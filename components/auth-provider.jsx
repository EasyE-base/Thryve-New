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
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [claimsChecked, setClaimsChecked] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get additional user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = userDoc.exists() ? userDoc.data() : null;
          
          // Map role from Firestore to expected dashboard role
          const mapRole = (firestoreRole) => {
            const roleMap = {
              'studio': 'merchant',
              'merchant': 'merchant',
              'instructor': 'instructor',
              'customer': 'customer'
            };
            return roleMap[firestoreRole] || firestoreRole;
          };

          const fullUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || userData?.displayName,
            role: mapRole(userData?.role) || null,
            profileComplete: userData?.profileComplete || false,
            // Include Firebase user methods
            getIdToken: firebaseUser.getIdToken.bind(firebaseUser)
          };
          
          setUser(fullUser);
          console.log('🔥 AuthProvider: User authenticated:', fullUser.email);
          setProfileLoaded(true);
          try {
            // Light touch claim check - don't block if fails
            await fetch('/api/session/sync');
          } catch (_) {}
          setClaimsChecked(true);
          
          // Handle redirects based on profile completion - ONLY for specific paths
          // Let authenticated users stay on homepage - don't auto-redirect
          if (!(profileLoaded && claimsChecked)) {
            // Defer redirects until profile + claims ready
            return;
          }

          if (pathname === '/signup') {
            if (!userData?.role) {
              console.log('🔥 AuthProvider: No role, redirecting to role selection');
              router.push('/signup/role-selection');
            } else if (!userData?.profileComplete) {
              console.log('🔥 AuthProvider: Role selected but profile incomplete, redirecting to profile builder');
              const mappedRole = mapRole(userData.role);
              const onboardingPaths = {
                customer: '/onboarding/customer',
                instructor: '/onboarding/instructor',
                merchant: '/onboarding/merchant'
              };
              router.push(onboardingPaths[mappedRole]);
            } else {
              console.log('🔥 AuthProvider: Profile complete, redirecting to dashboard');
              const mappedRole = mapRole(userData.role);
              const dashboardPaths = {
                customer: '/dashboard/customer',
                instructor: '/dashboard/instructor',
                merchant: '/dashboard/merchant'
              };
              router.push(dashboardPaths[mappedRole]);
            }
          } else if (pathname === '/signup/role-selection' && !userData?.role) {
            // User is on role selection page and has no role - this is correct, don't redirect
            console.log('🔥 AuthProvider: User on role selection page, no redirect needed');
          }
        } catch (error) {
          console.error('🔥 AuthProvider: Error fetching user data:', error);
          setUser(null);
          setProfileLoaded(true);
          setClaimsChecked(true);
        }
      } else {
        console.log('🔥 AuthProvider: No authenticated user');
        setUser(null);
        setProfileLoaded(true);
        setClaimsChecked(true);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router, profileLoaded, claimsChecked]);

  const signUp = async (email, password, name, selectedRole = null) => {
    try {
      console.log('🔥 AuthProvider: Creating user with email:', email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Normalize role mapping (studio => merchant)
      const mapRole = (firestoreRole) => {
        const roleMap = {
          'studio': 'merchant',
          'merchant': 'merchant',
          'instructor': 'instructor',
          'customer': 'customer'
        };
        return roleMap[firestoreRole] || firestoreRole;
      };

      const persistedRole = selectedRole ? selectedRole : null;
      const mappedRole = persistedRole ? mapRole(persistedRole) : null;

      // Create user document in Firestore with immediate role persistence if available
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: name,
        createdAt: new Date(),
        role: persistedRole, // store original selection; mapping used for routing
        profileComplete: false
      });

      // Also persist role to localStorage for guard consistency
      try {
        if (mappedRole) {
          localStorage.setItem('user_role', mappedRole);
        }
      } catch (_) {}
      
      console.log('🔥 AuthProvider: User created successfully:', user.uid);
      
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: name,
          role: mappedRole,
          profileComplete: false
        },
        role: mappedRole
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

  const completeOnboarding = async () => {
    try {
      // Update user document to mark onboarding as complete
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        profileComplete: true,
        onboardingCompletedAt: new Date()
      });

      // Update local user state
      setUser(prev => ({
        ...prev,
        profileComplete: true
      }));

      return { success: true };
    } catch (error) {
      console.error('Error completing onboarding:', error);
      return { success: false, error: error.message };
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
    },
    completeOnboarding
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Add default export
export default AuthProvider;