import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}'
);

if (!serviceAccount.project_id) {
  throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_JSON');
}

const app = initializeApp({
  credential: cert(serviceAccount),
});

export const auth = getAuth(app);
export const db = getFirestore(app); 