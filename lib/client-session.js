// Client-side session management for Firebase authentication
'use client'

import { onAuthStateChanged } from 'firebase/auth'
import app, { auth } from '@/lib/firebase'

export async function syncAuthState(user) {
  try {
    if (user) {
      const idToken = await user.getIdToken()
      const res = await fetch('/api/session/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }) })
      return res.ok
    } else {
      const res = await fetch('/api/session/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clear: true }) })
      return res.ok
    }
  } catch (e) {
    console.error('Auth state sync error:', e)
    return false
  }
}

export async function syncCustomClaims() {
  try {
    const res = await fetch('/api/claims/sync', { method: 'POST' })
    if (!res.ok) return false
    const user = auth.currentUser
    if (user) {
      // Force refresh to get claims in the ID token, then re-create session cookie
      await user.getIdToken(true)
      const idToken = await user.getIdToken()
      const s = await fetch('/api/session/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }) })
      return s.ok
    }
    return true
  } catch (e) {
    console.error('Claims sync error:', e)
    return false
  }
}

export function initializeAuthListener() {
  return onAuthStateChanged(auth, async (user) => {
    console.log('Auth state changed:', user ? user.email : 'logged out')
    await syncAuthState(user)
  })
}

export async function getCurrentSession() {
  try {
    const res = await fetch('/api/session/sync')
    if (!res.ok) return null
    const data = await res.json()
    return data.success ? data : null
  } catch (e) {
    console.error('Failed to get current session:', e)
    return null
  }
}


