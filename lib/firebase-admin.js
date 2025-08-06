import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let app = null;
let authInstance = null;
let dbInstance = null;

function initAdmin() {
  if (app) return { auth: authInstance, db: dbInstance };

  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}'
  );

  if (!serviceAccount.project_id) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_JSON');
  }

  app = initializeApp({
    credential: cert(serviceAccount),
  });

  authInstance = getAuth(app);
  dbInstance = getFirestore(app);

  return { auth: authInstance, db: dbInstance };
}

export const auth = new Proxy({}, {
  get(target, prop) {
    const { auth } = initAdmin();
    return auth[prop];
  }
});

export const db = new Proxy({}, {
  get(target, prop) {
    const { db } = initAdmin();
    return db[prop];
  }
});

export { initAdmin }; 