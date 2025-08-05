'use client'

import { useDashboard } from '@/contexts/DashboardContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users, UserPlus, MessageSquare, Star, Calendar } from 'lucide-react'

export default function MerchantInstructors() {
  const { instructors } = useDashboard()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Instructor Management</h1>
          <p className="text-gray-600">Manage your teaching staff</p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Instructor
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(instructors || []).map((instructor, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <Avatar className="h-16 w-16 mx-auto">
                  <AvatarImage src={instructor.avatar} />
                  <AvatarFallback>{instructor.name?.charAt(0) || 'I'}</AvatarFallback>
                </Avatar>
                
                <div>
                  <h3 className="font-semibold">{instructor.name || 'Instructor Name'}</h3>
                  <p className="text-sm text-gray-600">{instructor.specialties?.join(', ') || 'Yoga, Pilates'}</p>
                </div>

                <div className="flex items-center justify-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>{instructor.rating || '4.8'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span>{instructor.classesThisMonth || '12'} classes</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Message
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    View Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}