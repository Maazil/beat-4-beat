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
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import {
  Accessor,
  createContext,
  onCleanup,
  onMount,
  ParentComponent,
  useContext,
} from "solid-js";
import { createStore } from "solid-js/store";
import { auth, db } from "../lib/firebase";
import {
  loginWithSpotify,
  logoutSpotify,
  getSpotifyProfile,
} from "../lib/spotify";
import {
  deleteUserProfile,
  findUserBySpotifyId,
  getUserProfile,
  upsertUserProfile,
  type AuthProvider as AuthProviderType,
} from "../services/usersService";
import { migrateRoomOwnership } from "../services/roomsService";

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  authProvider: AuthProviderType | null;
}

interface AuthContextValue {
  state: AuthState;
  signInAnonymously: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithSpotify: () => Promise<void>;
  signOut: () => Promise<void>;
  handleSpotifyLoginCallback: () => Promise<void>;
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
    authProvider: null,
  });

  // Computed signals based on user state + authProvider
  const isGuest = () => state.authProvider === "guest";
  const isAuthenticated = () => state.user !== null;
  const isFullUser = () =>
    state.authProvider === "google" || state.authProvider === "spotify";
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

  // Firebase Anonymous Sign In (guest)
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

  // Spotify login: sign in anonymously to Firebase, then redirect to Spotify
  const signInWithSpotify = async () => {
    setState("isLoading", true);
    try {
      await firebaseSignInAnonymously(auth);
      sessionStorage.setItem("spotify_auth_intent", "login");
      await loginWithSpotify();
      // loginWithSpotify() redirects — code below won't execute
    } catch (error) {
      console.error("Spotify sign in failed:", error);
      sessionStorage.removeItem("spotify_auth_intent");
      setState("isLoading", false);
      throw error;
    }
  };

  /**
   * Called after Spotify OAuth redirect is handled on the Dashboard.
   * If the intent was "login", fetch the Spotify profile, update Firebase
   * user profile and Firestore doc, then update auth state.
   */
  const handleSpotifyLoginCallback = async () => {
    const intent = sessionStorage.getItem("spotify_auth_intent");
    if (intent !== "login") return;

    const user = auth.currentUser;
    if (!user) return;

    try {
      const profile = await getSpotifyProfile();
      const displayName = profile.display_name || "Spotify User";
      const photoURL = profile.images?.[0]?.url || null;

      // Check if this Spotify account has logged in before (different Firebase UID)
      const existingUser = await findUserBySpotifyId(profile.id);
      if (existingUser && existingUser.uid !== user.uid) {
        // Returning Spotify user — migrate rooms from old UID to new UID
        const migrated = await migrateRoomOwnership(
          existingUser.uid,
          user.uid,
          displayName
        );
        if (migrated > 0) {
          console.info(
            `[auth] Migrated ${migrated} room(s) from old UID ${existingUser.uid} to ${user.uid}`
          );
        }
        // Clean up the old user document
        await deleteUserProfile(existingUser.uid);
      }

      // Update Firebase Auth profile with Spotify display name + photo
      await updateProfile(user, { displayName, photoURL });

      // Update Firestore user doc with authProvider and Spotify info
      const ref = doc(db, "users", user.uid);
      await setDoc(
        ref,
        {
          authProvider: "spotify" as AuthProviderType,
          displayName,
          email: profile.email || null,
          photoURL,
          spotifyId: profile.id,
          lastLoginAt: serverTimestamp(),
        },
        { merge: true }
      );

      setState({
        authProvider: "spotify",
        // Re-read user to pick up updated displayName/photoURL
        user: auth.currentUser,
      });
    } catch (error) {
      console.error("Failed to complete Spotify login:", error);
    } finally {
      sessionStorage.removeItem("spotify_auth_intent");
    }
  };

  // Firebase Sign Out
  const signOut = async () => {
    try {
      if (state.authProvider === "spotify") {
        logoutSpotify();
      }
      await firebaseSignOut(auth);
      setState({ authProvider: null });
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

        // Read authProvider from Firestore
        let authProvider: AuthProviderType | null = null;
        try {
          const profile = await getUserProfile(user.uid);
          authProvider = profile?.authProvider ?? (user.isAnonymous ? "guest" : "google");
        } catch {
          authProvider = user.isAnonymous ? "guest" : "google";
        }

        setState({ user, authProvider, isLoading: false });
      } else {
        setState({ user: null, authProvider: null, isLoading: false });
      }
    });

    onCleanup(() => {
      unsubscribe();
    });
  });

  const value: AuthContextValue = {
    state,
    signInAnonymously,
    signInWithGoogle,
    signInWithSpotify,
    signOut,
    handleSpotifyLoginCallback,
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
