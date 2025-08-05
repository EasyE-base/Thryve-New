const functions = require('firebase-functions')
const admin = require('firebase-admin')

// Initialize Firebase Admin
admin.initializeApp()
const firestore = admin.firestore()

/**
 * Cloud Function triggered when a new user is created
 * Automatically creates a user profile document in Firestore
 */
exports.handleNewUser = functions.auth.user().onCreate(async (user) => {
  try {
    console.log('Creating profile for new user:', user.uid)
    
    const userRef = firestore.collection('users').doc(user.uid)
    
    // Determine signup method from provider data
    const provider = user.providerData[0]?.providerId || 'email'
    const signupMethod = provider === 'google.com' ? 'google' : 'email'
    
    const userData = {
      email: user.email || '',
      name: user.displayName || '',
      photoURL: user.photoURL || null,
      role: null,
      profileCompleted: false,
      hasOnboarded: false,
      credits: 0,
      lastSeen: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      // Provider information
      provider: provider,
      signupMethod: signupMethod,
      // Add any additional default fields here
      preferences: {
        notifications: true,
        emailUpdates: true
      },
      metadata: {
        platform: 'web',
        userAgent: user.metadata?.creationTime || null
      }
    }
    
    await userRef.set(userData)
    console.log('Successfully created profile for user:', user.uid)
    
    return { success: true }
  } catch (error) {
    console.error('Error creating user profile:', error)
    return { success: false, error: error.message }
  }
})

/**
 * Cloud Function triggered when a user is deleted
 * Cleans up associated user data
 */
exports.handleDeleteUser = functions.auth.user().onDelete(async (user) => {
  try {
    console.log('Cleaning up data for deleted user:', user.uid)
    
    // Delete user profile
    await firestore.collection('users').doc(user.uid).delete()
    
    // Add cleanup for other collections if needed
    // Example: delete user's bookings, classes, etc.
    
    console.log('Successfully cleaned up data for user:', user.uid)
    return { success: true }
  } catch (error) {
    console.error('Error cleaning up user data:', error)
    return { success: false, error: error.message }
  }
})

/**
 * Scheduled function to update user lastSeen timestamps
 * Runs every hour to track active users
 */
exports.updateActiveUsers = functions.pubsub.schedule('every 1 hours').onRun(async (context) => {
  try {
    console.log('Updating active user timestamps')
    
    // This would typically be triggered by client-side activity
    // but can be used for maintenance tasks
    
    return { success: true }
  } catch (error) {
    console.error('Error updating active users:', error)
    return { success: false, error: error.message }
  }
})

/**
 * HTTP function for admin operations (optional)
 */
exports.adminUtils = functions.https.onCall(async (data, context) => {
  // Verify admin authentication
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Must be an admin to call this function')
  }
  
  const { operation, userId, userData } = data
  
  try {
    switch (operation) {
      case 'updateUserRole':
        await firestore.collection('users').doc(userId).update({
          role: userData.role,
          lastSeen: admin.firestore.FieldValue.serverTimestamp()
        })
        return { success: true, message: 'User role updated' }
      
      case 'getUserProfile':
        const userDoc = await firestore.collection('users').doc(userId).get()
        return { success: true, profile: userDoc.data() }
      
      default:
        throw new functions.https.HttpsError('invalid-argument', 'Unknown operation')
    }
  } catch (error) {
    console.error('Admin operation error:', error)
    throw new functions.https.HttpsError('internal', error.message)
  }
})