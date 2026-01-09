import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: "AIzaSyBWwFSr_ARF893c1DksVaVi0tPg0NeBn-Q",
  authDomain: "exavy-c9548.firebaseapp.com",
  projectId: "exavy-c9548",
  storageBucket: "exavy-c9548.firebasestorage.app",
  messagingSenderId: "821737979488",
  appId: "1:821737979488:web:90ca14c02e5624be634d05",
  measurementId: "G-YELKT05C0R"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics (only in browser)
export const initAnalytics = async () => {
  if (await isSupported()) {
    return getAnalytics(app);
  }
  return null;
};

// Initialize App Check with reCAPTCHA v3
// Note: You need to add the reCAPTCHA site key from Firebase console
export const initAppCheck = (siteKey: string) => {
  try {
    return initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true
    });
  } catch (error) {
    console.error('Error initializing App Check:', error);
    return null;
  }
};

// Helper for phone auth
export const setupRecaptcha = (containerId: string) => {
  return new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved
    }
  });
};

export { signInWithPhoneNumber };
