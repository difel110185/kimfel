import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';
import { User, FirestoreUser } from '@/types/user';

// Convert Firebase User to our User type
export const convertFirebaseUser = (firebaseUser: FirebaseUser): User => ({
  uid: firebaseUser.uid,
  email: firebaseUser.email || '',
  displayName: firebaseUser.displayName,
  photoURL: firebaseUser.photoURL,
  createdAt: new Date(),
  updatedAt: new Date()
});

// Sign in with Google
export const signInWithGoogle = async (): Promise<User> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Create or update user in Firestore
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    const now = Timestamp.now();

    if (!userDoc.exists()) {
      // Create new user
      const firestoreUser: FirestoreUser = {
        email: user.email || '',
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: now,
        updatedAt: now
      };
      await setDoc(userRef, firestoreUser);
    } else {
      // Update existing user
      await setDoc(userRef, {
        email: user.email || '',
        displayName: user.displayName,
        photoURL: user.photoURL,
        updatedAt: now
      }, { merge: true });
    }

    return convertFirebaseUser(user);
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

// Sign out
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Listen to auth state changes
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      const user = convertFirebaseUser(firebaseUser);
      callback(user);
    } else {
      callback(null);
    }
  });
};
