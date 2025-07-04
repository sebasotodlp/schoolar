import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Check if all required Firebase environment variables are present
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

const missingEnvVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);

let app: any = null;
let db: any = null;
let auth: any = null;

// Only initialize Firebase if all required environment variables are present
if (missingEnvVars.length === 0) {
  try {
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
    };

    // Initialize Firebase
    app = initializeApp(firebaseConfig);

    // Initialize Firestore
    db = getFirestore(app);

    // Initialize Auth
    auth = getAuth(app);

    console.log('Firebase initialized successfully');
  } catch (error) {
    console.warn('Firebase initialization failed:', error);
    console.warn('The application will continue to work in local mode');
  }
} else {
  console.warn('Firebase environment variables missing:', missingEnvVars);
  console.warn('The application will continue to work in local mode without Firebase');
}

// Export with fallback handling
export { db, auth };

// Test Firebase connection
export const testFirebaseConnection = async (): Promise<boolean> => {
  if (!db) {
    return false;
  }
  
  try {
    // Simple test to see if we can access Firestore
    await import('firebase/firestore').then(({ enableNetwork }) => {
      return enableNetwork(db);
    });
    return true;
  } catch (error) {
    console.warn('Firebase connection test failed:', error);
    return false;
  }
};

export default app;