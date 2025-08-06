'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth-provider'
import { collection, query, where, getDocs, addDoc, serverTimestamp, limit, startAfter, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Search, Users, MapPin, Star, Clock, DollarSign, 
  Calendar, Award, Mail, MessageSquare, Send, X,
  ChevronLeft, ChevronRight, Loader2, Filter, 
  MapPin as LocationIcon, Zap, TrendingUp
} from 'lucide-react'
import { toast } from 'sonner'

const ITEMS_PER_PAGE = 10

export default function InstructorInviteModal({ open, onOpenChange }) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('employees')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedInstructor, setSelectedInstructor] = useState(null)
  const [inviteStep, setInviteStep] = useState(1) // 1: Search, 2: Preview, 3: Customize, 4: Confirm
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [instructors, setInstructors] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [lastDoc, setLastDoc] = useState(null)
  
  // Phase 2: Advanced filters
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    locationRadius: 50, // miles
    minRating: 0,
    maxRate: 200,
    specialties: [],
    certifications: [],
    availability: []
  })
  
  // Phase 2: Counter-offer state
  const [showCounterOffer, setShowCounterOffer] = useState(false)
  const [counterOffer, setCounterOffer] = useState({
    proposedRate: '',
    proposedSchedule: '',
    message: ''
  })
  
  // Invitation form state
  const [inviteForm, setInviteForm] = useState({
    type: 'contract',
    customMessage: '',
    proposedRate: '',
    useTemplate: false,
    templateId: null
  })

  // Phase 2: Debounced search
  const debouncedSearch = useCallback(
    debounce((query, filters) => {
      searchInstructors(true, query, filters)
    }, 500),
    []
  )

  // Debounce helper function
  function debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  // Phase 2: Enhanced search with filters
  const searchInstructors = async (reset = false, query = searchQuery, appliedFilters = filters) => {
    if (!query.trim() && !appliedFilters.specialties.length && !appliedFilters.certifications.length) return
    
    setSearching(true)
    try {
      const instructorsRef = collection(db, 'instructors')
      let q = query(
        instructorsRef,
        where('verified', '==', true),
        orderBy('name'),
        limit(ITEMS_PER_PAGE)
      )

      // Add search filter if query exists
      if (query.trim()) {
        q = query(
          instructorsRef,
          where('verified', '==', true),
          where('name', '>=', query),
          where('name', '<=', query + '\uf8ff'),
          orderBy('name'),
          limit(ITEMS_PER_PAGE)
        )
      }

      // Add pagination
      if (!reset && lastDoc) {
        q = query(q, startAfter(lastDoc))
      }

      const snapshot = await getDocs(q)
      let newInstructors = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // Phase 2: Apply client-side filters
      newInstructors = newInstructors.filter(instructor => {
        // Rating filter
        if (appliedFilters.minRating > 0 && instructor.rating < appliedFilters.minRating) {
          return false
        }
        
        // Rate filter
        if (appliedFilters.maxRate < 200 && instructor.hourlyRate > appliedFilters.maxRate) {
          return false
        }
        
        // Specialties filter
        if (appliedFilters.specialties.length > 0) {
          const hasSpecialty = appliedFilters.specialties.some(specialty => 
            instructor.specialties?.includes(specialty)
          )
          if (!hasSpecialty) return false
        }
        
        // Certifications filter
        if (appliedFilters.certifications.length > 0) {
          const hasCertification = appliedFilters.certifications.some(cert => 
            instructor.certifications?.includes(cert)
          )
          if (!hasCertification) return false
        }
        
        return true
      })

      if (reset) {
        setInstructors(newInstructors)
        setPage(1)
      } else {
        setInstructors(prev => [...prev, ...newInstructors])
        setPage(prev => prev + 1)
      }

      setHasMore(snapshot.docs.length === ITEMS_PER_PAGE)
      if (snapshot.docs.length > 0) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1])
      }
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Failed to search instructors')
    } finally {
      setSearching(false)
    }
  }

  // Phase 2: Handle real-time search
  useEffect(() => {
    if (searchQuery.trim() || filters.specialties.length > 0 || filters.certifications.length > 0) {
      debouncedSearch(searchQuery, filters)
    } else {
      setInstructors([])
    }
  }, [searchQuery, filters, debouncedSearch])

  // Load more results
  const loadMore = () => {
    if (!searching && hasMore) {
      searchInstructors(false)
    }
  }

  // Phase 2: Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  // Phase 2: Toggle specialty filter
  const toggleSpecialty = (specialty) => {
    setFilters(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }))
  }

  // Phase 2: Toggle certification filter
  const toggleCertification = (certification) => {
    setFilters(prev => ({
      ...prev,
      certifications: prev.certifications.includes(certification)
        ? prev.certifications.filter(c => c !== certification)
        : [...prev.certifications, certification]
    }))
  }

  // Send invitation
  const sendInvitation = async () => {
    if (!selectedInstructor || !user) return

    setLoading(true)
    try {
      const inviteData = {
        instructorId: selectedInstructor.id,
        instructorName: selectedInstructor.name,
        instructorEmail: selectedInstructor.email,
        status: 'pending',
        type: inviteForm.type,
        customMessage: inviteForm.customMessage,
        proposedRate: inviteForm.proposedRate ? parseFloat(inviteForm.proposedRate) : null,
        sentAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        sentBy: user.uid
      }

      // Add to studio invitations
      await addDoc(collection(db, `studioInvites/${user.uid}/invites`), inviteData)

      toast.success('Invitation sent successfully!')
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error('Send invitation error:', error)
      toast.error('Failed to send invitation')
    } finally {
      setLoading(false)
    }
  }

  // Phase 2: Send counter-offer
  const sendCounterOffer = async () => {
    if (!selectedInstructor || !user) return

    setLoading(true)
    try {
      const counterOfferData = {
        proposedRate: parseFloat(counterOffer.proposedRate),
        proposedSchedule: counterOffer.proposedSchedule,
        message: counterOffer.message,
        createdAt: serverTimestamp()
      }

      // Add counter-offer to invitation
      await addDoc(
        collection(db, `studioInvites/${user.uid}/invites/${selectedInstructor.id}/counterOffer`), 
        counterOfferData
      )

      toast.success('Counter-offer sent successfully!')
      setShowCounterOffer(false)
      setCounterOffer({ proposedRate: '', proposedSchedule: '', message: '' })
    } catch (error) {
      console.error('Send counter-offer error:', error)
      toast.error('Failed to send counter-offer')
    } finally {
      setLoading(false)
    }
  }

  // Reset form
  const resetForm = () => {
    setSelectedInstructor(null)
    setInviteStep(1)
    setInviteForm({
      type: 'contract',
      customMessage: '',
      proposedRate: '',
      useTemplate: false,
      templateId: null
    })
    setSearchQuery('')
    setInstructors([])
    setPage(1)
    setHasMore(true)
    setLastDoc(null)
    setFilters({
      locationRadius: 50,
      minRating: 0,
      maxRate: 200,
      specialties: [],
      certifications: [],
      availability: []
    })
    setShowFilters(false)
  }

  // Handle modal close
  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  // Phase 2: Available specialties and certifications
  const availableSpecialties = [
    'Yoga', 'Pilates', 'CrossFit', 'Strength Training', 'HIIT', 'Cardio',
    'Dance', 'Martial Arts', 'Senior Fitness', 'Rehabilitation', 'Nutrition',
    'Meditation', 'Flexibility', 'Sports Performance', 'Functional Fitness'
  ]

  const availableCertifications = [
    'Yoga Alliance RYT-200', 'Yoga Alliance RYT-500', 'NASM Certified Personal Trainer',
    'ACE Certified Personal Trainer', 'CrossFit Level 1', 'CrossFit Level 2',
    'Pilates Instructor Certification', 'Dance Teacher Certification',
    'Senior Fitness Specialist', 'Nutrition Coach', 'Rehabilitation Specialist'
  ]

  // Render advanced filters
  const renderAdvancedFilters = () => {
    return (
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </div>
        </CardHeader>
        
        {showFilters && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Minimum Rating</Label>
                <div className="flex items-center space-x-2">
                  <Slider
                    value={[filters.minRating]}
                    onValueChange={([value]) => handleFilterChange('minRating', value)}
                    max={5}
                    min={0}
                    step={0.1}
                    className="flex-1"
                  />
                  <span className="text-sm w-12">{filters.minRating}</span>
                </div>
              </div>
              
              <div>
                <Label>Max Hourly Rate</Label>
                <div className="flex items-center space-x-2">
                  <Slider
                    value={[filters.maxRate]}
                    onValueChange={([value]) => handleFilterChange('maxRate', value)}
                    max={200}
                    min={20}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-sm w-12">${filters.maxRate}</span>
                </div>
              </div>
              
              <div>
                <Label>Location Radius (miles)</Label>
                <div className="flex items-center space-x-2">
                  <Slider
                    value={[filters.locationRadius]}
                    onValueChange={([value]) => handleFilterChange('locationRadius', value)}
                    max={100}
                    min={5}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-sm w-12">{filters.locationRadius}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <Label>Specialties</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {availableSpecialties.map((specialty) => (
                  <div key={specialty} className="flex items-center space-x-2">
                    <Checkbox
                      id={specialty}
                      checked={filters.specialties.includes(specialty)}
                      onCheckedChange={() => toggleSpecialty(specialty)}
                    />
                    <Label htmlFor={specialty} className="text-sm">{specialty}</Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-3">
              <Label>Certifications</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {availableCertifications.map((certification) => (
                  <div key={certification} className="flex items-center space-x-2">
                    <Checkbox
                      id={certification}
                      checked={filters.certifications.includes(certification)}
                      onCheckedChange={() => toggleCertification(certification)}
                    />
                    <Label htmlFor={certification} className="text-sm">{certification}</Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    )
  }

  // Render search results
  const renderSearchResults = () => {
    if (searching && instructors.length === 0) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Searching instructors...</span>
        </div>
      )
    }

    if (instructors.length === 0 && !searching) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No instructors found</p>
          <p className="text-sm text-gray-400 mt-1">
            {searchQuery ? 'Try adjusting your search terms or filters' : 'Start searching to find instructors'}
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {instructors.map((instructor) => (
          <Card 
            key={instructor.id} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              setSelectedInstructor(instructor)
              setInviteStep(2)
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={instructor.photo} />
                  <AvatarFallback>
                    {instructor.name?.charAt(0) || 'I'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold">{instructor.name}</h3>
                    {instructor.verified && (
                      <Badge variant="secondary" className="text-xs">
                        <Award className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                    <div className="flex items-center">
                      <LocationIcon className="h-3 w-3 mr-1" />
                      {instructor.location?.city}, {instructor.location?.state}
                    </div>
                    <div className="flex items-center">
                      <Star className="h-3 w-3 mr-1 text-yellow-500" />
                      {instructor.rating || 'N/A'} ({instructor.reviewCount || 0})
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-3 w-3 mr-1" />
                      ${instructor.hourlyRate}/hr
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mt-2">
                    {instructor.specialties?.slice(0, 3).map((specialty, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                    {instructor.specialties?.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{instructor.specialties.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
                
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        ))}
        
        {hasMore && (
          <div className="text-center pt-4">
            <Button 
              variant="outline" 
              onClick={loadMore}
              disabled={searching}
            >
              {searching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load More'
              )}
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Render instructor profile preview
  const renderProfilePreview = () => {
    if (!selectedInstructor) return null

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setInviteStep(1)}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Search
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={selectedInstructor.photo} />
                <AvatarFallback className="text-lg">
                  {selectedInstructor.name?.charAt(0) || 'I'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h2 className="text-xl font-bold">{selectedInstructor.name}</h2>
                  {selectedInstructor.verified && (
                    <Badge variant="secondary">
                      <Award className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                
                <p className="text-gray-600 mb-4">{selectedInstructor.bio}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedInstructor.rating || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      ${selectedInstructor.hourlyRate}
                    </div>
                    <div className="text-sm text-gray-600">Per Hour</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {selectedInstructor.reviewCount || 0}
                    </div>
                    <div className="text-sm text-gray-600">Reviews</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {selectedInstructor.specialties?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Specialties</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold mb-2">Specialties</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedInstructor.specialties?.map((specialty, index) => (
                        <Badge key={index} variant="outline">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Certifications</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedInstructor.certifications?.map((cert, index) => (
                        <Badge key={index} variant="secondary">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Location</h4>
                    <div className="flex items-center text-gray-600">
                      <LocationIcon className="h-4 w-4 mr-2" />
                      {selectedInstructor.location?.city}, {selectedInstructor.location?.state}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={() => setInviteStep(1)}>
            Cancel
          </Button>
          <Button onClick={() => setInviteStep(3)}>
            Send Invitation
          </Button>
        </div>
      </div>
    )
  }

  // Render invitation form
  const renderInvitationForm = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setInviteStep(2)}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Profile
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Send Invitation to {selectedInstructor?.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Position Type</Label>
                <Select 
                  value={inviteForm.type} 
                  onValueChange={(value) => setInviteForm(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="rate">Proposed Rate (Optional)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="rate"
                    type="number"
                    placeholder="0.00"
                    value={inviteForm.proposedRate}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, proposedRate: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="message">Custom Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Tell the instructor why you'd like them to join your team..."
                value={inviteForm.customMessage}
                onChange={(e) => setInviteForm(prev => ({ ...prev, customMessage: e.target.value }))}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={() => setInviteStep(2)}>
            Cancel
          </Button>
          <Button onClick={sendInvitation} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Invitation
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  // Phase 2: Render counter-offer modal
  const renderCounterOfferModal = () => {
    if (!showCounterOffer) return null

    return (
      <Dialog open={showCounterOffer} onOpenChange={setShowCounterOffer}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Counter-Offer</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="counterRate">Your Proposed Rate</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="counterRate"
                  type="number"
                  placeholder="0.00"
                  value={counterOffer.proposedRate}
                  onChange={(e) => setCounterOffer(prev => ({ ...prev, proposedRate: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="counterSchedule">Proposed Schedule</Label>
              <Textarea
                id="counterSchedule"
                placeholder="Describe your proposed schedule..."
                value={counterOffer.proposedSchedule}
                onChange={(e) => setCounterOffer(prev => ({ ...prev, proposedSchedule: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="counterMessage">Message</Label>
              <Textarea
                id="counterMessage"
                placeholder="Explain your counter-offer..."
                value={counterOffer.message}
                onChange={(e) => setCounterOffer(prev => ({ ...prev, message: e.target.value }))}
                rows={4}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowCounterOffer(false)}>
                Cancel
              </Button>
              <Button onClick={sendCounterOffer} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Send Counter-Offer
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Invite Instructor</span>
            </DialogTitle>
          </DialogHeader>

          {inviteStep === 1 && (
            <div className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="employees">Search Employees</TabsTrigger>
                  <TabsTrigger value="marketplace">Browse Marketplace</TabsTrigger>
                </TabsList>
                
                <TabsContent value="employees" className="space-y-4">
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Search by name, specialty, or location..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Button onClick={() => searchInstructors(true)} disabled={!searchQuery.trim()}>
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </Button>
                  </div>
                  
                  {renderSearchResults()}
                </TabsContent>
                
                <TabsContent value="marketplace" className="space-y-4">
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Search marketplace instructors..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Button onClick={() => searchInstructors(true)} disabled={!searchQuery.trim()}>
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </Button>
                  </div>
                  
                  {renderAdvancedFilters()}
                  {renderSearchResults()}
                </TabsContent>
              </Tabs>
            </div>
          )}

          {inviteStep === 2 && renderProfilePreview()}
          {inviteStep === 3 && renderInvitationForm()}
        </DialogContent>
      </Dialog>
      
      {renderCounterOfferModal()}
    </>
  )
} 