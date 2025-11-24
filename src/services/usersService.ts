// src/services/usersService.ts
import { type User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  type DocumentReference,
} from "firebase/firestore";
import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { db } from "../lib/firebase";

type UserProfile = {
  uid: string;
  displayName: string | null;
  email: string | null;
  emailVerified: boolean;
  photoURL: string | null;
  isAnonymous: boolean;
  providerId: string;
  phoneNumber: string | null;
  createdAt: ReturnType<typeof serverTimestamp>;
  lastLoginAt: ReturnType<typeof serverTimestamp>;
};

const userDoc = (uid: string): DocumentReference<UserProfile> =>
  doc(db, "users", uid) as DocumentReference<UserProfile>;

export async function upsertUserProfile(user: User) {
  const ref = userDoc(user.uid);
  const snapshot = await getDoc(ref);

  const payload: Partial<UserProfile> = {
    uid: user.uid,
    displayName: user.displayName ?? null,
    email: user.email ?? null,
    emailVerified: user.emailVerified,
    photoURL: user.photoURL ?? null,
    isAnonymous: user.isAnonymous,
    providerId: user.providerId,
    phoneNumber: user.phoneNumber ?? null,
    lastLoginAt: serverTimestamp(),
  };

  if (!snapshot.exists()) {
    await setDoc(ref, {
      ...payload,
      createdAt: serverTimestamp(),
    } as UserProfile);
  } else {
    await setDoc(ref, payload, { merge: true });
  }

  return ref.id;
}

type UserDoc = UserProfile & { id: string };

const usersRef = collection(db, "users");
const [users, setUsers] = createStore<UserDoc[]>([]);
const [isLoading, setIsLoading] = createSignal(true);
const [error, setError] = createSignal<Error | null>(null);

let unsubscribe: (() => void) | null = null;

export function startUsersListener() {
  if (unsubscribe) return; // already listening

  const q = query(collection(db, "users"));
  unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const docs = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as UserDoc
      );
      setUsers(docs);
      setIsLoading(false);
    },
    (err) => {
      setError(err);
      setIsLoading(false);
    }
  );
}

export function stopUsersListener() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}

export const usersStore = {
  users,
  isLoading,
  error,
};
