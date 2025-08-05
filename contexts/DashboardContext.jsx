'use client'

import { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth-provider'
import { toast } from 'sonner'

// ✅ UNIFIED DASHBOARD STATE MANAGEMENT
const DashboardContext = createContext()

// ✅ DASHBOARD ACTIONS
const DASHBOARD_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_DATA: 'SET_DATA',
  UPDATE_SECTION: 'UPDATE_SECTION',
  SET_ERROR: 'SET_ERROR',
  UPDATE_REAL_TIME: 'UPDATE_REAL_TIME',
  SET_ACTIVE_TAB: 'SET_ACTIVE_TAB',
  UPDATE_BOOKING: 'UPDATE_BOOKING',
  UPDATE_CLASS: 'UPDATE_CLASS',
  UPDATE_EARNINGS: 'UPDATE_EARNINGS',
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS'
}

// ✅ INITIAL STATE
const initialState = {
  loading: true,
  error: null,
  activeSection: 'overview',
  activeTab: 'dashboard',
  
  // User data
  profile: null,
  
  // Merchant specific
  studio: null,
  classes: [],
  instructors: [],
  customers: [],
  analytics: null,
  revenue: null,
  bookings: [],
  xPassData: null,
  
  // Instructor specific  
  assignedClasses: [],
  earnings: null,
  swapRequests: [],
  performance: null,
  
  // Customer specific
  myBookings: [],
  recommendedClasses: [],
  loyaltyPoints: 0,
  membershipStatus: null,
  xPassCredits: 0,
  
  // Shared
  messages: [],
  notifications: [],
  calendar: [],
  
  // Real-time connection
  wsConnected: false,
  lastUpdate: null
}

// ✅ DASHBOARD REDUCER
const dashboardReducer = (state, action) => {
  switch (action.type) {
    case DASHBOARD_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload }
      
    case DASHBOARD_ACTIONS.SET_DATA:
      return { 
        ...state, 
        ...action.payload, 
        loading: false, 
        error: null,
        lastUpdate: new Date().toISOString()
      }
      
    case DASHBOARD_ACTIONS.UPDATE_SECTION:
      return { ...state, activeSection: action.payload }
      
    case DASHBOARD_ACTIONS.SET_ACTIVE_TAB:
      return { ...state, activeTab: action.payload }
      
    case DASHBOARD_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false }
      
    case DASHBOARD_ACTIONS.UPDATE_REAL_TIME:
      const { type: updateType, data } = action.payload
      
      switch (updateType) {
        case 'booking_created':
          return {
            ...state,
            bookings: [...state.bookings, data],
            myBookings: state.role === 'customer' ? [...state.myBookings, data] : state.myBookings
          }
          
        case 'booking_cancelled':
          return {
            ...state,
            bookings: state.bookings.filter(b => b.id !== data.id),
            myBookings: state.myBookings.filter(b => b.id !== data.id)
          }
          
        case 'class_updated':
          return {
            ...state,
            classes: state.classes.map(c => c.id === data.id ? { ...c, ...data } : c),
            assignedClasses: state.assignedClasses.map(c => c.id === data.id ? { ...c, ...data } : c)
          }
          
        case 'earnings_updated':
          return {
            ...state,
            earnings: { ...state.earnings, ...data }
          }
          
        default:
          return state
      }
      
    case DASHBOARD_ACTIONS.SET_NOTIFICATIONS:
      return { ...state, notifications: action.payload }
      
    default:
      return state
  }
}

// ✅ DASHBOARD PROVIDER
export const DashboardProvider = ({ children, role }) => {
  const [state, dispatch] = useReducer(dashboardReducer, { ...initialState, role })
  const { user } = useAuth()

  // ✅ API UTILITY - Single endpoint with all data
  const fetchDashboardData = useCallback(async () => {
    if (!user) return

    dispatch({ type: DASHBOARD_ACTIONS.SET_LOADING, payload: true })

    try {
      const token = await user.getIdToken()
      
      // ✅ SINGLE API CALL - All dashboard data at once
      const response = await fetch(`/api/dashboard/${role}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.status}`)
      }

      const data = await response.json()
      
      dispatch({ 
        type: DASHBOARD_ACTIONS.SET_DATA, 
        payload: data 
      })

    } catch (error) {
      console.error('Dashboard fetch error:', error)
      dispatch({ 
        type: DASHBOARD_ACTIONS.SET_ERROR, 
        payload: error.message 
      })
      toast.error('Failed to load dashboard data')
    }
  }, [user, role])

  // ✅ REAL-TIME WEBSOCKET CONNECTION
  useEffect(() => {
    if (!user) return

    let ws = null
    let reconnectTimeout = null

    const connectWebSocket = async () => {
      try {
        const token = await user.getIdToken()
        ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/dashboard/${user.uid}?token=${token}`)
        
        ws.onopen = () => {
          console.log('✅ Dashboard WebSocket connected')
          dispatch({ 
            type: DASHBOARD_ACTIONS.UPDATE_REAL_TIME, 
            payload: { type: 'ws_connected', data: true } 
          })
        }
        
        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)
            
            // Handle real-time updates
            dispatch({
              type: DASHBOARD_ACTIONS.UPDATE_REAL_TIME,
              payload: message
            })
            
            // Show toast notifications for important updates
            if (message.showNotification) {
              toast.info(message.notification || 'Dashboard updated')
            }
            
          } catch (error) {
            console.error('WebSocket message parse error:', error)
          }
        }
        
        ws.onclose = () => {
          console.log('❌ Dashboard WebSocket disconnected')
          
          // Auto-reconnect after 3 seconds
          reconnectTimeout = setTimeout(() => {
            console.log('🔄 Reconnecting WebSocket...')
            connectWebSocket()
          }, 3000)
        }
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error)
        }
        
      } catch (error) {
        console.error('WebSocket connection error:', error)
        
        // Retry connection after 5 seconds
        reconnectTimeout = setTimeout(connectWebSocket, 5000)
      }
    }

    connectWebSocket()

    return () => {
      if (ws) {
        ws.close()
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
    }
  }, [user])

  // ✅ INITIAL DATA LOAD
  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user, fetchDashboardData])

  // ✅ REFRESH DATA UTILITY
  const refreshData = useCallback(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // ✅ UPDATE SECTION UTILITY
  const updateSection = useCallback((section) => {
    dispatch({ type: DASHBOARD_ACTIONS.UPDATE_SECTION, payload: section })
  }, [])

  // ✅ UPDATE TAB UTILITY
  const updateTab = useCallback((tab) => {
    dispatch({ type: DASHBOARD_ACTIONS.SET_ACTIVE_TAB, payload: tab })
  }, [])

  // ✅ API UTILITIES
  const createClass = useCallback(async (classData) => {
    try {
      const token = await user.getIdToken()
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(classData)
      })

      if (response.ok) {
        const newClass = await response.json()
        dispatch({
          type: DASHBOARD_ACTIONS.UPDATE_REAL_TIME,
          payload: { type: 'class_created', data: newClass }
        })
        toast.success('Class created successfully')
        return newClass
      } else {
        throw new Error('Failed to create class')
      }
    } catch (error) {
      toast.error('Failed to create class')
      throw error
    }
  }, [user])

  const bookClass = useCallback(async (classId, productId) => {
    try {
      const token = await user.getIdToken()
      const response = await fetch(`/api/classes/${classId}/book`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId })
      })

      if (response.ok) {
        const booking = await response.json()
        dispatch({
          type: DASHBOARD_ACTIONS.UPDATE_REAL_TIME,
          payload: { type: 'booking_created', data: booking }
        })
        toast.success('Class booked successfully')
        return booking
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to book class')
      }
    } catch (error) {
      toast.error(error.message || 'Failed to book class')
      throw error
    }
  }, [user])

  const cancelBooking = useCallback(async (bookingId) => {
    try {
      const token = await user.getIdToken()
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        dispatch({
          type: DASHBOARD_ACTIONS.UPDATE_REAL_TIME,
          payload: { type: 'booking_cancelled', data: { id: bookingId } }
        })
        toast.success('Booking cancelled')
        return true
      } else {
        throw new Error('Failed to cancel booking')
      }
    } catch (error) {
      toast.error('Failed to cancel booking')
      throw error
    }
  }, [user])

  // ✅ CONTEXT VALUE
  const value = {
    ...state,
    dispatch,
    refreshData,
    updateSection,
    updateTab,
    createClass,
    bookClass,
    cancelBooking,
    actions: DASHBOARD_ACTIONS
  }

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}

// ✅ HOOK TO USE DASHBOARD
export const useDashboard = () => {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return context
}