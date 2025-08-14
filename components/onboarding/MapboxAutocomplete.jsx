'use client'

import React, { useEffect, useRef, useState } from 'react'

export default function MapboxAutocomplete({
  token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  onSelect,
  placeholder = 'Search address',
  defaultValue = '',
}) {
  const [value, setValue] = useState(defaultValue)
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  useEffect(() => {
    const doSearch = async () => {
      if (!token || value.trim().length < 3) return setResults([])
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${token}&autocomplete=true&limit=5`
        const res = await fetch(url)
        const data = await res.json()
        setResults(Array.isArray(data.features) ? data.features : [])
      } catch {
        setResults([])
      }
    }
    const id = window.setTimeout(doSearch, 300)
    return () => window.clearTimeout(id)
  }, [token, value])

  return (
    <div ref={containerRef} className="relative">
      <input
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
        placeholder={placeholder}
        value={value}
        onChange={(e) => { setValue(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
      />
      {open && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-sm">
          {results.map((f) => (
            <button
              type="button"
              key={f.id}
              onClick={() => {
                setValue(f.place_name)
                setOpen(false)
                const [lng, lat] = f.center
                onSelect?.({
                  address1: f.text,
                  city: f.context?.find(c => c.id?.startsWith('place'))?.text || '',
                  state: f.context?.find(c => c.id?.startsWith('region'))?.short_code?.split('-')[1]?.toUpperCase() || '',
                  zip: f.context?.find(c => c.id?.startsWith('postcode'))?.text || '',
                  country: f.context?.find(c => c.id?.startsWith('country'))?.short_code?.toUpperCase() || '',
                  lat,
                  lng,
                  formatted: f.place_name,
                })
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50"
            >
              {f.place_name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}


