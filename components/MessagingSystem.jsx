'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/components/auth-provider'
import { 
  MessageCircle, Send, Phone, Video, MoreVertical, 
  Search, Bell, BellOff, Star, Archive, Trash2,
  Users, User, Calendar, MapPin, Clock, CheckCircle,
  AlertCircle, Info, Heart, Smile, Plus, Paperclip,
  Image, Mic, Settings, X, ChevronLeft, ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns'

const MessagingSystem = ({ isOpen, onClose, initialThread = null }) => {
  const { user, role } = useAuth()
  const [activeThread, setActiveThread] = useState(initialThread)
  const [messageThreads, setMessageThreads] = useState([])
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedParticipants, setSelectedParticipants] = useState([])
  const [showNewChat, setShowNewChat] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const [isTyping, setIsTyping] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const wsRef = useRef(null)

  // Initialize real-time connection
  useEffect(() => {
    if (isOpen && user) {
      initializeMessaging()
      setupWebSocketConnection()
      return () => {
        if (wsRef.current) {
          wsRef.current.close()
        }
      }
    }
  }, [isOpen, user])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const initializeMessaging = async () => {
    try {
      setIsLoading(true)
      await fetchMessageThreads()
      if (activeThread) {
        await fetchMessages(activeThread.id)
      }
    } catch (error) {
      console.error('Error initializing messaging:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const setupWebSocketConnection = () => {
    // In a real implementation, you'd use WebSocket or Socket.io
    // For now, we'll simulate real-time with polling
    const interval = setInterval(async () => {
      if (activeThread) {
        await fetchMessages(activeThread.id, true) // Silent refresh
      }
      await fetchMessageThreads(true) // Update thread list
    }, 3000)

    return () => clearInterval(interval)
  }

  const fetchMessageThreads = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true)
      const token = await user.getIdToken()
      const response = await fetch('/server-api/messages/threads', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setMessageThreads(data.threads || [])
        
        // Calculate unread count
        const totalUnread = data.threads?.reduce((sum, thread) => sum + (thread.unreadCount || 0), 0) || 0
        setUnreadCount(totalUnread)
      }
    } catch (error) {
      console.error('Error fetching threads:', error)
    } finally {
      if (!silent) setIsLoading(false)
    }
  }

  const fetchMessages = async (threadId, silent = false) => {
    try {
      if (!silent) setIsLoading(true)
      const token = await user.getIdToken()
      const response = await fetch(`/server-api/messages/threads/${threadId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
        
        // Mark messages as read
        await markMessagesAsRead(threadId)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      if (!silent) setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeThread) return

    const tempMessage = {
      id: Date.now(),
      content: newMessage.trim(),
      senderId: user.uid,
      senderName: user.displayName || 'You',
      timestamp: new Date(),
      isTemp: true
    }

    setMessages(prev => [...prev, tempMessage])
    setNewMessage('')

    try {
      const token = await user.getIdToken()
      const response = await fetch('/server-api/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          threadId: activeThread.id,
          content: tempMessage.content,
          type: 'text'
        })
      })

      if (response.ok) {
        // Remove temp message and fetch real messages
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
        await fetchMessages(activeThread.id, true)
        await fetchMessageThreads(true) // Update thread preview
      } else {
        throw new Error('Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
    }
  }

  const markMessagesAsRead = async (threadId) => {
    try {
      const token = await user.getIdToken()
      await fetch(`/server-api/messages/threads/${threadId}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const createNewThread = async (participantIds, message, threadType = 'direct') => {
    try {
      const token = await user.getIdToken()
      const response = await fetch('/server-api/messages/threads/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          participantIds,
          initialMessage: message,
          type: threadType
        })
      })

      if (response.ok) {
        const data = await response.json()
        setActiveThread(data.thread)
        setShowNewChat(false)
        await fetchMessageThreads()
        await fetchMessages(data.thread.id)
      }
    } catch (error) {
      console.error('Error creating thread:', error)
      toast.error('Failed to create conversation')
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp)
    if (isToday(date)) {
      return format(date, 'h:mm a')
    } else if (isYesterday(date)) {
      return 'Yesterday'
    } else {
      return format(date, 'MMM d')
    }
  }

  const getThreadPreview = (thread) => {
    if (thread.lastMessage) {
      return thread.lastMessage.content.substring(0, 50) + (thread.lastMessage.content.length > 50 ? '...' : '')
    }
    return 'No messages yet'
  }

  const isUserOnline = (userId) => {
    return onlineUsers.has(userId)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[80vh] overflow-hidden flex">
        
        {/* Sidebar - Thread List */}
        <div className="w-1/3 border-r bg-gray-50 flex flex-col">
          
          {/* Header */}
          <div className="p-6 border-b bg-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-[#1C1C1E]">Messages</h2>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  onClick={() => setShowNewChat(true)}
                  className="bg-[#1E90FF] hover:bg-[#1976D2] text-white"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF]"
              />
            </div>
          </div>

          {/* Thread List */}
          <div className="flex-1 overflow-y-auto">
            {messageThreads.filter(thread => 
              !searchQuery || 
              thread.participants.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
            ).map((thread) => (
              <div
                key={thread.id}
                onClick={() => {
                  setActiveThread(thread)
                  fetchMessages(thread.id)
                }}
                className={`p-4 border-b hover:bg-white cursor-pointer transition-colors ${
                  activeThread?.id === thread.id ? 'bg-white border-l-4 border-[#1E90FF]' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="relative">
                    {thread.type === 'group' ? (
                      <div className="w-12 h-12 bg-[#1E90FF]/10 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-[#1E90FF]" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center relative">
                        <User className="h-6 w-6 text-gray-600" />
                        {thread.participants.some(p => p.id !== user.uid && isUserOnline(p.id)) && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-[#1C1C1E] truncate">
                        {thread.type === 'group' 
                          ? thread.name 
                          : thread.participants.find(p => p.id !== user.uid)?.name || 'Unknown User'
                        }
                      </h3>
                      <span className="text-xs text-gray-500">
                        {thread.lastMessage && formatMessageTime(thread.lastMessage.timestamp)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate">
                        {getThreadPreview(thread)}
                      </p>
                      {thread.unreadCount > 0 && (
                        <Badge className="bg-[#1E90FF] text-white text-xs">
                          {thread.unreadCount}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Thread metadata */}
                    {thread.classId && (
                      <div className="mt-1 flex items-center text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>Class Discussion</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {messageThreads.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No conversations yet</p>
                <p className="text-sm">Start a new chat to get connected!</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          
          {activeThread ? (
            <>
              {/* Chat Header */}
              <div className="p-6 border-b bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      {activeThread.type === 'group' ? (
                        <div className="w-10 h-10 bg-[#1E90FF]/10 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-[#1E90FF]" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center relative">
                          <User className="h-5 w-5 text-gray-600" />
                          {activeThread.participants.some(p => p.id !== user.uid && isUserOnline(p.id)) && (
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-white"></div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-[#1C1C1E]">
                        {activeThread.type === 'group' 
                          ? activeThread.name 
                          : activeThread.participants.find(p => p.id !== user.uid)?.name || 'Unknown User'
                        }
                      </h3>
                      <p className="text-sm text-gray-500">
                        {activeThread.participants.some(p => p.id !== user.uid && isUserOnline(p.id)) 
                          ? 'Online' 
                          : `${activeThread.participants.length} participants`
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="ghost">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Class info if this is a class thread */}
                {activeThread.classId && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2 text-sm text-[#1E90FF]">
                      <Calendar className="h-4 w-4" />
                      <span>Class Discussion: {activeThread.className}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      message.senderId === user.uid
                        ? 'bg-[#1E90FF] text-white'
                        : 'bg-white text-gray-900 shadow-sm'
                    }`}>
                      {message.senderId !== user.uid && (
                        <p className="text-xs font-medium mb-1 opacity-70">
                          {message.senderName}
                        </p>
                      )}
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.senderId === user.uid ? 'text-blue-200' : 'text-gray-500'
                      }`}>
                        {formatMessageTime(message.timestamp)}
                        {message.isTemp && (
                          <span className="ml-1">⏳</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white px-4 py-2 rounded-2xl shadow-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-6 border-t bg-white">
                <div className="flex items-center space-x-3">
                  <Button size="sm" variant="ghost">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Image className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          sendMessage()
                        }
                      }}
                      placeholder="Type a message..."
                      className="w-full px-4 py-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF]"
                    />
                    <Button size="sm" variant="ghost" className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <Smile className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Button size="sm" variant="ghost">
                    <Mic className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-[#1E90FF] hover:bg-[#1976D2] text-white rounded-full p-3"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            /* No Active Thread */
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  Select a conversation
                </h3>
                <p className="text-gray-500">
                  Choose from your existing conversations or start a new one
                </p>
                <Button
                  onClick={() => setShowNewChat(true)}
                  className="mt-4 bg-[#1E90FF] hover:bg-[#1976D2] text-white"
                >
                  Start New Chat
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MessagingSystem