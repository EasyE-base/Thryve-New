'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/components/auth-provider'
import { 
  Bell, BellOff, Check, X, Calendar, MessageCircle, 
  CreditCard, UserPlus, AlertCircle, CheckCircle, 
  Info, Heart, Star, Gift, Zap, Settings, Trash2,
  MoreVertical, Filter, Search, Mail, MessageSquare,
  Smartphone, Eye, EyeOff, Volume2, VolumeX
} from 'lucide-react'
import { toast } from 'sonner'
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns'

const NotificationSystem = ({ isOpen, onClose }) => {
  const { user, role } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [filter, setFilter] = useState('all') // all, unread, booking, payment, social
  const [isLoading, setIsLoading] = useState(false)
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    sms: false,
    push: true,
    inApp: true,
    bookingConfirmations: true,
    classReminders: true,
    paymentAlerts: true,
    promotions: false,
    socialUpdates: true
  })

  useEffect(() => {
    if (isOpen && user) {
      fetchNotifications()
      fetchNotificationSettings()
      // Set up real-time notification listening
      const interval = setInterval(fetchNotifications, 10000)
      return () => clearInterval(interval)
    }
  }, [isOpen, user])

  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      const token = await user.getIdToken()
      const response = await fetch('/server-api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchNotificationSettings = async () => {
    try {
      const token = await user.getIdToken()
      const response = await fetch('/server-api/notifications/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setNotificationSettings({ ...notificationSettings, ...data.settings })
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      const token = await user.getIdToken()
      await fetch(`/server-api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const token = await user.getIdToken()
      await fetch('/server-api/notifications/mark-all-read', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })))
      setUnreadCount(0)
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('Failed to update notifications')
    }
  }

  const deleteNotification = async (notificationId) => {
    try {
      const token = await user.getIdToken()
      await fetch(`/server-api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
      toast.success('Notification deleted')
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Failed to delete notification')
    }
  }

  const updateNotificationSettings = async (newSettings) => {
    try {
      const token = await user.getIdToken()
      await fetch('/server-api/notifications/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings: newSettings })
      })
      
      setNotificationSettings(newSettings)
      toast.success('Notification settings updated')
    } catch (error) {
      console.error('Error updating settings:', error)
      toast.error('Failed to update settings')
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking_confirmation':
      case 'booking_cancelled':
      case 'booking_reminder':
        return <Calendar className="h-5 w-5 text-blue-600" />
      case 'payment_success':
      case 'payment_failed':
        return <CreditCard className="h-5 w-5 text-green-600" />
      case 'waitlist_promotion':
        return <UserPlus className="h-5 w-5 text-purple-600" />
      case 'class_update':
      case 'class_cancelled':
        return <AlertCircle className="h-5 w-5 text-orange-600" />
      case 'message':
        return <MessageCircle className="h-5 w-5 text-indigo-600" />
      case 'promotion':
      case 'special_offer':
        return <Gift className="h-5 w-5 text-pink-600" />
      case 'achievement':
        return <Star className="h-5 w-5 text-yellow-600" />
      default:
        return <Bell className="h-5 w-5 text-gray-600" />
    }
  }

  const getNotificationStyle = (type, read) => {
    const baseStyle = `p-4 border-l-4 transition-colors ${read ? 'opacity-75' : ''}`
    
    switch (type) {
      case 'booking_confirmation':
      case 'booking_reminder':
        return `${baseStyle} border-blue-500 bg-blue-50`
      case 'payment_success':
        return `${baseStyle} border-green-500 bg-green-50`
      case 'payment_failed':
        return `${baseStyle} border-red-500 bg-red-50`
      case 'waitlist_promotion':
        return `${baseStyle} border-purple-500 bg-purple-50`
      case 'class_update':
      case 'class_cancelled':
        return `${baseStyle} border-orange-500 bg-orange-50`
      case 'message':
        return `${baseStyle} border-indigo-500 bg-indigo-50`
      case 'promotion':
        return `${baseStyle} border-pink-500 bg-pink-50`
      case 'achievement':
        return `${baseStyle} border-yellow-500 bg-yellow-50`
      default:
        return `${baseStyle} border-gray-500 bg-gray-50`
    }
  }

  const formatNotificationTime = (timestamp) => {
    const date = new Date(timestamp)
    if (isToday(date)) {
      return format(date, 'h:mm a')
    } else if (isYesterday(date)) {
      return 'Yesterday'
    } else {
      return format(date, 'MMM d')
    }
  }

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true
    if (filter === 'unread') return !notif.read
    if (filter === 'booking') return ['booking_confirmation', 'booking_cancelled', 'booking_reminder', 'waitlist_promotion'].includes(notif.type)
    if (filter === 'payment') return ['payment_success', 'payment_failed'].includes(notif.type)
    if (filter === 'social') return ['message', 'achievement', 'promotion'].includes(notif.type)
    return true
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-[#1E90FF] to-[#4A90E2] text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">Notifications</h2>
                <p className="opacity-90">
                  {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-white hover:bg-white/10"
              >
                <Check className="h-4 w-4 mr-2" />
                Mark All Read
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                {['all', 'unread', 'booking', 'payment', 'social'].map((filterType) => (
                  <Button
                    key={filterType}
                    variant={filter === filterType ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(filterType)}
                    className={filter === filterType ? 'bg-[#1E90FF] text-white' : ''}
                  >
                    {filterType === 'all' && 'All'}
                    {filterType === 'unread' && 'Unread'}
                    {filterType === 'booking' && 'Bookings'}
                    {filterType === 'payment' && 'Payments'}
                    {filterType === 'social' && 'Social'}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Notification List */}
        <div className="max-h-[60vh] overflow-y-auto">
          {filteredNotifications.length > 0 ? (
            <div className="divide-y">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`${getNotificationStyle(notification.type, notification.read)} hover:bg-opacity-75 cursor-pointer group`}
                  onClick={() => {
                    if (!notification.read) {
                      markAsRead(notification.id)
                    }
                  }}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className={`text-lg font-semibold ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                            {notification.title}
                          </h3>
                          <p className={`text-sm mt-1 ${notification.read ? 'text-gray-600' : 'text-gray-700'}`}>
                            {notification.message}
                          </p>
                          
                          {/* Additional data display */}
                          {notification.data && (
                            <div className="mt-2 space-y-1">
                              {notification.data.className && (
                                <div className="flex items-center text-xs text-gray-600">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  <span>{notification.data.className}</span>
                                </div>
                              )}
                              {notification.data.amount && (
                                <div className="flex items-center text-xs text-gray-600">
                                  <CreditCard className="h-3 w-3 mr-1" />
                                  <span>${notification.data.amount}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <span className="text-xs text-gray-500">
                            {formatNotificationTime(notification.createdAt)}
                          </span>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-[#1E90FF] rounded-full"></div>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification(notification.id)
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Action buttons for specific notification types */}
                      {notification.type === 'booking_reminder' && (
                        <div className="mt-3 flex space-x-2">
                          <Button size="sm" className="bg-[#1E90FF] hover:bg-[#1976D2] text-white">
                            View Class
                          </Button>
                          <Button size="sm" variant="outline">
                            Cancel Booking
                          </Button>
                        </div>
                      )}
                      
                      {notification.type === 'waitlist_promotion' && (
                        <div className="mt-3 flex space-x-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Accept Booking
                          </Button>
                          <Button size="sm" variant="outline">
                            Decline
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </h3>
              <p className="text-gray-500">
                {filter === 'unread' 
                  ? 'All caught up! Check back later for updates.'
                  : 'When you have notifications, they\'ll appear here.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Notification Settings Preview */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Mail className={`h-4 w-4 ${notificationSettings.email ? 'text-green-600' : 'text-gray-400'}`} />
                <span>Email</span>
                
                <MessageSquare className={`h-4 w-4 ml-4 ${notificationSettings.sms ? 'text-green-600' : 'text-gray-400'}`} />
                <span>SMS</span>
                
                <Bell className={`h-4 w-4 ml-4 ${notificationSettings.push ? 'text-green-600' : 'text-gray-400'}`} />
                <span>Push</span>
              </div>
            </div>
            
            <Button size="sm" variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Manage Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotificationSystem