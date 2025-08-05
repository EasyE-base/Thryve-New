# Google Auth Setup Guide for Thryve Platform

## Overview
This guide provides step-by-step instructions for setting up Google Authentication with Firebase for the Thryve platform.

## Prerequisites
- Firebase project created
- Vercel deployment environment
- Google Cloud Console access

## 1. Firebase Console Setup

### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select existing project
3. Enable Google Analytics (optional)
4. Wait for project creation

### Enable Authentication
1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Click **Google** provider
3. Click **Enable** toggle
4. Set **Project support email** (required)
5. Click **Save**

### Get Firebase Configuration
1. Go to **Project Settings** (gear icon)
2. Scroll to **Your apps** section
3. Click **Web app** icon `</>`
4. Register app with name "Thryve Platform"
5. Copy the Firebase config object:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

## 2. Google Cloud Console Setup

### Enable Required APIs
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Navigate to **APIs & Services** > **Library**
4. Enable these APIs:
   - Identity and Access Management (IAM) API
   - Google+ API (if available)
   - People API

### Configure OAuth Consent Screen
1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type (for public app)
3. Fill required fields:
   - App name: "Thryve Platform"
   - User support email: your-email
   - Developer contact: your-email
4. Add scopes: `email`, `profile`, `openid`
5. Add authorized domains: `thryve-new-new.vercel.app`

### Create OAuth 2.0 Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Application type: **Web application**
4. Name: "Thryve Web Client"
5. Authorized JavaScript origins:
   - `https://thryve-new-new.vercel.app`
   - `http://localhost:3000` (for development)
6. Authorized redirect URIs:
   - `https://your-project.firebaseapp.com/__/auth/handler`
7. Click **Create**
8. Copy **Client ID** and **Client Secret**

## 3. Environment Variables Setup

### Vercel Environment Variables
In Vercel Dashboard > Project Settings > Environment Variables, add:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Google OAuth
GOOGLE_CLIENT_ID=your-oauth-client-id
GOOGLE_CLIENT_SECRET=your-oauth-client-secret

# MongoDB (if using)
MONGODB_URI=your-mongodb-connection-string
```

### Local Development (.env.local)
Create `.env.local` file in project root:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Google OAuth
GOOGLE_CLIENT_ID=your-oauth-client-id
GOOGLE_CLIENT_SECRET=your-oauth-client-secret

# MongoDB
MONGODB_URI=mongodb://localhost:27017/thryve
```

## 4. Code Implementation

### Firebase Configuration (lib/firebase.js)
```javascript
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()
```

### Google Sign-In Implementation
```javascript
import { signInWithPopup, signInWithRedirect } from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    const user = result.user
    
    // Save user data to your backend
    await fetch('/api/auth/firebase-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      })
    })
    
    return user
  } catch (error) {
    console.error('Google sign-in error:', error)
    throw error
  }
}
```

## 5. Testing and Verification

### Test Authentication Flow
1. Deploy to Vercel with environment variables
2. Visit your app
3. Click "Sign In with Google"
4. Complete Google OAuth flow
5. Verify user is authenticated
6. Check browser console for errors

### Debug Common Issues
1. **"Invalid origin"**: Check authorized JavaScript origins
2. **"Redirect URI mismatch"**: Verify redirect URIs match exactly
3. **"API key not valid"**: Ensure API key is correct and APIs are enabled
4. **CORS errors**: Check domain configuration in Firebase/Google Cloud

## 6. Security Considerations

### Firebase Security Rules
```javascript
// Firestore rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Environment Variable Security
- Never commit `.env.local` to version control
- Use different Firebase projects for development/production
- Regularly rotate API keys and secrets
- Monitor Firebase usage and authentication logs

## 7. Troubleshooting

### Common Error Messages
- **"Firebase API key is invalid"**: Check API key in environment variables
- **"Auth domain is not authorized"**: Add domain to Firebase authorized domains
- **"Google sign-in popup blocked"**: Use redirect instead of popup
- **"CORS policy error"**: Check authorized origins in Google Cloud Console

### Debug Tools
Load `debug-auth.js` in browser console:
```javascript
debugAuth.debugAuthState() // Check current auth state
debugAuth.clearAuthState() // Clear all auth data
```

### Firebase Auth Debug
```javascript
import { getAuth } from 'firebase/auth'

const auth = getAuth()
auth.onAuthStateChanged((user) => {
  console.log('Auth state changed:', user)
})
```

## 8. Production Deployment Checklist

- [ ] Firebase project configured for production
- [ ] Google Cloud OAuth consent screen published
- [ ] All environment variables set in Vercel
- [ ] Authorized domains include production URL
- [ ] Firebase Security Rules configured
- [ ] Google APIs enabled and configured
- [ ] SSL certificate valid
- [ ] Authentication flow tested end-to-end

## Support and Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Google Identity Platform](https://developers.google.com/identity)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js Authentication](https://nextjs.org/docs/authentication)

## Contact
For issues with this setup, check the Thryve platform repository issues or contact the development team.