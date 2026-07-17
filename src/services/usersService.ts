// src/services/usersService.ts
import { type User } from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentReference,
} from "firebase/firestore";
import { db } from "../lib/db";

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
