/**
 * Debug Authentication Helper Functions
 * Load this script in browser console to debug authentication issues
 */

const debugAuth = {
  // Main debug function
  debugAuthState() {
    console.log('🔥 DEBUGGING AUTHENTICATION STATE');
    console.log('================================');
    
    this.checkCookies();
    this.checkLocalStorage();
    this.checkFirebaseAuth();
    this.checkDOMElements();
    
    console.log('================================');
  },
  
  // Check browser cookies
  checkCookies() {
    console.log('\n🍪 COOKIES:');
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});
    
    if (cookies.user) {
      try {
        const userCookie = JSON.parse(decodeURIComponent(cookies.user));
        console.log('✅ User Cookie Found:', userCookie);
      } catch (e) {
        console.log('❌ User Cookie Invalid:', cookies.user);
      }
    } else {
      console.log('❌ No user cookie found');
    }
  },
  
  // Check localStorage
  checkLocalStorage() {
    console.log('\n💾 LOCAL STORAGE:');
    
    const authKeys = ['pendingRoleSelection', 'pendingUserData', 'user', 'role', 'onboardingCompleted'];
    
    authKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        console.log(`✅ ${key}:`, value);
      } else {
        console.log(`❌ ${key}: Not found`);
      }
    });
  },
  
  // Check Firebase Auth
  checkFirebaseAuth() {
    console.log('\n🔥 FIREBASE AUTH:');
    
    if (typeof window.firebase !== 'undefined') {
      console.log('✅ Firebase SDK loaded');
      const auth = window.firebase.auth();
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        console.log('✅ Firebase User:', {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName
        });
      } else {
        console.log('❌ No Firebase user authenticated');
      }
    } else {
      console.log('❌ Firebase SDK not loaded');
    }
  },
  
  // Check DOM elements for auth state
  checkDOMElements() {
    console.log('\n🌐 DOM ELEMENTS:');
    
    const signInBtn = Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent?.includes('Sign In'));
    const signUpBtn = Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent?.includes('Sign Up') || btn.textContent?.includes('Get Started'));
    const dashboardBtn = Array.from(document.querySelectorAll('button, a')).find(el => 
      el.textContent?.includes('Dashboard'));
    
    console.log('Sign In button:', signInBtn ? '✅ Found' : '❌ Not found');
    console.log('Sign Up button:', signUpBtn ? '✅ Found' : '❌ Not found');
    console.log('Dashboard button:', dashboardBtn ? '✅ Found' : '❌ Not found');
    
    const messagesBtn = Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent?.includes('Messages'));
    const notificationsBtn = Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent?.includes('Notifications'));
    
    console.log('Messages button:', messagesBtn ? '❌ Found (should not be visible)' : '✅ Not found');
    console.log('Notifications button:', notificationsBtn ? '❌ Found (should not be visible)' : '✅ Not found');
  },
  
  // Clear all auth state
  clearAuthState() {
    console.log('🧹 CLEARING ALL AUTH STATE');
    
    const authKeys = ['pendingRoleSelection', 'pendingUserData', 'user', 'role', 'onboardingCompleted'];
    authKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`Cleared localStorage: ${key}`);
    });
    
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    console.log('Cleared all cookies');
    
    if (typeof window.firebase !== 'undefined') {
      window.firebase.auth().signOut();
    }
    
    console.log('✅ Auth state cleared - refresh page');
  }
};

// Make it globally available
window.debugAuth = debugAuth;
console.log('🔧 Debug Auth Tools Loaded - Use: debugAuth.debugAuthState()');