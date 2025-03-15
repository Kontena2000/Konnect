
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import authService from "../services/auth";
import moduleService from "../services/module";
import { moduleTemplates } from "../components/three/ModuleLibrary";

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

async function initialize() {
  console.log("Starting initialization...");
  
  try {
    // Initialize default users
    await authService.initializeDefaultUsers();
    console.log("Default users initialized");

    // Initialize module database
    const existingModules = await moduleService.getAllModules();
    if (existingModules.length === 0) {
      for (const [category, modules] of Object.entries(moduleTemplates)) {
        for (const module of modules) {
          await moduleService.createModule({
            ...module,
            technicalSpecs: {
              weight: module.category === 'konnect' ? 2500 : 
                     module.category === 'power' ? 5 :
                     module.category === 'network' ? 0.5 :
                     module.category === 'cooling' ? 2 : 10,
              powerConsumption: {
                watts: module.category === 'konnect' ? 15000 : 0,
                kWh: module.category === 'konnect' ? 360 : 0
              },
              wireConfigurations: [
                {
                  type: module.type,
                  gauge: module.category === 'power' ? 'AWG 8' : 
                         module.category === 'network' ? module.type : 'N/A',
                  length: module.category === 'konnect' ? 10 :
                          module.category === 'power' ? 5 :
                          module.category === 'network' ? 3 : 1
                }
              ]
            }
          });
        }
      }
      console.log("Module database initialized");
    }

    console.log("Initialization completed successfully");
  } catch (error) {
    console.error("Initialization failed:", error);
  }
}

initialize();
