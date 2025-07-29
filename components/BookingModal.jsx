'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/components/auth-provider'
import { 
  X, Calendar, Clock, MapPin, User, Users, CreditCard, 
  CheckCircle, AlertCircle, Loader, Heart, Star,
  ArrowLeft, ArrowRight, RefreshCw, UserPlus
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

const BookingModal = ({ classData, isOpen, onClose, onBookingSuccess }) => {
  const { user, role } = useAuth()
  const [bookingStep, setBookingStep] = useState('details') // details, payment, confirmation
  const [isLoading, setIsLoading] = useState(false)
  const [availableSpots, setAvailableSpots] = useState(classData?.capacity - classData?.booked || 0)
  const [isWaitlisted, setIsWaitlisted] = useState(false)
  const [userBookings, setUserBookings] = useState([])
  const [paymentMethod, setPaymentMethod] = useState('credit')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [similarClasses, setSimilarClasses] = useState([])

  // Fetch user's existing bookings and class availability
  useEffect(() => {
    if (isOpen && user && classData) {
      fetchBookingData()
      fetchSimilarClasses()
      startRealTimeUpdates()
    }
  }, [isOpen, user, classData])

  const fetchBookingData = async () => {
    try {
      const token = await user.getIdToken()
      
      // Fetch current bookings
      const bookingsResponse = await fetch('/server-api/bookings/user', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json()
        setUserBookings(bookingsData.bookings || [])
      }

      // Fetch real-time availability
      const availabilityResponse = await fetch(`/server-api/classes/${classData.id}/availability`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (availabilityResponse.ok) {
        const availabilityData = await availabilityResponse.json()
        setAvailableSpots(availabilityData.availableSpots)
        setIsWaitlisted(availabilityData.isUserWaitlisted)
      }
    } catch (error) {
      console.error('Error fetching booking data:', error)
    }
  }

  const fetchSimilarClasses = async () => {
    try {
      const response = await fetch(`/server-api/classes/similar/${classData.id}?limit=3`)
      if (response.ok) {
        const data = await response.json()
        setSimilarClasses(data.classes || [])
      }
    } catch (error) {
      console.error('Error fetching similar classes:', error)
    }
  }

  const startRealTimeUpdates = () => {
    const interval = setInterval(async () => {
      if (isOpen && classData) {
        try {
          const response = await fetch(`/server-api/classes/${classData.id}/availability`)
          if (response.ok) {
            const data = await response.json()
            setAvailableSpots(data.availableSpots)
          }
        } catch (error) {
          console.error('Error updating availability:', error)
        }
      }
    }, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }

  const handleBookClass = async () => {
    if (!user) {
      toast.error('Please sign in to book classes')
      return
    }

    setIsLoading(true)
    try {
      const token = await user.getIdToken()
      const response = await fetch('/server-api/bookings/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          classId: classData.id,
          paymentMethod,
          date: selectedDate.toISOString()
        })
      })

      const result = await response.json()

      if (response.ok) {
        if (result.waitlisted) {
          toast.success('Added to waitlist! We\'ll notify you if a spot opens up.')
          setIsWaitlisted(true)
        } else {
          toast.success('Class booked successfully!')
          setBookingStep('confirmation')
        }
        
        setAvailableSpots(result.availableSpots)
        onBookingSuccess && onBookingSuccess(result)
      } else {
        toast.error(result.message || 'Booking failed. Please try again.')
      }
    } catch (error) {
      console.error('Booking error:', error)
      toast.error('Booking failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId) => {
    setIsLoading(true)
    try {
      const token = await user.getIdToken()
      const response = await fetch(`/server-api/bookings/${bookingId}/cancel`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        toast.success('Booking cancelled successfully')
        fetchBookingData()
      } else {
        const result = await response.json()
        toast.error(result.message || 'Cancellation failed')
      }
    } catch (error) {
      toast.error('Cancellation failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRescheduleBooking = async (bookingId, newDate) => {
    setIsLoading(true)
    try {
      const token = await user.getIdToken()
      const response = await fetch(`/server-api/bookings/${bookingId}/reschedule`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newDate: newDate.toISOString() })
      })

      if (response.ok) {
        toast.success('Booking rescheduled successfully')
        fetchBookingData()
      } else {
        const result = await response.json()
        toast.error(result.message || 'Reschedule failed')
      }
    } catch (error) {
      toast.error('Reschedule failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinWaitlist = async () => {
    setIsLoading(true)
    try {
      const token = await user.getIdToken()
      const response = await fetch('/server-api/bookings/waitlist', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          classId: classData.id,
          date: selectedDate.toISOString()
        })
      })

      if (response.ok) {
        toast.success('Added to waitlist! We\'ll notify you when a spot opens up.')
        setIsWaitlisted(true)
      } else {
        const result = await response.json()
        toast.error(result.message || 'Failed to join waitlist')
      }
    } catch (error) {
      toast.error('Failed to join waitlist. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !classData) return null

  const isClassFull = availableSpots <= 0
  const existingBooking = userBookings.find(booking => booking.classId === classData.id)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="relative">
          <img 
            src={classData.image || '/api/placeholder/800/300'} 
            alt={classData.title}
            className="w-full h-64 object-cover rounded-t-2xl"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-t-2xl"></div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 smooth-transition"
          >
            <X className="h-5 w-5" />
          </button>
          
          {/* Class Info Overlay */}
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-start justify-between">
              <div>
                <Badge className="bg-[#1E90FF] text-white mb-3">
                  {classData.type}
                </Badge>
                <h2 className="text-3xl font-bold text-white mb-2">{classData.title}</h2>
                <p className="text-white/90 text-lg">with {classData.instructor}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">{classData.price}</div>
                <div className="flex items-center text-white/90 mt-1">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{availableSpots} spots left</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          
          {/* Booking Steps */}
          {bookingStep === 'details' && (
            <div className="space-y-8">
              
              {/* Class Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-0 shadow-md">
                  <CardContent className="p-6 text-center">
                    <Calendar className="h-8 w-8 text-[#1E90FF] mx-auto mb-3" />
                    <div className="font-semibold">{classData.date}</div>
                    <div className="text-gray-600">{classData.time}</div>
                  </CardContent>
                </Card>
                
                <Card className="border-0 shadow-md">
                  <CardContent className="p-6 text-center">
                    <MapPin className="h-8 w-8 text-[#1E90FF] mx-auto mb-3" />
                    <div className="font-semibold">{classData.studio}</div>
                    <div className="text-gray-600">Studio Location</div>
                  </CardContent>
                </Card>
                
                <Card className="border-0 shadow-md">
                  <CardContent className="p-6 text-center">
                    <Clock className="h-8 w-8 text-[#1E90FF] mx-auto mb-3" />
                    <div className="font-semibold">60 minutes</div>
                    <div className="text-gray-600">Class Duration</div>
                  </CardContent>
                </Card>
              </div>

              {/* Real-time Availability */}
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <RefreshCw className="h-5 w-5 mr-2 text-[#1E90FF]" />
                    Live Availability
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Users className="h-5 w-5 text-green-600 mr-2" />
                        <span className="font-semibold">{availableSpots} spots available</span>
                      </div>
                      <div className="flex items-center">
                        <UserPlus className="h-5 w-5 text-orange-600 mr-2" />
                        <span>3 on waitlist</span>
                      </div>
                    </div>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-[#1E90FF] h-2 rounded-full" 
                        style={{ width: `${((classData.capacity - availableSpots) / classData.capacity) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Existing Booking Management */}
              {existingBooking && (
                <Card className="border-2 border-[#1E90FF] bg-blue-50">
                  <CardHeader>
                    <CardTitle className="flex items-center text-[#1E90FF]">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      You're already booked for this class!
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex space-x-3">
                      <Button 
                        variant="outline" 
                        onClick={() => handleRescheduleBooking(existingBooking.id, new Date())}
                        disabled={isLoading}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Reschedule
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={() => handleCancelBooking(existingBooking.id)}
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel Booking
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Payment Method Selection */}
              {!existingBooking && (
                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle>Payment Method</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button
                        onClick={() => setPaymentMethod('credit')}
                        className={`p-4 border-2 rounded-lg text-center transition-colors ${
                          paymentMethod === 'credit' 
                            ? 'border-[#1E90FF] bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <CreditCard className="h-6 w-6 mx-auto mb-2" />
                        <div className="font-semibold">Credit Card</div>
                        <div className="text-sm text-gray-600">Pay {classData.price}</div>
                      </button>
                      
                      <button
                        onClick={() => setPaymentMethod('xpass')}
                        className={`p-4 border-2 rounded-lg text-center transition-colors ${
                          paymentMethod === 'xpass' 
                            ? 'border-[#1E90FF] bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Star className="h-6 w-6 mx-auto mb-2" />
                        <div className="font-semibold">X Pass Credit</div>
                        <div className="text-sm text-gray-600">1 credit</div>
                      </button>
                      
                      <button
                        onClick={() => setPaymentMethod('membership')}
                        className={`p-4 border-2 rounded-lg text-center transition-colors ${
                          paymentMethod === 'membership' 
                            ? 'border-[#1E90FF] bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Heart className="h-6 w-6 mx-auto mb-2" />
                        <div className="font-semibold">Studio Membership</div>
                        <div className="text-sm text-gray-600">Included</div>
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              {!existingBooking && (
                <div className="flex space-x-4">
                  {isClassFull ? (
                    <Button 
                      onClick={handleJoinWaitlist}
                      disabled={isLoading || isWaitlisted}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-4 text-lg"
                    >
                      {isLoading ? (
                        <Loader className="h-5 w-5 mr-2 animate-spin" />
                      ) : (
                        <UserPlus className="h-5 w-5 mr-2" />
                      )}
                      {isWaitlisted ? 'On Waitlist' : 'Join Waitlist'}
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleBookClass}
                      disabled={isLoading}
                      className="flex-1 bg-[#1E90FF] hover:bg-[#1976D2] text-white py-4 text-lg"
                    >
                      {isLoading ? (
                        <Loader className="h-5 w-5 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-5 w-5 mr-2" />
                      )}
                      Book Now
                    </Button>
                  )}
                  <Button variant="outline" onClick={onClose} className="px-8">
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Confirmation Step */}
          {bookingStep === 'confirmation' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Booking Confirmed!</h3>
              <p className="text-gray-600">
                You're all set for {classData.title} on {classData.date} at {classData.time}
              </p>
              <div className="flex space-x-4 justify-center">
                <Button onClick={onClose} className="bg-[#1E90FF] hover:bg-[#1976D2]">
                  Done
                </Button>
                <Link href="/my-bookings">
                  <Button variant="outline">View My Bookings</Button>
                </Link>
              </div>
            </div>
          )}

          {/* Similar Classes Suggestions */}
          {similarClasses.length > 0 && bookingStep === 'details' && (
            <Card className="border-0 shadow-md mt-8">
              <CardHeader>
                <CardTitle>You Might Also Like</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {similarClasses.map((similarClass) => (
                    <div key={similarClass.id} className="p-4 border rounded-lg hover:border-[#1E90FF] transition-colors cursor-pointer">
                      <img 
                        src={similarClass.image} 
                        alt={similarClass.title}
                        className="w-full h-24 object-cover rounded mb-3"
                      />
                      <h4 className="font-semibold">{similarClass.title}</h4>
                      <p className="text-sm text-gray-600">{similarClass.instructor}</p>
                      <p className="text-sm text-[#1E90FF] font-semibold">{similarClass.price}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default BookingModal