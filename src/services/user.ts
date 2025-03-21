
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

export interface User {
  id: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  createdAt: Date;
}

const userService = {
  async getUsers(): Promise<User[]> {
    try {
      const usersRef = collection(db, "users");
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
    } catch (error) {
      console.error("Error fetching users:", error);
      throw new Error("Failed to fetch users");
    }
  },

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const usersRef = collection(db, "users");
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
    } catch (error) {
      console.error("Error fetching user by email:", error);
      throw new Error("Failed to fetch user");
    }
  },

  async addUser(email: string, role: User["role"]): Promise<User> {
    try {
      const existingUser = await this.getUserByEmail(email);
      if (existingUser) {
        return existingUser;
      }

      const usersRef = collection(db, "users");
      const docRef = await addDoc(usersRef, {
        email,
        role,
        createdAt: serverTimestamp()
      });

      // Set custom claims via API
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
        console.error('Failed to set custom claims');
      }

      return {
        id: docRef.id,
        email,
        role,
        createdAt: new Date()
      };
    } catch (error) {
      console.error("Error adding user:", error);
      throw new Error("Failed to add user");
    }
  },

  async updateUserRole(userId: string, role: User["role"]): Promise<void> {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { 
        role,
        updatedAt: serverTimestamp()
      });

      // Update custom claims via API
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
        throw new Error('Failed to update custom claims');
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      throw new Error("Failed to update user role");
    }
  },

  async deleteUser(userId: string): Promise<void> {
    try {
      const userRef = doc(db, "users", userId);
      await deleteDoc(userRef);
    } catch (error) {
      console.error("Error deleting user:", error);
      throw new Error("Failed to delete user");
    }
  }
};

export default userService;
