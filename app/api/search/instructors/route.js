import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    // Verify authentication header exists
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No valid authorization header' }, { status: 401 })
    }

    // Get search query from URL parameters
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '10')

    // Mock instructor data for search
    const mockInstructors = [
      {
        id: 'instructor-1',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@example.com',
        phone: '(555) 123-4567',
        role: 'instructor',
        status: 'active',
        specialties: ['Yoga', 'Meditation', 'Flexibility'],
        rating: 4.8,
        totalClasses: 24,
        joinedDate: '2023-12-31',
        avatar: 'SJ'
      },
      {
        id: 'instructor-2',
        name: 'Mike Rodriguez',
        email: 'mike.rodriguez@example.com',
        phone: '(555) 987-6543',
        role: 'instructor',
        status: 'active',
        specialties: ['HIIT', 'Strength Training', 'Weight Loss'],
        rating: 4.9,
        totalClasses: 18,
        joinedDate: '2024-01-14',
        avatar: 'MR'
      },
      {
        id: 'instructor-3',
        name: 'Emma Chen',
        email: 'emma.chen@example.com',
        phone: '(555) 456-7890',
        role: 'instructor',
        status: 'pending',
        specialties: ['Pilates', 'Core Strength', 'Flexibility'],
        rating: 4.7,
        totalClasses: 12,
        joinedDate: '2024-01-19',
        avatar: 'EC'
      },
      {
        id: 'instructor-4',
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '(555) 111-2222',
        role: 'instructor',
        status: 'pending',
        specialties: ['CrossFit', 'Endurance', 'Strength'],
        rating: 4.6,
        totalClasses: 8,
        joinedDate: '2024-01-20',
        avatar: 'JD'
      },
      {
        id: 'instructor-5',
        name: 'Alice Smith',
        email: 'alice.smith@example.com',
        phone: '(555) 333-4444',
        role: 'instructor',
        status: 'pending',
        specialties: ['Zumba', 'Dance Fitness', 'Cardio'],
        rating: 4.5,
        totalClasses: 6,
        joinedDate: '2024-01-21',
        avatar: 'AS'
      }
    ]

    // Filter instructors based on search query
    let filteredInstructors = mockInstructors
    if (query) {
      const searchTerm = query.toLowerCase()
      filteredInstructors = mockInstructors.filter(instructor => 
        instructor.name.toLowerCase().includes(searchTerm) ||
        instructor.email.toLowerCase().includes(searchTerm) ||
        instructor.specialties.some(specialty => 
          specialty.toLowerCase().includes(searchTerm)
        )
      )
    }

    // Apply limit
    filteredInstructors = filteredInstructors.slice(0, limit)

    return NextResponse.json({
      instructors: filteredInstructors,
      total: filteredInstructors.length,
      query: query,
      limit: limit
    })

  } catch (error) {
    console.error('Instructor search error:', error)
    return NextResponse.json({ 
      error: 'Failed to search instructors',
      details: error.message 
    }, { status: 500 })
  }
}
