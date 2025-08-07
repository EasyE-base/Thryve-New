import { NextResponse } from 'next/server'

export async function GET() {
  const debug = {
    env_vars: {
      FIREBASE_SERVICE_ACCOUNT_KEY_SET: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
      FIREBASE_SERVICE_ACCOUNT_KEY_BASE64_SET: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64,
      FIREBASE_ADMIN_KEY_SET: !!process.env.FIREBASE_ADMIN_KEY,
      FIREBASE_SERVICE_ACCOUNT_JSON_SET: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      NODE_ENV: process.env.NODE_ENV
    },
    timestamp: new Date().toISOString(),
    node_env: process.env.NODE_ENV
  }

  try {
    // Test Firebase Admin parsing with multiple formats
    let serviceAccount = null
    let source = 'none'
    
    // Try Base64 first
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64) {
      try {
        serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64, 'base64').toString('utf-8'))
        source = 'base64'
      } catch (error) {
        debug.base64_error = error.message
      }
    }
    
    // Fallback to regular JSON
    if (!serviceAccount) {
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || 
                               process.env.FIREBASE_ADMIN_KEY || 
                               process.env.FIREBASE_SERVICE_ACCOUNT_JSON
      
      if (serviceAccountKey) {
        try {
          serviceAccount = JSON.parse(serviceAccountKey)
          source = 'json'
        } catch (parseError) {
          debug.parse_error = {
            message: parseError.message,
            position: parseError.message.match(/position (\d+)/)?.[1] || 'unknown',
            sample: serviceAccountKey.substring(0, 200) + '...'
          }
        }
      } else {
        debug.error = 'No Firebase service account key found in environment variables'
      }
    }
    
    if (serviceAccount) {
      debug.service_account = {
        source: source,
        has_project_id: !!serviceAccount.project_id,
        has_private_key: !!serviceAccount.private_key,
        has_client_email: !!serviceAccount.client_email,
        project_id: serviceAccount.project_id,
        client_email: serviceAccount.client_email ? '***' + serviceAccount.client_email.slice(-10) : null
      }
    }
  } catch (error) {
    debug.error = error.message
  }

  return NextResponse.json(debug)
}
