import admin from "firebase-admin";

if (!admin.apps.length) {
  if (process.env.VITE_FIREBASE_PROJECT_ID) {
    admin.initializeApp({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    });
    console.log("Firebase Admin initialized for project:", process.env.VITE_FIREBASE_PROJECT_ID);
  } else {
    admin.initializeApp();
    console.log("Firebase Admin initialized using default credentials.");
  }
}

export default admin;
