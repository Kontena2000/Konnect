
const path = require("path");
const { initializeApp } = require("firebase/app");
const { getAuth } = require("firebase/auth");
const { getFirestore } = require("firebase/firestore");

// Debug directory structure
console.log("Current directory:", __dirname);
console.log("Services directory:", path.resolve(__dirname, "../services"));
console.log("Components directory:", path.resolve(__dirname, "../components"));

// Fix path resolution by using relative paths from scripts directory
const authService = require("../services/auth").default;
const moduleService = require("../services/module").default;
const { moduleTemplates } = require("../components/three/ModuleLibrary");

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
      for (const [category, templateList] of Object.entries(moduleTemplates)) {
        for (const template of templateList) {
          try {
            await moduleService.createModule({
              ...template,
              technicalSpecs: {
                weight: template.category === "konnect" ? 2500 : 
                       template.category === "power" ? 5 :
                       template.category === "network" ? 0.5 :
                       template.category === "cooling" ? 2 : 10,
                powerConsumption: {
                  watts: template.category === "konnect" ? 15000 : 0,
                  kWh: template.category === "konnect" ? 360 : 0
                },
                wireConfigurations: [
                  {
                    type: template.type,
                    gauge: template.category === "power" ? "AWG 8" : 
                           template.category === "network" ? template.type : "N/A",
                    length: template.category === "konnect" ? 10 :
                            template.category === "power" ? 5 :
                            template.category === "network" ? 3 : 1
                  }
                ]
              }
            });
            console.log(`Created module: ${template.name}`);
          } catch (error) {
            console.error(`Failed to create module ${template.name}:`, error);
          }
        }
      }
      console.log("Module database initialized");
    }

    console.log("Initialization completed successfully");
  } catch (error) {
    console.error("Initialization failed:", error);
    process.exit(1);
  }
}

initialize();
