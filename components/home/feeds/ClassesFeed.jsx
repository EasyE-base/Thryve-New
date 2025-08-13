'use client'

import { useEffect, useRef, useState } from 'react'

export default function ClassesFeed({ lat, lng, radius = 25, segment = 'members', mockItems = [] }) {
  const [items, setItems] = useState([])
  const [cursor, setCursor] = useState(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const sentinelRef = useRef(null)
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
      const res = await fetch(`/api/feeds/classes?${params.toString()}`)
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
        setCursor((c) => c || '') // trigger next load
      }
    })
    io.observe(sentinelRef.current)
    return () => io.disconnect()
  }, [loading, done])

  if ((loadedOnce || items.length > 0) && (lat && lng)) {
    return (
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((c) => (
          <div key={c.id} className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            {c.imageUrl && <img alt="" src={c.imageUrl} className="h-40 w-full object-cover" loading="lazy" />}
            <div className="p-4">
              <div className="text-sm text-gray-500">{c.studioName} • {c.city}, {c.state}</div>
              <div className="mt-1 font-semibold text-gray-900">{c.title}</div>
              <div className="mt-1 text-sm text-gray-700">{new Date(c.startTime).toLocaleString()}</div>
              <div className="mt-2 text-sm text-gray-700">${(c.priceCents/100).toFixed(2)}</div>
              <div className="mt-3">
                <a
                  href={`/class/${c.id}`}
                  onClick={(e) => {
                    if (typeof window !== 'undefined') {
                      window.dataLayer = window.dataLayer || []
                      window.dataLayer.push({ event: 'class_card_click', id: c.id, segment })
                    }
                    if (!window.__isAuthed) { e.preventDefault(); window.location.href = `/login?next=/class/${c.id}` }
                  }}
                  className="inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
                >
                  Book
                </a>
              </div>
            </div>
          </div>
        ))}
        <div ref={sentinelRef} />
        {loading && <div className="col-span-full text-center text-gray-600">Loading…</div>}
      </div>
    )
  }

  // Fallback mock scroller
  return (
    <div className="mt-8 overflow-x-auto -mx-4 px-4">
      <div className="flex gap-4 flex-nowrap snap-x snap-mandatory">
        {mockItems.map((c) => (
          <div key={c.id} className="snap-start min-w-[280px] rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {c.imageUrl && <img alt="" src={c.imageUrl} className="h-32 w-full object-cover" />}
            <div className="p-4">
              <div className="text-sm text-gray-500">{c.studioName} • {c.city}, {c.state}</div>
              <div className="mt-1 font-semibold text-gray-900">{c.title}</div>
              <div className="mt-1 text-sm text-gray-700">{new Date(c.startTime).toLocaleString()}</div>
              <div className="mt-2 text-sm text-gray-700">${(c.priceCents/100).toFixed(2)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


