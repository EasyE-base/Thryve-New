"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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
          const userData = userDoc.data();
          
          // Combine Firebase auth user with Firestore data
          const fullUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            ...userData
          };
          
          setUser(fullUser);
          console.log('🔥 AuthProvider: User authenticated:', fullUser.email);
          
          // Handle redirects based on profile completion
          if (pathname === '/' || pathname === '/signup') {
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

  const value = {
    user,
    loading,
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