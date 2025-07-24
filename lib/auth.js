import { createClient } from './supabase'
import { redirect } from 'next/navigation'

export async function signUp(email, password) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        onboarding_complete: false
      },
      emailRedirectTo: undefined // Skip email confirmation for testing
    }
  })
  
  if (error) throw error
  
  // For development, we'll auto-confirm the user if they're not confirmed
  if (data.user && !data.user.email_confirmed_at) {
    console.log('User created, attempting auto sign in...')
    // Try to sign in immediately after signup
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (signInError) {
      console.log('Auto sign in failed, user may need email confirmation:', signInError.message)
      throw new Error('Account created but requires email confirmation. Please check your email.')
    }
    
    return signInData
  }
  
  return data
}

export async function signIn(email, password) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) throw error
  return data
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
}

export async function getCurrentUser() {
  const supabase = createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) return null
  
  return {
    ...session.user,
    role: session.user.user_metadata?.role,
    onboarding_complete: session.user.user_metadata?.onboarding_complete || false
  }
}

export async function handleRoleSelection(role) {
  const supabase = createClient()
  
  try {
    // First try to get user from session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      throw new Error('No active session found. Please log in again.')
    }
    
    // Update user metadata with selected role
    const { data, error } = await supabase.auth.updateUser({
      data: { 
        role,
        onboarding_complete: false 
      }
    })
    
    if (error) throw error
    
    return data
  } catch (error) {
    console.error('Role selection error:', error)
    throw error
  }
}

export function getRoleRedirect(role) {
  switch (role) {
    case 'customer':
      return '/dashboard/customer'
    case 'instructor':
      return '/dashboard/instructor'
    case 'merchant':
      return '/dashboard/merchant'
    default:
      return '/signup/role-selection'
  }
}