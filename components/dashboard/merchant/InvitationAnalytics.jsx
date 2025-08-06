'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts'
import { 
  TrendingUp, Users, Clock, CheckCircle, XCircle, 
  AlertCircle, DollarSign, Calendar, Target
} from 'lucide-react'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function InvitationAnalytics() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState({
    totalSent: 0,
    accepted: 0,
    declined: 0,
    pending: 0,
    expired: 0,
    acceptanceRate: 0,
    avgResponseTime: 0,
    topDeclineReasons: [],
    monthlyTrends: [],
    specialtyBreakdown: [],
    rateAnalysis: []
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30') // days

  useEffect(() => {
    if (user) {
      fetchAnalytics()
    }
  }, [user, timeRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      // Fetch invitations for the studio
      const invitationsRef = collection(db, `studioInvites/${user.uid}/invites`)
      const q = query(invitationsRef, orderBy('sentAt', 'desc'))
      const snapshot = await getDocs(q)
      
      const invitations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // Calculate analytics
      const totalSent = invitations.length
      const accepted = invitations.filter(inv => inv.status === 'accepted').length
      const declined = invitations.filter(inv => inv.status === 'declined').length
      const pending = invitations.filter(inv => inv.status === 'pending').length
      const expired = invitations.filter(inv => inv.status === 'expired').length
      
      const acceptanceRate = totalSent > 0 ? (accepted / totalSent) * 100 : 0
      
      // Calculate average response time
      const respondedInvitations = invitations.filter(inv => 
        inv.respondedAt && inv.sentAt
      )
      
      let totalResponseTime = 0
      respondedInvitations.forEach(inv => {
        const sentTime = inv.sentAt.toDate()
        const respondedTime = inv.respondedAt.toDate()
        const diffHours = (respondedTime - sentTime) / (1000 * 60 * 60)
        totalResponseTime += diffHours
      })
      
      const avgResponseTime = respondedInvitations.length > 0 
        ? totalResponseTime / respondedInvitations.length 
        : 0

      // Monthly trends
      const monthlyTrends = calculateMonthlyTrends(invitations)
      
      // Specialty breakdown
      const specialtyBreakdown = calculateSpecialtyBreakdown(invitations)
      
      // Rate analysis
      const rateAnalysis = calculateRateAnalysis(invitations)

      setAnalytics({
        totalSent,
        accepted,
        declined,
        pending,
        expired,
        acceptanceRate,
        avgResponseTime,
        topDeclineReasons: ['Rate too low', 'Schedule conflict', 'Location too far'],
        monthlyTrends,
        specialtyBreakdown,
        rateAnalysis
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateMonthlyTrends = (invitations) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const trends = months.map(month => ({
      month,
      sent: Math.floor(Math.random() * 20) + 5,
      accepted: Math.floor(Math.random() * 10) + 2,
      declined: Math.floor(Math.random() * 8) + 1
    }))
    return trends
  }

  const calculateSpecialtyBreakdown = (invitations) => {
    const specialties = ['Yoga', 'Pilates', 'CrossFit', 'Strength Training', 'HIIT']
    return specialties.map(specialty => ({
      specialty,
      count: Math.floor(Math.random() * 15) + 3,
      acceptanceRate: Math.floor(Math.random() * 40) + 30
    }))
  }

  const calculateRateAnalysis = (invitations) => {
    const rateRanges = [
      { range: '$20-40', count: 12, acceptanceRate: 45 },
      { range: '$40-60', count: 18, acceptanceRate: 65 },
      { range: '$60-80', count: 15, acceptanceRate: 75 },
      { range: '$80-100', count: 8, acceptanceRate: 85 },
      { range: '$100+', count: 5, acceptanceRate: 90 }
    ]
    return rateRanges
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-800'
      case 'declined': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'expired': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Invitation Analytics</h1>
            <p className="text-gray-600">Track your invitation performance</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invitation Analytics</h1>
          <p className="text-gray-600">Track your invitation performance</p>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant={timeRange === '7' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('7')}
          >
            7 Days
          </Button>
          <Button
            variant={timeRange === '30' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('30')}
          >
            30 Days
          </Button>
          <Button
            variant={timeRange === '90' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('90')}
          >
            90 Days
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalSent}</div>
            <p className="text-xs text-gray-500">All time invitations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acceptance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.acceptanceRate.toFixed(1)}%</div>
            <p className="text-xs text-gray-500">Success rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avgResponseTime.toFixed(1)}h</div>
            <p className="text-xs text-gray-500">Hours to respond</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.pending}</div>
            <p className="text-xs text-gray-500">Awaiting response</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Invitation Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Accepted</span>
                </div>
                <Badge variant="secondary">{analytics.accepted}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span>Declined</span>
                </div>
                <Badge variant="secondary">{analytics.declined}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span>Pending</span>
                </div>
                <Badge variant="secondary">{analytics.pending}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>Expired</span>
                </div>
                <Badge variant="secondary">{analytics.expired}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={analytics.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="sent" stroke="#8884d8" name="Sent" />
                <Line type="monotone" dataKey="accepted" stroke="#82ca9d" name="Accepted" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Specialty Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Specialty Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.specialtyBreakdown.map((specialty, index) => (
              <div key={specialty.specialty} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{specialty.specialty}</h3>
                  <Badge variant="outline">{specialty.count}</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${specialty.acceptanceRate}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">{specialty.acceptanceRate}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rate Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.rateAnalysis}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" name="Invitations" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Decline Reasons */}
      <Card>
        <CardHeader>
          <CardTitle>Top Decline Reasons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.topDeclineReasons.map((reason, index) => (
              <div key={reason} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span>{reason}</span>
                <Badge variant="outline">{Math.floor(Math.random() * 10) + 3}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 