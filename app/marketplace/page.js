'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import { Search, Filter, MapPin, Star, Clock, DollarSign, Users, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

export default function MarketplacePage() {
  const { user, role } = useAuth()
  const router = useRouter()
  const [instructors, setInstructors] = useState([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState(null)
  const [selectedInstructor, setSelectedInstructor] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    specialties: [],
    minRating: 0,
    maxRate: 200,
    verified: false,
    location: '',
    radius: 25
  })

  // Available specialties for filter
  const availableSpecialties = [
    'Yoga', 'HIIT', 'Pilates', 'Cycling', 'Zumba', 'Strength Training',
    'Meditation', 'Flexibility', 'Cardio', 'Weight Loss', 'Core Strength',
    'Barre', 'Dance Fitness', 'Endurance Training', 'Indoor Cycling'
  ]

  // Search instructors
  const searchInstructors = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        specialties: filters.specialties.join(','),
        minRating: filters.minRating.toString(),
        maxRate: filters.maxRate.toString(),
        verified: filters.verified.toString(),
        location: filters.location,
        radius: filters.radius.toString(),
        limit: '20',
        page: '1'
      })
      
      console.log('Search params:', Object.fromEntries(params.entries()))

      const headers = {}
      if (user) {
        try {
          const token = await user.getIdToken()
          headers['Authorization'] = `Bearer ${token}`
        } catch (error) {
          console.log('No auth token available, proceeding without authentication')
        }
      }

      const url = `/api/marketplace/search?${params}`
      console.log('Calling API URL:', url)
      const response = await fetch(url, {
        headers
      })

      if (!response.ok) {
        throw new Error('Failed to search instructors')
      }

      const data = await response.json()
      console.log('Marketplace API response:', data)
      console.log('Instructors array length:', data.instructors?.length || 0)
      setInstructors(data.instructors || [])
      setStats(data.stats)
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Failed to search instructors')
    } finally {
      setLoading(false)
    }
  }

  // Access control: B2B only (studio owners/merchants)
  useEffect(() => {
    if (!user) return
    // Allow roles: 'studio' or 'merchant'
    if (role !== 'studio' && role !== 'merchant') {
      router.replace('/marketplace/gate')
      return
    }
    searchInstructors()
  }, [user, role])

  // Handle specialty filter toggle
  const toggleSpecialty = (specialty) => {
    setFilters(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }))
  }

  // Send booking request
  const sendBookingRequest = async (bookingData) => {
    if (!user) {
      toast.error('Please log in to send booking requests')
      return
    }

    try {
      const response = await fetch('/api/bookings/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          instructorId: selectedInstructor.id,
          instructorName: selectedInstructor.name,
          instructorEmail: selectedInstructor.email,
          ...bookingData
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send booking request')
      }

      const data = await response.json()
      toast.success('Booking request sent successfully!')
      setShowBookingModal(false)
      setSelectedInstructor(null)
    } catch (error) {
      console.error('Booking error:', error)
      toast.error('Failed to send booking request')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section (B2B only) */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Find Qualified Instructors for Your Studio
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              A hiring network between studios and instructors. Not for consumer bookings.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name, specialty, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-4 text-lg bg-white text-gray-900 border-0 rounded-full"
                  onKeyPress={(e) => e.key === 'Enter' && searchInstructors()}
                />
                <Button
                  onClick={searchInstructors}
                  disabled={loading}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full"
                >
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      {stats && (
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.totalInstructors}</div>
                <div className="text-sm text-gray-600">Total Instructors</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.verifiedInstructors}</div>
                <div className="text-sm text-gray-600">Verified</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{stats.averageRating.toFixed(1)}</div>
                <div className="text-sm text-gray-600">Avg Rating</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{stats.topSpecialties.length}</div>
                <div className="text-sm text-gray-600">Specialties</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.totalResults}</div>
                <div className="text-sm text-gray-600">Results</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 rounded-lg border border-blue-100 bg-blue-50 text-blue-900 px-4 py-3 text-sm">
          Studios can browse opted-in instructors, send invitations, and track responses. Instructors manage visibility and invites in their dashboard.
        </div>
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Location Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="City, State, or ZIP"
                      value={filters.location}
                      onChange={(e) => setFilters({...filters, location: e.target.value})}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Specialty Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialties
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {availableSpecialties.map(specialty => (
                      <div key={specialty} className="flex items-center space-x-2">
                        <Checkbox
                          id={specialty}
                          checked={filters.specialties.includes(specialty)}
                          onCheckedChange={() => toggleSpecialty(specialty)}
                        />
                        <label htmlFor={specialty} className="text-sm text-gray-700">
                          {specialty}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rating Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Rating: {filters.minRating}+
                  </label>
                  <Slider
                    value={[filters.minRating]}
                    onValueChange={([value]) => setFilters({...filters, minRating: value})}
                    max={5}
                    min={0}
                    step={0.5}
                    className="w-full"
                  />
                </div>

                {/* Rate Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Rate: ${filters.maxRate}/hour
                  </label>
                  <Slider
                    value={[filters.maxRate]}
                    onValueChange={([value]) => setFilters({...filters, maxRate: value})}
                    max={200}
                    min={20}
                    step={10}
                    className="w-full"
                  />
                </div>

                {/* Verified Filter */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="verified"
                    checked={filters.verified}
                    onCheckedChange={(checked) => setFilters({...filters, verified: checked})}
                  />
                  <label htmlFor="verified" className="text-sm text-gray-700">
                    Verified instructors only
                  </label>
                </div>

                {/* Apply Filters Button */}
                <Button
                  onClick={searchInstructors}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Searching...' : 'Apply Filters'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results Grid */}
          <div className="lg:w-3/4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Searching instructors...</p>
              </div>
            ) : instructors.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No instructors found</h3>
                <p className="text-gray-600">Try adjusting your search terms or filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {instructors.map(instructor => (
                  <InstructorCard
                    key={instructor.id}
                    instructor={instructor}
                    onSelect={setSelectedInstructor}
                    onBook={() => setShowBookingModal(true)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedInstructor && (
        <BookingRequestModal
          instructor={selectedInstructor}
          onSubmit={sendBookingRequest}
          onClose={() => setShowBookingModal(false)}
        />
      )}
    </div>
  )
}

// Instructor Card Component
function InstructorCard({ instructor, onSelect, onBook }) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
      <div className="relative">
        <img 
          src={instructor.photo} 
          alt={instructor.name}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        {instructor.verified && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <Award className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {instructor.name}
            </h3>
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-600">
                {instructor.rating} ({instructor.reviewCount} reviews)
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              ${instructor.hourlyRate}
            </div>
            <div className="text-sm text-gray-500">per hour</div>
          </div>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {instructor.bio}
        </p>
        
        <div className="flex flex-wrap gap-1 mb-4">
          {instructor.specialties.slice(0, 3).map(specialty => (
            <Badge key={specialty} variant="secondary" className="text-xs">
              {specialty}
            </Badge>
          ))}
          {instructor.specialties.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{instructor.specialties.length - 3} more
            </Badge>
          )}
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{instructor.location.city}, {instructor.location.state}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>Available</span>
          </div>
        </div>
        
        <Button
          onClick={() => {
            onSelect(instructor)
            onBook()
          }}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          Send Invitation
        </Button>
      </CardContent>
    </Card>
  )
}

// Booking Request Modal Component
function BookingRequestModal({ instructor, onSubmit, onClose }) {
  const [bookingForm, setBookingForm] = useState({
    classType: instructor.specialties[0] || '',
    scheduledTime: '',
    duration: 60,
    maxStudents: 20,
    proposedRate: instructor.hourlyRate,
    specialRequirements: '',
    location: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...bookingForm,
      scheduledTime: new Date(bookingForm.scheduledTime)
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="w-12 h-12">
            <AvatarImage src={instructor.photo} />
            <AvatarFallback>{instructor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold">{instructor.name}</h2>
            <p className="text-gray-600">{instructor.specialties.join(', ')}</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Class Type
            </label>
            <Select
              value={bookingForm.classType}
              onValueChange={(value) => setBookingForm({...bookingForm, classType: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select class type" />
              </SelectTrigger>
              <SelectContent>
                {instructor.specialties.map(specialty => (
                  <SelectItem key={specialty} value={specialty}>
                    {specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date & Time
            </label>
            <Input
              type="datetime-local"
              value={bookingForm.scheduledTime}
              onChange={(e) => setBookingForm({...bookingForm, scheduledTime: e.target.value})}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes)
              </label>
              <Input
                type="number"
                value={bookingForm.duration}
                onChange={(e) => setBookingForm({...bookingForm, duration: parseInt(e.target.value)})}
                min="30"
                max="180"
                step="15"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Students
              </label>
              <Input
                type="number"
                value={bookingForm.maxStudents}
                onChange={(e) => setBookingForm({...bookingForm, maxStudents: parseInt(e.target.value)})}
                min="1"
                max="50"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proposed Rate ($/hour)
            </label>
            <Input
              type="number"
              value={bookingForm.proposedRate}
              onChange={(e) => setBookingForm({...bookingForm, proposedRate: parseInt(e.target.value)})}
              min="20"
              max="500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Special Requirements (Optional)
            </label>
            <textarea
              value={bookingForm.specialRequirements}
              onChange={(e) => setBookingForm({...bookingForm, specialRequirements: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 h-20 resize-none"
              placeholder="Any special equipment, music preferences, etc."
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Send Request
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}