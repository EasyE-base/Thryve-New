import { createClient } from './supabase'
import { redirect } from 'next/navigation'

export async function signUp(email, password, role) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        onboarding_complete: false
      }
    }
  })
  
  if (error) throw error
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
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No user found')
  
  const { error } = await supabase.auth.updateUser({
    data: { 
      role,
      onboarding_complete: false 
    }
  })
  
  if (error) throw error
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