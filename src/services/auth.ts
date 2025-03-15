
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

const authService = {
  async register(email: string, password: string, role: UserRole = "editor"): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Add user to Firestore
      await userService.addUser(email, role);
      
      return userCredential;
    } catch (error: any) {
      console.error("Registration error:", error);
      throw new Error(error.message || "Failed to register user");
    }
  },

  async login(email: string, password: string): Promise<UserCredential> {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error("Login error:", error);
      throw new Error(error.message || "Failed to login");
    }
  },

  async signOut(): Promise<void> {
    try {
      return await firebaseSignOut(auth);
    } catch (error: any) {
      console.error("Sign out error:", error);
      throw new Error(error.message || "Failed to sign out");
    }
  },

  getCurrentUser(): AuthUser | null {
    return auth.currentUser as AuthUser | null;
  },

  async initializeDefaultUsers(): Promise<void> {
    const defaultUsers = [
      { email: "jef@kontena.eu", password: "123456", role: "admin" as UserRole },
      { email: "lars@kontena.eu", password: "123456", role: "admin" as UserRole }
    ];

    for (const user of defaultUsers) {
      try {
        await this.register(user.email, user.password, user.role);
        console.log(`Created user: ${user.email}`);
      } catch (error: any) {
        if (error.code === "auth/email-already-in-use") {
          console.log(`User ${user.email} already exists`);
        } else {
          console.error(`Failed to create user ${user.email}:`, error);
        }
      }
    }
  }
};

export default authService;
