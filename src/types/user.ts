
import type { Timestamp } from 'firebase/firestore';

// Defines the structure for a single user profile
export interface Profile {
  id: string; // Unique identifier for the profile (e.g., UUID or 'kids')
  name: string; // Display name for the profile
  profileImageUrl: string; // URL of the avatar image
  profileImageName: string; // Alt text or internal name for the image
  // Add any other profile-specific settings here (e.g., language, content restrictions)
}

// Defines the structure for the main user account stored in Firestore
export interface UserAccount {
  mobile: string; // User's mobile number (also the document ID in Firestore)
  password?: string; // User's password (should be hashed in production!)
  profiles: Profile[]; // Array of user profiles associated with the account
  createdAt: Timestamp | Date; // Timestamp of account creation (can be Firestore Timestamp or Date object)
  // Add other account-level details if needed (e.g., subscription status)
}

// Note: When retrieving from Firestore, createdAt will be a Timestamp.
// When storing in localStorage, it might be converted to a Date object or ISO string.
// Ensure consistent handling based on where the data is used.
