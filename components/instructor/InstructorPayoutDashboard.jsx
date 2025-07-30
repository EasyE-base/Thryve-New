'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  CreditCard, 
  BarChart3, 
  FileText,
  Clock,
  Users,
  Target,
  Activity
} from 'lucide-react'

const InstructorPayoutDashboard = ({ authToken }) => {
  const [dashboardData, setDashboardData] = useState(null)
  const [earningsHistory, setEarningsHistory] = useState([])
  const [payoutTransactions, setPayoutTransactions] = useState([])
  const [performanceAnalytics, setPerformanceAnalytics] = useState(null)
  const [taxDocuments, setTaxDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  const API_BASE = `${process.env.NEXT_PUBLIC_BASE_URL}/server-api`

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': authToken || 'Bearer firebase-test-token'
  }

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${API_BASE}/instructor/payout-dashboard`, { headers })
      if (!response.ok) throw new Error('Failed to fetch dashboard data')
      const data = await response.json()
      setDashboardData(data)
    } catch (err) {
      setError(err.message)
    }
  }

  // Fetch earnings history
  const fetchEarningsHistory = async () => {
    try {
      const response = await fetch(`${API_BASE}/instructor/earnings-history?period=current_month&limit=10`, { headers })
      if (!response.ok) throw new Error('Failed to fetch earnings history')
      const data = await response.json()
      setEarningsHistory(data.earnings || [])
    } catch (err) {
      console.error('Error fetching earnings history:', err)
    }
  }

  // Fetch payout transactions
  const fetchPayoutTransactions = async () => {
    try {
      const response = await fetch(`${API_BASE}/instructor/payout-transactions?limit=5`, { headers })
      if (!response.ok) throw new Error('Failed to fetch payout transactions')
      const data = await response.json()
      setPayoutTransactions(data.transactions || [])
    } catch (err) {
      console.error('Error fetching payout transactions:', err)
    }
  }

  // Fetch performance analytics
  const fetchPerformanceAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE}/instructor/performance-analytics`, { headers })
      if (!response.ok) throw new Error('Failed to fetch performance analytics')
      const data = await response.json()
      setPerformanceAnalytics(data)
    } catch (err) {
      console.error('Error fetching performance analytics:', err)
    }
  }

  // Fetch tax documents
  const fetchTaxDocuments = async () => {
    try {
      const response = await fetch(`${API_BASE}/instructor/tax-documents?year=2024`, { headers })
      if (!response.ok) throw new Error('Failed to fetch tax documents')
      const data = await response.json()
      setTaxDocuments(data.documents || [])
    } catch (err) {
      console.error('Error fetching tax documents:', err)
    }
  }

  // Process payout
  const processPayout = async (amount, payoutType = 'scheduled') => {
    try {
      const response = await fetch(`${API_BASE}/instructor/process-payout`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          instructorId: dashboardData?.profile?.instructorId,
          amount: parseFloat(amount),
          payoutType,
          description: `${payoutType === 'instant' ? 'Instant' : 'Scheduled'} payout request`
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process payout')
      }
      
      const result = await response.json()
      
      // Refresh data after successful payout
      await Promise.all([
        fetchDashboardData(),
        fetchPayoutTransactions()
      ])
      
      return result
    } catch (err) {
      throw err
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        await Promise.all([
          fetchDashboardData(),
          fetchEarningsHistory(),
          fetchPayoutTransactions(),
          fetchPerformanceAnalytics(),
          fetchTaxDocuments()
        ])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading payout dashboard...</p>
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
              <p className="text-destructive mb-4">Error loading dashboard: {error}</p>
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
          <h1 className="text-3xl font-bold">Instructor Payout Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your earnings, payouts, and financial performance
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          Commission: {dashboardData?.profile?.commissionRate ? 
            `${(dashboardData.profile.commissionRate * 100).toFixed(0)}%` : '70%'}
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">
                  ${dashboardData?.earnings?.totalLifetimeEarnings?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Payouts</p>
                <p className="text-2xl font-bold">
                  ${dashboardData?.earnings?.totalPayouts?.toFixed(2) || '0.00'}
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
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">
                  ${dashboardData?.earnings?.currentMonthEarnings?.toFixed(2) || '0.00'}
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
                  {dashboardData?.earnings?.nextPayoutDate ? 
                    new Date(dashboardData.earnings.nextPayoutDate).toLocaleDateString() : 
                    'TBD'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="taxes">Tax Docs</TabsTrigger>
          <TabsTrigger value="payout">Request Payout</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Payouts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.recentActivity?.recentPayouts?.length > 0 ? (
                    dashboardData.recentActivity.recentPayouts.map((payout, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">${payout.amount?.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(payout.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={payout.status === 'completed' ? 'default' : 'secondary'}>
                          {payout.status}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No recent payouts</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Classes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Upcoming Classes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.recentActivity?.upcomingClasses?.length > 0 ? (
                    dashboardData.recentActivity.upcomingClasses.map((classItem, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">{classItem.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(classItem.startTime).toLocaleDateString()} at{' '}
                            {new Date(classItem.startTime).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                        <Badge variant="outline">
                          ${classItem.earnings?.toFixed(2) || '0.00'}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No upcoming classes</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    <p className="font-medium">Classes This Month</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">
                    {dashboardData?.monthlyStats?.classesThisMonth || 0}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-green-600" />
                    <p className="font-medium">Students This Month</p>
                  </div>
                  <p className="text-3xl font-bold text-green-600">
                    {dashboardData?.monthlyStats?.studentsThisMonth || 0}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                    <p className="font-medium">Avg Earning/Class</p>
                  </div>
                  <p className="text-3xl font-bold text-purple-600">
                    ${dashboardData?.monthlyStats?.averageEarningPerClass?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Earnings Tab */}
        <TabsContent value="earnings">
          <EarningsHistoryTab 
            earningsHistory={earningsHistory} 
            headers={headers}
            API_BASE={API_BASE}
          />
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <PayoutTransactionsTab 
            payoutTransactions={payoutTransactions}
            headers={headers}
            API_BASE={API_BASE}
          />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <PerformanceAnalyticsTab 
            performanceAnalytics={performanceAnalytics}
            headers={headers}
            API_BASE={API_BASE}
          />
        </TabsContent>

        {/* Tax Documents Tab */}
        <TabsContent value="taxes">
          <TaxDocumentsTab 
            taxDocuments={taxDocuments}
            headers={headers}
            API_BASE={API_BASE}
          />
        </TabsContent>

        {/* Request Payout Tab */}
        <TabsContent value="payout">
          <PayoutRequestTab 
            dashboardData={dashboardData}
            processPayout={processPayout}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Earnings History Tab Component
const EarningsHistoryTab = ({ earningsHistory, headers, API_BASE }) => {
  const [earnings, setEarnings] = useState(earningsHistory)
  const [period, setPeriod] = useState('current_month')
  const [loading, setLoading] = useState(false)

  const fetchEarnings = async (selectedPeriod) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/instructor/earnings-history?period=${selectedPeriod}&limit=20`, { headers })
      if (response.ok) {
        const data = await response.json()
        setEarnings(data.earnings || [])
      }
    } catch (err) {
      console.error('Error fetching earnings:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod)
    fetchEarnings(newPeriod)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Earnings History</CardTitle>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant={period === 'current_month' ? 'default' : 'outline'}
              onClick={() => handlePeriodChange('current_month')}
            >
              This Month
            </Button>
            <Button 
              size="sm" 
              variant={period === 'last_month' ? 'default' : 'outline'}
              onClick={() => handlePeriodChange('last_month')}
            >
              Last Month
            </Button>
            <Button 
              size="sm" 
              variant={period === 'last_3_months' ? 'default' : 'outline'}
              onClick={() => handlePeriodChange('last_3_months')}
            >
              Last 3 Months
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading earnings...</p>
          </div>
        ) : earnings.length > 0 ? (
          <div className="space-y-4">
            {earnings.map((earning, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{earning.className || 'Class'}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(earning.classDate).toLocaleDateString()} • 
                    {earning.studentsAttended || 0} students
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Base: ${earning.baseEarning?.toFixed(2)} • 
                    Commission: {((earning.commissionRate || 0.7) * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">${earning.totalEarning?.toFixed(2)}</p>
                  {earning.bonus > 0 && (
                    <p className="text-sm text-green-600">+${earning.bonus.toFixed(2)} bonus</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">No earnings data available</p>
        )}
      </CardContent>
    </Card>
  )
}

// Payout Transactions Tab Component
const PayoutTransactionsTab = ({ payoutTransactions, headers, API_BASE }) => {
  const [transactions, setTransactions] = useState(payoutTransactions)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(false)

  const fetchTransactions = async (status = '') => {
    setLoading(true)
    try {
      const url = status ? `${API_BASE}/instructor/payout-transactions?status=${status}&limit=20` : 
                          `${API_BASE}/instructor/payout-transactions?limit=20`
      const response = await fetch(url, { headers })
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
      }
    } catch (err) {
      console.error('Error fetching transactions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter)
    fetchTransactions(newFilter === 'all' ? '' : newFilter)
  }

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
          <CardTitle>Payout Transactions</CardTitle>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => handleFilterChange('all')}
            >
              All
            </Button>
            <Button 
              size="sm" 
              variant={filter === 'completed' ? 'default' : 'outline'}
              onClick={() => handleFilterChange('completed')}
            >
              Completed
            </Button>
            <Button 
              size="sm" 
              variant={filter === 'pending' ? 'default' : 'outline'}
              onClick={() => handleFilterChange('pending')}
            >
              Pending
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading transactions...</p>
          </div>
        ) : transactions.length > 0 ? (
          <div className="space-y-4">
            {transactions.map((transaction, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Payout #{transaction.id?.slice(-8) || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(transaction.createdAt).toLocaleDateString()} • 
                    {transaction.payoutType || 'scheduled'}
                  </p>
                  {transaction.stripeTransferId && (
                    <p className="text-xs text-muted-foreground">
                      Stripe: {transaction.stripeTransferId.slice(-12)}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">${transaction.amount?.toFixed(2)}</p>
                  <Badge className={getStatusColor(transaction.status)}>
                    {transaction.status || 'pending'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">No transactions found</p>
        )}
      </CardContent>
    </Card>
  )
}

// Performance Analytics Tab Component
const PerformanceAnalyticsTab = ({ performanceAnalytics, headers, API_BASE }) => {
  if (!performanceAnalytics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Loading performance analytics...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {performanceAnalytics.classPerformance?.totalClasses || 0}
              </p>
              <p className="text-sm text-muted-foreground">Total Classes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {performanceAnalytics.classPerformance?.averageAttendance?.toFixed(1) || '0.0'}
              </p>
              <p className="text-sm text-muted-foreground">Avg Attendance</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {performanceAnalytics.classPerformance?.studentSatisfaction?.toFixed(1) || '0.0'}
              </p>
              <p className="text-sm text-muted-foreground">Satisfaction Score</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Classes */}
      {performanceAnalytics.topPerformingClasses?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performanceAnalytics.topPerformingClasses.map((classItem, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{classItem.className}</p>
                    <p className="text-sm text-muted-foreground">
                      {classItem.totalSessions} sessions • 
                      {classItem.averageAttendance?.toFixed(1)} avg attendance
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${classItem.totalRevenue?.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {performanceAnalytics.recommendations?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {performanceAnalytics.recommendations.map((rec, index) => (
                <div key={index} className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                  <p className="font-medium text-blue-900">{rec.title}</p>
                  <p className="text-sm text-blue-700">{rec.description}</p>
                  {rec.impact && (
                    <p className="text-xs text-blue-600 mt-1">
                      Potential impact: {rec.impact}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Tax Documents Tab Component
const TaxDocumentsTab = ({ taxDocuments, headers, API_BASE }) => {
  const [documents, setDocuments] = useState(taxDocuments)
  const [year, setYear] = useState('2024')
  const [loading, setLoading] = useState(false)

  const fetchTaxDocuments = async (selectedYear) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/instructor/tax-documents?year=${selectedYear}`, { headers })
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
      }
    } catch (err) {
      console.error('Error fetching tax documents:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleYearChange = (newYear) => {
    setYear(newYear)
    fetchTaxDocuments(newYear)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Tax Documents
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant={year === '2024' ? 'default' : 'outline'}
              onClick={() => handleYearChange('2024')}
            >
              2024
            </Button>
            <Button 
              size="sm" 
              variant={year === '2023' ? 'default' : 'outline'}
              onClick={() => handleYearChange('2023')}
            >
              2023
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading tax documents...</p>
          </div>
        ) : documents.length > 0 ? (
          <div className="space-y-4">
            {documents.map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{doc.documentType || '1099 Form'}</p>
                  <p className="text-sm text-muted-foreground">
                    Tax Year: {doc.taxYear} • 
                    Total Earnings: ${doc.totalEarnings?.toFixed(2)}
                  </p>
                  {doc.quarterlyBreakdown && (
                    <p className="text-xs text-muted-foreground">
                      Q1: ${doc.quarterlyBreakdown.q1?.toFixed(2)} • 
                      Q2: ${doc.quarterlyBreakdown.q2?.toFixed(2)} • 
                      Q3: ${doc.quarterlyBreakdown.q3?.toFixed(2)} • 
                      Q4: ${doc.quarterlyBreakdown.q4?.toFixed(2)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    View
                  </Button>
                  <Button size="sm">
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No tax documents available for {year}</p>
            <p className="text-sm text-muted-foreground">Documents will be generated at year end</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Payout Request Tab Component
const PayoutRequestTab = ({ dashboardData, processPayout }) => {
  const [amount, setAmount] = useState('')
  const [payoutType, setPayoutType] = useState('scheduled')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const availableBalance = dashboardData?.earnings?.currentMonthEarnings || 0
  const minimumPayout = 25.00

  const handlePayoutRequest = async () => {
    setError(null)
    setResult(null)
    
    const payoutAmount = parseFloat(amount)
    
    if (!payoutAmount || payoutAmount < minimumPayout) {
      setError(`Minimum payout amount is $${minimumPayout.toFixed(2)}`)
      return
    }
    
    if (payoutAmount > availableBalance) {
      setError('Payout amount exceeds available balance')
      return
    }

    setProcessing(true)
    try {
      const payoutResult = await processPayout(payoutAmount, payoutType)
      setResult(payoutResult)
      setAmount('')
    } catch (err) {
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Request Payout</CardTitle>
          <CardDescription>
            Request a payout from your available earnings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Available Balance */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Available Balance</p>
                <p className="text-2xl font-bold text-green-900">
                  ${availableBalance.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-green-700">
                  Minimum payout: ${minimumPayout.toFixed(2)}
                </p>
                <p className="text-sm text-green-700">
                  Schedule: {dashboardData?.profile?.payoutSchedule || 'Weekly'}
                </p>
              </div>
            </div>
          </div>

          {/* Payout Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Payout Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min={minimumPayout}
                  max={availableBalance}
                  step="0.01"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Payout Type</label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={payoutType === 'scheduled' ? 'default' : 'outline'}
                  onClick={() => setPayoutType('scheduled')}
                  className="w-full"
                >
                  Scheduled (Free)
                </Button>
                <Button
                  type="button"
                  variant={payoutType === 'instant' ? 'default' : 'outline'}
                  onClick={() => setPayoutType('instant')}
                  className="w-full"
                >
                  Instant (1% fee)
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {payoutType === 'scheduled' 
                  ? 'Funds will be transferred on your next payout date (typically within 2-7 business days)'
                  : 'Funds will be transferred instantly for a 1% fee (typically within 30 minutes)'
                }
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {result && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">Payout Request Successful!</p>
                <p className="text-green-700 text-sm">
                  Payout ID: {result.payoutId}
                </p>
                {result.stripeTransferId && (
                  <p className="text-green-700 text-sm">
                    Transfer ID: {result.stripeTransferId}
                  </p>
                )}
              </div>
            )}

            <Button 
              onClick={handlePayoutRequest}
              disabled={processing || !amount || parseFloat(amount) < minimumPayout}
              className="w-full"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                `Request ${payoutType === 'instant' ? 'Instant' : 'Scheduled'} Payout`
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payout Information */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Commission Rate:</span>
              <span className="font-medium">
                {dashboardData?.profile?.commissionRate ? 
                  `${(dashboardData.profile.commissionRate * 100).toFixed(0)}%` : '70%'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payout Schedule:</span>
              <span className="font-medium">
                {dashboardData?.profile?.payoutSchedule || 'Weekly'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Minimum Payout:</span>
              <span className="font-medium">${minimumPayout.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Instant Payout Fee:</span>
              <span className="font-medium">1% of payout amount</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default InstructorPayoutDashboard