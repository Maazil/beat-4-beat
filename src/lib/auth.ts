// The Auth SDK (~90 KB) lives in its own module so it stays out of the entry
// chunk: only the lazy-loaded services/pages that need it — and AuthContext's
// dynamic import once the app has mounted — pull it in, keeping the landing
// critical path lean.
//
// Import the specific functions by name (not a `import("firebase/auth")`
// barrel) so the bundler tree-shakes the SDK down to what we actually use;
// AuthContext re-exposes them through a dynamic import of this module.
import {
  getAuth,
  GoogleAuthProvider,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { app } from "./firebase";

export const auth = getAuth(app);

// Apply the default browser preference instead of explicitly setting it.
auth.useDeviceLanguage();

export {
  GoogleAuthProvider,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
  signOut,
};
