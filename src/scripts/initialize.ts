
const path = require("path");
const { initializeApp } = require("firebase/app");
const { getAuth } = require("firebase/auth");
const { getFirestore } = require("firebase/firestore");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

// Debug directory structure
console.log("Current directory:", __dirname);
console.log("Services directory:", path.resolve(__dirname, "../services"));

// Import directly from source files
const moduleTemplates = {
  konnect: [
    {
      id: "edge-container",
      type: "edge-container",
      category: "konnect",
      name: "Edge Container",
      description: "Standard Edge Computing Container",
      color: "#808080",
      dimensions: [6.1, 2.9, 2.44]
    }
  ],
  power: [
    {
      id: "208v-3phase",
      type: "208v-3phase",
      category: "power",
      name: "208V 3-Phase",
      description: "208V Three Phase Power Cable",
      color: "#1FB73A",
      dimensions: [0.1, 0.1, 0.1]
    }
  ],
  network: [
    {
      id: "cat6a",
      type: "cat6a",
      category: "network",
      name: "CAT6A",
      description: "Category 6A Network Cable",
      color: "#00ff00",
      dimensions: [0.1, 0.1, 0.1]
    }
  ],
  cooling: [
    {
      id: "chilled-water",
      type: "chilled-water",
      category: "cooling",
      name: "Chilled Water",
      description: "Chilled Water Cooling Pipe",
      color: "#0088ff",
      dimensions: [0.1, 0.1, 0.1]
    }
  ],
  environment: [
    {
      id: "air-handler",
      type: "air-handler",
      category: "environment",
      name: "Air Handler",
      description: "Environmental Air Handler Unit",
      color: "#888888",
      dimensions: [1.2, 1.8, 0.6]
    }
  ]
};

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
    const authService = require("../services/auth").default;
    await authService.initializeDefaultUsers();
    console.log("Default users initialized");

    // Initialize module database
    const moduleService = require("../services/module").default;
    const existingModules = await moduleService.getAllModules();
    
    if (existingModules.length === 0) {
      for (const [category, templates] of Object.entries(moduleTemplates)) {
        for (const template of templates) {
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
