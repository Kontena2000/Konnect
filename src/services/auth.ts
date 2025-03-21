import { auth } from "@/lib/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  UserCredential,
  User
} from "firebase/auth";
import userService from "./user";

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
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Add user to Firestore
      await userService.addUser(email, role);
      
      return userCredential;
    } catch (error: any) {
      console.error("Registration error:", error);
      throw new AuthError(
        error.message || "Failed to register user",
        error.code
      );
    }
  },

  async login(email: string, password: string): Promise<UserCredential> {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error("Login error:", error);
      throw new AuthError(
        error.message || "Failed to login",
        error.code
      );
    }
  },

  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      console.error("Sign out error:", error);
      throw new AuthError(
        error.message || "Failed to sign out",
        error.code
      );
    }
  },

  getCurrentUser(): AuthUser | null {
    return auth.currentUser as AuthUser | null;
  },

  async initializeDefaultUsers(): Promise<void> {
    const defaultUsers = [
      { email: 'ruud@kontena.eu', password: '123456', role: 'admin' as UserRole },
      { email: 'jef@kontena.eu', password: '123456', role: 'admin' as UserRole },
      { email: 'lars@kontena.eu', password: '123456', role: 'admin' as UserRole }
    ];

    for (const user of defaultUsers) {
      try {
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