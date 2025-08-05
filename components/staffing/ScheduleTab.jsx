'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, Clock, AlertTriangle, Eye } from 'lucide-react'

// ✅ EXTRACTED: Schedule tab for staffing dashboard
export default function ScheduleTab({ dashboard }) {
  const getClassStatusBadge = (classItem) => {
    if (classItem.needsCoverage) {
      return (
        <Badge className="bg-red-500/20 text-red-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Needs Coverage
        </Badge>
      )
    }
    if (!classItem.hasAssignedInstructor) {
      return (
        <Badge className="bg-yellow-500/20 text-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          Unassigned
        </Badge>
      )
    }
    return (
      <Badge className="bg-green-500/20 text-green-200">
        <CheckCircle className="h-3 w-3 mr-1" />
        Assigned
      </Badge>
    )
  }

  if (!dashboard?.classes || dashboard.classes.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="h-16 w-16 text-blue-400 mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-semibold text-white mb-2">No Classes Scheduled</h3>
        <p className="text-blue-200">Add classes to your schedule to get started.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Class Schedule</h2>
        <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white">
          Add Class
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dashboard.classes.map((classItem) => (
          <Card key={classItem.id} className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-white font-semibold">{classItem.name || 'Unnamed Class'}</h3>
                  <p className="text-blue-200 text-sm">
                    {classItem.instructor ? `Instructor: ${classItem.instructor}` : 'No instructor assigned'}
                  </p>
                </div>
                {getClassStatusBadge(classItem)}
              </div>
              
              <div className="space-y-2 text-sm mb-4">
                <div className="text-blue-300">
                  <strong>Time:</strong> {classItem.startTime || 'TBD'} - {classItem.endTime || 'TBD'}
                </div>
                <div className="text-blue-300">
                  <strong>Date:</strong> {classItem.date || 'Not scheduled'}
                </div>
                <div className="text-blue-300">
                  <strong>Capacity:</strong> {classItem.capacity || 0} students
                </div>
                {classItem.specialRequirements && (
                  <div className="text-blue-300">
                    <strong>Requirements:</strong> {classItem.specialRequirements}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-400/20"
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-400/20"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}