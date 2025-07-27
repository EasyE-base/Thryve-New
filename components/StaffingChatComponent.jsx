'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  MessageSquare, Send, Users, Clock, Loader2, RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

export default function StaffingChatComponent({ studioId }) {
  const { user, userRole } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (user && studioId) {
      fetchMessages()
      // Set up polling for real-time updates
      const interval = setInterval(fetchMessages, 5000)
      return () => clearInterval(interval)
    }
  }, [user, studioId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    if (!studioId) return
    
    setLoading(true)
    try {
      const token = await user.getIdToken()
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/server-api/staffing/chat?studioId=${studioId}&limit=50`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      } else {
        console.error('Failed to fetch messages')
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !studioId) return

    setSending(true)
    try {
      const token = await user.getIdToken()
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/server-api/staffing/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            studioId: studioId,
            message: newMessage.trim()
          })
        }
      )

      if (response.ok) {
        setNewMessage('')
        await fetchMessages()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getRoleBadge = (role) => {
    const roleConfig = {
      instructor: { color: 'bg-blue-500/20 text-blue-200', label: 'Instructor' },
      merchant: { color: 'bg-purple-500/20 text-purple-200', label: 'Studio' },
      customer: { color: 'bg-green-500/20 text-green-200', label: 'Customer' }
    }

    const config = roleConfig[role] || roleConfig.instructor
    return (
      <Badge className={`${config.color} text-xs`}>
        {config.label}
      </Badge>
    )
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-white flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Staffing Chat
            </CardTitle>
            <CardDescription className="text-blue-200">
              Real-time communication for shift coverage and swaps
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className="bg-green-500/20 text-green-200">
              <Users className="h-3 w-3 mr-1" />
              {messages.length > 0 ? 'Active' : 'No Activity'}
            </Badge>
            <Button
              onClick={fetchMessages}
              size="sm"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-4 pt-0">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
              <span className="ml-2 text-blue-200">Loading messages...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <MessageSquare className="h-12 w-12 text-blue-400 mx-auto mb-3 opacity-50" />
                <h4 className="text-white font-medium mb-1">No Messages Yet</h4>
                <p className="text-blue-200 text-sm">Start the conversation about shift coverage and swaps</p>
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.senderId === user?.uid
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] ${
                      isOwnMessage
                        ? 'bg-blue-500/20 border-blue-400/20'
                        : 'bg-white/10 border-white/20'
                    } border backdrop-blur-sm rounded-lg p-3`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${
                          isOwnMessage ? 'text-blue-200' : 'text-white'
                        }`}>
                          {isOwnMessage ? 'You' : message.senderName || 'Unknown'}
                        </span>
                        {getRoleBadge(message.senderRole)}
                      </div>
                      <div className="flex items-center text-xs text-blue-300">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                      </div>
                    </div>
                    
                    <p className={`text-sm ${
                      isOwnMessage ? 'text-blue-100' : 'text-blue-200'
                    }`}>
                      {message.message}
                    </p>

                    {/* Related content indicators */}
                    {message.relatedClassId && (
                      <div className="mt-2 text-xs text-blue-300 opacity-75">
                        📅 Related to class
                      </div>
                    )}
                    {message.relatedSwapId && (
                      <div className="mt-2 text-xs text-blue-300 opacity-75">
                        🔄 Related to swap request
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message about coverage, swaps, or scheduling..."
            className="flex-1 bg-white/10 border-white/20 text-white placeholder-blue-300"
            disabled={sending}
          />
          <Button
            onClick={sendMessage}
            disabled={sending || !newMessage.trim()}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Chat Guidelines */}
        <div className="mt-3 text-xs text-blue-300 opacity-75">
          💡 Use this chat to coordinate shift swaps, request coverage, and communicate about scheduling changes
        </div>
      </CardContent>
    </Card>
  )
}