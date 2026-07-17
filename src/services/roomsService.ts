// src/services/roomsService.ts
import { FirebaseError } from "firebase/app";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
  type DocumentReference,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../lib/db";
import { auth } from "../lib/firebase";
import type { Category } from "../model/category";
import type { GameState } from "../model/gameState";
import type { CreateRoomData, Room } from "../model/room";
import type { SongItem } from "../model/songItem";
import { getUserDjName } from "./usersService";

// Collection reference
const roomsCollection = collection(db, "rooms");

// Document reference helpers
const roomDoc = (roomId: string): DocumentReference => doc(db, "rooms", roomId);
const joinRequestDoc = (roomId: string, uid: string): DocumentReference =>
  doc(db, "rooms", roomId, "joinRequests", uid);

/**
 * Convert Firestore document data to Room with proper Date conversion
 * Firestore Timestamps are converted to JavaScript Dates
 */
function docToRoom(id: string, data: DocumentData): Room {
  // Migrate old score format ({ points: number } → { roundPoints: number[] })
  const scores = data.scores?.map((s: Record<string, unknown>) =>
    "roundPoints" in s ? s : { teamName: s.teamName, roundPoints: [] },
  );

  return {
    ...data,
    id,
    ...(scores ? { scores } : {}),
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
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

  // Generate fresh IDs for categories and items
  const categoriesWithFreshIds = generateFreshIds(roomData.categories);

  const docRef = await addDoc(roomsCollection, {
    ...roomData,
    categories: categoriesWithFreshIds,
    hostId: user.uid,
    hostName: roomData.hostName || user.displayName || "Host",
    editorIds: [],
    editorNames: {},
    inviteToken: null,
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

/** Page size for the public-rooms list views (market, all rooms). */
export const PUBLIC_ROOMS_PAGE_SIZE = 24;

export interface PublicRoomsPage {
  rooms: Room[];
  /** Opaque cursor — pass back to getPublicRoomsPage for the next page. */
  cursor: QueryDocumentSnapshot | null;
  hasMore: boolean;
}

/**
 * Fetch one page of public rooms, newest first. A bounded one-shot read:
 * the list grids don't need a live listener, and an unbounded query would
 * download every public room (full board payloads included) as the
 * catalog grows. Requires the composite index in firestore.indexes.json.
 */
export async function getPublicRoomsPage(
  cursor?: QueryDocumentSnapshot | null,
): Promise<PublicRoomsPage> {
  const q = query(
    roomsCollection,
    where("isPublic", "==", true),
    orderBy("createdAt", "desc"),
    ...(cursor ? [startAfter(cursor)] : []),
    limit(PUBLIC_ROOMS_PAGE_SIZE),
  );
  const snapshot = await getDocs(q);

  return {
    rooms: snapshot.docs.map((doc) => docToRoom(doc.id, doc.data())),
    cursor: snapshot.docs[snapshot.docs.length - 1] ?? null,
    hasMore: snapshot.docs.length === PUBLIC_ROOMS_PAGE_SIZE,
  };
}

/**
 * Subscribe to real-time updates for the current user's rooms — both the rooms
 * they host and the rooms they co-edit. Runs two queries (hostId and
 * editorIds) and emits the merged, deduped result on either update. Rooms
 * created before the editorIds field existed still match via the hostId query.
 */
export function subscribeToMyRooms(callback: (rooms: Room[]) => void): Unsubscribe {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Must be logged in to subscribe to your rooms");
  }

  const hostedQuery = query(roomsCollection, where("hostId", "==", user.uid));
  const editedQuery = query(roomsCollection, where("editorIds", "array-contains", user.uid));

  let hosted: Room[] = [];
  let edited: Room[] = [];

  const emit = () => {
    const byId = new Map<string, Room>();
    for (const room of [...hosted, ...edited]) {
      byId.set(room.id, room);
    }
    callback([...byId.values()]);
  };

  const unsubHosted = onSnapshot(hostedQuery, (snapshot) => {
    hosted = snapshot.docs.map((doc) => docToRoom(doc.id, doc.data()));
    emit();
  });
  const unsubEdited = onSnapshot(editedQuery, (snapshot) => {
    edited = snapshot.docs.map((doc) => docToRoom(doc.id, doc.data()));
    emit();
  });

  return () => {
    unsubHosted();
    unsubEdited();
  };
}

/**
 * Subscribe to real-time updates for a single room
 */
export function subscribeToRoom(
  roomId: string,
  callback: (room: Room | null) => void,
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
 * Update a room (host or co-editors can update content).
 * Editor membership and invites are managed via the dedicated co-owner
 * functions below, so they can't be changed through this generic update.
 */
export async function updateRoom(
  roomId: string,
  updates: Partial<
    Omit<Room, "id" | "hostId" | "editorIds" | "editorNames" | "inviteToken" | "createdAt">
  >,
): Promise<void> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Must be logged in to update a room");
  }

  // Verify the current user is allowed to edit (host or co-editor)
  const room = await getRoom(roomId);
  if (!room) {
    throw new Error("Room not found");
  }

  if (room.hostId !== user.uid && !room.editorIds?.includes(user.uid)) {
    throw new Error("Only the host or a co-owner can update this room");
  }

  await updateDoc(roomDoc(roomId), updates);
}

/**
 * Save the live game state (board + scores) on the room document.
 * Unlike updateRoom, this skips the ownership pre-read — it runs on every
 * tile click and score award, and the security rules already restrict
 * writes to the host and co-owners.
 *
 * Writes only the given fields via field paths, so a score write doesn't
 * rewrite playOrder (and vice versa) — concurrent host/co-owner actions
 * can't clobber each other's unrelated fields.
 */
export async function updateRoomGameState(
  roomId: string,
  updates: Partial<GameState>,
): Promise<void> {
  const payload: Record<string, unknown> = {};
  for (const [field, value] of Object.entries(updates)) {
    payload[`gameState.${field}`] = value;
  }
  await updateDoc(roomDoc(roomId), payload);
}

/**
 * Copy a room into the current user's dashboard. Works on any room the
 * user can read (their own, co-edited, or public). The copy gets fresh ids
 * (via createRoom), the current user as host, no co-owners, a clean board
 * (isRevealed reset), and starts private.
 */
export async function duplicateRoom(roomId: string): Promise<string> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Must be logged in to copy a room");
  }

  const room = await getRoom(roomId);
  if (!room) {
    throw new Error("Room not found");
  }

  const categories = room.categories.map((category) => ({
    ...category,
    items: category.items.map((item) => ({ ...item, isRevealed: false })),
  }));

  const djName = await getUserDjName(user.uid);

  return createRoom({
    // "(copy)" only when duplicating your own room — a market room keeps its name
    roomName: canEditRoom(room) ? `${room.roomName} (copy)` : room.roomName,
    hostName: djName?.trim() || user.displayName || "Host",
    categories,
    isPublic: false,
    isActive: true,
    createdAt: Date.now(),
  });
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

/**
 * Check if current user can edit a room (host or co-editor)
 */
export function canEditRoom(room: Room): boolean {
  const user = auth.currentUser;
  if (!user) return false;
  return room.hostId === user.uid || (room.editorIds?.includes(user.uid) ?? false);
}

/** Display info for a co-owner, snapshotted from their join request. */
export type RoomEditor = {
  uid: string;
  displayName: string | null;
  email: string | null;
};

async function requireHostedRoom(roomId: string): Promise<Room> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("You must be signed in to manage co-owners");
  }

  const room = await getRoom(roomId);
  if (!room) {
    throw new Error("Room not found");
  }

  if (room.hostId !== user.uid) {
    throw new Error("Only the host can manage co-owners");
  }

  return room;
}

/**
 * Resolve co-owner uids to display info from their join requests (host only —
 * security rules limit join requests to the host and the requester). Editors
 * whose join request is missing fall back to showing just the uid.
 */
export async function getRoomEditors(roomId: string, editorIds: string[]): Promise<RoomEditor[]> {
  const snapshots = await Promise.all(editorIds.map((uid) => getDoc(joinRequestDoc(roomId, uid))));

  return snapshots.map((snapshot, i) => {
    const data = snapshot.exists() ? snapshot.data() : null;
    return {
      uid: editorIds[i],
      displayName: (data?.displayName as string | null) ?? null,
      email: (data?.email as string | null) ?? null,
    };
  });
}

/**
 * Create or rotate the invite link token for a room (host only).
 * Anyone who opens an invite link built from this token becomes a co-owner,
 * so rotating it invalidates previously shared links.
 */
export async function generateRoomInvite(roomId: string): Promise<string> {
  await requireHostedRoom(roomId);

  const token = crypto.randomUUID();
  await updateDoc(roomDoc(roomId), { inviteToken: token });
  return token;
}

/**
 * Deactivate the room's invite link (host only).
 */
export async function revokeRoomInvite(roomId: string): Promise<void> {
  await requireHostedRoom(roomId);
  await updateDoc(roomDoc(roomId), { inviteToken: null });
}

/**
 * Accept an invite link as the current user. Proves possession of the token
 * by writing it to the room's joinRequests (where security rules compare it
 * against the room's current invite token), then adds the user to editorIds.
 * Both writes are rejected by the rules if the token is invalid or revoked.
 */
export async function acceptRoomInvite(roomId: string, token: string): Promise<void> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("You must be signed in to accept an invite");
  }

  // If the user can already edit the room (host or existing co-owner),
  // there is nothing to accept.
  try {
    const room = await getRoom(roomId);
    if (room && canEditRoom(room)) return;
  } catch {
    // Room not readable yet — the expected case for a new invitee.
  }

  // Prefer the co-owner's DJ name, falling back to their account display name —
  // the same precedence the host's name uses when a room is created.
  const djName = await getUserDjName(user.uid);
  const editorName = djName?.trim() || user.displayName?.trim() || "Co-host";

  try {
    await setDoc(joinRequestDoc(roomId, user.uid), {
      token,
      displayName: editorName,
      email: user.email ?? null,
    });
    // editorNames is denormalized onto the room so the public host label can
    // show co-owner names without reading the host-only joinRequests.
    await updateDoc(roomDoc(roomId), {
      editorIds: arrayUnion(user.uid),
      [`editorNames.${user.uid}`]: editorName,
    });
  } catch (err) {
    if (err instanceof FirebaseError && err.code === "permission-denied") {
      throw new Error("The invite link is invalid or has been disabled");
    }
    throw err;
  }
}

/**
 * Remove a co-owner from a room by their user ID (host only).
 */
export async function removeRoomEditor(roomId: string, uid: string): Promise<void> {
  await requireHostedRoom(roomId);
  await updateDoc(roomDoc(roomId), {
    editorIds: arrayRemove(uid),
    [`editorNames.${uid}`]: deleteField(),
  });
  await deleteDoc(joinRequestDoc(roomId, uid));
}
