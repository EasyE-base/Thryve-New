'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

export type HomeLocation = {
  zip: string
  lat: number
  lng: number
  city?: string
  state?: string
}

const STORAGE_KEY = 'thryve_home_location'

export function useHomeLocation() {
  const [location, setLocation] = useState<HomeLocation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
          setLocation(parsed)
        }
      }
    } catch {}
  }, [])

  useEffect(() => {
    try {
      if (location) localStorage.setItem(STORAGE_KEY, JSON.stringify(location))
    } catch {}
  }, [location])

  const setZip = useCallback(async (zip: string) => {
    setError(null)
    if (!/^\d{5}$/.test(zip)) {
      setError('Invalid ZIP')
      return null
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/geo/zip?zip=${encodeURIComponent(zip)}`)
      if (!res.ok) throw new Error('ZIP lookup failed')
      const data = await res.json()
      const next: HomeLocation = { zip, lat: data.lat, lng: data.lng, city: data.city, state: data.state }
      setLocation(next)
      return next
    } catch (e: any) {
      setError(e?.message || 'Failed to set ZIP')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const useMyLocation = useCallback(() => {
    setError(null)
    if (!('geolocation' in navigator)) {
      setError('Geolocation not available')
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords
      const next: HomeLocation = { zip: '', lat: latitude, lng: longitude }
      setLocation(next)
      setLoading(false)
    }, () => {
      setError('Location permission denied')
      setLoading(false)
    }, { enableHighAccuracy: false, maximumAge: 300000, timeout: 10000 })
  }, [])

  return useMemo(() => ({ location, setZip, useMyLocation, loading, error, setLocation }), [location, setZip, useMyLocation, loading, error])
}


