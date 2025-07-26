'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ArrowLeft, Search, MapPin, Star, Clock, Users, Filter } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ExplorePage() {
  const { user } = useAuth()
  const [classes, setClasses] = useState([])
  const [instructors, setInstructors] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('classes')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Sample data for now (in production, this would come from APIs)
  useEffect(() => {
    const sampleClasses = [
      {
        id: 1,
        title: 'Morning Yoga Flow',
        instructor: 'Sarah Johnson',
        type: 'Yoga',
        level: 'Beginner',
        duration: 60,
        price: 25,
        rating: 4.8,
        location: 'Zen Studio Downtown',
        description: 'Start your day with energizing vinyasa flow',
        schedule: '2024-01-15T08:00:00Z',
        capacity: 20,
        enrolled: 15
      },
      {
        id: 2,
        title: 'HIIT Bootcamp',
        instructor: 'Mike Rodriguez',
        type: 'HIIT',
        level: 'Intermediate',
        duration: 45,
        price: 30,
        rating: 4.9,
        location: 'FitCore Gym',
        description: 'High-intensity interval training for maximum results',
        schedule: '2024-01-15T18:00:00Z',
        capacity: 15,
        enrolled: 12
      },
      {
        id: 3,
        title: 'Pilates Core Strength',
        instructor: 'Emma Chen',
        type: 'Pilates',
        level: 'All Levels',
        duration: 50,
        price: 28,
        rating: 4.7,
        location: 'Pure Movement Studio',
        description: 'Build core strength and improve posture',
        schedule: '2024-01-16T10:00:00Z',
        capacity: 12,
        enrolled: 8
      }
    ]

    const sampleInstructors = [
      {
        id: 1,
        name: 'Sarah Johnson',
        specialties: ['Yoga', 'Meditation', 'Flexibility'],
        rating: 4.8,
        experience: '5+ years',
        location: 'Downtown',
        bio: 'Certified yoga instructor with expertise in vinyasa and hatha yoga',
        avatar: null,
        classesCount: 24
      },
      {
        id: 2,
        name: 'Mike Rodriguez',
        specialties: ['HIIT', 'Strength Training', 'Weight Loss'],
        rating: 4.9,
        experience: '8+ years',
        location: 'Midtown',
        bio: 'Former athlete turned fitness coach specializing in high-intensity training',
        avatar: null,
        classesCount: 18
      }
    ]

    setTimeout(() => {
      setClasses(sampleClasses)
      setInstructors(sampleInstructors)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredClasses = classes.filter(classItem =>
    classItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classItem.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classItem.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredInstructors = instructors.filter(instructor =>
    instructor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instructor.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/customer">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Explore</h1>
            </div>
            <div className="text-sm text-gray-600">
              Welcome, {user?.email}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search classes, instructors, or activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('classes')}
              className={`pb-4 text-sm font-medium border-b-2 ${
                activeTab === 'classes'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Classes ({filteredClasses.length})
            </button>
            <button
              onClick={() => setActiveTab('instructors')}
              className={`pb-4 text-sm font-medium border-b-2 ${
                activeTab === 'instructors'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Instructors ({filteredInstructors.length})
            </button>
          </nav>
        </div>

        {/* Classes Tab */}
        {activeTab === 'classes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClasses.map((classItem) => (
              <Card key={classItem.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{classItem.title}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">by {classItem.instructor}</p>
                    </div>
                    <Badge variant="secondary">{classItem.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">{classItem.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {classItem.duration}min
                      </div>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 mr-1 text-yellow-500" />
                        {classItem.rating}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {classItem.level}
                      </Badge>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {classItem.location}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        {classItem.enrolled}/{classItem.capacity} spots
                      </div>
                      <div className="text-lg font-bold text-blue-600">
                        ${classItem.price}
                      </div>
                    </div>

                    <Button 
                      className="w-full" 
                      onClick={() => router.push(`/class/${classItem.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Instructors Tab */}
        {activeTab === 'instructors' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInstructors.map((instructor) => (
              <Card key={instructor.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>
                        {instructor.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{instructor.name}</CardTitle>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className="text-sm text-gray-600">{instructor.rating}</span>
                        <span className="text-sm text-gray-400 ml-2">({instructor.classesCount} classes)</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">{instructor.bio}</p>
                    
                    <div className="flex flex-wrap gap-2">
                      {instructor.specialties.map((specialty) => (
                        <Badge key={specialty} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {instructor.location}
                      </div>
                      <span>{instructor.experience}</span>
                    </div>

                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => router.push(`/instructor/${instructor.id}`)}
                    >
                      View Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {((activeTab === 'classes' && filteredClasses.length === 0) ||
          (activeTab === 'instructors' && filteredInstructors.length === 0)) && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600">
              Try adjusting your search terms or browse all {activeTab}.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}