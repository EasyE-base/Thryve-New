'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ArrowLeft, Calendar, Clock, MapPin, Users, Star, CreditCard, DollarSign } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { format } from 'date-fns'

export default function ClassDetailPage() {
  const { user } = useAuth()
  const [classData, setClassData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [isBooked, setIsBooked] = useState(false)
  const params = useParams()
  const router = useRouter()

  useEffect(() => {
    // In production, this would fetch from API using params.id
    const sampleClass = {
      id: params.id,
      title: 'Morning Yoga Flow',
      instructor: {
        name: 'Sarah Johnson',
        bio: 'Certified yoga instructor with 5+ years of experience in vinyasa and hatha yoga.',
        specialties: ['Yoga', 'Meditation', 'Flexibility'],
        rating: 4.8,
        totalClasses: 24
      },
      type: 'Yoga',
      level: 'Beginner',
      duration: 60,
      price: 25,
      rating: 4.8,
      location: 'Zen Studio Downtown',
      address: '123 Main Street, Downtown',
      description: 'Start your day with an energizing vinyasa flow that will awaken your body and mind. This beginner-friendly class focuses on breath-synchronized movement, basic poses, and relaxation techniques. Perfect for those new to yoga or looking for a gentle morning practice.',
      schedule: '2024-01-15T08:00:00Z',
      capacity: 20,
      enrolled: 15,
      amenities: ['Mats Provided', 'Towels Available', 'Water Station', 'Changing Room'],
      requirements: ['Comfortable clothing', 'Water bottle', 'Positive attitude'],
      cancellationPolicy: 'Free cancellation up to 4 hours before class start time.'
    }

    setTimeout(() => {
      setClassData(sampleClass)
      setLoading(false)
    }, 1000)
  }, [params.id])

  const handleBookClass = async () => {
    if (!user) {
      toast.error('Please sign in to book classes')
      return
    }

    setBookingLoading(true)
    try {
      // In production, this would process payment and create booking
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call
      
      setIsBooked(true)
      toast.success('Class booked successfully!')
    } catch (error) {
      toast.error('Failed to book class. Please try again.')
    } finally {
      setBookingLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!classData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Class not found</h2>
          <p className="text-gray-600 mb-4">The class you're looking for doesn't exist.</p>
          <Link href="/dashboard/customer/explore">
            <Button>Browse Classes</Button>
          </Link>
        </div>
      </div>
    )
  }

  const spotsLeft = classData.capacity - classData.enrolled
  const isFull = spotsLeft <= 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/customer/explore">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Explore
                </Button>
              </Link>
            </div>
            <div className="text-sm text-gray-600">
              {user?.email}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Class Header */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl mb-2">{classData.title}</CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <Badge variant="secondary">{classData.type}</Badge>
                      <Badge variant="outline">{classData.level}</Badge>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        {classData.rating}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">${classData.price}</div>
                    <div className="text-sm text-gray-600">per session</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{classData.description}</p>
              </CardContent>
            </Card>

            {/* Class Details */}
            <Card>
              <CardHeader>
                <CardTitle>Class Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="font-medium">Date</div>
                      <div className="text-sm text-gray-600">
                        {format(new Date(classData.schedule), 'EEEE, MMMM dd')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="font-medium">Time</div>
                      <div className="text-sm text-gray-600">
                        {format(new Date(classData.schedule), 'h:mm a')} ({classData.duration} min)
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="font-medium">Location</div>
                      <div className="text-sm text-gray-600">{classData.location}</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="font-medium">Capacity</div>
                      <div className="text-sm text-gray-600">
                        {classData.enrolled}/{classData.capacity} spots filled
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Instructor */}
            <Card>
              <CardHeader>
                <CardTitle>Your Instructor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg">
                      {classData.instructor.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{classData.instructor.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        {classData.instructor.rating}
                      </div>
                      <span>{classData.instructor.totalClasses} classes taught</span>
                    </div>
                    <p className="text-gray-700 mb-3">{classData.instructor.bio}</p>
                    <div className="flex flex-wrap gap-2">
                      {classData.instructor.specialties.map((specialty) => (
                        <Badge key={specialty} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What to Bring */}
            <Card>
              <CardHeader>
                <CardTitle>What to Bring</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {classData.requirements.map((requirement, index) => (
                    <li key={index} className="flex items-center">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                      {requirement}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Book This Class</span>
                  <div className="text-2xl font-bold text-blue-600">${classData.price}</div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Spots Available:</span>
                    <span className={spotsLeft <= 5 ? 'text-red-600 font-medium' : 'text-green-600'}>
                      {spotsLeft} left
                    </span>
                  </div>
                  {spotsLeft <= 5 && spotsLeft > 0 && (
                    <p className="text-xs text-red-600">Hurry! Only {spotsLeft} spots remaining</p>
                  )}
                </div>

                {isBooked ? (
                  <Button disabled className="w-full">
                    ✓ Booked Successfully
                  </Button>
                ) : isFull ? (
                  <Button disabled variant="secondary" className="w-full">
                    Class Full - Join Waitlist
                  </Button>
                ) : (
                  <Button 
                    onClick={handleBookClass} 
                    disabled={bookingLoading}
                    className="w-full"
                  >
                    {bookingLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Booking...
                      </div>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Book Now
                      </>
                    )}
                  </Button>
                )}

                <div className="text-xs text-gray-500 text-center">
                  Secure payment processed by Stripe
                </div>
              </CardContent>
            </Card>

            {/* Amenities */}
            <Card>
              <CardHeader>
                <CardTitle>What's Included</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {classData.amenities.map((amenity, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      {amenity}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Cancellation Policy */}
            <Card>
              <CardHeader>
                <CardTitle>Cancellation Policy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{classData.cancellationPolicy}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}