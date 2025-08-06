// app/api/auth/me/route.js
import { NextResponse } from 'next/server';
import { initAdmin } from '@/lib/firebase-admin';

export async function GET(request) {
  try {
    // Get the Authorization header which should contain the Firebase ID token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ role: null }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json({ role: null }, { status: 401 });
    }

    // Verify the Firebase ID token
    const { auth, db } = initAdmin();
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.exists ? userDoc.data() : null;
    
    return NextResponse.json({ 
      role: userData?.role || null,
      profileComplete: userData?.profileComplete || false
    });
  } catch (error) {
    console.error('Auth verification error:', error);
    return NextResponse.json({ role: null }, { status: 401 });
  }
} 