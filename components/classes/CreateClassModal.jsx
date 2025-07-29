'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { X, Plus, Minus, AlertCircle, CheckCircle, Clock, Users, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/components/auth-provider'

export default function CreateClassModal({ isOpen, onClose, classData, onSuccess }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 60,
    capacity: 20,
    price: 0,
    category: 'fitness',
    level: 'all-levels',
    requirements: '',
    startTime: '09:00',
    scheduleDays: [],
    recurrencePattern: 'weekly',
    defaultInstructorId: '',
    tags: [],
    memberPlusOnly: false,
    xPassEligible: true
  })
  const [tagInput, setTagInput] = useState('')
  const [instructors, setInstructors] = useState([])
  const [validationErrors, setValidationErrors] = useState({})

  const categories = [
    { value: 'yoga', label: 'Yoga' },
    { value: 'pilates', label: 'Pilates' },
    { value: 'hiit', label: 'HIIT' },
    { value: 'cardio', label: 'Cardio' },
    { value: 'strength', label: 'Strength Training' },
    { value: 'dance', label: 'Dance' },
    { value: 'meditation', label: 'Meditation' },
    { value: 'fitness', label: 'General Fitness' }
  ]

  const levels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'all-levels', label: 'All Levels' }
  ]

  const recurrencePatterns = [
    { value: 'none', label: 'Single Class' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'daily', label: 'Daily' }
  ]

  const daysOfWeek = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ]

  useEffect(() => {
    if (isOpen) {
      if (classData) {
        // Editing existing class
        setFormData({
          name: classData.name || '',
          description: classData.description || '',
          duration: classData.duration || 60,
          capacity: classData.capacity || 20,
          price: classData.price || 0,
          category: classData.category || 'fitness',
          level: classData.level || 'all-levels',
          requirements: classData.requirements || '',
          startTime: classData.startTime || '09:00',
          scheduleDays: classData.scheduleDays || [],
          recurrencePattern: classData.recurrencePattern || 'weekly',
          defaultInstructorId: classData.defaultInstructorId || '',
          tags: classData.tags || [],
          memberPlusOnly: classData.memberPlusOnly || false,
          xPassEligible: classData.xPassEligible !== false
        })
      } else {
        // Reset form for new class
        setFormData({
          name: '',
          description: '',
          duration: 60,
          capacity: 20,
          price: 0,
          category: 'fitness',
          level: 'all-levels',
          requirements: '',
          startTime: '09:00',
          scheduleDays: [],
          recurrencePattern: 'weekly',
          defaultInstructorId: '',
          tags: [],
          memberPlusOnly: false,
          xPassEligible: true
        })
      }
      
      setValidationErrors({})
      fetchInstructors()
    }
  }, [isOpen, classData])

  const fetchInstructors = async () => {
    try {
      const response = await fetch('/server-api/marketplace/instructors', {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setInstructors(data.instructors || [])
      }
    } catch (error) {
      console.error('Fetch instructors error:', error)
    }
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.name.trim()) {
      errors.name = 'Class name is required'
    }

    if (!formData.duration || formData.duration <= 0) {
      errors.duration = 'Valid duration is required'
    }

    if (!formData.capacity || formData.capacity <= 0) {
      errors.capacity = 'Valid capacity is required'
    }

    if (formData.price < 0) {
      errors.price = 'Price cannot be negative'
    }

    if (!formData.startTime) {
      errors.startTime = 'Start time is required'
    }

    if (formData.recurrencePattern !== 'none' && formData.scheduleDays.length === 0) {
      errors.scheduleDays = 'Select at least one day for recurring classes'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: undefined
      }))
    }
  }

  const handleScheduleDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      scheduleDays: prev.scheduleDays.includes(day)
        ? prev.scheduleDays.filter(d => d !== day)
        : [...prev.scheduleDays, day]
    }))
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the form errors')
      return
    }

    setLoading(true)

    try {
      const url = classData 
        ? `/server-api/classes/${classData.id}`
        : '/server-api/classes'
      
      const method = classData ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || `Class ${classData ? 'updated' : 'created'} successfully!`)
        
        if (data.warnings && data.warnings.length > 0) {
          data.warnings.forEach(warning => {
            toast.warning(warning)
          })
        }
        
        onSuccess?.()
        onClose()
      } else {
        const data = await response.json()
        toast.error(data.error || `Failed to ${classData ? 'update' : 'create'} class`)
        
        if (data.details) {
          setValidationErrors(data.details.reduce((acc, error) => {
            acc.general = acc.general ? `${acc.general}; ${error}` : error
            return acc
          }, {}))
        }
      }
    } catch (error) {
      console.error('Submit class error:', error)
      toast.error(`Failed to ${classData ? 'update' : 'create'} class`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <CardTitle className="text-2xl">
            {classData ? 'Edit Class' : 'Create New Class'}
          </CardTitle>
          <CardDescription>
            {classData ? 'Update your class details' : 'Add a new class to your studio schedule'}
          </CardDescription>
        </CardHeader>

        <CardContent className="max-h-[70vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-[#1E90FF]" />
                General Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Class Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Morning Yoga Flow"
                    className={validationErrors.name ? 'border-red-500' : ''}
                  />
                  {validationErrors.name && (
                    <p className="text-red-500 text-sm">{validationErrors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe what participants can expect from this class..."
                  rows={3}
                />
              </div>
            </div>

            {/* Class Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Clock className="h-5 w-5 mr-2 text-[#1E90FF]" />
                Class Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
                    min="15"
                    max="180"
                    className={validationErrors.duration ? 'border-red-500' : ''}
                  />
                  {validationErrors.duration && (
                    <p className="text-red-500 text-sm">{validationErrors.duration}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity">Max Capacity *</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => handleInputChange('capacity', parseInt(e.target.value) || 0)}
                    min="1"
                    max="100"
                    className={validationErrors.capacity ? 'border-red-500' : ''}
                  />
                  {validationErrors.capacity && (
                    <p className="text-red-500 text-sm">{validationErrors.capacity}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    className={validationErrors.price ? 'border-red-500' : ''}
                  />
                  {validationErrors.price && (
                    <p className="text-red-500 text-sm">{validationErrors.price}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="level">Difficulty Level</Label>
                  <Select value={formData.level} onValueChange={(value) => handleInputChange('level', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {levels.map(level => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultInstructor">Default Instructor</Label>
                  <Select value={formData.defaultInstructorId} onValueChange={(value) => handleInputChange('defaultInstructorId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select instructor (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No default instructor</SelectItem>
                      {instructors.map(instructor => (
                        <SelectItem key={instructor.userId} value={instructor.userId}>
                          {instructor.firstName} {instructor.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">Requirements/Prerequisites</Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) => handleInputChange('requirements', e.target.value)}
                  placeholder="Any equipment, experience, or preparation needed..."
                  rows={2}
                />
              </div>
            </div>

            {/* Scheduling */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-[#1E90FF]" />
                Scheduling
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleInputChange('startTime', e.target.value)}
                    className={validationErrors.startTime ? 'border-red-500' : ''}
                  />
                  {validationErrors.startTime && (
                    <p className="text-red-500 text-sm">{validationErrors.startTime}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recurrencePattern">Recurrence Pattern</Label>
                  <Select value={formData.recurrencePattern} onValueChange={(value) => handleInputChange('recurrencePattern', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select pattern" />
                    </SelectTrigger>
                    <SelectContent>
                      {recurrencePatterns.map(pattern => (
                        <SelectItem key={pattern.value} value={pattern.value}>
                          {pattern.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.recurrencePattern !== 'none' && (
                <div className="space-y-2">
                  <Label>Schedule Days *</Label>
                  <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                    {daysOfWeek.map(day => (
                      <div key={day.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={day.value}
                          checked={formData.scheduleDays.includes(day.value)}
                          onCheckedChange={() => handleScheduleDayToggle(day.value)}
                        />
                        <Label htmlFor={day.value} className="text-sm">
                          {day.label.slice(0, 3)}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {validationErrors.scheduleDays && (
                    <p className="text-red-500 text-sm">{validationErrors.scheduleDays}</p>
                  )}
                </div>
              )}
            </div>

            {/* Tags and Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Users className="h-5 w-5 mr-2 text-[#1E90FF]" />
                Additional Options
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add a tag..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    />
                    <Button type="button" onClick={handleAddTag} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="memberPlusOnly"
                      checked={formData.memberPlusOnly}
                      onCheckedChange={(checked) => handleInputChange('memberPlusOnly', checked)}
                    />
                    <Label htmlFor="memberPlusOnly" className="text-sm">
                      Member+ only (restrict to premium members)
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="xPassEligible"
                      checked={formData.xPassEligible}
                      onCheckedChange={(checked) => handleInputChange('xPassEligible', checked)}
                    />
                    <Label htmlFor="xPassEligible" className="text-sm">
                      X Pass eligible (allow cross-studio bookings)
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Validation Errors */}
            {validationErrors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-red-800 font-medium">Validation Errors:</span>
                </div>
                <p className="text-red-700 mt-1">{validationErrors.general}</p>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-[#1E90FF] hover:bg-[#1976D2]"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {classData ? 'Updating...' : 'Creating...'}
                  </div>
                ) : (
                  classData ? 'Update Class' : 'Create Class'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}