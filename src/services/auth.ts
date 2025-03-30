import { auth } from "@/lib/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  UserCredential,
  User
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

const authService = {
  async register(email: string, password: string, role: UserRole = "editor"): Promise<UserCredential> {
    return withFirebaseErrorHandling(async () => {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Add user to Firestore
      await userService.addUser(email, role);
      
      return userCredential;
    }, `Failed to register user with email: ${email}`);
  },

  async login(email: string, password: string): Promise<UserCredential> {
    return withFirebaseErrorHandling(async () => {
      return await signInWithEmailAndPassword(auth, email, password);
    }, `Failed to login with email: ${email}`);
  },

  async signOut(): Promise<void> {
    return withFirebaseErrorHandling(async () => {
      await firebaseSignOut(auth);
    }, "Failed to sign out");
  },

  getCurrentUser(): AuthUser | null {
    try {
      return auth.currentUser as AuthUser | null;
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