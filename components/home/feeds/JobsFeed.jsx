'use client'

import { useEffect, useRef, useState } from 'react'

export default function JobsFeed({ lat, lng, radius = 25, segment = 'instructors', mockItems = [] }) {
  const [items, setItems] = useState([])
  const [cursor, setCursor] = useState(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const sentinelRef = useRef(null)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [loadedOnce, setLoadedOnce] = useState(false)

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
      setLoadedOnce(true)
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

  if ((loadedOnce || items.length > 0) && (lat && lng)) {
    return (
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((j) => (
          <div key={j.id} className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <div className="p-4">
              <div className="text-sm text-gray-500">{j.city}, {j.state}</div>
              <div className="mt-1 font-semibold text-gray-900">{j.title}</div>
              <div className="mt-1 text-sm text-gray-700">${j.ratePerHour}/hr • {j.scheduleSummary}</div>
              {j.remote && <div className="mt-2 inline-flex items-center rounded-full border border-gray-200 px-2 py-0.5 text-xs text-gray-700">Remote OK</div>}
              <div className="mt-3">
                <a
                  href={`/job/${j.id}`}
                  onClick={(e) => {
                    if (typeof window !== 'undefined') {
                      window.dataLayer = window.dataLayer || []
                      window.dataLayer.push({ event: 'job_card_click', id: j.id, segment })
                    }
                    if (!window.__isAuthed) { e.preventDefault(); window.location.href = `/login?next=/job/${j.id}`; return }
                    if (window.__role === 'customer') { e.preventDefault(); setShowRoleModal(true); return }
                  }}
                  className="inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
                >
                  Apply
                </a>
              </div>
            </div>
          </div>
        ))}
        <div ref={sentinelRef} />
        {loading && <div className="col-span-full text-center text-gray-600">Loading…</div>}
        {showRoleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900">This action is for studios and instructors</h3>
              <p className="mt-2 text-sm text-gray-700">Create a studio or instructor account to apply to jobs.</p>
              <div className="mt-4 flex gap-3">
                <a href="/signup?role=merchant" className="inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black">I'm a studio</a>
                <a href="/signup?role=instructor" className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50">I'm an instructor</a>
              </div>
              <button onClick={() => setShowRoleModal(false)} className="mt-4 text-sm text-gray-600 underline">Close</button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Fallback mock scroller
  return (
    <div className="mt-6 overflow-x-auto -mx-4 px-4">
      <div className="flex gap-4 flex-nowrap snap-x snap-mandatory">
        {mockItems.map((j) => (
          <div key={j.id} className="snap-start min-w-[280px] rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden p-4">
            <div className="text-sm text-gray-500">{j.city}, {j.state}</div>
            <div className="mt-1 font-semibold text-gray-900">{j.title}</div>
            <div className="mt-1 text-sm text-gray-700">${j.ratePerHour}/hr • {j.scheduleSummary}</div>
            {j.remote && <div className="mt-2 inline-flex items-center rounded-full border border-gray-200 px-2 py-0.5 text-xs text-gray-700">Remote OK</div>}
          </div>
        ))}
      </div>
    </div>
  )
}


