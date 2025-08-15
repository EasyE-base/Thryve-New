'use client'

import { useEffect, useState } from 'react'

export default function DebugSessionPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      setErr('')
      const res = await fetch('/api/session/sync')
      const json = await res.json().catch(() => ({}))
      setData({ ok: res.ok, status: res.status, ...json })
    } catch (e) {
      setErr(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }

  const syncClaims = async () => {
    try {
      setLoading(true)
      await fetch('/api/claims/sync', { method: 'POST' })
      // refresh token and session
      try { await window?.firebase?.auth?.().currentUser?.getIdToken(true) } catch {}
      const idToken = await window?.firebase?.auth?.().currentUser?.getIdToken?.()
      if (idToken) {
        await fetch('/api/session/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }) })
      }
      await load()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Session Debug</h1>
        <div className="flex gap-2">
          <button className="px-3 py-2 border rounded" onClick={load} disabled={loading}>Reload</button>
          <button className="px-3 py-2 bg-black text-white rounded" onClick={syncClaims} disabled={loading}>Sync Claims</button>
        </div>
      </div>
      {err && <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 mb-3">{err}</div>}
      <pre className="bg-gray-100 p-3 rounded overflow-auto text-sm">{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}


