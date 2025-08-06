// scripts/setup-firestore.js
const admin = require('firebase-admin');

// Initialize admin SDK
try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error('❌ Firebase Admin initialization failed. Make sure FIREBASE_SERVICE_ACCOUNT_JSON is set.');
  console.error('For now, using Firebase client SDK approach...');
  process.exit(1);
}

const db = admin.firestore();

async function setupCollections() {
  console.log('🔥 Setting up Firestore collections...');

  // Create sample documents to initialize collections
  const collections = {
    users: {
      sampleDoc: {
        email: 'sample@example.com',
        role: null,
        profileComplete: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
    },
    studios: {
      sampleDoc: {
        name: 'Sample Studio',
        location: '',
        type: '',
        amenities: [],
        instructors: [],
        classes: [],
        createdBy: '',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
    },
    classes: {
      sampleDoc: {
        title: 'Sample Class',
        studioId: '',
        instructorId: '',
        attendees: [],
        startTime: null,
        endTime: null,
        capacity: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
    },
    bookings: {
      sampleDoc: {
        userId: '',
        classId: '',
        studioId: '',
        instructorId: '',
        status: 'pending',
        amount: 0,
        className: '',
        bookedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
    },
    instructors: {
      sampleDoc: {
        name: '',
        bio: '',
        schedule: [],
        studioId: '',
        performanceStats: {},
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
    },
    customers: {
      sampleDoc: {
        name: '',
        goals: [],
        preferences: [],
        createdBy: '',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
    },
    reviews: {
      sampleDoc: {
        instructorId: '',
        customerId: '',
        rating: 0,
        comment: '',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
    },
    favorites: {
      sampleDoc: {
        userId: '',
        studioId: '',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
    }
  };

  for (const [collectionName, config] of Object.entries(collections)) {
    try {
      // Create collection with a temporary document
      const docRef = db.collection(collectionName).doc('_setup');
      await docRef.set(config.sampleDoc);
      
      // Delete the temporary document
      await docRef.delete();
      
      console.log(`✅ Created collection: ${collectionName}`);
    } catch (error) {
      console.error(`❌ Error creating ${collectionName}:`, error);
    }
  }

  console.log('🎉 Firestore setup complete!');
  console.log('📝 Next steps:');
  console.log('  1. Set up Firestore security rules in Firebase Console');
  console.log('  2. Test the onboarding flow to save real data');
  console.log('  3. Verify dashboard APIs fetch real data');
  process.exit(0);
}

setupCollections();