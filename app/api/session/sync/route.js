// app/api/session/sync/route.js
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request) {
  try {
    const payload = await request.json().catch(() => ({}))
    const jar = cookies()

    // Clear cookie if requested
    if (payload?.clear === true) {
      jar.delete('user')
      return NextResponse.json({ ok: true, cleared: true })
    }

    // Minimal, canonical fields only
    const cookieValue = {
      uid: payload?.uid || null,
      email: payload?.email || null,
      role: payload?.role || null,
      onboardingCompleted: !!payload?.onboardingCompleted,
    }

    jar.set('user', JSON.stringify(cookieValue), {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'BAD_REQUEST' }, { status: 400 })
  }
}


