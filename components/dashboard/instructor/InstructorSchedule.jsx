'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Users, MapPin } from 'lucide-react'

export default function InstructorSchedule() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Schedule</h1>
        <p className="text-gray-600">View your assigned classes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Classes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-[#1E90FF] rounded-lg flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium">Yoga Flow Class</div>
                    <div className="text-sm text-gray-600 flex items-center space-x-2">
                      <Clock className="h-3 w-3" />
                      <span>9:00 AM - 10:00 AM</span>
                      <MapPin className="h-3 w-3" />
                      <span>Studio A</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="secondary">
                    <Users className="h-3 w-3 mr-1" />
                    8/15
                  </Badge>
                  <div className="text-sm text-green-600 mt-1">$50</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}