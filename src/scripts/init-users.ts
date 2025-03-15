
import authService from "../services/auth";

async function initializeUsers() {
  console.log("Initializing default users...");
  try {
    await authService.initializeDefaultUsers();
    console.log("Default users initialized successfully");
  } catch (error) {
    console.error("Failed to initialize default users:", error);
  }
}

initializeUsers();
