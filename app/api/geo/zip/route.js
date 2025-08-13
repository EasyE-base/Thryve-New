import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const zip = (searchParams.get('zip') || '').trim()
  if (!/^\d{5}$/.test(zip)) {
    return NextResponse.json({ error: 'INVALID_ZIP' }, { status: 400 })
  }

  const key = process.env.GEOCODE_API_KEY
  if (!key) {
    return NextResponse.json({ error: 'NO_API_KEY' }, { status: 500 })
  }

  try {
    // Mapbox forward geocoding for US ZIP
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${zip}.json?country=US&types=postcode&access_token=${encodeURIComponent(key)}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return NextResponse.json({ error: 'GEOCODE_FAILED' }, { status: 502 })
    const data = await res.json()
    const feature = data?.features?.[0]
    if (!feature) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    const [lng, lat] = feature.center
    const context = feature.context || []
    const place = feature.text || ''
    const city = place || (context.find((c) => c.id?.startsWith('place'))?.text || '')
    const state = context.find((c) => c.id?.startsWith('region'))?.short_code?.split('-')[1]?.toUpperCase() || ''
    return NextResponse.json({ lat, lng, city, state })
  } catch (e) {
    return NextResponse.json({ error: 'GEOCODE_ERROR' }, { status: 500 })
  }
}


