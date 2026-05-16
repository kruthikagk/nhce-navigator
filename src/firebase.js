import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBi7V5aQFLNii2g-MGflTA80cxiU4R7M_w",
  authDomain: "navigation-4a130.firebaseapp.com",
  projectId: "navigation-4a130",
  storageBucket: "navigation-4a130.firebasestorage.app",
  messagingSenderId: "672693736094",
  appId: "1:672693736094:web:6599cd944999f6106fa18f",
  measurementId: "G-TKK1E9LWKQ",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();