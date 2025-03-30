import { db } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  query, 
  orderBy,
  where,
  serverTimestamp
} from "firebase/firestore";
import { withFirebaseErrorHandling } from "@/utils/firebaseDebug";
import { getFirestoreSafely } from "@/lib/firebase";

export interface User {
  id: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  createdAt: Date;
}

const userService = {
  async getUsers(): Promise<User[]> {
    return withFirebaseErrorHandling(async () => {
      // Get Firestore instance safely
      const safeDb = getFirestoreSafely() || db;
      
      const usersRef = collection(safeDb, "users");
      const q = query(usersRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email,
          role: data.role,
          createdAt: data.createdAt?.toDate() || new Date()
        };
      });
    }, "Failed to fetch users");
  },

  async getUserByEmail(email: string): Promise<User | null> {
    return withFirebaseErrorHandling(async () => {
      // Get Firestore instance safely
      const safeDb = getFirestoreSafely() || db;
      
      const usersRef = collection(safeDb, "users");
      const q = query(usersRef, where("email", "==", email));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        role: data.role,
        createdAt: data.createdAt?.toDate() || new Date()
      };
    }, `Failed to fetch user by email: ${email}`);
  },

  async addUser(email: string, role: User["role"]): Promise<User> {
    return withFirebaseErrorHandling(async () => {
      const existingUser = await this.getUserByEmail(email);
      if (existingUser) {
        return existingUser;
      }

      // Get Firestore instance safely
      const safeDb = getFirestoreSafely() || db;
      
      const usersRef = collection(safeDb, "users");
      const docRef = await addDoc(usersRef, {
        email,
        role,
        createdAt: serverTimestamp()
      });

      // Set custom claims via API
      try {
        const response = await fetch('/api/auth/set-custom-claims', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            role
          })
        });

        if (!response.ok) {
          console.warn('Failed to set custom claims, but user was created');
        }
      } catch (apiError) {
        console.warn('API error when setting custom claims:', apiError);
        // Continue anyway since the user was created in Firestore
      }

      return {
        id: docRef.id,
        email,
        role,
        createdAt: new Date()
      };
    }, `Failed to add user with email: ${email}`);
  },

  async updateUserRole(userId: string, role: User["role"]): Promise<void> {
    return withFirebaseErrorHandling(async () => {
      // Get Firestore instance safely
      const safeDb = getFirestoreSafely() || db;
      
      const userRef = doc(safeDb, "users", userId);
      await updateDoc(userRef, { 
        role,
        updatedAt: serverTimestamp()
      });

      // Update custom claims via API
      try {
        const response = await fetch('/api/auth/set-custom-claims', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: userId,
            role
          })
        });

        if (!response.ok) {
          console.warn('Failed to update custom claims, but user role was updated in Firestore');
        }
      } catch (apiError) {
        console.warn('API error when updating custom claims:', apiError);
        // Continue anyway since the user role was updated in Firestore
      }
    }, `Failed to update role for user: ${userId}`);
  },

  async deleteUser(userId: string): Promise<void> {
    return withFirebaseErrorHandling(async () => {
      // Get Firestore instance safely
      const safeDb = getFirestoreSafely() || db;
      
      const userRef = doc(safeDb, "users", userId);
      await deleteDoc(userRef);
    }, `Failed to delete user: ${userId}`);
  }
};

export default userService;