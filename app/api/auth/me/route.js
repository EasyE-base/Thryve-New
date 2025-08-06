// app/api/auth/me/route.js
import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';

export async function GET(request) {
  const sessionCookie = request.cookies.get('session')?.value;
  if (!sessionCookie) return NextResponse.json({ role: null }, { status: 401 });

  try {
    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    return NextResponse.json({ role: decoded.role || null });
  } catch {
    return NextResponse.json({ role: null }, { status: 401 });
  }
} 