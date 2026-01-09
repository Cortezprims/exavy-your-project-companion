import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInWithPopup,
  GoogleAuthProvider,
  PhoneAuthProvider,
  signInWithPhoneNumber,
  ConfirmationResult,
  updateProfile,
  RecaptchaVerifier
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
  createdAt?: any;
}

interface FirebaseAuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null; needsPhoneVerification?: boolean }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  sendPhoneVerification: (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => Promise<{ error: Error | null; confirmationResult?: ConfirmationResult }>;
  verifyPhoneCode: (confirmationResult: ConfirmationResult, code: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<{ error: Error | null }>;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(undefined);

const googleProvider = new GoogleAuthProvider();

export const FirebaseAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from Firestore
  const fetchUserProfile = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data() as UserProfile);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Create user profile in Firestore
  const createUserProfile = async (firebaseUser: FirebaseUser, additionalData?: Partial<UserProfile>) => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const userData: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || additionalData?.displayName || null,
        phoneNumber: firebaseUser.phoneNumber || additionalData?.phoneNumber || null,
        photoURL: firebaseUser.photoURL,
        createdAt: serverTimestamp(),
        ...additionalData
      };
      await setDoc(userRef, userData);
      setUserProfile(userData);
    } else {
      setUserProfile(userSnap.data() as UserProfile);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchUserProfile(firebaseUser.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }
      
      await createUserProfile(result.user, { displayName });
      
      return { error: null, needsPhoneVerification: true };
    } catch (error: any) {
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await createUserProfile(result.user);
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const sendPhoneVerification = async (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => {
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      return { error: null, confirmationResult };
    } catch (error: any) {
      return { error };
    }
  };

  const verifyPhoneCode = async (confirmationResult: ConfirmationResult, code: string) => {
    try {
      await confirmationResult.confirm(code);
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) return { error: new Error('No user logged in') };
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, data, { merge: true });
      setUserProfile(prev => prev ? { ...prev, ...data } : null);
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  return (
    <FirebaseAuthContext.Provider value={{
      user,
      userProfile,
      loading,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      sendPhoneVerification,
      verifyPhoneCode,
      signOut,
      updateUserProfile
    }}>
      {children}
    </FirebaseAuthContext.Provider>
  );
};

export const useFirebaseAuth = () => {
  const context = useContext(FirebaseAuthContext);
  if (context === undefined) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
  }
  return context;
};
