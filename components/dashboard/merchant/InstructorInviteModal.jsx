'use client'

import { useState, useEffect } from 'react'
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
import { 
  Search, Users, MapPin, Star, Clock, DollarSign, 
  Calendar, Award, Mail, MessageSquare, Send, X,
  ChevronLeft, ChevronRight, Loader2
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
  
  // Invitation form state
  const [inviteForm, setInviteForm] = useState({
    type: 'contract',
    customMessage: '',
    proposedRate: '',
    useTemplate: false,
    templateId: null
  })

  // Search instructors with pagination
  const searchInstructors = async (reset = false) => {
    if (!searchQuery.trim()) return
    
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
      if (searchQuery.trim()) {
        // For now, we'll search by name - in Phase 2 we'll add full-text search
        q = query(
          instructorsRef,
          where('verified', '==', true),
          where('name', '>=', searchQuery),
          where('name', '<=', searchQuery + '\uf8ff'),
          orderBy('name'),
          limit(ITEMS_PER_PAGE)
        )
      }

      // Add pagination
      if (!reset && lastDoc) {
        q = query(q, startAfter(lastDoc))
      }

      const snapshot = await getDocs(q)
      const newInstructors = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

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

  // Load more results
  const loadMore = () => {
    if (!searching && hasMore) {
      searchInstructors(false)
    }
  }

  // Handle search
  const handleSearch = () => {
    setInstructors([])
    setPage(1)
    setLastDoc(null)
    setHasMore(true)
    searchInstructors(true)
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
  }

  // Handle modal close
  const handleClose = () => {
    resetForm()
    onOpenChange(false)
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
            {searchQuery ? 'Try adjusting your search terms' : 'Start searching to find instructors'}
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
                      <MapPin className="h-3 w-3 mr-1" />
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
                      <MapPin className="h-4 w-4 mr-2" />
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

  return (
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
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <Button onClick={handleSearch} disabled={!searchQuery.trim()}>
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
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <Button onClick={handleSearch} disabled={!searchQuery.trim()}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
                
                {renderSearchResults()}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {inviteStep === 2 && renderProfilePreview()}
        {inviteStep === 3 && renderInvitationForm()}
      </DialogContent>
    </Dialog>
  )
} 