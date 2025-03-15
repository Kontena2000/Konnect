
const { initializeApp } = require("firebase/app");
const { getAuth } = require("firebase/auth");
const { getFirestore } = require("firebase/firestore");
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
  console.log('Starting initialization...');
  
  try {
    // Initialize default users
    await authService.initializeDefaultUsers();
    console.log('Default users initialized');

    // Initialize module database
    const existingModules = await moduleService.getAllModules();
    if (existingModules.length === 0) {
      for (const [category, templateList] of Object.entries(moduleTemplates)) {
        for (const templateItem of templateList) {
          await moduleService.createModule({
            ...templateItem,
            technicalSpecs: {
              weight: templateItem.category === 'konnect' ? 2500 : 
                     templateItem.category === 'power' ? 5 :
                     templateItem.category === 'network' ? 0.5 :
                     templateItem.category === 'cooling' ? 2 : 10,
              powerConsumption: {
                watts: templateItem.category === 'konnect' ? 15000 : 0,
                kWh: templateItem.category === 'konnect' ? 360 : 0
              },
              wireConfigurations: [
                {
                  type: templateItem.type,
                  gauge: templateItem.category === 'power' ? 'AWG 8' : 
                         templateItem.category === 'network' ? templateItem.type : 'N/A',
                  length: templateItem.category === 'konnect' ? 10 :
                          templateItem.category === 'power' ? 5 :
                          templateItem.category === 'network' ? 3 : 1
                }
              ]
            }
          });
        }
      }
      console.log('Module database initialized');
    }

    console.log('Initialization completed successfully');
  } catch (error) {
    console.error('Initialization failed:', error);
  }
}

initialize();
