'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Bell, Check, Clock, AlertTriangle, Info, Star, 
  Calendar, DollarSign, Users, X, CheckCircle, AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

export default function NotificationInbox() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [filter, setFilter] = useState('all') // 'all', 'unread', 'read'

  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const token = await user.getIdToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/server-api/notifications/inbox`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      } else {
        console.error('Failed to fetch notifications')
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      const token = await user.getIdToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/server-api/notifications/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notificationId })
      })

      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, readAt: new Date().toISOString(), status: 'read' }
              : notification
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
        toast.success('Notification marked as read')
      } else {
        toast.error('Failed to mark notification as read')
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast.error('Failed to mark notification as read')
    }
  }

  const getNotificationIcon = (templateId, type) => {
    switch (templateId) {
      case 'booking_confirmed':
        return <CheckCircle className="h-5 w-5 text-green-400" />
      case 'class_cancelled':
        return <X className="h-5 w-5 text-red-400" />
      case 'no_show_penalty':
        return <AlertTriangle className="h-5 w-5 text-orange-400" />
      case 'low_credits':
        return <AlertCircle className="h-5 w-5 text-yellow-400" />
      case 'xpass_purchase':
        return <Star className="h-5 w-5 text-purple-400" />
      case 'payment_processed':
        return <DollarSign className="h-5 w-5 text-green-400" />
      case 'class_reminder':
        return <Clock className="h-5 w-5 text-blue-400" />
      default:
        return <Bell className="h-5 w-5 text-blue-400" />
    }
  }

  const getNotificationColor = (templateId) => {
    switch (templateId) {
      case 'booking_confirmed':
        return 'bg-green-500/10 border-green-400/20'
      case 'class_cancelled':
        return 'bg-red-500/10 border-red-400/20'
      case 'no_show_penalty':
        return 'bg-orange-500/10 border-orange-400/20'
      case 'low_credits':
        return 'bg-yellow-500/10 border-yellow-400/20'
      case 'xpass_purchase':
        return 'bg-purple-500/10 border-purple-400/20'
      case 'payment_processed':
        return 'bg-green-500/10 border-green-400/20'
      case 'class_reminder':
        return 'bg-blue-500/10 border-blue-400/20'
      default:
        return 'bg-white/10 border-white/20'
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.readAt
    if (filter === 'read') return notification.readAt
    return true
  })

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/10 rounded w-1/3"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-white/10 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Notifications</h2>
          <p className="text-blue-200">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <Button
          onClick={fetchNotifications}
          variant="outline"
          size="sm"
          className="border-white/20 text-white hover:bg-white/10"
        >
          Refresh
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-white/5 p-1 rounded-lg border border-white/10">
        {[
          { id: 'all', label: 'All', count: notifications.length },
          { id: 'unread', label: 'Unread', count: unreadCount },
          { id: 'read', label: 'Read', count: notifications.length - unreadCount }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === tab.id
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

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="h-16 w-16 text-blue-400 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {filter === 'unread' ? 'No unread notifications' : 
             filter === 'read' ? 'No read notifications' : 'No notifications'}
          </h3>
          <p className="text-blue-200">
            {filter === 'all' 
              ? 'Notifications about your bookings, payments, and account will appear here.'
              : 'Check back later for updates.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`${getNotificationColor(notification.templateId)} backdrop-blur-sm transition-all duration-200 hover:bg-white/15 ${
                !notification.readAt ? 'ring-2 ring-blue-400/30' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.templateId, notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-medium text-sm">
                        {notification.subject}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {!notification.readAt && (
                          <Badge className="bg-blue-500/20 text-blue-200 text-xs">
                            New
                          </Badge>
                        )}
                        <span className="text-blue-300 text-xs">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-blue-200 text-sm mb-3">
                      {notification.message}
                    </p>
                    
                    {/* Template-specific content */}
                    {notification.templateData && (
                      <div className="bg-white/5 rounded-lg p-3 mb-3">
                        {notification.templateId === 'booking_confirmed' && (
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-3 w-3 text-blue-400" />
                              <span className="text-blue-200">
                                {notification.templateData.date} at {notification.templateData.time}
                              </span>
                            </div>
                            {notification.templateData.location && (
                              <div className="flex items-center space-x-2">
                                <Users className="h-3 w-3 text-blue-400" />
                                <span className="text-blue-200">
                                  {notification.templateData.location}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {notification.templateId === 'no_show_penalty' && (
                          <div className="space-y-1 text-xs">
                            {notification.templateData.creditDeducted && (
                              <div className="text-orange-200">
                                🎟️ 1 credit deducted from your pack
                              </div>
                            )}
                            <div className="text-orange-200">
                              💰 ${notification.templateData.feeAmount} penalty fee applied
                            </div>
                          </div>
                        )}
                        
                        {notification.templateId === 'low_credits' && (
                          <div className="text-yellow-200 text-xs">
                            ⚠️ Only {notification.templateData.creditsRemaining} credit{notification.templateData.creditsRemaining === 1 ? '' : 's'} remaining
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            notification.type === 'email' ? 'border-green-400/30 text-green-300' :
                            notification.type === 'sms' ? 'border-blue-400/30 text-blue-300' :
                            'border-purple-400/30 text-purple-300'
                          }`}
                        >
                          {notification.type === 'in_app' ? 'In-App' : notification.type.toUpperCase()}
                        </Badge>
                        
                        {notification.status && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              notification.status === 'delivered' ? 'border-green-400/30 text-green-300' :
                              notification.status === 'read' ? 'border-blue-400/30 text-blue-300' :
                              'border-yellow-400/30 text-yellow-300'
                            }`}
                          >
                            {notification.status}
                          </Badge>
                        )}
                      </div>
                      
                      {!notification.readAt && (
                        <Button
                          onClick={() => markAsRead(notification.id)}
                          size="sm"
                          variant="outline"
                          className="border-white/20 text-white hover:bg-white/10 text-xs"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Mark Read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Auto-refresh info */}
      <div className="text-center">
        <p className="text-blue-300 text-sm">
          💡 Notifications are updated in real-time. New alerts will appear automatically.
        </p>
      </div>
    </div>
  )
}