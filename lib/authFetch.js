'use client'

import { getAuth } from 'firebase/auth'

export async function authFetch(input, init = {}) {
  const auth = getAuth()
  const user = auth.currentUser
  if (!user) throw new Error('not-signed-in')

  const token = await user.getIdToken()
  const headers = new Headers(init.headers || {})
  headers.set('Authorization', `Bearer ${token}`)
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  let res = await fetch(input, { ...init, headers })
  if (res.status === 401) {
    const fresh = await user.getIdToken(true)
    headers.set('Authorization', `Bearer ${fresh}`)
    res = await fetch(input, { ...init, headers })
  }
  return res
}


