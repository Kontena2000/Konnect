
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { AuthUser } from "@/services/auth";
import firebaseMonitor from "./firebase-monitor";

export interface EditorPreferences {
  grid: {
    size: "small" | "medium" | "large";
    weight: "0.5" | "1" | "2";
    color: string;
  };
  objects: {
    transparency: number;
  };
  userId: string;
}

const editorPreferencesService = {
  async getPreferences(userId: string): Promise<EditorPreferences | null> {
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
            size: "medium",
            weight: "1",
            color: "#888888"
          },
          objects: {
            transparency: 0.85
          },
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

  async savePreferences(preferences: Omit<EditorPreferences, "userId">, user: AuthUser): Promise<void> {
    try {
      const prefsWithUser = {
        ...preferences,
        userId: user.uid
      };

      firebaseMonitor.logOperation({
        type: "settings",
        action: "save_editor_preferences",
        status: "pending",
        timestamp: Date.now(),
        details: { userId: user.uid, preferences: prefsWithUser }
      });

      const prefsRef = doc(db, "editorPreferences", user.uid);
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
        details: { userId: user.uid, preferences: prefsWithUser }
      });
    } catch (error) {
      firebaseMonitor.logOperation({
        type: "settings",
        action: "save_editor_preferences",
        status: "error",
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : "Unknown error",
        details: { userId: user.uid, preferences }
      });
      throw error;
    }
  }
};

export default editorPreferencesService;
