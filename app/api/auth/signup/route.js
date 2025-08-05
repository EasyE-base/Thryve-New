import { NextResponse } from 'next/server'
import { signUpWithEmailAndPassword } from '@/lib/auth'

export async function POST(request) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const result = await signUpWithEmailAndPassword(email, password, `${firstName} ${lastName}`)
    
    if (result.success) {
      return NextResponse.json({ 
        message: 'User created successfully',
        user: {
          id: result.user.uid,
          email: result.user.email,
          name: result.user.displayName
        }
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to create user' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Signup API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 400 }
    )
  }
}