#!/usr/bin/env node

// Test script to verify Firestore integration
// This script tests the complete data flow from onboarding to dashboard

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, getDoc } = require('firebase/firestore');

// Firebase config (using environment variables)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testFirestoreCollections() {
  console.log('🔥 Testing Firestore Collections...\n');

  const collections = [
    'users',
    'studios', 
    'classes',
    'bookings',
    'instructors',
    'customers',
    'reviews',
    'favorites'
  ];
  
  for (const collectionName of collections) {
    try {
      const snapshot = await getDocs(collection(db, collectionName));
      console.log(`✅ ${collectionName}: ${snapshot.size} documents`);
      
      // Show first document structure if exists
      if (snapshot.size > 0) {
        const firstDoc = snapshot.docs[0];
        const data = firstDoc.data();
        console.log(`   Sample data keys: ${Object.keys(data).join(', ')}`);
      }
    } catch (error) {
      console.error(`❌ ${collectionName}: ${error.message}`);
    }
  }
}

async function testDashboardAPI() {
  console.log('\n🔍 Testing Dashboard API...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/dashboard/merchant', {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Merchant Dashboard API: Working');
      console.log(`   Total Classes: ${data.overview.totalClasses}`);
      console.log(`   Total Customers: ${data.overview.totalCustomers}`);
      console.log(`   Total Revenue: $${data.overview.totalRevenue}`);
      console.log(`   Studio Name: ${data.studio.name}`);
    } else {
      console.log(`❌ Merchant Dashboard API: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error(`❌ Dashboard API Error: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 Starting Firestore Integration Tests\n');
  
  try {
    await testFirestoreCollections();
    await testDashboardAPI();
    
    console.log('\n🎉 Test completed!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Complete user onboarding to create real data');
    console.log('   2. Verify dashboard shows real data instead of empty states');
    console.log('   3. Test all role-based dashboards (customer, instructor, merchant)');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  process.exit(0);
}

// Run tests if environment variables are set
if (firebaseConfig.apiKey) {
  runTests();
} else {
  console.error('❌ Firebase config not found. Make sure environment variables are set.');
  console.log('Required environment variables:');
  console.log('  - NEXT_PUBLIC_FIREBASE_API_KEY');
  console.log('  - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  console.log('  - NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  console.log('  - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
  console.log('  - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
  console.log('  - NEXT_PUBLIC_FIREBASE_APP_ID');
}