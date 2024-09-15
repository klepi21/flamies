import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// Initialize Firebase (replace with your config)
const firebaseConfig = {
  apiKey: "AIzaSyCIqpE3Z6C_2td5b1hGgQLyEDIIf8RySHw",
  authDomain: "flamies-fa7bb.firebaseapp.com",
  projectId: "flamies-fa7bb",
  storageBucket: "flamies-fa7bb.appspot.com",
  messagingSenderId: "672027851197",
  appId: "1:672027851197:web:aa6d834c8490df3e38bad4",
  measurementId: "G-NFWGG37ESJ"
};

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
