'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Calendar, Clock, Users, MessageSquare, ArrowLeftRight, 
  UserCheck, AlertTriangle, CheckCircle, X, Send, Loader2,
  MapPin, BookOpen, Star, RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

export default function InstructorScheduleComponent() {
  const { user, userRole } = useAuth()
  const [loading, setLoading] = useState(true)
  const [schedule, setSchedule] = useState([])
  const [swapRequests, setSwapRequests] = useState([])
  const [coveragePool, setCoveragePool] = useState([])
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  })
  const [activeTab, setActiveTab] = useState('schedule')
  const [selectedClass, setSelectedClass] = useState(null)
  const [showSwapModal, setShowSwapModal] = useState(false)
  const [showCoverageModal, setShowCoverageModal] = useState(false)
  const [swapMessage, setSwapMessage] = useState('')
  const [coverageMessage, setCoverageMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user && userRole === 'instructor') {
      fetchSchedule()
      fetchSwapRequests()
      fetchCoveragePool()
    }
  }, [user, userRole, dateRange])

  const fetchSchedule = async () => {
    setLoading(true)
    try {
      const token = await user.getIdToken()
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      })

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/server-api/staffing/schedule?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setSchedule(data.classes || [])
      } else {
        toast.error('Failed to fetch schedule')
      }
    } catch (error) {
      console.error('Error fetching schedule:', error)
      toast.error('Failed to fetch schedule')
    } finally {
      setLoading(false)
    }
  }

  const fetchSwapRequests = async () => {
    try {
      const token = await user.getIdToken()
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/server-api/staffing/swap-requests`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setSwapRequests(data.swapRequests || [])
      }
    } catch (error) {
      console.error('Error fetching swap requests:', error)
    }
  }

  const fetchCoveragePool = async () => {
    try {
      const token = await user.getIdToken()
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/server-api/staffing/coverage-pool`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setCoveragePool(data.coveragePool || [])
      }
    } catch (error) {
      console.error('Error fetching coverage pool:', error)
    }
  }

  const handleRequestSwap = async (classId, recipientId) => {
    setSubmitting(true)
    try {
      const token = await user.getIdToken()
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/server-api/staffing/request-swap`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            classId: classId,
            recipientInstructorId: recipientId,
            message: swapMessage
          })
        }
      )

      if (response.ok) {
        const data = await response.json()
        toast.success('Swap request sent successfully!')
        setShowSwapModal(false)
        setSwapMessage('')
        setSelectedClass(null)
        await fetchSchedule()
        await fetchSwapRequests()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to send swap request')
      }
    } catch (error) {
      console.error('Error requesting swap:', error)
      toast.error('Failed to send swap request')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAcceptSwap = async (swapRequestId) => {
    setSubmitting(true)
    try {
      const token = await user.getIdToken()
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/server-api/staffing/accept-swap`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            swapRequestId: swapRequestId
          })
        }
      )

      if (response.ok) {
        const data = await response.json()
        toast.success('Swap request accepted!')
        await fetchSchedule()
        await fetchSwapRequests()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to accept swap request')
      }
    } catch (error) {
      console.error('Error accepting swap:', error)
      toast.error('Failed to accept swap request')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRequestCoverage = async (classId) => {
    setSubmitting(true)
    try {
      const token = await user.getIdToken()
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/server-api/staffing/request-coverage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            classId: classId,
            message: coverageMessage,
            urgent: false
          })
        }
      )

      if (response.ok) {
        toast.success('Coverage request sent successfully!')
        setShowCoverageModal(false)
        setCoverageMessage('')
        setSelectedClass(null)
        await fetchSchedule()
        await fetchCoveragePool()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to request coverage')
      }
    } catch (error) {
      console.error('Error requesting coverage:', error)
      toast.error('Failed to request coverage')
    } finally {
      setSubmitting(false)
    }
  }

  const handleApplyCoverage = async (coverageRequestId) => {
    setSubmitting(true)
    try {
      const token = await user.getIdToken()
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/server-api/staffing/apply-coverage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            coverageRequestId: coverageRequestId,
            message: 'I would like to cover this class'
          })
        }
      )

      if (response.ok) {
        toast.success('Applied for coverage successfully!')
        await fetchCoveragePool()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to apply for coverage')
      }
    } catch (error) {
      console.error('Error applying for coverage:', error)
      toast.error('Failed to apply for coverage')
    } finally {
      setSubmitting(false)
    }
  }

  const getSwapStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-500/20 text-yellow-200', icon: Clock },
      accepted: { color: 'bg-green-500/20 text-green-200', icon: CheckCircle },
      rejected: { color: 'bg-red-500/20 text-red-200', icon: X },
      awaiting_approval: { color: 'bg-blue-500/20 text-blue-200', icon: Clock },
      approved: { color: 'bg-green-500/20 text-green-200', icon: CheckCircle }
    }

    const config = statusConfig[status] || statusConfig.pending
    const IconComponent = config.icon

    return (
      <Badge className={`${config.color} text-xs`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    )
  }

  if (userRole !== 'instructor') {
    return (
      <div className="text-center py-12">
        <UserCheck className="h-16 w-16 text-blue-400 mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-semibold text-white mb-2">Instructor Access Required</h3>
        <p className="text-blue-200">This feature is only available to instructors.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">My Schedule & Staffing</h1>
        <p className="text-blue-200">Manage your classes, swap shifts, and cover for colleagues</p>
      </div>

      {/* Date Range Selector */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-white">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-white">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <Button 
              onClick={fetchSchedule}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Update
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-white/5 p-1 rounded-lg border border-white/10">
        {[
          { id: 'schedule', label: 'My Schedule', count: schedule.length },
          { id: 'swaps', label: 'Swap Requests', count: swapRequests.filter(r => r.status === 'pending').length },
          { id: 'coverage', label: 'Coverage Pool', count: coveragePool.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-500 text-white'
                : 'text-blue-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <Badge variant="secondary" className="bg-white/20 text-white text-xs">
                {tab.count}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">My Classes</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-2" />
              <p className="text-blue-200">Loading schedule...</p>
            </div>
          ) : schedule.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-blue-400 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold text-white mb-2">No Classes Scheduled</h3>
              <p className="text-blue-200">No classes assigned for the selected date range.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schedule.map((classItem) => (
                <Card key={classItem.id} className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-white font-semibold">{classItem.className}</h3>
                      {classItem.swapRequest && (
                        <div className="ml-2">
                          {getSwapStatusBadge(classItem.swapRequest.status)}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-blue-200">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(classItem.startTime).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-blue-200">
                        <Clock className="h-4 w-4 mr-2" />
                        {new Date(classItem.startTime).toLocaleTimeString()} - {new Date(classItem.endTime).toLocaleTimeString()}
                      </div>
                      <div className="flex items-center text-blue-200">
                        <MapPin className="h-4 w-4 mr-2" />
                        {classItem.location || 'Location TBD'}
                      </div>
                      <div className="flex items-center text-blue-200">
                        <Users className="h-4 w-4 mr-2" />
                        {classItem.enrolled || 0} / {classItem.capacity || 'Unlimited'} enrolled
                      </div>
                    </div>

                    {classItem.needsCoverage && (
                      <div className="mt-3 p-2 bg-orange-500/10 border border-orange-400/20 rounded">
                        <div className="flex items-center text-orange-200 text-sm">
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Coverage Requested
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {classItem.canRequestSwap && (
                        <Button
                          onClick={() => {
                            setSelectedClass(classItem)
                            setShowSwapModal(true)
                          }}
                          size="sm"
                          className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-400/20"
                        >
                          <ArrowLeftRight className="h-3 w-3 mr-1" />
                          Request Swap
                        </Button>
                      )}
                      
                      {classItem.canRequestCoverage && (
                        <Button
                          onClick={() => {
                            setSelectedClass(classItem)
                            setShowCoverageModal(true)
                          }}
                          size="sm"
                          className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-200 border border-orange-400/20"
                        >
                          <UserCheck className="h-3 w-3 mr-1" />
                          Need Coverage
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'swaps' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Swap Requests</h2>
          
          {swapRequests.length === 0 ? (
            <div className="text-center py-12">
              <ArrowLeftRight className="h-16 w-16 text-blue-400 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold text-white mb-2">No Swap Requests</h3>
              <p className="text-blue-200">No pending swap requests at this time.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {swapRequests.map((request) => (
                <Card key={request.id} className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-white font-semibold">{request.classData?.className}</h3>
                        <p className="text-blue-200 text-sm">
                          {request.userRole === 'initiator' ? 'You requested' : `${request.initiatorName} requested`} 
                          {' '}swap with{' '}
                          {request.userRole === 'recipient' ? 'you' : request.recipientName}
                        </p>
                      </div>
                      {getSwapStatusBadge(request.status)}
                    </div>

                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center text-blue-200">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(request.classData?.startTime).toLocaleDateString()} at {new Date(request.classData?.startTime).toLocaleTimeString()}
                      </div>
                      <div className="text-blue-300">
                        <strong>Message:</strong> {request.message || 'No message provided'}
                      </div>
                      <div className="text-blue-300 text-xs">
                        {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                      </div>
                    </div>

                    {request.status === 'pending' && request.userRole === 'recipient' && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAcceptSwap(request.id)}
                          disabled={submitting}
                          size="sm"
                          className="bg-green-500/20 hover:bg-green-500/30 text-green-200 border border-green-400/20"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {submitting ? 'Accepting...' : 'Accept Swap'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-400/20 text-red-300 hover:bg-red-500/10"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Decline
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'coverage' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Coverage Pool</h2>
            <Badge className="bg-orange-500/20 text-orange-200">
              {coveragePool.filter(item => item.urgent).length} Urgent
            </Badge>
          </div>
          
          {coveragePool.length === 0 ? (
            <div className="text-center py-12">
              <UserCheck className="h-16 w-16 text-blue-400 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold text-white mb-2">No Coverage Needed</h3>
              <p className="text-blue-200">All classes are currently covered.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coveragePool.map((item) => (
                <Card key={item.id} className={`backdrop-blur-sm border-white/20 ${
                  item.urgent ? 'bg-orange-500/10 border-orange-400/20' : 'bg-white/10'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-white font-semibold">{item.classData?.className}</h3>
                      {item.urgent && (
                        <Badge className="bg-orange-500/20 text-orange-200 text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          URGENT
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center text-blue-200">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(item.classData?.startTime).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-blue-200">
                        <Clock className="h-4 w-4 mr-2" />
                        {new Date(item.classData?.startTime).toLocaleTimeString()}
                      </div>
                      <div className="flex items-center text-blue-200">
                        <Users className="h-4 w-4 mr-2" />
                        {item.applicantCount} applicant{item.applicantCount !== 1 ? 's' : ''}
                      </div>
                      {item.message && (
                        <div className="text-blue-300 text-xs">
                          <strong>Note:</strong> {item.message}
                        </div>
                      )}
                    </div>

                    {item.userHasApplied ? (
                      <Badge className="bg-blue-500/20 text-blue-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Applied ({item.applicationStatus})
                      </Badge>
                    ) : (
                      <Button
                        onClick={() => handleApplyCoverage(item.id)}
                        disabled={submitting}
                        size="sm"
                        className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-200 border border-green-400/20"
                      >
                        <UserCheck className="h-3 w-3 mr-1" />
                        {submitting ? 'Applying...' : 'Apply to Cover'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Swap Request Modal */}
      {showSwapModal && selectedClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-blue-900/90 to-purple-900/90 backdrop-blur-md border border-white/20 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-white mb-4">Request Shift Swap</h3>
            <div className="space-y-4">
              <div>
                <p className="text-blue-200 text-sm mb-2">Class: {selectedClass.className}</p>
                <p className="text-blue-200 text-sm">
                  {new Date(selectedClass.startTime).toLocaleDateString()} at {new Date(selectedClass.startTime).toLocaleTimeString()}
                </p>
              </div>
              
              <div>
                <Label htmlFor="swapMessage" className="text-white">Message (Optional)</Label>
                <Textarea
                  id="swapMessage"
                  value={swapMessage}
                  onChange={(e) => setSwapMessage(e.target.value)}
                  placeholder="Let them know why you need to swap..."
                  className="bg-white/10 border-white/20 text-white placeholder-blue-300"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleRequestSwap(selectedClass.id, 'instructor-id-placeholder')}
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  {submitting ? 'Sending...' : 'Send Request'}
                </Button>
                <Button
                  onClick={() => {
                    setShowSwapModal(false)
                    setSwapMessage('')
                    setSelectedClass(null)
                  }}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Coverage Request Modal */}
      {showCoverageModal && selectedClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-orange-900/90 to-red-900/90 backdrop-blur-md border border-white/20 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-white mb-4">Request Coverage</h3>
            <div className="space-y-4">
              <div>
                <p className="text-orange-200 text-sm mb-2">Class: {selectedClass.className}</p>
                <p className="text-orange-200 text-sm">
                  {new Date(selectedClass.startTime).toLocaleDateString()} at {new Date(selectedClass.startTime).toLocaleTimeString()}
                </p>
              </div>
              
              <div>
                <Label htmlFor="coverageMessage" className="text-white">Message (Optional)</Label>
                <Textarea
                  id="coverageMessage"
                  value={coverageMessage}
                  onChange={(e) => setCoverageMessage(e.target.value)}
                  placeholder="Let other instructors know why you need coverage..."
                  className="bg-white/10 border-white/20 text-white placeholder-orange-300"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleRequestCoverage(selectedClass.id)}
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  {submitting ? 'Requesting...' : 'Request Coverage'}
                </Button>
                <Button
                  onClick={() => {
                    setShowCoverageModal(false)
                    setCoverageMessage('')
                    setSelectedClass(null)
                  }}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}