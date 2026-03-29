import admin from 'firebase-admin';
import fs from 'fs';

let firebaseApp;

const initializeFirebase = () => {
  if (firebaseApp) return firebaseApp;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (serviceAccountJson) {
    const serviceAccount = JSON.parse(
      Buffer.from(serviceAccountJson, 'base64').toString('utf-8')
    );
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || 'equorariding',
    });
  } else if (serviceAccountPath) {
    const serviceAccount = JSON.parse(
      fs.readFileSync(serviceAccountPath, 'utf-8')
    );
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || 'equorariding',
    });
  } else {
    firebaseApp = admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'equorariding',
    });
  }

  return firebaseApp;
};

export const getFirebaseAuth = () => {
  if (!firebaseApp) initializeFirebase();
  return admin.auth();
};

export const verifyFirebaseIdToken = async (idToken) => {
  const auth = getFirebaseAuth();
  return auth.verifyIdToken(idToken);
};

export default initializeFirebase;
