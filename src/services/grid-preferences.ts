
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { AuthUser } from "@/services/auth";
import firebaseMonitor from "./firebase-monitor";

export interface GridPreferences {
  size: "small" | "medium" | "large";
  weight: "0.5" | "1" | "2";
  color: string;
  userId: string;
}

const gridPreferencesService = {
  async getPreferences(userId: string): Promise<GridPreferences | null> {
    try {
      firebaseMonitor.logOperation({
        type: "settings",
        action: "get_grid_preferences",
        status: "pending",
        timestamp: Date.now(),
        details: { userId }
      });

      const prefsRef = doc(db, "gridPreferences", userId);
      const snapshot = await getDoc(prefsRef);

      if (!snapshot.exists()) {
        return null;
      }

      firebaseMonitor.logOperation({
        type: "settings",
        action: "get_grid_preferences",
        status: "success",
        timestamp: Date.now(),
        details: { userId, preferences: snapshot.data() }
      });

      return snapshot.data() as GridPreferences;
    } catch (error) {
      firebaseMonitor.logOperation({
        type: "settings",
        action: "get_grid_preferences",
        status: "error",
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : "Unknown error",
        details: { userId }
      });
      throw error;
    }
  },

  async savePreferences(preferences: GridPreferences, user: AuthUser): Promise<void> {
    try {
      firebaseMonitor.logOperation({
        type: "settings",
        action: "save_grid_preferences",
        status: "pending",
        timestamp: Date.now(),
        details: { userId: user.uid, preferences }
      });

      const prefsRef = doc(db, "gridPreferences", user.uid);
      const snapshot = await getDoc(prefsRef);

      if (snapshot.exists()) {
        await updateDoc(prefsRef, preferences);
      } else {
        await setDoc(prefsRef, preferences);
      }

      firebaseMonitor.logOperation({
        type: "settings",
        action: "save_grid_preferences",
        status: "success",
        timestamp: Date.now(),
        details: { userId: user.uid, preferences }
      });
    } catch (error) {
      firebaseMonitor.logOperation({
        type: "settings",
        action: "save_grid_preferences",
        status: "error",
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : "Unknown error",
        details: { userId: user.uid, preferences }
      });
      throw error;
    }
  }
};

export default gridPreferencesService;
