'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { 
  Calendar, Clock, Users, UserCheck, Settings, 
  CheckCircle, X, AlertTriangle, ArrowLeftRight,
  Building2, Loader2, RefreshCw, TrendingUp, Target,
  MessageSquare, UserPlus, Edit, Eye
} from 'lucide-react'
import { toast } from 'sonner'

export default function StudioStaffingDashboard() {
  const { user, role } = useAuth()
  const [loading, setLoading] = useState(true)
  const [dashboard, setDashboard] = useState(null)
  const [settings, setSettings] = useState(null)
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  })
  const [activeTab, setActiveTab] = useState('schedule')
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [tempSettings, setTempSettings] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user && role === 'merchant') {
      fetchDashboard()
      fetchSettings()
    }
  }, [user, role, dateRange])

  const fetchDashboard = async () => {
    setLoading(true)
    try {
      const token = await user.getIdToken()
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      })

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/server-api/staffing/dashboard?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setDashboard(data)
      } else {
        toast.error('Failed to fetch staffing dashboard')
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
      toast.error('Failed to fetch staffing dashboard')
    } finally {
      setLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const token = await user.getIdToken()
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/server-api/staffing/settings`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
        setTempSettings(data.settings)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const handleApproveSwap = async (swapRequestId, approved, reason = '') => {
    setSubmitting(true)
    try {
      const token = await user.getIdToken()
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/server-api/staffing/approve-swap`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            swapRequestId: swapRequestId,
            approved: approved,
            reason: reason
          })
        }
      )

      if (response.ok) {
        toast.success(`Swap request ${approved ? 'approved' : 'rejected'} successfully!`)
        await fetchDashboard()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to process swap request')
      }
    } catch (error) {
      console.error('Error processing swap request:', error)
      toast.error('Failed to process swap request')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateSettings = async () => {
    setSubmitting(true)
    try {
      const token = await user.getIdToken()
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/server-api/staffing/settings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(tempSettings)
        }
      )

      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
        setShowSettingsModal(false)
        toast.success('Settings updated successfully!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update settings')
      }
    } catch (error) {
      console.error('Error updating settings:', error)
      toast.error('Failed to update settings')
    } finally {
      setSubmitting(false)
    }
  }

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

  if (role !== 'merchant') {
    return (
      <div className="text-center py-12">
        <Building2 className="h-16 w-16 text-blue-400 mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-semibold text-white mb-2">Studio Access Required</h3>
        <p className="text-blue-200">This feature is only available to studio owners.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Studio Staffing Dashboard</h1>
          <p className="text-blue-200">Manage your classes, instructors, and shift coverage</p>
        </div>
        <Button
          onClick={() => setShowSettingsModal(true)}
          className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
        >
          <Settings className="h-4 w-4 mr-2" />
          Staffing Settings
        </Button>
      </div>

      {/* Statistics Cards */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-900/20 to-blue-700/20 border border-blue-400/20 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 font-medium text-sm">Total Classes</p>
                  <p className="text-3xl font-bold text-white">{dashboard.stats?.totalClasses || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-900/20 to-green-700/20 border border-green-400/20 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-200 font-medium text-sm">Assigned</p>
                  <p className="text-3xl font-bold text-white">{dashboard.stats?.assignedClasses || 0}</p>
                  <p className="text-green-300 text-sm">
                    {dashboard.stats?.totalClasses > 0 
                      ? Math.round((dashboard.stats?.assignedClasses / dashboard.stats?.totalClasses) * 100) 
                      : 0}% coverage
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-900/20 to-yellow-700/20 border border-yellow-400/20 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-200 font-medium text-sm">Unassigned</p>
                  <p className="text-3xl font-bold text-white">{dashboard.stats?.unassignedClasses || 0}</p>
                  <p className="text-yellow-300 text-sm">Need instructors</p>
                </div>
                <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-900/20 to-red-700/20 border border-red-400/20 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-200 font-medium text-sm">Need Coverage</p>
                  <p className="text-3xl font-bold text-white">{dashboard.stats?.needingCoverage || 0}</p>
                  <p className="text-red-300 text-sm">{dashboard.stats?.pendingSwaps || 0} pending swaps</p>
                </div>
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
              onClick={fetchDashboard}
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
          { id: 'schedule', label: 'Class Schedule', count: dashboard?.classes?.length || 0 },
          { id: 'approvals', label: 'Pending Approvals', count: dashboard?.pendingSwaps?.length || 0 },
          { id: 'coverage', label: 'Coverage Requests', count: dashboard?.openCoverage?.length || 0 },
          { id: 'instructors', label: 'Instructors', count: dashboard?.instructors?.length || 0 }
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
      {loading ? (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-2" />
          <p className="text-blue-200">Loading dashboard...</p>
        </div>
      ) : (
        <>
          {activeTab === 'schedule' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Class Schedule</h2>
              
              {dashboard?.classes?.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-blue-400 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Classes Scheduled</h3>
                  <p className="text-blue-200">No classes scheduled for the selected date range.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dashboard?.classes?.map((classItem) => (
                    <Card key={classItem.id} className="bg-white/10 backdrop-blur-sm border-white/20">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-white font-semibold">{classItem.className}</h3>
                          {getClassStatusBadge(classItem)}
                        </div>
                        
                        <div className="space-y-2 text-sm mb-4">
                          <div className="flex items-center text-blue-200">
                            <Calendar className="h-4 w-4 mr-2" />
                            {new Date(classItem.startTime).toLocaleDateString()}
                          </div>
                          <div className="flex items-center text-blue-200">
                            <Clock className="h-4 w-4 mr-2" />
                            {new Date(classItem.startTime).toLocaleTimeString()} - {new Date(classItem.endTime).toLocaleTimeString()}
                          </div>
                          <div className="flex items-center text-blue-200">
                            <UserCheck className="h-4 w-4 mr-2" />
                            {classItem.instructorName}
                          </div>
                          <div className="flex items-center text-blue-200">
                            <Users className="h-4 w-4 mr-2" />
                            {classItem.enrolled || 0} / {classItem.capacity || 'Unlimited'} enrolled
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-400/20"
                          >
                            <Edit className="h-3 w-3 mr-1" />
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
              )}
            </div>
          )}

          {activeTab === 'approvals' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Pending Swap Approvals</h2>
              
              {dashboard?.pendingSwaps?.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 text-blue-400 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Pending Approvals</h3>
                  <p className="text-blue-200">All swap requests have been processed.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboard?.pendingSwaps?.map((request) => (
                    <Card key={request.id} className="bg-white/10 backdrop-blur-sm border-white/20">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-white font-semibold">Swap Request</h3>
                            <p className="text-blue-200 text-sm">
                              Between instructors for a class
                            </p>
                          </div>
                          <Badge className="bg-yellow-500/20 text-yellow-200">
                            <Clock className="h-3 w-3 mr-1" />
                            Awaiting Approval
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm mb-4">
                          <div className="text-blue-300">
                            <strong>Class:</strong> Class details would be here
                          </div>
                          <div className="text-blue-300">
                            <strong>Message:</strong> {request.message || 'No message provided'}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleApproveSwap(request.id, true)}
                            disabled={submitting}
                            size="sm"
                            className="bg-green-500/20 hover:bg-green-500/30 text-green-200 border border-green-400/20"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {submitting ? 'Approving...' : 'Approve'}
                          </Button>
                          <Button
                            onClick={() => handleApproveSwap(request.id, false, 'Denied by studio management')}
                            disabled={submitting}
                            size="sm"
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-400/20"
                          >
                            <X className="h-3 w-3 mr-1" />
                            {submitting ? 'Rejecting...' : 'Reject'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'coverage' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Coverage Requests</h2>
              
              {dashboard?.openCoverage?.length === 0 ? (
                <div className="text-center py-12">
                  <UserCheck className="h-16 w-16 text-blue-400 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Coverage Requests</h3>
                  <p className="text-blue-200">All classes are currently covered.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dashboard?.openCoverage?.map((request) => (
                    <Card key={request.id} className="bg-orange-500/10 backdrop-blur-sm border-orange-400/20">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-white font-semibold">Coverage Needed</h3>
                          <Badge className="bg-orange-500/20 text-orange-200">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Open
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm mb-4">
                          <div className="text-orange-200">
                            <strong>Applicants:</strong> {request.applicants?.length || 0}
                          </div>
                          {request.message && (
                            <div className="text-orange-200">
                              <strong>Message:</strong> {request.message}
                            </div>
                          )}
                        </div>

                        <Button
                          size="sm"
                          className="w-full bg-orange-500/20 hover:bg-orange-500/30 text-orange-200 border border-orange-400/20"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Review Applicants
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'instructors' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">Studio Instructors</h2>
                <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Instructor
                </Button>
              </div>
              
              {dashboard?.instructors?.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-blue-400 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Instructors</h3>
                  <p className="text-blue-200">Add instructors to start managing your classes.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dashboard?.instructors?.map((instructor) => (
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
              )}
            </div>
          )}
        </>
      )}

      {/* Settings Modal */}
      {showSettingsModal && tempSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-purple-900/90 to-blue-900/90 backdrop-blur-md border border-white/20 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-2xl font-semibold text-white mb-6">Staffing Settings</h3>
            
            <div className="space-y-6">
              {/* Approval Settings */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-white">Approval Settings</h4>
                
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                  <div>
                    <Label className="text-white font-medium">Require Studio Approval</Label>
                    <p className="text-blue-200 text-sm">All instructor swaps must be approved by studio management</p>
                  </div>
                  <Switch
                    checked={tempSettings.requireApproval}
                    onCheckedChange={(checked) => setTempSettings(prev => ({ ...prev, requireApproval: checked }))}
                  />
                </div>
              </div>

              {/* Limits & Restrictions */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-white">Limits & Restrictions</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxWeeklyHours" className="text-white">Max Weekly Hours</Label>
                    <Input
                      id="maxWeeklyHours"
                      type="number"
                      value={tempSettings.maxWeeklyHours}
                      onChange={(e) => setTempSettings(prev => ({ ...prev, maxWeeklyHours: parseInt(e.target.value) }))}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="minHoursBetween" className="text-white">Min Hours Between Classes</Label>
                    <Input
                      id="minHoursBetween"
                      type="number"
                      value={tempSettings.minHoursBetweenClasses}
                      onChange={(e) => setTempSettings(prev => ({ ...prev, minHoursBetweenClasses: parseInt(e.target.value) }))}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-white">Instructor Permissions</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                    <div>
                      <Label className="text-white font-medium">Allow Self-Initiated Swaps</Label>
                      <p className="text-blue-200 text-sm">Instructors can initiate swap requests with colleagues</p>
                    </div>
                    <Switch
                      checked={tempSettings.allowSelfSwap}
                      onCheckedChange={(checked) => setTempSettings(prev => ({ ...prev, allowSelfSwap: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                    <div>
                      <Label className="text-white font-medium">Allow Coverage Requests</Label>
                      <p className="text-blue-200 text-sm">Instructors can request coverage from available colleagues</p>
                    </div>
                    <Switch
                      checked={tempSettings.allowCoverageRequest}
                      onCheckedChange={(checked) => setTempSettings(prev => ({ ...prev, allowCoverageRequest: checked }))}
                    />
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-white">Notification Preferences</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                    <div>
                      <Label className="text-white font-medium">Notify on Swap Requests</Label>
                      <p className="text-blue-200 text-sm">Get notified when instructors request swaps</p>
                    </div>
                    <Switch
                      checked={tempSettings.notifyOnSwapRequest}
                      onCheckedChange={(checked) => setTempSettings(prev => ({ ...prev, notifyOnSwapRequest: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                    <div>
                      <Label className="text-white font-medium">Notify on Coverage Requests</Label>
                      <p className="text-blue-200 text-sm">Get notified when instructors need coverage</p>
                    </div>
                    <Switch
                      checked={tempSettings.notifyOnCoverageRequest}
                      onCheckedChange={(checked) => setTempSettings(prev => ({ ...prev, notifyOnCoverageRequest: checked }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button
                onClick={handleUpdateSettings}
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Settings className="h-4 w-4 mr-2" />}
                {submitting ? 'Saving...' : 'Save Settings'}
              </Button>
              <Button
                onClick={() => {
                  setShowSettingsModal(false)
                  setTempSettings(settings)
                }}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}