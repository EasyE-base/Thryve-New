import { createClient } from './supabase'

export async function signUp(email, password, firstName = '', lastName = '') {
  const supabase = createClient()
  
  try {
    console.log('=== ENHANCED SIGNUP WITH SESSION PERSISTENCE ===')
    
    // Step 1: Create user account
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          onboarding_complete: false
        }
      }
    })
    
    if (signUpError) {
      console.error('Signup error:', signUpError)
      throw signUpError
    }
    
    console.log('Signup successful, user created:', signUpData.user?.id)
    
    // Step 2: Immediately sign in to establish session (your key insight!)
    console.log('Attempting immediate sign-in to establish session...')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (signInError) {
      console.error('Auto sign-in failed:', signInError)
      // Return signup data even if auto sign-in fails
      return signUpData
    }
    
    console.log('Auto sign-in successful, session established:', signInData.session?.user?.id)
    
    // Return the sign-in data which includes the active session
    return signInData
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