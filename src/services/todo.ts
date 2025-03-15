
import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where,
  orderBy
} from "firebase/firestore";

export type TodoStatus = "pending" | "in_progress" | "completed" | "blocked";
export type TodoPriority = "low" | "medium" | "high";

export interface Todo {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: TodoStatus;
  priority: TodoPriority;
  dueDate?: Date;
  assignedTo?: string;
  moduleId?: string;
  connectionId?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

const todoService = {
  async createTodo(data: Omit<Todo, "id" | "createdAt" | "updatedAt">): Promise<string> {
    const todoRef = await addDoc(collection(db, "todos"), {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return todoRef.id;
  },

  async updateTodo(id: string, data: Partial<Todo>): Promise<void> {
    const todoRef = doc(db, "todos", id);
    await updateDoc(todoRef, {
      ...data,
      updatedAt: new Date()
    });
  },

  async deleteTodo(id: string): Promise<void> {
    const todoRef = doc(db, "todos", id);
    await deleteDoc(todoRef);
  },

  async getProjectTodos(projectId: string): Promise<Todo[]> {
    const todosQuery = query(
      collection(db, "todos"),
      where("projectId", "==", projectId),
      orderBy("createdAt", "desc")
    );
    
    const snapshot = await getDocs(todosQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Todo));
  },

  async getModuleTodos(moduleId: string): Promise<Todo[]> {
    const todosQuery = query(
      collection(db, "todos"),
      where("moduleId", "==", moduleId),
      orderBy("createdAt", "desc")
    );
    
    const snapshot = await getDocs(todosQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Todo));
  }
};

export default todoService;
