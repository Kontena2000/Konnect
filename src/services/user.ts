
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";

export interface User {
  id: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  createdAt: Date;
}

const userService = {
  async getUsers(): Promise<User[]> {
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    })) as User[];
  },

  async addUser(email: string, role: User["role"]): Promise<User> {
    const usersRef = collection(db, "users");
    const docRef = await addDoc(usersRef, {
      email,
      role,
      createdAt: new Date()
    });
    
    return {
      id: docRef.id,
      email,
      role,
      createdAt: new Date()
    };
  },

  async updateUserRole(userId: string, role: User["role"]): Promise<void> {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { role });
  },

  async deleteUser(userId: string): Promise<void> {
    const userRef = doc(db, "users", userId);
    await deleteDoc(userRef);
  }
};

export default userService;
