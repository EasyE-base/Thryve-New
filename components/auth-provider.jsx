"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, linkWithCredential } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get additional user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = userDoc.exists() ? userDoc.data() : null;
          
          const fullUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || userData?.displayName,
            role: userData?.role || null,
            profileComplete: userData?.profileComplete || false
          };
          
          setUser(fullUser);
          console.log('🔥 AuthProvider: User authenticated:', fullUser.email);
          
          // Handle redirects based on profile completion
          if (pathname === '/' || pathname === '/signup') {
            // Temporarily disable redirects for testing
            /*
            if (!userData?.role) {
              console.log('🔥 AuthProvider: No role, redirecting to role selection');
              router.push('/signup/role-selection');
            } else if (!userData?.profileComplete) {
              console.log('🔥 AuthProvider: Role selected but profile incomplete, redirecting to profile builder');
              const profilePaths = {
                customer: '/profile/customer',
                instructor: '/profile/instructor',
                merchant: '/profile/studio'
              };
              router.push(profilePaths[userData.role]);
            } else {
              console.log('🔥 AuthProvider: Profile complete, redirecting to dashboard');
              const dashboardPaths = {
                customer: '/dashboard/customer',
                instructor: '/dashboard/instructor',
                merchant: '/dashboard/merchant'
              };
              router.push(dashboardPaths[userData.role]);
            }
            */
          }
        } catch (error) {
          console.error('🔥 AuthProvider: Error fetching user data:', error);
          setUser(null);
        }
      } else {
        console.log('🔥 AuthProvider: No authenticated user');
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  const signUp = async (email, password, name) => {
    try {
      console.log('🔥 AuthProvider: Creating user with email:', email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: name,
        createdAt: new Date(),
        role: null,
        profileComplete: false
      });
      
      console.log('🔥 AuthProvider: User created successfully:', user.uid);
      
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: name,
          role: null,
          profileComplete: false
        }
      };
    } catch (error) {
      console.error('🔥 AuthProvider: Sign up error:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user document exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const isNewUser = !userDoc.exists();
      
      if (isNewUser) {
        // Create user document for new Google users
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          displayName: user.displayName,
          createdAt: new Date(),
          role: null,
          profileComplete: false
        });
        console.log('🔥 AuthProvider: New Google user created:', user.uid);
      } else {
        console.log('🔥 AuthProvider: Existing Google user signed in:', user.uid);
      }
      
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: userDoc.exists() ? userDoc.data().role : null,
          profileComplete: userDoc.exists() ? userDoc.data().profileComplete : false
        },
        isNewUser
      };
    } catch (error) {
      console.error('🔥 AuthProvider: Google sign in error:', error);
      
      // Handle account exists with different credential
      if (error.code === 'auth/account-exists-with-different-credential') {
        return {
          success: false,
          code: 'account-exists',
          email: error.customData?.email,
          credential: error.credential
        };
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  };

  const linkGoogle = async (credential) => {
    try {
      const result = await linkWithCredential(auth.currentUser, credential);
      console.log('🔥 AuthProvider: Google account linked successfully');
      
      return {
        success: true,
        user: {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName
        }
      };
    } catch (error) {
      console.error('🔥 AuthProvider: Link Google error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signInWithGoogle,
    linkGoogle,
    signOut: async () => {
      try {
        await auth.signOut();
        router.push('/');
      } catch (error) {
        console.error('Sign out error:', error);
      }
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Add default export
export default AuthProvider;