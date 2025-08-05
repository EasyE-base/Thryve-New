import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

export function formatDate(date, options = {}) {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
  
  return new Date(date).toLocaleDateString('en-US', {
    ...defaultOptions,
    ...options
  })
}

export function formatDateTime(date) {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function calculateCommission(amount, rate) {
  return amount * rate
}

export function getPayoutStatusColor(status) {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'success':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'pending':
    case 'processing':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'failed':
    case 'error':
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'scheduled':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export function validatePayoutAmount(amount, minimumAmount = 25, maximumAmount = null) {
  const numAmount = parseFloat(amount)
  
  if (isNaN(numAmount) || numAmount <= 0) {
    return { valid: false, error: 'Please enter a valid amount' }
  }
  
  if (numAmount < minimumAmount) {
    return { valid: false, error: `Minimum payout amount is $${minimumAmount.toFixed(2)}` }
  }
  
  if (maximumAmount && numAmount > maximumAmount) {
    return { valid: false, error: `Maximum payout amount is $${maximumAmount.toFixed(2)}` }
  }
  
  return { valid: true, error: null }
}

export function getNextPayoutDate(schedule = 'weekly', lastPayoutDate = null) {
  const now = new Date()
  const baseDate = lastPayoutDate ? new Date(lastPayoutDate) : now
  
  switch (schedule.toLowerCase()) {
    case 'weekly':
      const nextWeek = new Date(baseDate)
      nextWeek.setDate(baseDate.getDate() + 7)
      return nextWeek
      
    case 'bi-weekly':
      const nextBiWeek = new Date(baseDate)
      nextBiWeek.setDate(baseDate.getDate() + 14)
      return nextBiWeek
      
    case 'monthly':
      const nextMonth = new Date(baseDate)
      nextMonth.setMonth(baseDate.getMonth() + 1)
      return nextMonth
      
    default:
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // Default to 1 week
  }
}

export function generatePayoutId() {
  return `payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function truncateText(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}