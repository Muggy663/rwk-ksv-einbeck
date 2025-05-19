// src/lib/firebase/auth.ts
import type { User as FirebaseUser } from 'firebase/auth';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged as onFirebaseAuthStateChanged,
  Auth
} from 'firebase/auth';
import { auth } from './config'; // Assuming auth is exported from config.ts

export type { FirebaseUser };

export const signInWithEmail = async (email: string, password: string): Promise<FirebaseUser> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const signOutUser = async (): Promise<void> => {
  return signOut(auth);
};

export const onAuthStateChanged = (callback: (user: FirebaseUser | null) => void) => {
  return onFirebaseAuthStateChanged(auth, callback);
};

export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};
