'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, UserCheck, UserPlus, MessageSquare, Eye } from 'lucide-react'

// ✅ EXTRACTED: Instructors tab for staffing dashboard
export default function InstructorsTab({ dashboard }) {
  if (!dashboard?.instructors || dashboard.instructors.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">Studio Instructors</h2>
          <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Instructor
          </Button>
        </div>
        
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-blue-400 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold text-white mb-2">No Instructors</h3>
          <p className="text-blue-200">Add instructors to start managing your classes.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Studio Instructors</h2>
        <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Instructor
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dashboard.instructors.map((instructor) => (
          <Card key={instructor.userId} className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{instructor.name || 'Unknown Instructor'}</h3>
                  <p className="text-blue-200 text-sm">{instructor.email}</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm mb-4">
                <div className="text-blue-200">
                  <strong>Specialties:</strong> {instructor.specialties?.join(', ') || 'Not specified'}
                </div>
                <div className="text-blue-200">
                  <strong>Experience:</strong> {instructor.experience || 'Not specified'}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-400/20"
                >
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Message
                </Button>
                <Button
                  size="sm"
                  className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-400/20"
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}