'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from 'lucide-react'

export default function CustomerCalendar() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Calendar</h1>
        <p className="text-gray-600">View your class schedule</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Class Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Calendar component will be implemented here</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}