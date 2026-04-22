/**
 * Firebase initialization.
 *
 * Fill in the values below from your Firebase project's web-app config:
 *   Firebase console -> Project settings -> General -> Your apps -> Web app -> SDK setup and configuration.
 *
 * The project's Spark (free) plan is sufficient for a small team; no billing required.
 * See README.md for step-by-step setup.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'REPLACE_WITH_YOUR_API_KEY',
  authDomain: 'REPLACE_WITH_YOUR_AUTH_DOMAIN',
  projectId: 'REPLACE_WITH_YOUR_PROJECT_ID',
  storageBucket: 'REPLACE_WITH_YOUR_STORAGE_BUCKET',
  messagingSenderId: 'REPLACE_WITH_YOUR_SENDER_ID',
  appId: 'REPLACE_WITH_YOUR_APP_ID',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
