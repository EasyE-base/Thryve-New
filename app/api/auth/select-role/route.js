import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { updateUserRole } from '@/lib/auth'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { role } = body

    if (!role || !['customer', 'instructor', 'merchant'].includes(role)) {
      return NextResponse.json(
        { error: 'Valid role is required' },
        { status: 400 }
      )
    }

    // Update user role in database
    await updateUserRole(session.user.id, role)
    
    return NextResponse.json({ 
      message: 'Role updated successfully',
      role
    })
  } catch (error) {
    console.error('Role selection API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update role' },
      { status: 400 }
    )
  }
}