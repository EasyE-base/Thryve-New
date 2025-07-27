'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  CreditCard,
  ArrowRight,
  Download,
  MessageSquare,
  Star,
  Heart
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function BookingSuccessPage() {
  const { user } = useAuth()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (!sessionId) {
      setError('Invalid booking session')
      setLoading(false)
      return
    }

    const fetchBookingDetails = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/booking/by-session?sessionId=${sessionId}`)
        
        if (response.ok) {
          const data = await response.json()
          setBooking(data.booking)
        } else {
          throw new Error('Failed to fetch booking details')
        }
      } catch (error) {
        console.error('Error fetching booking details:', error)
        setError('Failed to load booking information')
      } finally {
        setLoading(false)
      }
    }

    fetchBookingDetails()
  }, [sessionId])

  const handleAddToCalendar = () => {
    if (!booking) return
    
    // Create calendar event URL (Google Calendar format)
    const startDate = new Date(booking.sessionTime)
    const endDate = new Date(startDate.getTime() + (75 * 60 * 1000)) // 75 minutes later
    
    const formatDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    }
    
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(booking.className)}&dates=${formatDate(startDate)}/${formatDate(endDate)}&details=${encodeURIComponent(`Fitness class booking confirmed. Booking ID: ${booking.id}`)}&location=${encodeURIComponent(booking.location || 'Studio Location')}`
    
    window.open(calendarUrl, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-blue-200">Loading booking confirmation...</p>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <Card className="bg-white/10 backdrop-blur-md border-white/20 p-8 text-center max-w-md">
          <CardContent>
            <div className="text-red-400 mb-4">
              <CheckCircle className="h-16 w-16 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Booking Error</h2>
              <p className="text-blue-200 mb-6">{error || 'Unable to find booking information'}</p>
            </div>
            <Link href="/marketplace">
              <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                Return to Marketplace
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md shadow-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <h1 className="text-2xl font-bold text-white">Booking Confirmation</h1>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/customer">
                <Button variant="ghost" className="text-white hover:text-blue-400 hover:bg-white/10">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Message */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-500/20 rounded-full mb-6">
            <CheckCircle className="h-12 w-12 text-green-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">🎉 Booking Confirmed!</h1>
          <p className="text-xl text-blue-200 mb-2">Your payment was successful and your spot is reserved.</p>
          <p className="text-blue-300">Confirmation email sent to your registered email address.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Booking Details */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Class Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">{booking.className}</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className="bg-blue-500/80 text-white">
                    Confirmed
                  </Badge>
                  <Badge className="bg-green-500/80 text-white">
                    Paid
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-blue-200">
                  <Calendar className="h-5 w-5 mr-3 text-blue-400" />
                  <div>
                    <div className="font-medium text-white">Session Date & Time</div>
                    <div className="text-sm">{booking.sessionTime}</div>
                  </div>
                </div>

                <div className="flex items-center text-blue-200">
                  <MapPin className="h-5 w-5 mr-3 text-blue-400" />
                  <div>
                    <div className="font-medium text-white">Location</div>
                    <div className="text-sm">Harmony Yoga Studio</div>
                    <div className="text-sm">456 Wellness Ave, Downtown</div>
                  </div>
                </div>

                <div className="flex items-center text-blue-200">
                  <User className="h-5 w-5 mr-3 text-blue-400" />
                  <div>
                    <div className="font-medium text-white">Instructor</div>
                    <div className="text-sm">Sarah Johnson</div>
                  </div>
                </div>

                <div className="flex items-center text-blue-200">
                  <Clock className="h-5 w-5 mr-3 text-blue-400" />
                  <div>
                    <div className="font-medium text-white">Duration</div>
                    <div className="text-sm">75 minutes</div>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-blue-200">
                    <CreditCard className="h-5 w-5 mr-3 text-blue-400" />
                    <span className="font-medium text-white">Amount Paid</span>
                  </div>
                  <div className="text-2xl font-bold text-white">${booking.amount?.toFixed(2) || '35.00'}</div>
                </div>
                <div className="text-sm text-blue-300 mt-1">
                  Booking ID: {booking.id}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white">What's Next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Button
                  onClick={handleAddToCalendar}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Add to Calendar
                </Button>

                <Button
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10"
                  onClick={() => toast.info('Receipt download feature coming soon!')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Receipt
                </Button>

                <Link href={`/instructor/${booking.instructorId || 'sarah-johnson'}`}>
                  <Button
                    variant="outline"
                    className="w-full border-white/20 text-white hover:bg-white/10"
                  >
                    <User className="h-4 w-4 mr-2" />
                    View Instructor Profile
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10"
                  onClick={() => toast.info('Messaging feature coming soon!')}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message Instructor
                </Button>
              </div>

              <div className="border-t border-white/10 pt-4">
                <h4 className="text-white font-semibold mb-3">Preparation Tips</h4>
                <ul className="space-y-2 text-sm text-blue-200">
                  <li>• Arrive 10-15 minutes early for setup</li>
                  <li>• Bring water bottle and towel</li>
                  <li>• Wear comfortable, stretchy clothing</li>
                  <li>• Yoga mats and props provided</li>
                </ul>
              </div>

              <div className="border-t border-white/10 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-white font-semibold">Rate Your Experience</h4>
                </div>
                <p className="text-sm text-blue-200 mb-3">
                  After your class, help others by sharing your experience.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/10"
                  onClick={() => toast.info('Rating feature will be available after your class!')}
                >
                  <Star className="h-4 w-4 mr-2" />
                  Rate Class (Post-Class)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="text-center mt-12 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/marketplace">
              <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8">
                <ArrowRight className="h-4 w-4 mr-2" />
                Book Another Class
              </Button>
            </Link>

            <Link href="/dashboard/customer">
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 px-8"
              >
                View My Bookings
              </Button>
            </Link>
          </div>

          <div className="text-sm text-blue-300">
            <p>Questions about your booking? Check your email for detailed information or contact support.</p>
          </div>
        </div>
      </div>
    </div>
  )
}