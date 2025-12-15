// firebase.js
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getDatabase, 
  ref, 
  set, 
  get, 
  onValue, 
  remove, 
  update 
} from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCRlpUJ4VH1aSOMDMou2ncXQuokiJWIjds",
  authDomain: "plannerauth-1aef8.firebaseapp.com",
  databaseURL: "https://plannerauth-1aef8-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "plannerauth-1aef8",
  storageBucket: "plannerauth-1aef8.appspot.com",
  messagingSenderId: "161546860298",
  appId: "1:161546860298:web:70b76789f3b732bbda6cf3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ THESE WERE MISSING
const auth = getAuth(app);
const database = getDatabase(app);
const googleProvider = new GoogleAuthProvider();

// Exports
export {
  auth,
  database,
  googleProvider,
  signInWithPopup,
  onAuthStateChanged,
  ref,
  set,
  get,
  onValue,
  remove,
  update
};
