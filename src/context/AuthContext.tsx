import {
  signInAnonymously as firebaseSignInAnonymously,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  Accessor,
  createContext,
  onCleanup,
  onMount,
  ParentComponent,
  useContext,
} from "solid-js";
import { createStore } from "solid-js/store";
import { auth } from "../lib/firebase";
import { upsertUserProfile } from "../services/usersService";

export interface AuthState {
  user: User | null;
  isLoading: boolean;
}

interface AuthContextValue {
  state: AuthState;
  signInAnonymously: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isGuest: Accessor<boolean>;
  isAuthenticated: Accessor<boolean>;
  isFullUser: Accessor<boolean>;
  canCreateRooms: Accessor<boolean>;
  isRoomHost: (roomHostId?: string) => boolean;
  userNameSplit: () => string;
}

const AuthContext = createContext<AuthContextValue>();

export const AuthProvider: ParentComponent = (props) => {
  const [state, setState] = createStore<AuthState>({
    user: null,
    isLoading: true,
  });

  // Computed signals based on user state
  const isGuest = () => state.user?.isAnonymous === true;
  const isAuthenticated = () => state.user !== null;
  const isFullUser = () =>
    state.user !== null && state.user.isAnonymous === false;
  const canCreateRooms = () => isFullUser();
  const userNameSplit = () => {
    return state.user !== null && isFullUser()
      ? state.user?.displayName?.split(" ").slice(0, -1).join(" ") || ""
      : "";
  };

  // Check if current user is the host of a room
  const isRoomHost = (roomHostId?: string) => {
    if (!state.user || !roomHostId) return false;
    return state.user.uid === roomHostId;
  };

  // Firebase Anonymous Sign In
  const signInAnonymously = async () => {
    setState("isLoading", true);
    try {
      const credential = await firebaseSignInAnonymously(auth);
      if (!credential.user.displayName) {
        const randomName = `Guest ${Math.floor(Math.random() * 1000)}`;
        try {
          await updateProfile(credential.user, { displayName: randomName });
        } catch (profileError) {
          console.warn("Failed to set guest display name", profileError);
        }
      }
    } catch (error) {
      console.error("Anonymous sign in failed:", error);
      throw error;
    } finally {
      setState("isLoading", false);
    }
  };

  const signInWithGoogle = async () => {
    setState("isLoading", true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google sign in failed:", error);
      throw error;
    } finally {
      setState("isLoading", false);
    }
  };

  // Firebase Sign Out
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Sign out failed:", error);
      throw error;
    }
  };

  // Initialize auth state listener
  onMount(() => {
    setState("isLoading", true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Upsert user profile to Firestore (create if new, update if exists)
        try {
          await upsertUserProfile(user);
        } catch (error) {
          console.error("Failed to sync user profile:", error);
        }
      }
      setState({ user, isLoading: false });
    });

    onCleanup(() => {
      unsubscribe();
    });
  });

  const value: AuthContextValue = {
    state,
    signInAnonymously,
    signInWithGoogle,
    signOut,
    isGuest,
    isAuthenticated,
    isFullUser,
    canCreateRooms,
    isRoomHost,
    userNameSplit,
  };

  return (
    <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
