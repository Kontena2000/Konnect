
const { initializeApp } = require("firebase/app");
const { getAuth, createUserWithEmailAndPassword } = require("firebase/auth");
const { getFirestore, collection, doc, setDoc } = require("firebase/firestore");
require("dotenv").config({ path: ".env.local" });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const defaultUsers = [
  { email: "ruud@kontena.eu", password: "123456", role: "admin" }
];

async function createUser(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log(`Created user: ${email}`);
    return userCredential.user;
  } catch (error) {
    if (error.code === "auth/email-already-in-use") {
      console.log(`User ${email} already exists`);
      return null;
    }
    throw error;
  }
}

async function setUserRole(email, role) {
  try {
    const usersRef = collection(db, "users");
    await setDoc(doc(usersRef, email), {
      email,
      role,
      createdAt: new Date()
    });
    
    // Set custom claims via API
    const response = await fetch('http://localhost:3000/api/auth/set-custom-claims', {
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
      throw new Error('Failed to set custom claims');
    }
    
    console.log(`Set role for ${email} to ${role}`);
  } catch (error) {
    console.error(`Failed to set role for ${email}:`, error);
  }
}

async function initialize() {
  console.log("Starting initialization...");
  
  try {
    for (const user of defaultUsers) {
      const userRecord = await createUser(user.email, user.password);
      if (userRecord) {
        await setUserRole(user.email, user.role);
      }
    }
    console.log("Users initialized successfully");
  } catch (error) {
    console.error("Initialization failed:", error);
    process.exit(1);
  }
}

initialize();
