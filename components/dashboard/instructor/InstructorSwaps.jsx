'use client'

import { useState } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Users, MessageSquare, Clock, Calendar, 
  CheckCircle, X, AlertCircle, Plus, Search,
  ArrowRight, Star, MapPin, Send
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'

// ✅ INSTRUCTOR SHIFT SWAP MANAGEMENT
export default function InstructorSwaps() {
  const { swapRequests, assignedClasses, refreshData } = useDashboard()
  const [activeTab, setActiveTab] = useState('requests')
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [selectedClass, setSelectedClass] = useState(null)
  const [requestMessage, setRequestMessage] = useState('')

  // ✅ MOCK DATA FOR DEMONSTRATION
  const pendingRequests = [
    {
      id: 1,
      className: 'Morning Yoga Flow',
      date: '2024-01-20',
      time: '09:00 AM',
      studio: 'Downtown Studio',
      requester: 'Sarah Johnson',
      requesterAvatar: null,
      requesterRating: 4.9,
      message: 'Family emergency - need coverage for tomorrow morning. Very reliable class with regular attendees.',
      status: 'pending',
      urgency: 'high'
    },
    {
      id: 2,
      className: 'Evening HIIT',
      date: '2024-01-22',
      time: '06:00 PM',
      studio: 'Westside Fitness',
      requester: 'Mike Chen',
      requesterAvatar: null,
      requesterRating: 4.7,
      message: 'Doctor appointment conflict. This is a popular class, usually fully booked.',
      status: 'pending',
      urgency: 'medium'
    }
  ]

  const myRequests = [
    {
      id: 3,
      className: 'Pilates Core',
      date: '2024-01-18',
      time: '07:00 PM',
      studio: 'My Studio',
      status: 'covered',
      coveredBy: 'Emma Wilson',
      message: 'Thanks for covering! The class went great.'
    },
    {
      id: 4,
      className: 'Weekend Yoga',
      date: '2024-01-25',
      time: '10:00 AM',
      studio: 'My Studio',
      status: 'pending',
      applications: 3
    }
  ]

  // ✅ HANDLE SWAP REQUEST RESPONSE
  const handleSwapResponse = async (requestId, action) => {
    try {
      const response = await fetch(`/api/swaps/${requestId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        toast.success(`Swap request ${action}ed successfully`)
        refreshData()
      } else {
        throw new Error(`Failed to ${action} swap request`)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  // ✅ CREATE SWAP REQUEST
  const handleCreateRequest = async () => {
    if (!selectedClass || !requestMessage.trim()) {
      toast.error('Please select a class and add a message')
      return
    }

    try {
      const response = await fetch('/api/swaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedClass.id,
          message: requestMessage
        })
      })

      if (response.ok) {
        toast.success('Swap request sent successfully')
        setShowRequestForm(false)
        setSelectedClass(null)
        setRequestMessage('')
        refreshData()
      } else {
        throw new Error('Failed to create swap request')
      }
    } catch (error) {
      toast.error('Failed to send swap request')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Shift Swaps</h1>
          <p className="text-gray-600">Manage class coverage and swap requests</p>
        </div>
        
        <Button onClick={() => setShowRequestForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Request Cover
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === 'requests' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('requests')}
          className="rounded-md"
        >
          Incoming Requests
          {pendingRequests.length > 0 && (
            <Badge className="ml-2 bg-red-500 text-white">
              {pendingRequests.length}
            </Badge>
          )}
        </Button>
        <Button
          variant={activeTab === 'my-requests' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('my-requests')}
          className="rounded-md"
        >
          My Requests
        </Button>
      </div>

      {activeTab === 'requests' ? (
        /* Incoming Swap Requests */
        <div className="space-y-4">
          {pendingRequests.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No swap requests
                </h3>
                <p className="text-gray-600">
                  You'll see requests from other instructors here when they need coverage
                </p>
              </CardContent>
            </Card>
          ) : (
            pendingRequests.map((request) => (
              <Card key={request.id} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={request.requesterAvatar} />
                        <AvatarFallback className="bg-[#1E90FF] text-white">
                          {request.requester.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-lg">{request.className}</h3>
                          <Badge 
                            variant={request.urgency === 'high' ? 'destructive' : 'secondary'}
                            className={request.urgency === 'high' ? 'bg-red-100 text-red-700' : ''}
                          >
                            {request.urgency === 'high' ? 'Urgent' : 'Regular'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{format(parseISO(request.date), 'EEE, MMM dd')}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{request.time}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{request.studio}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="text-sm text-gray-600">Requested by</span>
                          <span className="font-medium">{request.requester}</span>
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            <span className="text-sm text-gray-600">{request.requesterRating}</span>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-lg mb-4">
                          <p className="text-sm text-gray-700">{request.message}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <Button 
                      variant="outline"
                      onClick={() => handleSwapResponse(request.id, 'decline')}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Decline
                    </Button>
                    <Button 
                      onClick={() => handleSwapResponse(request.id, 'accept')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept Cover
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        /* My Swap Requests */
        <div className="space-y-4">
          {myRequests.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No active requests
                </h3>
                <p className="text-gray-600">
                  Your swap requests will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            myRequests.map((request) => (
              <Card key={request.id} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-lg">{request.className}</h3>
                        <Badge 
                          variant={request.status === 'covered' ? 'default' : 'secondary'}
                          className={request.status === 'covered' ? 'bg-green-100 text-green-700' : ''}
                        >
                          {request.status === 'covered' ? 'Covered' : 'Pending'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{format(parseISO(request.date), 'EEE, MMM dd')}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{request.time}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{request.studio}</span>
                        </div>
                      </div>
                      
                      {request.status === 'covered' ? (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-gray-600">
                            Covered by <span className="font-medium">{request.coveredBy}</span>
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                          <span className="text-sm text-gray-600">
                            {request.applications || 0} applications received
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Chat
                      </Button>
                      {request.status === 'pending' && (
                        <Button variant="outline" size="sm">
                          Cancel Request
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Request Cover Modal */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader>
              <CardTitle>Request Class Coverage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Select Class to Cover
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {(assignedClasses || []).slice(0, 5).map((cls, index) => (
                    <div
                      key={index}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedClass?.id === cls.id 
                          ? 'border-[#1E90FF] bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedClass(cls)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{cls.name || `Class ${index + 1}`}</div>
                          <div className="text-sm text-gray-600">
                            {cls.date || 'Jan 20'} • {cls.time || '9:00 AM'}
                          </div>
                        </div>
                        {selectedClass?.id === cls.id && (
                          <CheckCircle className="h-5 w-5 text-[#1E90FF]" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">
                  Message to Other Instructors
                </label>
                <Textarea
                  id="message"
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="Explain why you need coverage and any important details about the class..."
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button 
                  variant="outline"
                  onClick={() => setShowRequestForm(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateRequest}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Request
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}