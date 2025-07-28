'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Calendar, Clock, MapPin, Users, DollarSign, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'

export default function StudioCreateClassPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [availableInstructors, setAvailableInstructors] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    level: 'All Levels',
    duration: 60,
    price: 25,
    capacity: 15,
    location: '',
    date: '',
    time: '',
    recurring: false,
    requirements: '',
    amenities: [],
    assignedInstructorId: '',
    assignedInstructorName: ''
  })
  const router = useRouter()

  const classTypes = [
    'Yoga', 'Pilates', 'HIIT', 'Strength Training', 'Cardio', 
    'Dance', 'Martial Arts', 'Meditation', 'Flexibility', 'Cycling', 'Other'
  ]

  const levels = ['Beginner', 'Intermediate', 'Advanced', 'All Levels']

  const availableAmenities = [
    'Mats Provided', 'Towels Available', 'Water Station', 'Changing Room',
    'Shower Facilities', 'Equipment Provided', 'Music System', 'Air Conditioning'
  ]

  // Fetch available instructors when component mounts
  useEffect(() => {
    const fetchInstructors = async () => {
      if (!user) return

      try {
        const token = await user.getIdToken()
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/server-api/studio/instructors`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setAvailableInstructors(data.instructors || [])
        } else {
          console.error('Failed to fetch instructors')
        }
      } catch (error) {
        console.error('Error fetching instructors:', error)
      }
    }

    fetchInstructors()
  }, [user])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleAmenity = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }))
  }

  const handleInstructorChange = (instructorId) => {
    if (instructorId === 'none') {
      setFormData(prev => ({
        ...prev,
        assignedInstructorId: '',
        assignedInstructorName: ''
      }))
    } else {
      const selectedInstructor = availableInstructors.find(i => i.userId === instructorId)
      setFormData(prev => ({
        ...prev,
        assignedInstructorId: instructorId,
        assignedInstructorName: selectedInstructor ? (selectedInstructor.name || selectedInstructor.email.split('@')[0]) : ''
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.title || !formData.description || !formData.type || !formData.location || !formData.date || !formData.time) {
        throw new Error('Please fill in all required fields')
      }

      // Get Firebase ID token for authentication
      const token = await user.getIdToken()

      // Make API call to create the class
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/server-api/studio/classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create class')
      }

      const result = await response.json()
      console.log('Class created:', result)

      toast.success('Class created successfully!')
      router.push('/dashboard/merchant')
    } catch (error) {
      console.error('Class creation error:', error)
      toast.error(error.message || 'Failed to create class')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/merchant">
                <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-white">Create New Class</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Basic Information
              </CardTitle>
              <CardDescription className="text-blue-200">
                Set up the core details for your class
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-white">Class Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., Morning Vinyasa Flow"
                    className="bg-white/10 border-white/20 text-white placeholder:text-blue-200"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-white">Class Type *</Label>
                  <Select onValueChange={(value) => handleInputChange('type', value)} value={formData.type}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Select class type" />
                    </SelectTrigger>
                    <SelectContent>
                      {classTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe what students can expect from this class..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-blue-200 min-h-[100px]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="level" className="text-white">Level</Label>
                  <Select onValueChange={(value) => handleInputChange('level', value)} value={formData.level}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {levels.map((level) => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-white">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                    min="15"
                    max="180"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity" className="text-white">Max Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => handleInputChange('capacity', parseInt(e.target.value))}
                    min="1"
                    max="50"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructor Assignment */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <User className="h-5 w-5 mr-2" />
                Instructor Assignment
              </CardTitle>
              <CardDescription className="text-blue-200">
                Assign an instructor to teach this class
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="instructor" className="text-white">Select Instructor</Label>
                <Select onValueChange={handleInstructorChange}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Choose an instructor (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No instructor assigned</SelectItem>
                    {availableInstructors.map((instructor) => (
                      <SelectItem key={instructor.userId} value={instructor.userId}>
                        {instructor.name || instructor.email.split('@')[0]} 
                        {instructor.stripeAccountStatus === 'active' && (
                          <span className="ml-2 text-green-400">✓ Payment Ready</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Schedule & Location */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Schedule & Location
              </CardTitle>
              <CardDescription className="text-blue-200">
                Set when and where the class will take place
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="location" className="text-white">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="e.g., Studio A, Main Floor"
                  className="bg-white/10 border-white/20 text-white placeholder:text-blue-200"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-white">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time" className="text-white">Start Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleInputChange('time', e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price" className="text-white flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Price per Class
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                  min="0"
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Additional Details</CardTitle>
              <CardDescription className="text-blue-200">
                Optional requirements and amenities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="requirements" className="text-white">Requirements/What to Bring</Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) => handleInputChange('requirements', e.target.value)}
                  placeholder="e.g., Bring a water bottle, wear comfortable clothing..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-blue-200"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-white">Amenities Included</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {availableAmenities.map((amenity) => (
                    <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.amenities.includes(amenity)}
                        onChange={() => toggleAmenity(amenity)}
                        className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-blue-200 text-sm">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Link href="/dashboard/merchant">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={loading} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8">
              {loading ? 'Creating...' : 'Create Class'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}