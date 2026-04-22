import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyB2RNRYfh7xCDzvu4v-aRGRCI2Gz9iq7r4',
  authDomain: 'traveltracker-80e9c.firebaseapp.com',
  projectId: 'traveltracker-80e9c',
  storageBucket: 'traveltracker-80e9c.firebasestorage.app',
  messagingSenderId: '607887946440',
  appId: '1:607887946440:web:afcabcf1af5f8628e86bfd',
  measurementId: 'G-KHMGGHDG17',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
