import { NextResponse } from 'next/server'
import { auth, db } from '@/lib/firebase-admin'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'

export async function POST(request) {
  const { role } = await request.json()
  const idToken = request.headers.get('authorization')?.split('Bearer ')[1]

  if (!idToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const decodedToken = await auth.verifyIdToken(idToken)
    const userId = decodedToken.uid

    console.log(`[API/select-role] Received request for user: ${userId} with role: ${role}`)

    const userRef = doc(db, 'users', userId)

    await updateDoc(userRef, {
      role: role,
      roleSelectedAt: serverTimestamp(),
      onboardingStatus: 'started', // Add a status flag
    })

    // Set a custom claim. This is the key to making middleware aware instantly.
    await auth.setCustomUserClaims(userId, { role: role })

    console.log(`[API/select-role] Successfully updated role and set custom claim for user: ${userId}`)

    return NextResponse.json({ success: true, role: role })
  } catch (error) {
    console.error('[API/select-role] Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}