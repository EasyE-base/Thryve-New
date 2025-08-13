'use client'

import { useEffect, useRef, useState } from 'react'

export default function JobsFeed({ lat, lng, radius = 25 }) {
  const [items, setItems] = useState([])
  const [cursor, setCursor] = useState(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const sentinelRef = useRef(null)

  useEffect(() => {
    setItems([])
    setCursor(null)
    setDone(false)
  }, [lat, lng, radius])

  useEffect(() => {
    if (!lat || !lng) return
    const load = async () => {
      if (loading || done) return
      setLoading(true)
      const params = new URLSearchParams({ lat: String(lat), lng: String(lng), radius: String(radius), limit: '20' })
      if (cursor) params.set('cursor', cursor)
      const res = await fetch(`/api/feeds/jobs?${params.toString()}`)
      if (!res.ok) { setLoading(false); return }
      const data = await res.json()
      setItems((prev) => [...prev, ...data.items])
      setCursor(data.nextCursor || null)
      setDone(!data.nextCursor)
      setLoading(false)
    }
    load()
  }, [lat, lng, radius, cursor])

  useEffect(() => {
    if (!sentinelRef.current) return
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting) && !loading && !done) {
        setCursor((c) => c || '')
      }
    })
    io.observe(sentinelRef.current)
    return () => io.disconnect()
  }, [loading, done])

  return (
    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((j) => (
        <a key={j.id} href={`/job/${j.id}`} className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden" onClick={(e) => {
          if (!window.__isAuthed) { e.preventDefault(); window.location.href = `/login?next=/job/${j.id}` }
        }}>
          <div className="p-4">
            <div className="text-sm text-gray-500">{j.city}, {j.state}</div>
            <div className="mt-1 font-semibold text-gray-900">{j.title}</div>
            <div className="mt-1 text-sm text-gray-700">${j.ratePerHour}/hr • {j.scheduleSummary}</div>
            {j.remote && <div className="mt-2 inline-flex items-center rounded-full border border-gray-200 px-2 py-0.5 text-xs text-gray-700">Remote OK</div>}
          </div>
        </a>
      ))}
      <div ref={sentinelRef} />
      {loading && <div className="col-span-full text-center text-gray-600">Loading…</div>}
    </div>
  )
}


