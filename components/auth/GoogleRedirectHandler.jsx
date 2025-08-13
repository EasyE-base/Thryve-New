'use client'

import { useEffect } from 'react'
import { auth } from '@/lib/firebaseClient'
import { getRedirectResult } from 'firebase/auth'

export default function GoogleRedirectHandler({ next = '/' }) {
  useEffect(() => {
    (async () => {
      try {
        const res = await getRedirectResult(auth)
        if (res?.user) {
          const token = await res.user.getIdToken()
          await fetch('/api/profile/ensure', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(()=>{})
          await fetch('/api/session/sync', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(()=>{})
          window.location.replace(next)
        }
      } catch {}
    })()
  }, [next])

  return null
}


