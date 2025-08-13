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
        const prof = await getDoc(doc(db, 'profiles', user.uid))
        const data = prof.exists() ? prof.data() : {}
        const role = canonicalizeRole(data.role)
        const onboarded = !!data.onboardingComplete

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


