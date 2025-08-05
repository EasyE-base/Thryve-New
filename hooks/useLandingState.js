'use client'

import { useState, useCallback } from 'react'

// ✅ CUSTOM HOOK: Centralized landing page state management
export function useLandingState() {
  // Modal states
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showMessaging, setShowMessaging] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  
  // Class selection
  const [selectedClass, setSelectedClass] = useState(null)

  // ✅ CALLBACK: Open sign-in modal
  const openSignInModal = useCallback(() => {
    setShowSignInModal(true)
  }, [])

  // ✅ CALLBACK: Close sign-in modal
  const closeSignInModal = useCallback(() => {
    setShowSignInModal(false)
  }, [])

  // ✅ CALLBACK: Handle class booking
  const handleBookClass = useCallback((classData) => {
    setSelectedClass(classData)
    setShowBookingModal(true)
  }, [])

  // ✅ CALLBACK: Handle booking success
  const handleBookingSuccess = useCallback((bookingResult) => {
    console.log('Booking successful:', bookingResult)
    setShowBookingModal(false)
    setSelectedClass(null)
  }, [])

  // ✅ CALLBACK: Close booking modal
  const closeBookingModal = useCallback(() => {
    setShowBookingModal(false)
    setSelectedClass(null)
  }, [])

  // ✅ CALLBACK: Toggle messaging
  const toggleMessaging = useCallback(() => {
    setShowMessaging(prev => !prev)
  }, [])

  // ✅ CALLBACK: Toggle notifications
  const toggleNotifications = useCallback(() => {
    setShowNotifications(prev => !prev)
  }, [])

  return {
    // State
    showSignInModal,
    showBookingModal,
    showMessaging,
    showNotifications,
    selectedClass,

    // Actions
    openSignInModal,
    closeSignInModal,
    handleBookClass,
    handleBookingSuccess,
    closeBookingModal,
    toggleMessaging,
    toggleNotifications
  }
}