
import { FirebaseConfig } from './types';

// This function is now designed to run on the client, where process.env is populated by Next.js.
export function getFirebaseConfig(): FirebaseConfig | null {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  // If any of the essential keys are missing, the config is invalid.
  if (Object.values(config).some(value => !value)) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Firebase configuration is missing from environment variables.');
    }
    return null;
  }

  return config as FirebaseConfig;
}
