import {
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
  type User,
} from "firebase/auth";
import {
  Accessor,
  createContext,
  createSignal,
  onCleanup,
  onMount,
  ParentComponent,
  useContext,
} from "solid-js";
import { createStore } from "solid-js/store";
import { auth } from "../lib/firebase";

export interface AuthState {
  user: User | null;
  isLoading: boolean;
}

interface AuthContextValue {
  state: AuthState;
  signInWithGoogle: () => Promise<void>;
  sendEmailSignInLink: (email: string, redirectPath?: string) => Promise<void>;
  isEmailSignInLink: (href: string) => boolean;
  getStoredSignInEmail: () => string | null;
  completeEmailSignIn: (href: string, email: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: Accessor<boolean>;
  isRoomHost: (roomHostId?: string) => boolean;
  userNameSplit: () => string;
  djName: Accessor<string | null>;
  setDjName: (name: string | null) => void;
}

const AuthContext = createContext<AuthContextValue>();

export const AuthProvider: ParentComponent = (props) => {
  const [state, setState] = createStore<AuthState>({
    user: null,
    isLoading: true,
  });

  const [djName, setDjName] = createSignal<string | null>(null);

  const isAuthenticated = () => state.user !== null;
  const userNameSplit = () => state.user?.displayName?.split(" ").slice(0, -1).join(" ") || "";

  const isRoomHost = (roomHostId?: string) => {
    if (!state.user || !roomHostId) return false;
    return state.user.uid === roomHostId;
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

  // The email is stashed so the finish route can complete the sign-in even if
  // the link opens in a new tab on the same device.
  const EMAIL_FOR_SIGN_IN_KEY = "emailForSignIn";

  const sendEmailSignInLink = async (email: string, redirectPath?: string) => {
    // Absolute URL on an authorized domain that completes the sign-in. A
    // validated in-app redirect target is encoded so the finish page can send
    // the user on to where they were originally headed.
    const finishUrl = new URL(`${window.location.origin}/login/finish`);
    if (redirectPath) finishUrl.searchParams.set("redirect", redirectPath);
    try {
      await sendSignInLinkToEmail(auth, email, {
        url: finishUrl.toString(),
        handleCodeInApp: true,
      });
      window.localStorage.setItem(EMAIL_FOR_SIGN_IN_KEY, email);
    } catch (error) {
      console.error("Email link send failed:", error);
      throw error;
    }
  };

  const isEmailSignInLink = (href: string) => isSignInWithEmailLink(auth, href);

  // Present on the same device that requested the link; absent when the link
  // opens elsewhere, in which case the finish page asks the user to confirm it.
  const getStoredSignInEmail = () => window.localStorage.getItem(EMAIL_FOR_SIGN_IN_KEY);

  const completeEmailSignIn = async (href: string, email: string): Promise<void> => {
    try {
      await signInWithEmailLink(auth, email, href);
      window.localStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);
    } catch (error) {
      console.error("Email link sign in failed:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Sign out failed:", error);
      throw error;
    }
  };

  onMount(() => {
    setState("isLoading", true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Lazy import keeps Firestore out of the entry chunk — signed-out
          // visitors (the landing page) never download it.
          const { getUserDjName, upsertUserProfile } = await import("../services/usersService");
          await upsertUserProfile(user);
          const name = await getUserDjName(user.uid);
          setDjName(name);
        } catch (error) {
          console.error("Failed to sync user profile:", error);
        }
      } else {
        setDjName(null);
      }
      setState({ user, isLoading: false });
    });

    onCleanup(() => {
      unsubscribe();
    });
  });

  const value: AuthContextValue = {
    state,
    signInWithGoogle,
    sendEmailSignInLink,
    isEmailSignInLink,
    getStoredSignInEmail,
    completeEmailSignIn,
    signOut,
    isAuthenticated,
    isRoomHost,
    userNameSplit,
    djName,
    setDjName,
  };

  return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
