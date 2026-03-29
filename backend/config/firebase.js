import admin from 'firebase-admin';
import fs from 'fs';

let firebaseApp = null;
let initialized = false;

const initializeFirebase = () => {
  if (initialized) return firebaseApp;
  initialized = true;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  // Skip initialization if no credentials — bypass OTP still works
  if (!serviceAccountJson && !serviceAccountPath) {
    console.warn('[firebase] No service account configured — Admin SDK skipped.');
    console.warn('[firebase] Set FIREBASE_OTP_BYPASS=true for phone auth without Firebase.');
    return null;
  }

  try {
    let credential;
    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(
        Buffer.from(serviceAccountJson, 'base64').toString('utf-8')
      );
      credential = admin.credential.cert(serviceAccount);
    } else {
      const serviceAccount = JSON.parse(
        fs.readFileSync(serviceAccountPath, 'utf-8')
      );
      credential = admin.credential.cert(serviceAccount);
    }

    firebaseApp = admin.initializeApp({
      credential,
      projectId: process.env.FIREBASE_PROJECT_ID || 'equorariding',
    });

    console.log('[firebase] Admin SDK initialized successfully.');
    return firebaseApp;
  } catch (e) {
    console.warn('[firebase] Init failed:', e.message);
    return null;
  }
};

export const getFirebaseAuth = () => {
  if (!firebaseApp) {
    throw new Error('Firebase Admin SDK not configured. Use bypass OTP or add service account.');
  }
  return admin.auth();
};

export const verifyFirebaseIdToken = async (idToken) => {
  const auth = getFirebaseAuth();
  return auth.verifyIdToken(idToken);
};

export default initializeFirebase;
