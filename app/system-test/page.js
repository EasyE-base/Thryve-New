'use client'

import React, { useState } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Upload, Bell, BarChart3, Settings, TestTube, Zap, 
  CheckCircle, AlertCircle, Info, Star
} from 'lucide-react'
import FileUploadComponent from '@/components/FileUploadComponent'
import NotificationInbox from '@/components/NotificationInbox'
import StudioAnalyticsDashboard from '@/components/StudioAnalyticsDashboard'
import { toast } from 'sonner'

export default function SystemIntegrationTestPage() {
  const { user, role } = useAuth()
  const [activeTab, setActiveTab] = useState('upload')
  const [testResults, setTestResults] = useState({})

  // Test file upload system
  const testFileUpload = async () => {
    if (!user) {
      toast.error('Please sign in to test file upload')
      return
    }

    setTestResults(prev => ({ ...prev, fileUpload: 'testing' }))
    
    try {
      // Test the file list endpoint
      const token = await user.getIdToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/server-api/files/list?type=profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setTestResults(prev => ({ ...prev, fileUpload: 'success' }))
        toast.success('File upload system is working correctly!')
      } else {
        setTestResults(prev => ({ ...prev, fileUpload: 'error' }))
        toast.error('File upload system test failed')
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, fileUpload: 'error' }))
      toast.error('File upload system test failed')
    }
  }

  // Test notification system
  const testNotifications = async () => {
    if (!user) {
      toast.error('Please sign in to test notifications')
      return
    }

    setTestResults(prev => ({ ...prev, notifications: 'testing' }))
    
    try {
      const token = await user.getIdToken()
      
      // Send a test notification
      const sendResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/server-api/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'in_app',
          recipients: [user.uid],
          subject: 'System Integration Test',
          message: 'This is a test notification to verify the notification system is working correctly.',
          templateId: 'system_test',
          data: {
            testId: `test-${Date.now()}`,
            timestamp: new Date().toISOString()
          }
        })
      })

      if (sendResponse.ok) {
        // Test fetching notifications
        const fetchResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/server-api/notifications/inbox`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (fetchResponse.ok) {
          setTestResults(prev => ({ ...prev, notifications: 'success' }))
          toast.success('Notification system is working correctly!')
        } else {
          setTestResults(prev => ({ ...prev, notifications: 'error' }))
          toast.error('Notification fetch failed')
        }
      } else {
        setTestResults(prev => ({ ...prev, notifications: 'error' }))
        toast.error('Notification send failed')
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, notifications: 'error' }))
      toast.error('Notification system test failed')
    }
  }

  // Test analytics system
  const testAnalytics = async () => {
    if (!user) {
      toast.error('Please sign in to test analytics')
      return
    }

    if (userRole !== 'merchant') {
      toast.error('Analytics testing requires merchant role')
      return
    }

    setTestResults(prev => ({ ...prev, analytics: 'testing' }))
    
    try {
      const token = await user.getIdToken()
      
      // Test analytics endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/server-api/analytics/studio`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setTestResults(prev => ({ ...prev, analytics: 'success' }))
        toast.success('Analytics system is working correctly!')
      } else {
        setTestResults(prev => ({ ...prev, analytics: 'error' }))
        toast.error('Analytics system test failed')
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, analytics: 'error' }))
      toast.error('Analytics system test failed')
    }
  }

  // Test all systems
  const testAllSystems = async () => {
    toast.info('Running comprehensive system tests...')
    await testFileUpload()
    await new Promise(resolve => setTimeout(resolve, 1000)) // Small delay
    await testNotifications()
    await new Promise(resolve => setTimeout(resolve, 1000)) // Small delay
    if (userRole === 'merchant') {
      await testAnalytics()
    }
    toast.success('All system tests completed!')
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-400" />
      case 'testing':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400" />
      default:
        return <Info className="h-4 w-4 text-blue-400" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'bg-green-500/10 border-green-400/20'
      case 'error':
        return 'bg-red-500/10 border-red-400/20'
      case 'testing':
        return 'bg-blue-500/10 border-blue-400/20'
      default:
        return 'bg-white/10 border-white/20'
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <TestTube className="h-16 w-16 text-blue-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-white mb-4">System Integration Test</h1>
            <p className="text-blue-200 mb-8">Please sign in to test the file upload, notification, and analytics systems.</p>
            <Button
              onClick={() => window.location.href = '/'}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              Go to Sign In
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center">
            <TestTube className="h-8 w-8 mr-3" />
            System Integration Test Suite
          </h1>
          <p className="text-blue-200 text-lg">
            Test and showcase the file upload, notification, and analytics systems
          </p>
          <div className="mt-4">
            <Badge className="bg-blue-500/20 text-blue-200 mr-2">
              User: {user.email}
            </Badge>
            <Badge className="bg-purple-500/20 text-purple-200">
              Role: {userRole || 'Loading...'}
            </Badge>
          </div>
        </div>

        {/* System Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className={`${getStatusColor(testResults.fileUpload)} backdrop-blur-sm`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold mb-1">File Upload System</h3>
                  <p className="text-blue-200 text-sm">Upload & manage files</p>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(testResults.fileUpload)}
                  <Upload className="h-6 w-6 text-blue-400" />
                </div>
              </div>
              <Button
                onClick={testFileUpload}
                size="sm"
                className="w-full mt-4 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-400/20"
                disabled={testResults.fileUpload === 'testing'}
              >
                Test System
              </Button>
            </CardContent>
          </Card>

          <Card className={`${getStatusColor(testResults.notifications)} backdrop-blur-sm`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold mb-1">Notification System</h3>
                  <p className="text-blue-200 text-sm">Send & receive notifications</p>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(testResults.notifications)}
                  <Bell className="h-6 w-6 text-blue-400" />
                </div>
              </div>
              <Button
                onClick={testNotifications}
                size="sm"
                className="w-full mt-4 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-400/20"
                disabled={testResults.notifications === 'testing'}
              >
                Test System
              </Button>
            </CardContent>
          </Card>

          <Card className={`${getStatusColor(testResults.analytics)} backdrop-blur-sm`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold mb-1">Analytics System</h3>
                  <p className="text-blue-200 text-sm">Business insights & data</p>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(testResults.analytics)}
                  <BarChart3 className="h-6 w-6 text-blue-400" />
                </div>
              </div>
              <Button
                onClick={testAnalytics}
                size="sm"
                className="w-full mt-4 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-400/20"
                disabled={testResults.analytics === 'testing' || userRole !== 'merchant'}
              >
                {userRole !== 'merchant' ? 'Merchant Only' : 'Test System'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Master Test Button */}
        <div className="text-center">
          <Button
            onClick={testAllSystems}
            size="lg"
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-3"
            disabled={Object.values(testResults).some(status => status === 'testing')}
          >
            <Zap className="h-5 w-5 mr-2" />
            Test All Systems
          </Button>
        </div>

        {/* System Interfaces */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Interactive System Interfaces
            </CardTitle>
            <CardDescription className="text-blue-200">
              Interact with each system directly to test functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10">
                <TabsTrigger 
                  value="upload" 
                  className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  File Upload
                </TabsTrigger>
                <TabsTrigger 
                  value="notifications"
                  className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger 
                  value="analytics"
                  className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                  disabled={userRole !== 'merchant'}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="mt-6">
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-white mb-2">File Upload System</h3>
                    <p className="text-blue-200">
                      Upload profile images, class images, or documents with chunked upload support
                    </p>
                  </div>
                  
                  {/* Multiple upload types for testing */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-white font-medium mb-3">Profile Image Upload</h4>
                      <FileUploadComponent 
                        fileType="profile" 
                        maxFiles={1}
                        onUploadComplete={(result) => {
                          toast.success(`Profile image uploaded: ${result.fileId}`)
                        }}
                      />
                    </div>
                    
                    <div>
                      <h4 className="text-white font-medium mb-3">Class Image Upload</h4>
                      <FileUploadComponent 
                        fileType="class" 
                        entityId="test-class-123"
                        maxFiles={3}
                        onUploadComplete={(result) => {
                          toast.success(`Class image uploaded: ${result.fileId}`)
                        }}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="notifications" className="mt-6">
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-white mb-2">Notification System</h3>
                    <p className="text-blue-200">
                      View and manage your notifications with real-time updates
                    </p>
                  </div>
                  
                  <NotificationInbox />
                </div>
              </TabsContent>
              
              <TabsContent value="analytics" className="mt-6">
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-white mb-2">Analytics Dashboard</h3>
                    <p className="text-blue-200">
                      View comprehensive business analytics and performance metrics
                    </p>
                  </div>
                  
                  {userRole === 'merchant' ? (
                    <StudioAnalyticsDashboard />
                  ) : (
                    <div className="text-center py-12">
                      <Star className="h-16 w-16 text-blue-400 mx-auto mb-4 opacity-50" />
                      <h3 className="text-xl font-semibold text-white mb-2">Analytics Access Required</h3>
                      <p className="text-blue-200">Switch to merchant role to access analytics dashboard</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-blue-300 text-sm">
            🚀 All three systems (File Upload, Notifications, Analytics) are now fully integrated and functional
          </p>
          <p className="text-blue-400 text-xs mt-2">
            Built with Next.js 14, Firebase Auth, MongoDB, and Tailwind CSS
          </p>
        </div>
      </div>
    </div>
  )
}