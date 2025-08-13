// app/api/marketplace/_guard.js
import { initAdmin } from '@/lib/firebase-admin'
import { canonicalizeRole } from '@/lib/roles'

export async function requireMarketplaceUser(authorization) {
  if (!authorization || !authorization.startsWith('Bearer ')) {
    const err = new Error('NO_TOKEN')
    err.code = 401
    throw err
  }
  const token = authorization.slice(7)
  const { auth, db } = initAdmin()
  const decoded = await auth.verifyIdToken(token)
  const snap = await db.collection('profiles').doc(decoded.uid).get()
  const data = snap.exists ? snap.data() : {}
  const role = canonicalizeRole(data.role)
  const onboarded = !!data.onboardingComplete

  const isMerchant = role === 'merchant'
  const isInstructor = role === 'instructor'
  if (!onboarded) {
    const err = new Error('NOT_ONBOARDED')
    err.code = 403
    throw err
  }
  if (!isMerchant && !isInstructor) {
    const err = new Error('WRONG_ROLE')
    err.code = 403
    throw err
  }
  return { uid: decoded.uid, role: isMerchant ? 'merchant' : 'instructor' }
}


