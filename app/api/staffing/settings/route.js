import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    // Verify authentication header exists
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No valid authorization header' }, { status: 401 })
    }

    // For now, return default settings
    const settings = {
      requireSwapApproval: true,
      autoApproveQualified: false,
      minimumCoverageHours: 24,
      notifyAllInstructors: true,
      emailNotifications: true,
      smsNotifications: false,
      dailySummary: true
    }

    return NextResponse.json({ settings })

  } catch (error) {
    console.error('Staffing settings error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch settings',
      details: error.message 
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    // Verify authentication header exists
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No valid authorization header' }, { status: 401 })
    }

    const body = await request.json()
    
    // For now, just return the updated settings
    // In production, you'd save these to Firestore
    const settings = {
      requireSwapApproval: body.requireSwapApproval ?? true,
      autoApproveQualified: body.autoApproveQualified ?? false,
      minimumCoverageHours: body.minimumCoverageHours ?? 24,
      notifyAllInstructors: body.notifyAllInstructors ?? true,
      emailNotifications: body.emailNotifications ?? true,
      smsNotifications: body.smsNotifications ?? false,
      dailySummary: body.dailySummary ?? true
    }

    return NextResponse.json({ settings })

  } catch (error) {
    console.error('Staffing settings update error:', error)
    return NextResponse.json({ 
      error: 'Failed to update settings',
      details: error.message 
    }, { status: 500 })
  }
}
