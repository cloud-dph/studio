
import type { Timestamp } from 'firebase/firestore';

// Removed Profile interface as it's no longer needed for the simplified structure

// Defines the structure for the main user account stored in Firestore
export interface UserAccount {
  mobile: string; // User's mobile number (also the document ID in Firestore)
  password?: string; // User's password (should be hashed in production!)
  name: string; // User's name, stored directly on the account
  createdAt: Timestamp | Date; // Timestamp of account creation (can be Firestore Timestamp or Date object)
  // Add other account-level details if needed (e.g., subscription status)
}

// Note: When retrieving from Firestore, createdAt will be a Timestamp.
// When storing in localStorage, it might be converted to a Date object or ISO string.
// Ensure consistent handling based on where the data is used.
