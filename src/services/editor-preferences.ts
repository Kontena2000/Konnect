
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { AuthUser } from "@/services/auth";
import firebaseMonitor from "./firebase-monitor";

export interface EditorPreferences {
  grid: {
    size: number;
    weight: "0.5" | "1" | "2";
    color: string;
    visible: boolean;
    showAxes: boolean;
    snap: boolean;
    divisions: number;
  };
  objects: {
    transparency: number;
  };
  autoSave: boolean;
  userId: string;
}

const editorPreferencesService = {
  async getPreferences(userId: string): Promise<EditorPreferences> {
    try {
      firebaseMonitor.logOperation({
        type: "settings",
        action: "get_editor_preferences",
        status: "pending",
        timestamp: Date.now(),
        details: { userId }
      });

      const prefsRef = doc(db, "editorPreferences", userId);
      const snapshot = await getDoc(prefsRef);

      if (!snapshot.exists()) {
        // Return default preferences
        return {
          grid: {
            size: 50,
            weight: "1",
            color: "#888888",
            visible: true,
            showAxes: true,
            snap: true,
            divisions: 5
          },
          objects: {
            transparency: 0.85
          },
          autoSave: true,
          userId
        };
      }

      const data = snapshot.data() as EditorPreferences;
      
      firebaseMonitor.logOperation({
        type: "settings",
        action: "get_editor_preferences",
        status: "success",
        timestamp: Date.now(),
        details: { userId, preferences: data }
      });

      return data;
    } catch (error) {
      firebaseMonitor.logOperation({
        type: "settings",
        action: "get_editor_preferences",
        status: "error",
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : "Unknown error",
        details: { userId }
      });
      throw error;
    }
  },

  async savePreferences(userId: string, preferences: EditorPreferences): Promise<void> {
    try {
      const prefsWithUser = {
        ...preferences,
        userId
      };

      firebaseMonitor.logOperation({
        type: "settings",
        action: "save_editor_preferences",
        status: "pending",
        timestamp: Date.now(),
        details: { userId, preferences: prefsWithUser }
      });

      const prefsRef = doc(db, "editorPreferences", userId);
      const snapshot = await getDoc(prefsRef);

      if (snapshot.exists()) {
        await updateDoc(prefsRef, prefsWithUser);
      } else {
        await setDoc(prefsRef, prefsWithUser);
      }

      firebaseMonitor.logOperation({
        type: "settings",
        action: "save_editor_preferences",
        status: "success",
        timestamp: Date.now(),
        details: { userId, preferences: prefsWithUser }
      });
    } catch (error) {
      firebaseMonitor.logOperation({
        type: "settings",
        action: "save_editor_preferences",
        status: "error",
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : "Unknown error",
        details: { userId, preferences }
      });
      throw error;
    }
  }
};

export default editorPreferencesService;
