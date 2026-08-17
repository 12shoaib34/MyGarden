import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, getReactNativePersistence, initializeAuth } from "@firebase/auth";
import { firebaseConfig } from "../config/cloudConfig";

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

function createAuth() {
  try {
    return initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    if (String(error?.code || "").includes("auth/already-initialized")) {
      return getAuth(firebaseApp);
    }
    throw error;
  }
}

export const firebaseAuth = createAuth();
export const firestoreDb = getFirestore(firebaseApp);
