import { createClient } from './supabase'
import { redirect } from 'next/navigation'

export async function signUp(email, password) {
  const supabase = createClient()
  
  try {
    // First attempt signup
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          onboarding_complete: false
        }
      }
    })
    
    if (signUpError) throw signUpError
    
    // The signup should automatically create a session since email confirmation is disabled
    if (signUpData.session) {
      console.log('Session created during signup:', signUpData.session.user.email)
      return signUpData
    }
    
    // If no session was created, there might be an issue
    console.log('No session created during signup, user:', signUpData.user?.email)
    return signUpData
  } catch (error) {
    console.error('Signup process error:', error)
    throw error
  }
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

export async function handleRoleSelection(role, user = null) {
  const supabase = createClient()
  
  try {
    // If no user passed, try to get from session
    if (!user) {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        throw new Error('No active session found. Please log in again.')
      }
      user = session.user
    }
    
    console.log('Updating role for user:', user.email, 'to role:', role)
    
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