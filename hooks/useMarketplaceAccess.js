// hooks/useMarketplaceAccess.js
'use client'

import { useEffect, useState } from 'react'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import { canonicalizeRole } from '@/lib/roles'

// Access union type shape (JS)
// { state: 'loading' } | { state: 'allowed', role } | { state: 'block', reason, role }

export function useMarketplaceAccess() {
  const [res, setRes] = useState({ state: 'loading' })

  useEffect(() => {
    const auth = getAuth()
    const db = getFirestore()

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return setRes({ state: 'block', reason: 'no-auth', role: 'unknown' })

      try {
        // Primary source
        const profSnap = await getDoc(doc(db, 'profiles', user.uid))
        let role = 'unknown'
        let onboarded = false
        if (profSnap.exists()) {
          const p = profSnap.data() || {}
          role = canonicalizeRole(p.role)
          onboarded = !!p.onboardingComplete
        } else {
          // Fallback: legacy users collection
          const userSnap = await getDoc(doc(db, 'users', user.uid))
          const u = userSnap.exists() ? (userSnap.data() || {}) : {}
          role = canonicalizeRole(u.role)
          onboarded = !!(u.onboardingComplete || u.profileComplete || u.onboard_complete)
        }

        if (!onboarded) return setRes({ state: 'block', reason: 'not-onboarded', role })
        if (role === 'merchant' || role === 'instructor') return setRes({ state: 'allowed', role })
        return setRes({ state: 'block', reason: 'wrong-role', role })
      } catch (e) {
        return setRes({ state: 'block', reason: 'no-auth', role: 'unknown' })
      }
    })

    return () => unsub()
  }, [])

  return res
}


