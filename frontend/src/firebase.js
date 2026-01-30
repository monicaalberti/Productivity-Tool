// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBkQr89xLzb0WKec8zzz0wGu-awgv6vgys",
  authDomain: "studyweave-75c94.firebaseapp.com",
  projectId: "studyweave-75c94",
  storageBucket: "studyweave-75c94.firebasestorage.app",
  messagingSenderId: "739186217294",
  appId: "1:739186217294:web:64424d56272225f71e8e1f",
  measurementId: "G-GV38NS0YGX"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);