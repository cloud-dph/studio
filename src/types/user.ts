

import type { Timestamp } from 'firebase/firestore';

export interface Profile {
  id: string; // Unique identifier for the profile (e.g., uuid or 'kids')
  name: string;
  profileImageUrl: string;
  profileImageName: string; // Name of the avatar image (e.g., "Avatar 1")
  // Add other profile-specific settings here if needed (e.g., language, maturity level)
}

export interface UserAccount {
  mobile: string; // Document ID in Firestore, also the primary identifier
  password?: string; // Store hashed password in Firestore (optional here as we don't send it to client often)
  profiles: Profile[];
  createdAt: Timestamp | Date; // Store creation timestamp
  // Add other account-level settings here if needed (e.g., subscription status)
}

