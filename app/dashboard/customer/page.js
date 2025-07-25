'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { signOut } from '@/lib/client-auth'
import { formatPrice, getStripe } from '@/lib/stripe'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Calendar, Clock, MapPin, Users, CreditCard, Search, Filter, Star, Dumbbell, LogOut, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'

export default function CustomerDashboard() {
  const [user, setUser] = useState(null)
  const [classes, setClasses] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [selectedClass, setSelectedClass] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      setUser(session.user)
      await loadDashboardData()
    }

    checkAuth()
  }, [router])

  const loadDashboardData = async () => {
    try {
      const [classesRes, bookingsRes] = await Promise.all([
        fetch('/api/classes'),
        fetch('/api/bookings')
      ])

      if (classesRes.ok) {
        const classesData = await classesRes.json()
        setClasses(classesData.classes || [])
      }

      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json()
        setBookings(bookingsData.bookings || [])
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const handleBookClass = async (classItem) => {
    if (bookingLoading) return

    setBookingLoading(true)

    try {
      // Create payment intent
      const paymentRes = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: classItem.id })
      })

      if (!paymentRes.ok) {
        throw new Error('Failed to create payment intent')
      }

      const { clientSecret } = await paymentRes.json()
      
      // Initialize Stripe
      const stripe = await getStripe()
      
      // Confirm payment
      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: {
            // For demo purposes, using test card
            number: '4242424242424242',
            exp_month: 12,
            exp_year: 2025,
            cvc: '123'
          }
        }
      })

      if (paymentError) {
        throw new Error(paymentError.message)
      }

      // Create booking
      const bookingRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: classItem.id,
          paymentIntentId: paymentIntent.id
        })
      })

      if (!bookingRes.ok) {
        throw new Error('Failed to create booking')
      }

      toast.success('Class booked successfully!')
      setSelectedClass(null)
      await loadDashboardData() // Refresh data
    } catch (error) {
      toast.error(error.message || 'Failed to book class')
    } finally {
      setBookingLoading(false)
    }
  }

  const filteredClasses = classes.filter(classItem => {
    const matchesSearch = classItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         classItem.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'all' || classItem.type === filterType

    return matchesSearch && matchesFilter
  })

  const classTypes = [...new Set(classes.map(c => c.type))].filter(Boolean)

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
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Dumbbell className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Thryve</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Avatar>
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-700">
                  {user?.email}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back! 👋
          </h2>
          <p className="text-gray-600">
            Ready to book your next fitness class?
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Classes Booked</p>
                  <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Star className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Favorite Type</p>
                  <p className="text-2xl font-bold text-gray-900">Yoga</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Dumbbell className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {bookings.filter(b => new Date(b.createdAt).getMonth() === new Date().getMonth()).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            {classTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Available Classes */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Available Classes ({filteredClasses.length})
          </h3>

          {filteredClasses.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Dumbbell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No classes found</h3>
                <p className="text-gray-600">
                  {searchTerm || filterType !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Check back later for new classes.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClasses.map((classItem) => {
                const isBooked = bookings.some(b => b.classId === classItem.id)
                const isFull = classItem.bookings?.length >= classItem.capacity

                return (
                  <Card key={classItem.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{classItem.title}</CardTitle>
                          {classItem.type && (
                            <Badge variant="secondary" className="mt-1">
                              {classItem.type}
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-600">
                            {formatPrice(classItem.price)}
                          </p>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-3">
                        {classItem.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {classItem.description}
                          </p>
                        )}

                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          {format(new Date(classItem.schedule), 'MMM dd, yyyy')}
                        </div>

                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-2" />
                          {format(new Date(classItem.schedule), 'h:mm a')}
                          {classItem.duration && ` (${classItem.duration} min)`}
                        </div>

                        {classItem.location && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-2" />
                            {classItem.location}
                          </div>
                        )}

                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="h-4 w-4 mr-2" />
                          {classItem.bookings?.length || 0} / {classItem.capacity} spots
                        </div>

                        <div className="pt-2">
                          {isBooked ? (
                            <Button disabled className="w-full">
                              Already Booked ✓
                            </Button>
                          ) : isFull ? (
                            <Button disabled variant="secondary" className="w-full">
                              Class Full
                            </Button>
                          ) : (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button className="w-full" onClick={() => setSelectedClass(classItem)}>
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  Book Class
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Book {classItem.title}</DialogTitle>
                                  <DialogDescription>
                                    Confirm your booking for this class.
                                  </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4">
                                  <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-medium mb-2">{classItem.title}</h4>
                                    <div className="space-y-1 text-sm text-gray-600">
                                      <div className="flex items-center">
                                        <Calendar className="h-4 w-4 mr-2" />
                                        {format(new Date(classItem.schedule), 'EEEE, MMM dd, yyyy')}
                                      </div>
                                      <div className="flex items-center">
                                        <Clock className="h-4 w-4 mr-2" />
                                        {format(new Date(classItem.schedule), 'h:mm a')}
                                      </div>
                                      {classItem.location && (
                                        <div className="flex items-center">
                                          <MapPin className="h-4 w-4 mr-2" />
                                          {classItem.location}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex justify-between items-center text-lg font-semibold">
                                    <span>Total:</span>
                                    <span className="text-blue-600">{formatPrice(classItem.price)}</span>
                                  </div>

                                  <div className="flex gap-3">
                                    <Button 
                                      variant="outline" 
                                      className="flex-1"
                                      onClick={() => setSelectedClass(null)}
                                    >
                                      Cancel
                                    </Button>
                                    <Button 
                                      className="flex-1"
                                      onClick={() => handleBookClass(classItem)}
                                      disabled={bookingLoading}
                                    >
                                      {bookingLoading ? (
                                        <div className="flex items-center">
                                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                          Booking...
                                        </div>
                                      ) : (
                                        <>
                                          <CreditCard className="h-4 w-4 mr-2" />
                                          Confirm Booking
                                        </>
                                      )}
                                    </Button>
                                  </div>

                                  <p className="text-xs text-gray-500 text-center">
                                    Payment will be processed securely via Stripe
                                  </p>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Bookings */}
        {bookings.length > 0 && (
          <div className="mt-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Recent Bookings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookings.slice(0, 3).map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{booking.class?.title}</h4>
                      <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                        {booking.status}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {booking.class?.schedule && format(new Date(booking.class.schedule), 'MMM dd, h:mm a')}
                      </div>
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-2" />
                        {formatPrice(booking.amount)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}