// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDuJj-jY8g4a-ow-oNKtFPGzZsDITXM0eo",
  authDomain: "iot-plantation-protection.firebaseapp.com",
  databaseURL: "https://iot-plantation-protection-default-rtdb.firebaseio.com",
  projectId: "iot-plantation-protection",
  storageBucket: "iot-plantation-protection.firebasestorage.app",
  messagingSenderId: "448475542426",
  appId: "1:448475542426:web:b4e4f7efde3406a13ac023",
  measurementId: "G-7S9VT22V42"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
export { db };