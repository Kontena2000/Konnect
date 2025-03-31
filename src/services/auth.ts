import { auth, getAuthSafely } from "@/lib/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  UserCredential,
  User,
  Auth
} from "firebase/auth";
import userService from "./user";
import { withFirebaseErrorHandling } from "@/utils/firebaseDebug";

export type UserRole = "admin" | "editor" | "viewer";

export interface AuthUser extends User {
  role?: UserRole;
}

export class AuthError extends Error {
  code?: string;
  
  constructor(message: string, code?: string) {
    super(message);
    this.name = "AuthError";
    this.code = code;
  }
}

// Helper function to ensure auth is not null
const ensureAuth = (authInstance: Auth | null): Auth => {
  if (!authInstance) {
    throw new Error("Firebase auth is not initialized");
  }
  return authInstance;
};

const authService = {
  async register(email: string, password: string, role: UserRole = "editor"): Promise<UserCredential> {
    return withFirebaseErrorHandling(async () => {
      // Get auth instance safely and ensure it's not null
      const safeAuth = ensureAuth(getAuthSafely() || auth);
      
      const userCredential = await createUserWithEmailAndPassword(safeAuth, email, password);
      
      // Add user to Firestore
      await userService.addUser(email, role);
      
      return userCredential;
    }, `Failed to register user with email: ${email}`);
  },

  async login(email: string, password: string): Promise<UserCredential> {
    return withFirebaseErrorHandling(async () => {
      // Get auth instance safely and ensure it's not null
      const safeAuth = ensureAuth(getAuthSafely() || auth);
      
      return await signInWithEmailAndPassword(safeAuth, email, password);
    }, `Failed to login with email: ${email}`);
  },

  async signOut(): Promise<void> {
    return withFirebaseErrorHandling(async () => {
      // Get auth instance safely and ensure it's not null
      const safeAuth = ensureAuth(getAuthSafely() || auth);
      
      await firebaseSignOut(safeAuth);
    }, "Failed to sign out");
  },

  getCurrentUser(): AuthUser | null {
    try {
      // Get auth instance safely
      const safeAuth = getAuthSafely() || auth;
      
      // Check if auth is initialized
      if (!safeAuth) {
        console.warn("Firebase auth is not initialized");
        return null;
      }
      
      return safeAuth.currentUser as AuthUser | null;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  },

  async initializeDefaultUsers(): Promise<void> {
    const defaultUsers = [
      { email: 'ruud@kontena.eu', password: '123456', role: 'admin' as UserRole }
    ];

    for (const user of defaultUsers) {
      try {
        // Try to create the user
        await this.register(user.email, user.password, user.role);
        console.log(`Created user: ${user.email}`);
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          try {
            // Update existing user's role to admin
            const existingUser = await userService.getUserByEmail(user.email);
            if (existingUser) {
              await userService.updateUserRole(existingUser.id, 'admin');
              console.log(`Updated ${user.email} role to admin`);
            }
          } catch (updateError) {
            console.error(`Failed to update role for ${user.email}:`, updateError);
          }
        } else {
          console.error(`Failed to create user ${user.email}:`, error);
        }
      }
    }
  }
};

export default authService;