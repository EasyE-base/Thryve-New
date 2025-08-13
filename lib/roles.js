// lib/roles.js

// Returns one of: 'merchant' | 'instructor' | 'customer' | 'unknown'
export function canonicalizeRole(input) {
  const v = (input || '').toLowerCase()
  if (['merchant', 'studio', 'studio-owner'].includes(v)) return 'merchant'
  if (v === 'instructor') return 'instructor'
  if (v === 'customer') return 'customer'
  return 'unknown'
}


