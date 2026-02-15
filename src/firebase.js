import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAznWgXGoNaNSas-Oq5H9WZW9lbTAqpSr8",
  authDomain: "attendance-f1ad8.firebaseapp.com",
  projectId: "attendance-f1ad8",
  storageBucket: "attendance-f1ad8.firebasestorage.app",
  messagingSenderId: "1049213979536",
  appId: "1:1049213979536:web:0c30c41b29b5d821e5c115",
  measurementId: "G-2YE2NB2QW8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Secondary app for admin operations (creating users without signing out current admin)
const secondaryApp = initializeApp(firebaseConfig, 'secondary');
export const secondaryAuth = getAuth(secondaryApp);

export default app;
