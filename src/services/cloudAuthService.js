import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "@firebase/auth";
import { firebaseAuth } from "./firebaseApp";

export function observeCloudUser(callback) {
  return onAuthStateChanged(firebaseAuth, callback);
}

export function getCurrentCloudUser() {
  return firebaseAuth.currentUser;
}

export function getReadyCloudUser(timeoutMs = 3000) {
  if (firebaseAuth.currentUser) {
    return Promise.resolve(firebaseAuth.currentUser);
  }

  return new Promise((resolve) => {
    let settled = false;
    let unsubscribe = null;
    let unsubscribeAfterAttach = false;

    const finish = (user) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);
      if (unsubscribe) {
        unsubscribe();
      } else {
        unsubscribeAfterAttach = true;
      }
      resolve(user || firebaseAuth.currentUser || null);
    };

    const timeout = setTimeout(() => finish(firebaseAuth.currentUser), timeoutMs);
    unsubscribe = onAuthStateChanged(firebaseAuth, finish);
    if (unsubscribeAfterAttach) {
      unsubscribe();
    }
  });
}

export async function createCloudAccount(email, password) {
  return createUserWithEmailAndPassword(
    firebaseAuth,
    normalizeEmail(email),
    String(password || "")
  );
}

export async function signInCloudAccount(email, password) {
  return signInWithEmailAndPassword(
    firebaseAuth,
    normalizeEmail(email),
    String(password || "")
  );
}

export async function signOutCloudAccount() {
  return signOut(firebaseAuth);
}

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function requireCloudUser() {
  const user = getCurrentCloudUser();
  if (!user) {
    throw new Error("Sign in to your cloud account first.");
  }
  return user;
}
