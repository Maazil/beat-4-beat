// src/services/roomsService.ts
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
  type DocumentReference,
  type Unsubscribe,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import type { Category } from "../model/category";
import type { CreateRoomData, Room } from "../model/room";
import type { SongItem } from "../model/songItem";

// Collection reference
const roomsCollection = collection(db, "rooms");

// Document reference helper
const roomDoc = (roomId: string): DocumentReference => doc(db, "rooms", roomId);

/**
 * Convert Firestore document data to Room with proper Date conversion
 * Firestore Timestamps are converted to JavaScript Dates
 */
function docToRoom(id: string, data: DocumentData): Room {
  return {
    ...data,
    id,
    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate()
        : data.createdAt,
  } as Room;
}

/**
 * Generate fresh UUIDs for all categories and items
 * Use this before saving to Firestore to avoid ID conflicts
 */
function generateFreshIds(categories: Category[]): Category[] {
  return categories.map((category) => ({
    ...category,
    id: crypto.randomUUID(),
    items: category.items.map((item: SongItem) => ({
      ...item,
      id: crypto.randomUUID(),
    })),
  }));
}

/**
 * Create a new room in Firestore
 * Automatically sets hostId from current authenticated user
 * Uses provided hostName or falls back to user's displayName
 * Generates fresh UUIDs for all categories and items
 */
export async function createRoom(roomData: CreateRoomData): Promise<string> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Must be logged in to create a room");
  }

  if (user.isAnonymous) {
    throw new Error("Guest users cannot create rooms");
  }

  // Generate fresh IDs for categories and items
  const categoriesWithFreshIds = generateFreshIds(roomData.categories);

  const docRef = await addDoc(roomsCollection, {
    ...roomData,
    categories: categoriesWithFreshIds,
    hostId: user.uid,
    hostName: roomData.hostName || user.displayName || "Anonymous Host",
    showCategories: roomData.showCategories ?? true,
    isActive: roomData.isActive ?? false,
    createdAt: serverTimestamp(),
  });

  // Update the document with its own ID for easier querying
  await updateDoc(docRef, { id: docRef.id });

  return docRef.id;
}

/**
 * Get a single room by ID
 */
export async function getRoom(roomId: string): Promise<Room | null> {
  const snapshot = await getDoc(roomDoc(roomId));

  if (!snapshot.exists()) {
    return null;
  }

  return docToRoom(snapshot.id, snapshot.data());
}

/**
 * Get all public rooms
 */
export async function getPublicRooms(): Promise<Room[]> {
  const q = query(roomsCollection, where("isPublic", "==", true));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => docToRoom(doc.id, doc.data()));
}

/**
 * Get all rooms owned by the current user
 */
export async function getMyRooms(): Promise<Room[]> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Must be logged in to get your rooms");
  }

  const q = query(roomsCollection, where("hostId", "==", user.uid));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => docToRoom(doc.id, doc.data()));
}

/**
 * Subscribe to real-time updates for public rooms
 */
export function subscribeToPublicRooms(
  callback: (rooms: Room[]) => void
): Unsubscribe {
  const q = query(roomsCollection, where("isPublic", "==", true));

  return onSnapshot(q, (snapshot) => {
    const rooms = snapshot.docs.map((doc) => docToRoom(doc.id, doc.data()));
    callback(rooms);
  });
}

/**
 * Subscribe to real-time updates for current user's rooms
 */
export function subscribeToMyRooms(
  callback: (rooms: Room[]) => void
): Unsubscribe {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Must be logged in to subscribe to your rooms");
  }

  const q = query(roomsCollection, where("hostId", "==", user.uid));

  return onSnapshot(q, (snapshot) => {
    const rooms = snapshot.docs.map((doc) => docToRoom(doc.id, doc.data()));
    callback(rooms);
  });
}

/**
 * Subscribe to real-time updates for a single room
 */
export function subscribeToRoom(
  roomId: string,
  callback: (room: Room | null) => void
): Unsubscribe {
  return onSnapshot(roomDoc(roomId), (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    callback(docToRoom(snapshot.id, snapshot.data()));
  });
}

/**
 * Update a room (only host can update)
 */
export async function updateRoom(
  roomId: string,
  updates: Partial<Omit<Room, "id" | "hostId" | "createdAt">>
): Promise<void> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Must be logged in to update a room");
  }

  // Verify ownership
  const room = await getRoom(roomId);
  if (!room) {
    throw new Error("Room not found");
  }

  if (room.hostId !== user.uid) {
    throw new Error("Only the host can update this room");
  }

  await updateDoc(roomDoc(roomId), updates);
}

/**
 * Delete a room (only host can delete)
 */
export async function deleteRoom(roomId: string): Promise<void> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Must be logged in to delete a room");
  }

  // Verify ownership
  const room = await getRoom(roomId);
  if (!room) {
    throw new Error("Room not found");
  }

  if (room.hostId !== user.uid) {
    throw new Error("Only the host can delete this room");
  }

  await deleteDoc(roomDoc(roomId));
}

/**
 * Toggle room active state (start/stop game)
 */
export async function toggleRoomActive(roomId: string): Promise<boolean> {
  const room = await getRoom(roomId);
  if (!room) {
    throw new Error("Room not found");
  }

  const newState = !room.isActive;
  await updateRoom(roomId, { isActive: newState });
  return newState;
}

/**
 * Check if current user is the host of a room
 */
export function isRoomHost(room: Room): boolean {
  const user = auth.currentUser;
  return user !== null && room.hostId === user.uid;
}
