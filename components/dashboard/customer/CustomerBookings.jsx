'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, Users, X, Star } from 'lucide-react'

export default function CustomerBookings() {
  const mockBookings = [
    {
      id: 1,
      className: 'Morning Yoga Flow',
      studio: 'Zen Wellness',
      instructor: 'Sarah M.',
      date: 'Today',
      time: '9:00 AM',
      status: 'confirmed',
      canCancel: true
    },
    {
      id: 2,
      className: 'HIIT Training',
      studio: 'FitZone',
      instructor: 'Mike C.',
      date: 'Tomorrow',
      time: '6:00 PM',
      status: 'confirmed',
      canCancel: true
    },
    {
      id: 3,
      className: 'Pilates Core',
      studio: 'Core Studio',
      instructor: 'Emma R.',
      date: 'Jan 22',
      time: '7:30 PM',
      status: 'waitlist',
      canCancel: true
    }
  ]

  const pastBookings = [
    {
      id: 4,
      className: 'Evening Yoga',
      studio: 'Zen Wellness',
      instructor: 'Lisa W.',
      date: 'Jan 15',
      time: '7:00 PM',
      status: 'completed',
      rating: 5
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Bookings</h1>
        <p className="text-gray-600">Manage your class schedule</p>
      </div>

      {/* Upcoming Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Classes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-[#1E90FF] rounded-lg flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium">{booking.className}</div>
                    <div className="text-sm text-gray-600 flex items-center space-x-2">
                      <MapPin className="h-3 w-3" />
                      <span>{booking.studio}</span>
                      <Users className="h-3 w-3" />
                      <span>{booking.instructor}</span>
                    </div>
                    <div className="text-sm text-gray-500 flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{booking.date} • {booking.time}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <Badge 
                    variant={booking.status === 'confirmed' ? 'default' : 'secondary'}
                    className={booking.status === 'waitlist' ? 'bg-yellow-100 text-yellow-700' : ''}
                  >
                    {booking.status}
                  </Badge>
                  {booking.canCancel && (
                    <Button variant="outline" size="sm">
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Past Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Classes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pastBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">{booking.className}</div>
                    <div className="text-sm text-gray-600 flex items-center space-x-2">
                      <MapPin className="h-3 w-3" />
                      <span>{booking.studio}</span>
                      <Users className="h-3 w-3" />
                      <span>{booking.instructor}</span>
                    </div>
                    <div className="text-sm text-gray-500 flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{booking.date} • {booking.time}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {booking.rating && (
                    <div className="flex items-center space-x-1">
                      {[...Array(booking.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-500 fill-current" />
                      ))}
                    </div>
                  )}
                  <Badge className="bg-green-100 text-green-700 mt-1">
                    Completed
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}