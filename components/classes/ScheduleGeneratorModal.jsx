'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar, X, PlayCircle, Clock, Repeat, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/components/auth-provider'

export default function ScheduleGeneratorModal({ isOpen, onClose, classData, onSuccess }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [generatedCount, setGeneratedCount] = useState(0)
  const [formData, setFormData] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    recurrencePattern: classData?.recurrencePattern || 'weekly'
  })
  const [preview, setPreview] = useState([])
  const [showPreview, setShowPreview] = useState(false)

  const recurrencePatterns = [
    { value: 'none', label: 'Single Instance', description: 'Create one class only' },
    { value: 'weekly', label: 'Weekly', description: 'Repeat every week' },
    { value: 'daily', label: 'Daily', description: 'Repeat every day (intensive programs)' }
  ]

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const generatePreview = () => {
    if (!classData || !formData.startDate || !formData.endDate) return

    const start = new Date(formData.startDate)
    const end = new Date(formData.endDate)
    const instances = []

    if (formData.recurrencePattern === 'none') {
      instances.push({
        date: start.toLocaleDateString(),
        time: classData.startTime,
        dayOfWeek: start.toLocaleDateString('en-US', { weekday: 'long' })
      })
    } else if (formData.recurrencePattern === 'weekly') {
      let currentDate = new Date(start)
      while (currentDate <= end) {
        if (classData.scheduleDays && classData.scheduleDays.length > 0) {
          const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][currentDate.getDay()]
          if (classData.scheduleDays.includes(dayName)) {
            instances.push({
              date: currentDate.toLocaleDateString(),
              time: classData.startTime,
              dayOfWeek: currentDate.toLocaleDateString('en-US', { weekday: 'long' })
            })
          }
        } else {
          instances.push({
            date: currentDate.toLocaleDateString(),
            time: classData.startTime,
            dayOfWeek: currentDate.toLocaleDateString('en-US', { weekday: 'long' })
          })
        }
        currentDate.setDate(currentDate.getDate() + 7)
      }
    } else if (formData.recurrencePattern === 'daily') {
      let currentDate = new Date(start)
      while (currentDate <= end) {
        instances.push({
          date: currentDate.toLocaleDateString(),
          time: classData.startTime,
          dayOfWeek: currentDate.toLocaleDateString('en-US', { weekday: 'long' })
        })
        currentDate.setDate(currentDate.getDate() + 1)
      }
    }

    setPreview(instances.slice(0, 10)) // Show first 10 for preview
    setGeneratedCount(instances.length)
    setShowPreview(true)
  }

  const handleGenerate = async () => {
    if (!classData) return

    setLoading(true)

    try {
      const response = await fetch('/server-api/classes/schedule/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          classId: classData.id,
          startDate: formData.startDate,
          endDate: formData.endDate,
          recurrencePattern: formData.recurrencePattern
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || `Generated ${data.generated} class instances`)
        onSuccess?.()
        onClose()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to generate schedule')
      }
    } catch (error) {
      console.error('Generate schedule error:', error)
      toast.error('Failed to generate schedule')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !classData) return null

  const isValidDateRange = new Date(formData.endDate) >= new Date(formData.startDate)
  const daysDifference = Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24))

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <CardTitle className="text-2xl flex items-center">
            <PlayCircle className="h-6 w-6 mr-2 text-[#1E90FF]" />
            Generate Schedule
          </CardTitle>
          <CardDescription>
            Create recurring instances for "{classData.name}"
          </CardDescription>
        </CardHeader>

        <CardContent className="max-h-[70vh] overflow-y-auto space-y-6">
          {/* Class Information */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Class Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {classData.duration} minutes
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {classData.startTime}
              </div>
              <div className="flex items-center">
                <Repeat className="h-4 w-4 mr-1" />
                {classData.recurrencePattern}
              </div>
              <div>
                Capacity: {classData.capacity}
              </div>
            </div>
            {classData.scheduleDays && classData.scheduleDays.length > 0 && (
              <div className="mt-2">
                <span className="text-blue-900 font-medium">Schedule Days: </span>
                <span className="text-blue-800 capitalize">
                  {classData.scheduleDays.join(', ')}
                </span>
              </div>
            )}
          </div>

          {/* Date Range Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Schedule Parameters</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  min={formData.startDate}
                />
              </div>
            </div>

            {!isValidDateRange && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  End date must be on or after the start date.
                </AlertDescription>
              </Alert>
            )}

            {isValidDateRange && daysDifference > 365 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Generating schedules for more than a year may create a large number of instances.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Recurrence Pattern Override */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recurrencePattern">Recurrence Pattern</Label>
              <Select 
                value={formData.recurrencePattern} 
                onValueChange={(value) => handleInputChange('recurrencePattern', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select recurrence pattern" />
                </SelectTrigger>
                <SelectContent>
                  {recurrencePatterns.map(pattern => (
                    <SelectItem key={pattern.value} value={pattern.value}>
                      <div>
                        <div className="font-medium">{pattern.label}</div>
                        <div className="text-xs text-gray-500">{pattern.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.recurrencePattern !== classData.recurrencePattern && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You've selected a different pattern than the class default ({classData.recurrencePattern}).
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Preview Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Preview</h3>
              <Button
                variant="outline"
                onClick={generatePreview}
                disabled={!isValidDateRange}
              >
                Generate Preview
              </Button>
            </div>

            {showPreview && (
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span className="font-medium text-green-900">
                      {generatedCount} instances will be created
                    </span>
                  </div>
                  <p className="text-green-800 text-sm">
                    Date range: {new Date(formData.startDate).toLocaleDateString()} - {new Date(formData.endDate).toLocaleDateString()}
                  </p>
                </div>

                {preview.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b">
                      <h4 className="font-medium">First {Math.min(10, preview.length)} instances:</h4>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {preview.map((instance, index) => (
                        <div key={index} className="px-4 py-3 border-b last:border-b-0 flex justify-between items-center">
                          <div>
                            <div className="font-medium">{instance.dayOfWeek}</div>
                            <div className="text-sm text-gray-600">{instance.date}</div>
                          </div>
                          <div className="text-sm font-medium text-[#1E90FF]">
                            {instance.time}
                          </div>
                        </div>
                      ))}
                    </div>
                    {generatedCount > 10 && (
                      <div className="bg-gray-50 px-4 py-2 border-t text-center text-sm text-gray-600">
                        ... and {generatedCount - 10} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Warning for large schedules */}
          {generatedCount > 100 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Large Schedule Warning:</strong> You're about to create {generatedCount} class instances. 
                This may take a moment to process and could impact performance. Consider using a shorter date range.
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={loading || !isValidDateRange || !showPreview}
              className="bg-[#1E90FF] hover:bg-[#1976D2]"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </div>
              ) : (
                `Generate ${generatedCount} Instances`
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}