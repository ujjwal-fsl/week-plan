// Authentication module
import { auth, googleProvider, signInWithPopup, onAuthStateChanged } from './firebase.js';

let currentUser = null;

/**
 * Sign in with Google popup
 * @returns {Promise<User>} Firebase user object
 */
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    currentUser = result.user;
    return currentUser;
  } catch (error) {
    console.error('Sign-in error:', error);
    throw error;
  }
}

/**
 * Get current authenticated user
 * @returns {User|null}
 */
export function getCurrentUser() {
  return currentUser;
}

/**
 * Listen for auth state changes
 * @param {Function} callback - Called with user object or null
 * @returns {Function} Unsubscribe function
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, (user) => {
    currentUser = user;
    callback(user);
  });
}

/**
 * Wait for auth state to be resolved
 * @returns {Promise<User|null>}
 */
export function waitForAuth() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      currentUser = user;
      resolve(user);
    });
  });
}
