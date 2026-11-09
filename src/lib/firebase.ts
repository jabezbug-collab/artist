import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBDG1mPJ7iWvkbB-OnJGtt1QTeZ-kqiHYo",
  authDomain: "artist-d617e.firebaseapp.com",
  projectId: "artist-d617e",
  storageBucket: "artist-d617e.firebasestorage.app",
  messagingSenderId: "76974432259",
  appId: "1:76974432259:web:803b38ff298541eb022e36",
  measurementId: "G-D0EJJRCXV1"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
