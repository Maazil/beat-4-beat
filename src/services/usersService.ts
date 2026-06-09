// src/services/usersService.ts
import { type User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentReference,
} from "firebase/firestore";
import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { db } from "../lib/firebase";

type UserProfile = {
  uid: string;
  displayName: string | null;
  djName: string | null;
  email: string | null;
  emailVerified: boolean;
  photoURL: string | null;
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

export async function getUserDjName(uid: string): Promise<string | null> {
  const ref = doc(db, "users", uid);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return (snapshot.data()?.djName as string) ?? null;
}

export async function updateDjName(uid: string, djName: string): Promise<void> {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, { djName: djName.trim() || null });
}

/** Minimal user info used when displaying/looking up co-owners. */
export type UserSummary = {
  uid: string;
  email: string | null;
  displayName: string | null;
};

/**
 * Look up an existing user account by email.
 * Returns the first match, or null if no account uses that email.
 */
export async function findUserByEmail(email: string): Promise<UserSummary | null> {
  const q = query(collection(db, "users"), where("email", "==", email.trim()));
  const snapshot = await getDocs(q);

  const first = snapshot.docs[0];
  if (!first) return null;

  const data = first.data() as UserProfile;
  return { uid: data.uid, email: data.email, displayName: data.displayName };
}

/**
 * Resolve a list of user IDs to their display info (email/name).
 * Missing accounts are skipped.
 */
export async function getUsersByIds(uids: string[]): Promise<UserSummary[]> {
  const snapshots = await Promise.all(uids.map((uid) => getDoc(userDoc(uid))));

  return snapshots
    .filter((snapshot) => snapshot.exists())
    .map((snapshot) => {
      const data = snapshot.data() as UserProfile;
      return { uid: data.uid, email: data.email, displayName: data.displayName };
    });
}

type UserDoc = UserProfile & { id: string };

const _usersRef = collection(db, "users");
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
          }) as UserDoc,
      );
      setUsers(docs);
      setIsLoading(false);
    },
    (err) => {
      setError(err);
      setIsLoading(false);
    },
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
