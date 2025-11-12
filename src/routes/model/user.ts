export interface User {
  id: string;              // Firebase UID or generated id
  displayName: string;
  email?: string;
  photoURL?: string;
  createdAt: number;       // Unix timestamp
}
