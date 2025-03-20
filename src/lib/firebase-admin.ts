
import * as admin from "firebase-admin";
import { join } from "path";

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(
        join(process.cwd(), "public", "kontena-layout-builder-firebase-adminsdk-fbsvc-7b95c34dc4-m8hhdcwm.json")
      ),
      databaseURL: "https://kontena-layout-builder-default-rtdb.europe-west1.firebasedatabase.app"
    });
    console.log("Firebase Admin SDK initialized successfully");
  } catch (error) {
    console.error("Failed to initialize admin app:", error);
  }
}

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();
const realTimeDb = admin.database();

export { admin, db, auth, storage, realTimeDb };
