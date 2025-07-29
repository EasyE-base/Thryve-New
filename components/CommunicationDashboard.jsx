'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/components/auth-provider'
import { 
  MessageSquare, Send, Users, Megaphone, Clock, Eye,
  BarChart3, TrendingUp, Calendar, Settings, Filter,
  Bell, Mail, Smartphone, MessageCircle, CheckCircle,
  AlertCircle, Search, Download, Plus, Edit, Trash2,
  MoreVertical, Star, Heart, Zap, Target, Award
} from 'lucide-react'
import { toast } from 'sonner'
import { format, isToday, subDays, startOfWeek, endOfWeek } from 'date-fns'

const CommunicationDashboard = () => {
  const { user, role } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [communicationStats, setCommunicationStats] = useState({})
  const [broadcasts, setBroadcasts] = useState([])
  const [autoResponders, setAutoResponders] = useState([])
  const [messageTemplates, setMessageTemplates] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [newBroadcast, setNewBroadcast] = useState({
    title: '',
    message: '',
    audience: 'all', // all, active_members, new_members, instructors
    scheduleFor: null,
    channels: ['in_app'] // in_app, email, sms
  })

  useEffect(() => {
    if (user && role === 'merchant') {
      fetchCommunicationData()
    }
  }, [user, role])

  const fetchCommunicationData = async () => {
    try {
      setIsLoading(true)
      const token = await user.getIdToken()
      
      // Fetch communication statistics
      const statsResponse = await fetch('/server-api/communication/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setCommunicationStats(statsData.stats || {})
      }

      // Fetch broadcasts
      const broadcastsResponse = await fetch('/server-api/communication/broadcasts', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (broadcastsResponse.ok) {
        const broadcastsData = await broadcastsResponse.json()
        setBroadcasts(broadcastsData.broadcasts || [])
      }

      // Fetch auto-responders
      const autoRespondersResponse = await fetch('/server-api/communication/auto-responders', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (autoRespondersResponse.ok) {
        const autoRespondersData = await autoRespondersResponse.json()
        setAutoResponders(autoRespondersData.autoResponders || [])
      }

      // Fetch message templates
      const templatesResponse = await fetch('/server-api/communication/templates', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json()
        setMessageTemplates(templatesData.templates || [])
      }

    } catch (error) {
      console.error('Error fetching communication data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const sendBroadcast = async () => {
    if (!newBroadcast.title || !newBroadcast.message) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const token = await user.getIdToken()
      const response = await fetch('/server-api/communication/broadcasts/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newBroadcast)
      })

      if (response.ok) {
        toast.success('Broadcast sent successfully!')
        setNewBroadcast({
          title: '',
          message: '',
          audience: 'all',
          scheduleFor: null,
          channels: ['in_app']
        })
        fetchCommunicationData()
      } else {
        throw new Error('Failed to send broadcast')
      }
    } catch (error) {
      console.error('Error sending broadcast:', error)
      toast.error('Failed to send broadcast')
    }
  }

  const createAutoResponder = async (trigger, response, isActive = true) => {
    try {
      const token = await user.getIdToken()
      const autoResponder = {
        trigger,
        response,
        isActive,
        createdAt: new Date().toISOString()
      }

      const response_api = await fetch('/server-api/communication/auto-responders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(autoResponder)
      })

      if (response_api.ok) {
        toast.success('Auto-responder created!')
        fetchCommunicationData()
      }
    } catch (error) {
      console.error('Error creating auto-responder:', error)
      toast.error('Failed to create auto-responder')
    }
  }

  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'sms':
        return <Smartphone className="h-4 w-4" />
      case 'in_app':
        return <MessageCircle className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getAudienceIcon = (audience) => {
    switch (audience) {
      case 'all':
        return <Users className="h-4 w-4 text-blue-600" />
      case 'active_members':
        return <Star className="h-4 w-4 text-green-600" />
      case 'new_members':
        return <Zap className="h-4 w-4 text-purple-600" />
      case 'instructors':
        return <Award className="h-4 w-4 text-orange-600" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  if (role !== 'merchant') {
    return (
      <div className="text-center py-12">
        <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">Access Restricted</h3>
        <p className="text-gray-500">This feature is only available to studio owners.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1C1C1E] mb-2">Communication Hub</h1>
          <p className="text-[#7A7A7A] text-lg">Manage your studio's communication and engagement</p>
        </div>
        
        <div className="flex space-x-3">
          <Button variant="outline" className="border-[#EADBC8] text-[#7A7A7A]">
            <Download className="h-4 w-4 mr-2" />
            Export Reports
          </Button>
          <Button className="bg-[#1E90FF] hover:bg-[#1976D2] text-white">
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'broadcasts', label: 'Broadcasts', icon: Megaphone },
            { id: 'auto-responders', label: 'Auto-Responders', icon: Zap },
            { id: 'templates', label: 'Templates', icon: MessageSquare },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#1E90FF] text-[#1E90FF]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content Area */}
      <div>
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#7A7A7A] font-medium">Messages Sent</p>
                      <p className="text-3xl font-bold text-[#1C1C1E] mt-2">
                        {communicationStats.messagesSent || '0'}
                      </p>
                      <p className="text-sm text-green-600 mt-1">+12% vs last month</p>
                    </div>
                    <MessageSquare className="h-8 w-8 text-[#1E90FF]" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#7A7A7A] font-medium">Open Rate</p>
                      <p className="text-3xl font-bold text-[#1C1C1E] mt-2">
                        {communicationStats.openRate || '0%'}
                      </p>
                      <p className="text-sm text-green-600 mt-1">+5% vs last month</p>
                    </div>
                    <Eye className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#7A7A7A] font-medium">Response Rate</p>
                      <p className="text-3xl font-bold text-[#1C1C1E] mt-2">
                        {communicationStats.responseRate || '0%'}
                      </p>
                      <p className="text-sm text-red-500 mt-1">-2% vs last month</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#7A7A7A] font-medium">Active Campaigns</p>
                      <p className="text-3xl font-bold text-[#1C1C1E] mt-2">
                        {broadcasts.filter(b => b.status === 'active').length}
                      </p>
                      <p className="text-sm text-[#7A7A7A] mt-1">Running now</p>
                    </div>
                    <Megaphone className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-[#1C1C1E]">Recent Communication Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {broadcasts.slice(0, 5).map((broadcast) => (
                    <div key={broadcast.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-[#1E90FF]/10 rounded-lg flex items-center justify-center">
                          <Megaphone className="h-5 w-5 text-[#1E90FF]" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#1C1C1E]">{broadcast.title}</h4>
                          <p className="text-sm text-[#7A7A7A]">
                            Sent to {broadcast.audienceSize || 0} members • {broadcast.openRate || '0%'} opened
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={`${
                          broadcast.status === 'sent' ? 'bg-green-100 text-green-700' :
                          broadcast.status === 'scheduled' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {broadcast.status}
                        </Badge>
                        <p className="text-xs text-[#7A7A7A] mt-1">
                          {format(new Date(broadcast.createdAt), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Broadcasts Tab */}
        {activeTab === 'broadcasts' && (
          <div className="space-y-8">
            
            {/* Create New Broadcast */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-[#1C1C1E]">Send New Broadcast</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#1C1C1E] mb-2">Campaign Title</label>
                    <input
                      type="text"
                      value={newBroadcast.title}
                      onChange={(e) => setNewBroadcast({...newBroadcast, title: e.target.value})}
                      placeholder="e.g., New Class Schedule Update"
                      className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF]"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#1C1C1E] mb-2">Audience</label>
                    <select
                      value={newBroadcast.audience}
                      onChange={(e) => setNewBroadcast({...newBroadcast, audience: e.target.value})}
                      className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF]"
                    >
                      <option value="all">All Members</option>
                      <option value="active_members">Active Members</option>
                      <option value="new_members">New Members</option>
                      <option value="instructors">Instructors</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1C1C1E] mb-2">Message</label>
                  <textarea
                    value={newBroadcast.message}
                    onChange={(e) => setNewBroadcast({...newBroadcast, message: e.target.value})}
                    placeholder="Write your message here..."
                    rows={4}
                    className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1C1C1E] mb-2">Delivery Channels</label>
                  <div className="flex space-x-4">
                    {['in_app', 'email', 'sms'].map((channel) => (
                      <button
                        key={channel}
                        onClick={() => {
                          const newChannels = newBroadcast.channels.includes(channel)
                            ? newBroadcast.channels.filter(c => c !== channel)
                            : [...newBroadcast.channels, channel]
                          setNewBroadcast({...newBroadcast, channels: newChannels})
                        }}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                          newBroadcast.channels.includes(channel)
                            ? 'border-[#1E90FF] bg-blue-50 text-[#1E90FF]'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {getChannelIcon(channel)}
                        <span className="capitalize">{channel.replace('_', ' ')}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button
                    onClick={sendBroadcast}
                    className="bg-[#1E90FF] hover:bg-[#1976D2] text-white"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Now
                  </Button>
                  <Button variant="outline">
                    <Clock className="h-4 w-4 mr-2" />
                    Schedule for Later
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Previous Broadcasts */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-[#1C1C1E]">Previous Broadcasts</CardTitle>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {broadcasts.map((broadcast) => (
                    <div key={broadcast.id} className="p-6 border rounded-xl hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            {getAudienceIcon(broadcast.audience)}
                            <h3 className="font-semibold text-lg text-[#1C1C1E]">{broadcast.title}</h3>
                            <Badge className={`${
                              broadcast.status === 'sent' ? 'bg-green-100 text-green-700' :
                              broadcast.status === 'scheduled' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {broadcast.status}
                            </Badge>
                          </div>
                          
                          <p className="text-[#7A7A7A] mb-3">{broadcast.message.substring(0, 100)}...</p>
                          
                          <div className="flex items-center space-x-6 text-sm text-[#7A7A7A]">
                            <span>Audience: {broadcast.audienceSize || 0} members</span>
                            <span>Opened: {broadcast.openRate || '0%'}</span>
                            <span>Clicked: {broadcast.clickRate || '0%'}</span>
                            <span>{format(new Date(broadcast.createdAt), 'MMM d, yyyy')}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2 mt-3">
                            {broadcast.channels?.map((channel) => (
                              <div key={channel} className="flex items-center space-x-1 text-xs text-[#7A7A7A]">
                                {getChannelIcon(channel)}
                                <span className="capitalize">{channel.replace('_', ' ')}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Auto-Responders Tab */}
        {activeTab === 'auto-responders' && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-[#1C1C1E]">Auto-Responders</CardTitle>
              <p className="text-[#7A7A7A]">Automated responses for common scenarios</p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Zap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Auto-Responders Coming Soon</h3>
                <p className="text-gray-500">Set up automated responses for booking confirmations, reminders, and more.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-[#1C1C1E]">Message Templates</CardTitle>
              <p className="text-[#7A7A7A]">Pre-written messages for faster communication</p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Message Templates Coming Soon</h3>
                <p className="text-gray-500">Create reusable templates for common communications.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-[#1C1C1E]">Communication Analytics</CardTitle>
              <p className="text-[#7A7A7A]">Detailed insights into your communication performance</p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Advanced Analytics Coming Soon</h3>
                <p className="text-gray-500">Track engagement, response rates, and communication effectiveness.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default CommunicationDashboard