'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  X, 
  Calendar, 
  Clock, 
  Users, 
  DollarSign, 
  MapPin,
  User,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Loader2,
  Heart,
  Star,
  Shield
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/components/auth-provider'

export default function RealTimeBookingModal({ isOpen, onClose, classInstance, onBookingSuccess }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [bookingStep, setBookingStep] = useState('details') // details, payment, confirmation
  const [userMembership, setUserMembership] = useState(null)
  const [availabilityData, setAvailabilityData] = useState(null)
  const [bookingData, setBookingData] = useState(null)
  const [refreshTimer, setRefreshTimer] = useState(null)

  useEffect(() => {
    if (isOpen && classInstance) {
      fetchUserMembership()
      fetchAvailability()
      
      // Set up real-time availability refresh
      const timer = setInterval(() => {
        fetchAvailability()
      }, 30000) // Refresh every 30 seconds
      
      setRefreshTimer(timer)
      
      return () => {
        if (timer) clearInterval(timer)
      }
    }
  }, [isOpen, classInstance])

  useEffect(() => {
    return () => {
      if (refreshTimer) clearInterval(refreshTimer)
    }
  }, [refreshTimer])

  const fetchUserMembership = async () => {
    try {
      const response = await fetch('/server-api/memberships/current', {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUserMembership(data.membership)
      }
    } catch (error) {
      console.error('Fetch membership error:', error)
    }
  }

  const fetchAvailability = async () => {
    if (!classInstance) return

    try {
      const response = await fetch(`/server-api/schedules?classInstanceId=${classInstance.id}`, {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const updated = data.schedules.find(s => s.id === classInstance.id)
        if (updated) {
          setAvailabilityData(updated)
        }
      }
    } catch (error) {
      console.error('Fetch availability error:', error)
    }
  }

  const calculateBookingPrice = () => {
    if (!userMembership) {
      return classInstance.price || 0
    }

    switch (userMembership.type) {
      case 'unlimited':
      case 'member_plus':
        return 0 // Covered by membership
      case 'class_pack':
        return 0 // Deduct from pack
      default:
        return classInstance.price || 0
    }
  }

  const getBookingType = () => {
    if (!userMembership) return 'Drop-in'
    
    switch (userMembership.type) {
      case 'unlimited':
        return 'Unlimited Membership'
      case 'class_pack':
        return 'Class Pack'
      case 'member_plus':
        return 'Member+'
      default:
        return 'Drop-in'
    }
  }

  const handleBookClass = async () => {
    setLoading(true)
    setBookingStep('payment')

    try {
      const response = await fetch('/server-api/booking/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          classInstanceId: classInstance.id,
          paymentMethod: 'membership', // Simplified for now
          membershipType: userMembership?.type || 'drop_in'
        })
      })

      const data = await response.json()

      if (response.ok) {
        setBookingData(data.booking)
        setBookingStep('confirmation')
        toast.success(data.message || 'Class booked successfully!')
        onBookingSuccess?.(data.booking)
      } else {
        if (response.status === 409 && data.waitlistAvailable) {
          // Class is full, offer waitlist
          handleJoinWaitlist()
        } else {
          toast.error(data.error || 'Failed to book class')
          setBookingStep('details')
        }
      }
    } catch (error) {
      console.error('Booking error:', error)
      toast.error('Failed to book class')
      setBookingStep('details')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinWaitlist = async () => {
    setLoading(true)

    try {
      const response = await fetch('/server-api/booking/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          classInstanceId: classInstance.id,
          autoBook: true,
          notifications: { email: true, sms: false }
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Added to waitlist at position ${data.position}`)
        onClose()
      } else {
        toast.error(data.error || 'Failed to join waitlist')
      }
    } catch (error) {
      console.error('Waitlist error:', error)
      toast.error('Failed to join waitlist')
    } finally {
      setLoading(false)
    }
  }

  const renderDetailsStep = () => {
    const currentData = availabilityData || classInstance
    const bookingPrice = calculateBookingPrice()
    const bookingType = getBookingType()

    return (
      <div className="space-y-6">
        {/* Class Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentData.className}</h2>
          <p className="text-gray-600">{currentData.description}</p>
          
          <div className="flex justify-center items-center space-x-2 mt-3">
            <Badge variant="outline" className="capitalize">
              {currentData.category}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {currentData.level}
            </Badge>
            {currentData.memberPlusOnly && (
              <Badge variant="default" className="bg-purple-600">
                Member+ Only
              </Badge>
            )}
          </div>
        </div>

        {/* Class Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center text-gray-600">
            <Calendar className="h-5 w-5 mr-2" />
            <div>
              <div className="font-medium">
                {new Date(currentData.startTime).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric'
                })}
              </div>
              <div className="text-sm">
                {new Date(currentData.startTime).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center text-gray-600">
            <Clock className="h-5 w-5 mr-2" />
            <div>
              <div className="font-medium">{currentData.duration} minutes</div>
              <div className="text-sm">Duration</div>
            </div>
          </div>

          <div className="flex items-center text-gray-600">
            <Users className="h-5 w-5 mr-2" />
            <div>
              <div className="font-medium">
                {currentData.availableSpots || 0} / {currentData.capacity}
              </div>
              <div className="text-sm">Available spots</div>
            </div>
          </div>

          <div className="flex items-center text-gray-600">
            <DollarSign className="h-5 w-5 mr-2" />
            <div>
              <div className="font-medium">
                {bookingPrice > 0 ? `$${bookingPrice}` : 'Included'}
              </div>
              <div className="text-sm">{bookingType}</div>
            </div>
          </div>
        </div>

        {/* Instructor */}
        {currentData.instructorName && currentData.instructorName !== 'TBD' && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center">
              <User className="h-5 w-5 text-gray-600 mr-2" />
              <div>
                <div className="font-medium">Instructor</div>
                <div className="text-gray-600">{currentData.instructorName}</div>
              </div>
            </div>
          </div>
        )}

        {/* Availability Status */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {currentData.availableSpots > 0 ? (
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 text-orange-500 mr-2" />
              )}
              <div>
                <div className="font-medium">
                  {currentData.availableSpots > 0 ? 'Spots Available' : 'Class Full'}
                </div>
                <div className="text-sm text-gray-600">
                  {currentData.availableSpots > 0 
                    ? `${currentData.availableSpots} spot${currentData.availableSpots !== 1 ? 's' : ''} remaining`
                    : `${currentData.waitlistCount || 0} on waitlist`
                  }
                </div>
              </div>
            </div>
            
            {currentData.availableSpots <= 0 && (
              <Badge variant="secondary">
                Waitlist Available
              </Badge>
            )}
          </div>
        </div>

        {/* Membership Info */}
        {userMembership && (
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <div className="font-medium text-green-900">
                  {userMembership.type === 'unlimited' ? 'Unlimited Membership' : 
                   userMembership.type === 'class_pack' ? 'Class Pack' :
                   userMembership.type === 'member_plus' ? 'Member+' : 'Active Membership'}
                </div>
                <div className="text-sm text-green-700">
                  {bookingPrice === 0 ? 'This class is included in your membership' : 
                   `Membership discount applied - $${bookingPrice}`}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Requirements */}
        {currentData.requirements && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Requirements:</strong> {currentData.requirements}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          
          {currentData.availableSpots > 0 ? (
            <Button 
              onClick={handleBookClass}
              disabled={loading}
              className="flex-1 bg-[#1E90FF] hover:bg-[#1976D2]"
            >
              {loading ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Booking...
                </div>
              ) : (
                `Book Class${bookingPrice > 0 ? ` - $${bookingPrice}` : ''}`
              )}
            </Button>
          ) : (
            <Button 
              onClick={handleJoinWaitlist}
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              {loading ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Joining...
                </div>
              ) : (
                'Join Waitlist'
              )}
            </Button>
          )}
        </div>
      </div>
    )
  }

  const renderConfirmationStep = () => {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
          <p className="text-gray-600">
            You're all set for {classInstance.className}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg text-left">
          <h3 className="font-semibold mb-2">Booking Details:</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Class:</span>
              <span className="font-medium">{classInstance.className}</span>
            </div>
            <div className="flex justify-between">
              <span>Date & Time:</span>
              <span className="font-medium">
                {new Date(classInstance.startTime).toLocaleDateString()} at{' '}
                {new Date(classInstance.startTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Duration:</span>
              <span className="font-medium">{classInstance.duration} minutes</span>
            </div>
            {bookingData && (
              <>
                <div className="flex justify-between">
                  <span>Booking ID:</span>
                  <span className="font-mono text-xs">{bookingData.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge variant="default">Confirmed</Badge>
                </div>
              </>
            )}
          </div>
        </div>

        <Alert>
          <Heart className="h-4 w-4" />
          <AlertDescription>
            You'll receive a confirmation email shortly with all the details. Don't forget to arrive 10 minutes early!
          </AlertDescription>
        </Alert>

        <Button onClick={onClose} className="w-full">
          Done
        </Button>
      </div>
    )
  }

  if (!isOpen || !classInstance) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full max-h-[90vh] overflow-hidden">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <CardTitle className="text-xl pr-8">
            {bookingStep === 'details' && 'Book Class'}
            {bookingStep === 'payment' && 'Processing...'}
            {bookingStep === 'confirmation' && 'Booking Complete'}
          </CardTitle>
          
          {bookingStep === 'details' && (
            <CardDescription>
              Review class details and confirm your booking
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="max-h-[70vh] overflow-y-auto">
          {bookingStep === 'details' && renderDetailsStep()}
          {bookingStep === 'payment' && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#1E90FF]" />
                <p className="text-gray-600">Processing your booking...</p>
              </div>
            </div>
          )}
          {bookingStep === 'confirmation' && renderConfirmationStep()}
        </CardContent>
      </Card>
    </div>
  )
}