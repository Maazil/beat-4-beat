import type { Analytics } from "firebase/analytics";
import { getApp, getApps, initializeApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

// Apply the default browser preference instead of explicitly setting it.
auth.useDeviceLanguage();

let analytics: Analytics | undefined;

// Analytics (and the googletagmanager request it triggers) stays off the
// critical path: the module is imported lazily once the browser is idle,
// keeping the entry chunk lean for the landing page.
if (typeof window !== "undefined") {
  const loadAnalytics = () => {
    void import("firebase/analytics").then(({ getAnalytics, isSupported }) =>
      isSupported().then((supported) => {
        if (supported) {
          analytics = getAnalytics(app);
        }
      }),
    );
  };

  if ("requestIdleCallback" in window) {
    requestIdleCallback(loadAnalytics);
  } else {
    // Older Safari has no requestIdleCallback
    setTimeout(loadAnalytics, 2000);
  }
}

export { analytics, app, auth };
