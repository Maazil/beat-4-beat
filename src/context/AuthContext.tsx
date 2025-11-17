import {
  Accessor,
  createContext,
  onMount,
  ParentComponent,
  useContext,
} from "solid-js";
import { createStore } from "solid-js/store";

export interface FirebaseUser {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  isAnonymous: boolean;
}

export interface AuthState {
  user: FirebaseUser | null;
  isLoading: boolean;
}

interface AuthContextValue {
  state: AuthState;
  signInAnonymously: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    name?: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  isGuest: Accessor<boolean>;
  isAuthenticated: Accessor<boolean>;
  isFullUser: Accessor<boolean>;
  canCreateRooms: Accessor<boolean>;
  isRoomHost: (roomHostId?: string) => boolean;
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

  // Check if current user is the host of a room
  const isRoomHost = (roomHostId?: string) => {
    if (!state.user || !roomHostId) return false;
    return state.user.uid === roomHostId;
  };

  // Firebase Anonymous Sign In
  const signInAnonymously = async () => {
    setState("isLoading", true);
    try {
      // TODO: Replace with Firebase signInAnonymously()
      // const userCredential = await signInAnonymously(auth);
      // Mock for now:
      const mockUser: FirebaseUser = {
        uid: `anon-${Date.now()}`,
        isAnonymous: true,
        displayName: `Gjest ${Math.floor(Math.random() * 1000)}`,
      };

      setState({
        user: mockUser,
        isLoading: false,
      });
    } catch (error) {
      console.error("Anonymous sign in failed:", error);
      setState("isLoading", false);
      throw error;
    }
  };

  // Firebase Email/Password Sign In
  const signInWithEmail = async (email: string, password: string) => {
    setState("isLoading", true);
    try {
      // TODO: Replace with Firebase signInWithEmailAndPassword()
      // const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Mock for now:
      const mockUser: FirebaseUser = {
        uid: `user-${Date.now()}`,
        email,
        displayName: email.split("@")[0],
        isAnonymous: false,
      };

      setState({
        user: mockUser,
        isLoading: false,
      });
    } catch (error) {
      console.error("Sign in failed:", error);
      setState("isLoading", false);
      throw error;
    }
  };

  // Firebase Email/Password Sign Up
  const signUpWithEmail = async (
    email: string,
    password: string,
    name?: string
  ) => {
    setState("isLoading", true);
    try {
      // TODO: Replace with Firebase createUserWithEmailAndPassword()
      // const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // if (name) await updateProfile(userCredential.user, { displayName: name });
      // Mock for now:
      const mockUser: FirebaseUser = {
        uid: `user-${Date.now()}`,
        email,
        displayName: name || email.split("@")[0],
        isAnonymous: false,
      };

      setState({
        user: mockUser,
        isLoading: false,
      });
    } catch (error) {
      console.error("Sign up failed:", error);
      setState("isLoading", false);
      throw error;
    }
  };

  // Firebase Sign Out
  const signOut = async () => {
    try {
      // TODO: Replace with Firebase signOut()
      // await signOut(auth);
      setState({
        user: null,
        isLoading: false,
      });
    } catch (error) {
      console.error("Sign out failed:", error);
      throw error;
    }
  };

  // Initialize auth state listener
  onMount(() => {
    // TODO: Replace with Firebase onAuthStateChanged()
    // const unsubscribe = onAuthStateChanged(auth, (user) => {
    //   if (user) {
    //     setState({
    //       user: {
    //         uid: user.uid,
    //         email: user.email,
    //         displayName: user.displayName,
    //         isAnonymous: user.isAnonymous,
    //       },
    //       isLoading: false,
    //     });
    //   } else {
    //     setState({ user: null, isLoading: false });
    //   }
    // });
    // return unsubscribe;

    // Mock: Check for stored session
    const storedUser = localStorage.getItem("mockUser");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setState({ user, isLoading: false });
      } catch (e) {
        localStorage.removeItem("mockUser");
        setState("isLoading", false);
      }
    } else {
      setState("isLoading", false);
    }
  });

  const value: AuthContextValue = {
    state,
    signInAnonymously,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    isGuest,
    isAuthenticated,
    isFullUser,
    canCreateRooms,
    isRoomHost,
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
