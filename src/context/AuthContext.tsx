import {
  Accessor,
  createContext,
  createSignal,
  ParentComponent,
  useContext,
} from "solid-js";
import { createStore } from "solid-js/store";

export type UserRole = "guest" | "authenticated" | null;

export interface User {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
}

export interface AuthState {
  user: User | null;
  isGuest: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue {
  state: AuthState;
  loginAsGuest: (guestName?: string) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isGuest: Accessor<boolean>;
  isAuthenticated: Accessor<boolean>;
}

const AuthContext = createContext<AuthContextValue>();

export const AuthProvider: ParentComponent = (props) => {
  const [state, setState] = createStore<AuthState>({
    user: null,
    isGuest: false,
    isAuthenticated: false,
    isLoading: false,
  });

  const [isGuest, setIsGuest] = createSignal(false);
  const [isAuthenticated, setIsAuthenticated] = createSignal(false);

  const loginAsGuest = (guestName?: string) => {
    const guestUser: User = {
      id: `guest-${Date.now()}`,
      name: guestName || `Gjest ${Math.floor(Math.random() * 1000)}`,
      role: "guest",
    };

    setState({
      user: guestUser,
      isGuest: true,
      isAuthenticated: false,
      isLoading: false,
    });
    setIsGuest(true);
    setIsAuthenticated(false);

    // Store guest session in localStorage
    localStorage.setItem("guestUser", JSON.stringify(guestUser));
  };

  const login = async (email: string, password: string) => {
    setState("isLoading", true);

    try {
      // TODO: Implement Firebase authentication
      // For now, mock authentication
      const user: User = {
        id: `user-${Date.now()}`,
        name: email.split("@")[0],
        email,
        role: "authenticated",
      };

      setState({
        user,
        isGuest: false,
        isAuthenticated: true,
        isLoading: false,
      });
      setIsGuest(false);
      setIsAuthenticated(true);

      // Remove guest session if exists
      localStorage.removeItem("guestUser");

      // TODO: Store auth token in localStorage/sessionStorage
    } catch (error) {
      console.error("Login failed:", error);
      setState("isLoading", false);
      throw error;
    }
  };

  const logout = () => {
    setState({
      user: null,
      isGuest: false,
      isAuthenticated: false,
      isLoading: false,
    });
    setIsGuest(false);
    setIsAuthenticated(false);

    // Clear all sessions
    localStorage.removeItem("guestUser");
    // TODO: Clear Firebase auth token
  };

  // Check for existing guest session on mount
  const storedGuest = localStorage.getItem("guestUser");
  if (storedGuest) {
    try {
      const guestUser = JSON.parse(storedGuest);
      setState({
        user: guestUser,
        isGuest: true,
        isAuthenticated: false,
        isLoading: false,
      });
      setIsGuest(true);
    } catch (e) {
      localStorage.removeItem("guestUser");
    }
  }

  const value: AuthContextValue = {
    state,
    loginAsGuest,
    login,
    logout,
    isGuest,
    isAuthenticated,
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
