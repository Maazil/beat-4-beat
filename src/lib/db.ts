// Firestore lives in its own module so the heavy SDK stays out of the entry
// chunk — only the lazy-loaded pages/services that touch data pull it in.
import { getFirestore } from "firebase/firestore";
import { app } from "./firebase";

export const db = getFirestore(app);
