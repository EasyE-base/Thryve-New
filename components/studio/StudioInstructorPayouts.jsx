'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Settings, 
  Calendar,
  BarChart3,
  CreditCard,
  Clock,
  Target,
  Award
} from 'lucide-react'

const StudioInstructorPayouts = ({ authToken }) => {
  const [payoutData, setPayoutData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  const API_BASE = `${process.env.NEXT_PUBLIC_BASE_URL}/server-api`

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': authToken || 'Bearer firebase-test-token'
  }

  // Fetch studio instructor payout data
  const fetchPayoutData = async () => {
    try {
      const response = await fetch(`${API_BASE}/studio/instructor-payouts`, { headers })
      if (!response.ok) {
        throw new Error(`Failed to fetch payout data: ${response.status}`)
      }
      const data = await response.json()
      setPayoutData(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayoutData()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading instructor payout management...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-destructive mb-4">Error loading payout data: {error}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Instructor Payout Management</h1>
          <p className="text-muted-foreground">
            Manage commission rates, payout schedules, and instructor earnings
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          {payoutData?.instructors?.length || 0} Instructors
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Instructors</p>
                <p className="text-2xl font-bold">
                  {payoutData?.instructors?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Payouts</p>
                <p className="text-2xl font-bold">
                  ${payoutData?.monthlyEarnings?.totalPayouts?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Commission</p>
                <p className="text-2xl font-bold">
                  {payoutData?.studioAnalytics?.averageCommissionRate ? 
                    `${(payoutData.studioAnalytics.averageCommissionRate * 100).toFixed(0)}%` : '70%'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Next Payout</p>
                <p className="text-lg font-bold">
                  {payoutData?.studioAnalytics?.nextPayoutDate ? 
                    new Date(payoutData.studioAnalytics.nextPayoutDate).toLocaleDateString() : 
                    'Weekly'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="instructors">Instructors</TabsTrigger>
          <TabsTrigger value="payouts">Recent Payouts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Monthly Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Classes</span>
                    <span className="font-bold">
                      {payoutData?.monthlyEarnings?.totalClasses || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Revenue</span>
                    <span className="font-bold">
                      ${payoutData?.monthlyEarnings?.totalRevenue?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Instructor Earnings</span>
                    <span className="font-bold text-green-600">
                      ${payoutData?.monthlyEarnings?.instructorEarnings?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Studio Revenue</span>
                    <span className="font-bold text-blue-600">
                      ${payoutData?.monthlyEarnings?.studioRevenue?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Earners */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Top Earning Instructors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payoutData?.instructors?.slice(0, 5).map((instructor, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{instructor.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {instructor.totalClasses || 0} classes
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          ${instructor.totalEarnings?.toFixed(2) || '0.00'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {((instructor.commissionRate || 0.7) * 100).toFixed(0)}% rate
                        </p>
                      </div>
                    </div>
                  )) || (
                    <p className="text-muted-foreground text-center py-4">
                      No instructor data available
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Payout Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payoutData?.recentActivity?.slice(0, 8).map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{activity.instructorName}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(activity.date).toLocaleDateString()} • 
                        {activity.type === 'payout' ? 'Payout' : 'Commission'} • 
                        {activity.status}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${activity.amount?.toFixed(2)}</p>
                      <Badge variant={activity.status === 'completed' ? 'default' : 'secondary'}>
                        {activity.status}
                      </Badge>
                    </div>
                  </div>
                )) || (
                  <p className="text-muted-foreground text-center py-4">
                    No recent activity
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Instructors Tab */}
        <TabsContent value="instructors">
          <InstructorsManagementTab 
            instructors={payoutData?.instructors || []}
            headers={headers}
            API_BASE={API_BASE}
            onUpdate={fetchPayoutData}
          />
        </TabsContent>

        {/* Recent Payouts Tab */}
        <TabsContent value="payouts">
          <RecentPayoutsTab 
            recentActivity={payoutData?.recentActivity || []}
            headers={headers}
            API_BASE={API_BASE}
          />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <PayoutSettingsTab 
            studioAnalytics={payoutData?.studioAnalytics || {}}
            headers={headers}
            API_BASE={API_BASE}
            onUpdate={fetchPayoutData}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Instructors Management Tab Component
const InstructorsManagementTab = ({ instructors, headers, API_BASE, onUpdate }) => {
  const [editingInstructor, setEditingInstructor] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  const updateInstructorCommission = async (instructorId, newCommissionRate) => {
    setUpdatingId(instructorId)
    try {
      const response = await fetch(`${API_BASE}/studio/configure-commission`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          instructorId,
          commissionRate: parseFloat(newCommissionRate) / 100, // Convert percentage to decimal
          payoutSchedule: 'weekly'
        })
      })

      if (response.ok) {
        setEditingInstructor(null)
        onUpdate()
      } else {
        throw new Error('Failed to update commission rate')
      }
    } catch (err) {
      console.error('Error updating commission:', err)
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Instructor Management</CardTitle>
        <CardDescription>
          Manage commission rates and payout settings for your instructors
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {instructors.length > 0 ? (
            instructors.map((instructor, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                    {instructor.name?.charAt(0) || 'I'}
                  </div>
                  <div>
                    <p className="font-medium">{instructor.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {instructor.email} • 
                      {instructor.totalClasses || 0} classes • 
                      Status: {instructor.stripeAccountStatus || 'Pending'}
                    </p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-muted-foreground">
                        Lifetime Earnings: ${instructor.totalEarnings?.toFixed(2) || '0.00'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Last Payout: {instructor.lastPayoutDate ? 
                          new Date(instructor.lastPayoutDate).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Commission Rate</p>
                    {editingInstructor === instructor.userId ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="10"
                          max="90"
                          step="5"
                          defaultValue={((instructor.commissionRate || 0.7) * 100).toFixed(0)}
                          className="w-20"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateInstructorCommission(instructor.userId, e.target.value)
                            } else if (e.key === 'Escape') {
                              setEditingInstructor(null)
                            }
                          }}
                          autoFocus
                        />
                        <span className="text-sm">%</span>
                      </div>
                    ) : (
                      <p className="font-bold text-lg">
                        {((instructor.commissionRate || 0.7) * 100).toFixed(0)}%
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {editingInstructor === instructor.userId ? (
                      <>
                        <Button 
                          size="sm" 
                          onClick={() => {
                            const input = document.querySelector('input[type="number"]')
                            updateInstructorCommission(instructor.userId, input.value)
                          }}
                          disabled={updatingId === instructor.userId}
                        >
                          {updatingId === instructor.userId ? 'Saving...' : 'Save'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setEditingInstructor(null)}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setEditingInstructor(instructor.userId)}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No instructors found</p>
              <p className="text-sm text-muted-foreground">
                Instructors will appear here once they join your studio
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Recent Payouts Tab Component
const RecentPayoutsTab = ({ recentActivity, headers, API_BASE }) => {
  const [filter, setFilter] = useState('all')
  const [filteredActivity, setFilteredActivity] = useState(recentActivity)

  useEffect(() => {
    if (filter === 'all') {
      setFilteredActivity(recentActivity)
    } else {
      setFilteredActivity(recentActivity.filter(activity => activity.status === filter))
    }
  }, [filter, recentActivity])

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Payout Activity</CardTitle>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button 
              size="sm" 
              variant={filter === 'completed' ? 'default' : 'outline'}
              onClick={() => setFilter('completed')}
            >
              Completed
            </Button>
            <Button 
              size="sm" 
              variant={filter === 'pending' ? 'default' : 'outline'}
              onClick={() => setFilter('pending')}
            >
              Pending
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredActivity.length > 0 ? (
            filteredActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                    {activity.type === 'payout' ? (
                      <CreditCard className="h-5 w-5" />
                    ) : (
                      <DollarSign className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{activity.instructorName}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(activity.date).toLocaleDateString()} • 
                      {activity.type === 'payout' ? 'Payout' : 'Commission'} • 
                      {activity.description || 'Regular payout'}
                    </p>
                    {activity.transactionId && (
                      <p className="text-xs text-muted-foreground">
                        ID: {activity.transactionId.slice(-8)}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-lg font-bold">${activity.amount?.toFixed(2)}</p>
                  <Badge className={getStatusColor(activity.status)}>
                    {activity.status}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No payout activity found</p>
              <p className="text-sm text-muted-foreground">
                {filter !== 'all' ? `No ${filter} payouts` : 'Payout activity will appear here'}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Payout Settings Tab Component
const PayoutSettingsTab = ({ studioAnalytics, headers, API_BASE, onUpdate }) => {
  const [settings, setSettings] = useState({
    defaultCommissionRate: (studioAnalytics.averageCommissionRate || 0.7) * 100,
    payoutSchedule: studioAnalytics.payoutSchedule || 'weekly',
    minimumPayoutAmount: studioAnalytics.minimumPayoutAmount || 25.00,
    automaticPayouts: studioAnalytics.automaticPayouts || true
  })
  const [saving, setSaving] = useState(false)

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      // In a real implementation, you would call an API to save studio settings
      console.log('Saving studio payout settings:', settings)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onUpdate()
    } catch (err) {
      console.error('Error saving settings:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Default Payout Settings</CardTitle>
          <CardDescription>
            Configure default settings for new instructors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="commissionRate">Default Commission Rate (%)</Label>
              <Input
                id="commissionRate"
                type="number"
                min="10"
                max="90"
                step="5"
                value={settings.defaultCommissionRate}
                onChange={(e) => setSettings({
                  ...settings,
                  defaultCommissionRate: parseFloat(e.target.value)
                })}
              />
              <p className="text-sm text-muted-foreground">
                Percentage of class revenue paid to instructors
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payoutSchedule">Payout Schedule</Label>
              <Select 
                value={settings.payoutSchedule}
                onValueChange={(value) => setSettings({
                  ...settings,
                  payoutSchedule: value
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                How often payouts are processed
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minimumPayout">Minimum Payout Amount ($)</Label>
              <Input
                id="minimumPayout"
                type="number"
                min="5"
                max="100"
                step="5"
                value={settings.minimumPayoutAmount}
                onChange={(e) => setSettings({
                  ...settings,
                  minimumPayoutAmount: parseFloat(e.target.value)
                })}
              />
              <p className="text-sm text-muted-foreground">
                Minimum balance required before payout
              </p>
            </div>

            <div className="space-y-2">
              <Label>Automatic Payouts</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="automaticPayouts"
                  checked={settings.automaticPayouts}
                  onChange={(e) => setSettings({
                    ...settings,
                    automaticPayouts: e.target.checked
                  })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="automaticPayouts" className="text-sm">
                  Enable automatic payouts
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Automatically process payouts when conditions are met
              </p>
            </div>
          </div>

          <Button onClick={handleSaveSettings} disabled={saving} className="w-full">
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving Settings...
              </>
            ) : (
              'Save Payout Settings'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Studio Analytics Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Studio Payout Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target className="h-5 w-5 text-blue-600" />
                <p className="font-medium">Total Instructors</p>
              </div>
              <p className="text-3xl font-bold text-blue-600">
                {studioAnalytics.totalInstructors || 0}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <p className="font-medium">Monthly Payouts</p>
              </div>
              <p className="text-3xl font-bold text-green-600">
                ${studioAnalytics.monthlyPayouts?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <p className="font-medium">Avg Commission</p>
              </div>
              <p className="text-3xl font-bold text-purple-600">
                {((studioAnalytics.averageCommissionRate || 0.7) * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default StudioInstructorPayouts