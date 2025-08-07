import { NextResponse } from 'next/server'
import { initAdmin } from '@/lib/firebase-admin'

export async function GET(request) {
  try {
    // For Phase 1, we'll skip authentication to allow testing
    // In production, this would verify the Bearer token
    /*
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No valid authorization header' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    if (!idToken) {
      return NextResponse.json({ error: 'No valid authorization header' }, { status: 401 })
    }

    const { auth, db } = initAdmin()
    const decodedToken = await auth.verifyIdToken(idToken)
    */
    
    // Add debugging to see what's happening
    console.log('Marketplace search called with params:', Object.fromEntries(new URL(request.url).searchParams.entries()))

    // Get search parameters
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const specialties = searchParams.get('specialties')?.split(',') || []
    const minRating = parseFloat(searchParams.get('minRating')) || 0
    const maxRate = parseFloat(searchParams.get('maxRate')) || 200
    const verified = searchParams.get('verified') === 'true'
    console.log('Verified parameter:', searchParams.get('verified'), 'Parsed as:', verified)
    const location = searchParams.get('location') || ''
    const radius = parseInt(searchParams.get('radius')) || 25
    const limit = parseInt(searchParams.get('limit')) || 20
    const page = parseInt(searchParams.get('page')) || 1

    // Mock instructor data for Phase 1 (will be replaced with real Firestore query)
    const mockInstructors = [
      {
        id: 'instructor-1',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@example.com',
        photo: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=face',
        bio: 'Certified yoga instructor with 8+ years of experience. Specializing in Vinyasa, Hatha, and Restorative yoga. Passionate about helping students find balance and strength.',
        specialties: ['Yoga', 'Meditation', 'Flexibility', 'Mindfulness'],
        certifications: ['RYT-500', 'Yoga Alliance Certified', 'Meditation Teacher'],
        hourlyRate: 85,
        location: {
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90210',
          coordinates: { latitude: 34.0522, longitude: -118.2437 }
        },
        availability: {
          monday: ['9:00-11:00', '14:00-16:00', '18:00-20:00'],
          tuesday: ['9:00-11:00', '14:00-16:00'],
          wednesday: ['9:00-11:00', '18:00-20:00'],
          thursday: ['9:00-11:00', '14:00-16:00'],
          friday: ['9:00-11:00', '18:00-20:00'],
          saturday: ['10:00-12:00', '14:00-16:00'],
          sunday: ['10:00-12:00']
        },
        rating: 4.8,
        reviewCount: 24,
        verified: true,
        portfolioPhotos: [
          'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop'
        ],
        joinedAt: new Date('2023-01-15'),
        lastActive: new Date()
      },
      {
        id: 'instructor-2',
        name: 'Mike Rodriguez',
        email: 'mike.rodriguez@example.com',
        photo: 'https://images.unsplash.com/photo-1566753773558-9a57d0c6b1f5?w=400&h=400&fit=crop&crop=face',
        bio: 'NASM certified personal trainer specializing in HIIT, strength training, and weight loss. Former collegiate athlete with a passion for helping clients achieve their fitness goals.',
        specialties: ['HIIT', 'Strength Training', 'Weight Loss', 'Cardio'],
        certifications: ['NASM-CPT', 'ACE-CPT', 'CrossFit Level 1'],
        hourlyRate: 95,
        location: {
          city: 'Austin',
          state: 'TX',
          zipCode: '78701',
          coordinates: { latitude: 30.2672, longitude: -97.7431 }
        },
        availability: {
          monday: ['6:00-8:00', '17:00-19:00'],
          tuesday: ['6:00-8:00', '17:00-19:00'],
          wednesday: ['6:00-8:00', '17:00-19:00'],
          thursday: ['6:00-8:00', '17:00-19:00'],
          friday: ['6:00-8:00', '17:00-19:00'],
          saturday: ['8:00-10:00', '14:00-16:00'],
          sunday: ['8:00-10:00']
        },
        rating: 4.9,
        reviewCount: 18,
        verified: true,
        portfolioPhotos: [
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop'
        ],
        joinedAt: new Date('2023-03-20'),
        lastActive: new Date()
      },
      {
        id: 'instructor-3',
        name: 'Emma Chen',
        email: 'emma.chen@example.com',
        photo: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
        bio: 'Pilates instructor with a background in dance. Specializing in reformer, mat, and barre classes. Focus on core strength, flexibility, and proper form.',
        specialties: ['Pilates', 'Core Strength', 'Flexibility', 'Barre'],
        certifications: ['Pilates Mat', 'Pilates Reformer', 'Barre Certified'],
        hourlyRate: 75,
        location: {
          city: 'Denver',
          state: 'CO',
          zipCode: '80202',
          coordinates: { latitude: 39.7392, longitude: -104.9903 }
        },
        availability: {
          monday: ['9:00-11:00', '15:00-17:00'],
          tuesday: ['9:00-11:00', '15:00-17:00'],
          wednesday: ['9:00-11:00', '15:00-17:00'],
          thursday: ['9:00-11:00', '15:00-17:00'],
          friday: ['9:00-11:00', '15:00-17:00'],
          saturday: ['10:00-12:00'],
          sunday: ['10:00-12:00']
        },
        rating: 4.7,
        reviewCount: 12,
        verified: true,
        portfolioPhotos: [
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop'
        ],
        joinedAt: new Date('2023-06-10'),
        lastActive: new Date()
      },
      {
        id: 'instructor-4',
        name: 'David Thompson',
        email: 'david.thompson@example.com',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
        bio: 'Certified cycling instructor and endurance coach. Former professional cyclist with expertise in indoor cycling, endurance training, and cycling technique.',
        specialties: ['Cycling', 'Endurance Training', 'Cardio', 'Indoor Cycling'],
        certifications: ['Spinning Certified', 'ACE-CPT', 'Cycling Coach'],
        hourlyRate: 80,
        location: {
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90210',
          coordinates: { latitude: 34.0522, longitude: -118.2437 }
        },
        availability: {
          monday: ['6:00-8:00', '18:00-20:00'],
          tuesday: ['6:00-8:00', '18:00-20:00'],
          wednesday: ['6:00-8:00', '18:00-20:00'],
          thursday: ['6:00-8:00', '18:00-20:00'],
          friday: ['6:00-8:00', '18:00-20:00'],
          saturday: ['8:00-10:00'],
          sunday: ['8:00-10:00']
        },
        rating: 4.6,
        reviewCount: 8,
        verified: false,
        portfolioPhotos: [
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop'
        ],
        joinedAt: new Date('2023-08-15'),
        lastActive: new Date()
      },
      {
        id: 'instructor-5',
        name: 'Lisa Martinez',
        email: 'lisa.martinez@example.com',
        photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
        bio: 'Zumba instructor and dance fitness specialist. Energetic and passionate about making fitness fun through dance. Certified in Zumba, Latin dance, and cardio dance.',
        specialties: ['Zumba', 'Dance Fitness', 'Cardio', 'Latin Dance'],
        certifications: ['Zumba Basic', 'Zumba Gold', 'Dance Fitness Certified'],
        hourlyRate: 70,
        location: {
          city: 'Austin',
          state: 'TX',
          zipCode: '78701',
          coordinates: { latitude: 30.2672, longitude: -97.7431 }
        },
        availability: {
          monday: ['18:00-20:00'],
          tuesday: ['18:00-20:00'],
          wednesday: ['18:00-20:00'],
          thursday: ['18:00-20:00'],
          friday: ['18:00-20:00'],
          saturday: ['10:00-12:00', '14:00-16:00'],
          sunday: ['10:00-12:00']
        },
        rating: 4.5,
        reviewCount: 6,
        verified: false,
        portfolioPhotos: [
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop'
        ],
        joinedAt: new Date('2023-09-05'),
        lastActive: new Date()
      }
    ]

    // Apply filters
    let filteredInstructors = mockInstructors

    // Text search
    if (query) {
      const searchTerm = query.toLowerCase()
      filteredInstructors = filteredInstructors.filter(instructor => 
        instructor.name.toLowerCase().includes(searchTerm) ||
        instructor.bio.toLowerCase().includes(searchTerm) ||
        instructor.specialties.some(specialty => 
          specialty.toLowerCase().includes(searchTerm)
        )
      )
    }

    // Specialty filter
    if (specialties.length > 0 && specialties.some(s => s.trim() !== '')) {
      filteredInstructors = filteredInstructors.filter(instructor =>
        specialties.some(specialty => 
          specialty.trim() !== '' && instructor.specialties.includes(specialty)
        )
      )
    }

    // Rating filter
    if (minRating > 0) {
      filteredInstructors = filteredInstructors.filter(instructor =>
        instructor.rating >= minRating
      )
    }

    // Rate filter
    if (maxRate <= 200) {
      filteredInstructors = filteredInstructors.filter(instructor =>
        instructor.hourlyRate <= maxRate
      )
    }

    // Verification filter
    if (verified === true) {
      filteredInstructors = filteredInstructors.filter(instructor =>
        instructor.verified === true
      )
    }

    // Location filter (simplified for Phase 1)
    if (location) {
      filteredInstructors = filteredInstructors.filter(instructor =>
        instructor.location.city.toLowerCase().includes(location.toLowerCase()) ||
        instructor.location.state.toLowerCase().includes(location.toLowerCase())
      )
    }

    // Pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedInstructors = filteredInstructors.slice(startIndex, endIndex)

    // Calculate marketplace stats
    const stats = {
      totalInstructors: mockInstructors.length,
      verifiedInstructors: mockInstructors.filter(i => i.verified).length,
      averageRating: mockInstructors.reduce((sum, i) => sum + i.rating, 0) / mockInstructors.length,
      topSpecialties: ['Yoga', 'HIIT', 'Pilates', 'Cycling', 'Zumba'],
      totalResults: filteredInstructors.length,
      hasMore: endIndex < filteredInstructors.length
    }

    return NextResponse.json({
      instructors: paginatedInstructors,
      stats,
      pagination: {
        page,
        limit,
        total: filteredInstructors.length,
        hasMore: stats.hasMore
      },
      filters: {
        query,
        specialties,
        minRating,
        maxRate,
        verified,
        location,
        radius
      }
    })

  } catch (error) {
    console.error('Marketplace search error:', error)
    return NextResponse.json({ 
      error: 'Failed to search marketplace',
      details: error.message 
    }, { status: 500 })
  }
}
