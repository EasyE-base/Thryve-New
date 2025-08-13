import { NextResponse } from 'next/server'
import { initAdmin } from '@/lib/firebase-admin'
import { requireMarketplaceUser } from '../_guard'

function parseNum(v, d = null) { const n = Number(v); return Number.isFinite(n) ? n : d }
function parseBool(v) { return v === 'true' ? true : v === 'false' ? false : undefined }

export async function GET(request) {
  try {
    const { uid, role } = await requireMarketplaceUser(request.headers.get('authorization'))
    // Role gate: require merchant or instructor. For MVP we infer by presence of studio/instructor docs if needed.

    const url = new URL(request.url)
    const lat = parseNum(url.searchParams.get('lat'))
    const lng = parseNum(url.searchParams.get('lng'))
    const radiusKm = parseNum(url.searchParams.get('radiusKm'), 50)
    const minRate = parseNum(url.searchParams.get('minRate'))
    const maxRate = parseNum(url.searchParams.get('maxRate'))
    const verified = parseBool(url.searchParams.get('verified'))
    const remote = parseBool(url.searchParams.get('remote'))
    const specialties = url.searchParams.getAll('specialties[]')
    const languages = url.searchParams.getAll('languages[]')

    // Base query: visible instructors
    const { db } = initAdmin()
    let query = db.collection('instructors').where('marketplaceVisible', '==', true)

    if (minRate != null) query = query.where('hourlyRate', '>=', minRate)
    if (maxRate != null) query = query.where('hourlyRate', '<=', maxRate)
    if (verified != null) query = query.where('verified', '==', verified)
    if (remote != null) query = query.where('remoteAvailable', '==', remote)

    // Execute base query (limit to reasonable size for MVP)
    const snap = await query.limit(200).get()
    let results = snap.docs.map(d => ({ id: d.id, ...d.data() }))

    // Client-side secondary filtering for arrays
    if (specialties.length > 0) {
      results = results.filter(r => Array.isArray(r.specialties) && r.specialties.some(s => specialties.includes(s)))
    }
    if (languages.length > 0) {
      results = results.filter(r => Array.isArray(r.languages) && r.languages.some(s => languages.includes(s)))
    }

    // Location filtering using bounding-box + Haversine (approx)
    if (lat != null && lng != null && radiusKm != null) {
      const R = 6371
      const toRad = (deg) => deg * Math.PI / 180
      const haversine = (a, b) => {
        if (typeof a?.lat !== 'number' || typeof a?.lng !== 'number') return Infinity
        const dLat = toRad(b.lat - a.lat)
        const dLng = toRad(b.lng - a.lng)
        const s1 = Math.sin(dLat / 2) ** 2
        const s2 = Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
        const d = 2 * Math.asin(Math.sqrt(s1 + s2))
        return R * d
      }
      const origin = { lat, lng }
      results = results.map(r => ({ ...r, _distanceKm: haversine({ lat: r.lat, lng: r.lng }, origin) }))
        .filter(r => r._distanceKm <= radiusKm)
        .sort((a, b) => (a._distanceKm ?? Infinity) - (b._distanceKm ?? Infinity))
    } else {
      // Sort by activity then rate as default
      results.sort((a, b) => (b.lastActiveAt?.toMillis?.() || 0) - (a.lastActiveAt?.toMillis?.() || 0) || (a.hourlyRate || 0) - (b.hourlyRate || 0))
    }

    return NextResponse.json({ instructors: results })
  } catch (e) {
    console.error('Marketplace search error:', e)
    return NextResponse.json({ error: 'Failed to search instructors' }, { status: 500 })
  }
}


