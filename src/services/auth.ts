
import { auth } from "@/lib/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  UserCredential,
  User
} from "firebase/auth";

export type UserRole = "staff" | "client";

export interface AuthUser extends User {
  role?: UserRole;
}

const authService = {
  async register(email: string, password: string): Promise<UserCredential> {
    return createUserWithEmailAndPassword(auth, email, password);
  },

  async login(email: string, password: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(auth, email, password);
  },

  async signOut(): Promise<void> {
    return firebaseSignOut(auth);
  },

  getCurrentUser(): AuthUser | null {
    return auth.currentUser as AuthUser | null;
  }
};

export default authService;
