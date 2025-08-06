const { initializeApp } = require('firebase/app')
const { getFirestore, collection, addDoc, doc, setDoc } = require('firebase/firestore')

// Firebase config (use your actual config)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Sample instructor data
const sampleInstructors = [
  {
    name: "Sarah Johnson",
    photo: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    bio: "Certified yoga instructor with 8+ years of experience. Specializing in Vinyasa, Hatha, and Restorative yoga. Passionate about helping students find balance and strength.",
    specialties: ["Yoga", "Vinyasa", "Hatha", "Restorative", "Meditation"],
    certifications: ["Yoga Alliance RYT-500", "Meditation Teacher Certification", "Prenatal Yoga"],
    hourlyRate: 75,
    location: {
      city: "San Francisco",
      state: "CA",
      coordinates: { latitude: 37.7749, longitude: -122.4194 }
    },
    availability: {
      monday: ["9:00-11:00", "14:00-16:00", "18:00-20:00"],
      tuesday: ["9:00-11:00", "14:00-16:00"],
      wednesday: ["9:00-11:00", "18:00-20:00"],
      thursday: ["9:00-11:00", "14:00-16:00"],
      friday: ["9:00-11:00", "18:00-20:00"],
      saturday: ["10:00-12:00"],
      sunday: ["10:00-12:00"]
    },
    rating: 4.9,
    reviewCount: 127,
    verified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Mike Chen",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    bio: "Personal trainer and CrossFit coach with a background in sports science. Focused on functional fitness and strength training for all levels.",
    specialties: ["CrossFit", "Strength Training", "HIIT", "Functional Fitness", "Sports Performance"],
    certifications: ["CrossFit Level 2", "NASM Certified Personal Trainer", "Sports Nutrition Coach"],
    hourlyRate: 85,
    location: {
      city: "Los Angeles",
      state: "CA",
      coordinates: { latitude: 34.0522, longitude: -118.2437 }
    },
    availability: {
      monday: ["6:00-8:00", "17:00-19:00"],
      tuesday: ["6:00-8:00", "17:00-19:00"],
      wednesday: ["6:00-8:00", "17:00-19:00"],
      thursday: ["6:00-8:00", "17:00-19:00"],
      friday: ["6:00-8:00", "17:00-19:00"],
      saturday: ["8:00-10:00"],
      sunday: ["8:00-10:00"]
    },
    rating: 4.8,
    reviewCount: 89,
    verified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Emma Wilson",
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    bio: "Pilates instructor and dance teacher with a focus on core strength and flexibility. Trained in classical Pilates and contemporary dance.",
    specialties: ["Pilates", "Dance", "Core Training", "Flexibility", "Rehabilitation"],
    certifications: ["Pilates Instructor Certification", "Dance Teacher Certification", "Rehabilitation Specialist"],
    hourlyRate: 70,
    location: {
      city: "New York",
      state: "NY",
      coordinates: { latitude: 40.7128, longitude: -74.0060 }
    },
    availability: {
      monday: ["10:00-12:00", "15:00-17:00"],
      tuesday: ["10:00-12:00", "15:00-17:00"],
      wednesday: ["10:00-12:00", "15:00-17:00"],
      thursday: ["10:00-12:00", "15:00-17:00"],
      friday: ["10:00-12:00", "15:00-17:00"],
      saturday: ["11:00-13:00"],
      sunday: ["11:00-13:00"]
    },
    rating: 4.7,
    reviewCount: 156,
    verified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "David Rodriguez",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    bio: "Martial arts instructor and self-defense expert. Teaching Brazilian Jiu-Jitsu, Muay Thai, and self-defense classes for all skill levels.",
    specialties: ["Brazilian Jiu-Jitsu", "Muay Thai", "Self Defense", "Martial Arts", "Combat Sports"],
    certifications: ["BJJ Black Belt", "Muay Thai Instructor", "Self Defense Instructor"],
    hourlyRate: 90,
    location: {
      city: "Miami",
      state: "FL",
      coordinates: { latitude: 25.7617, longitude: -80.1918 }
    },
    availability: {
      monday: ["7:00-9:00", "18:00-20:00"],
      tuesday: ["7:00-9:00", "18:00-20:00"],
      wednesday: ["7:00-9:00", "18:00-20:00"],
      thursday: ["7:00-9:00", "18:00-20:00"],
      friday: ["7:00-9:00", "18:00-20:00"],
      saturday: ["9:00-11:00"],
      sunday: ["9:00-11:00"]
    },
    rating: 4.9,
    reviewCount: 203,
    verified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Lisa Thompson",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    bio: "Senior fitness specialist and nutrition coach. Dedicated to helping older adults maintain strength, mobility, and independence through safe, effective exercise.",
    specialties: ["Senior Fitness", "Nutrition Coaching", "Rehabilitation", "Balance Training", "Low Impact"],
    certifications: ["Senior Fitness Specialist", "Nutrition Coach", "Rehabilitation Specialist"],
    hourlyRate: 65,
    location: {
      city: "Phoenix",
      state: "AZ",
      coordinates: { latitude: 33.4484, longitude: -112.0740 }
    },
    availability: {
      monday: ["9:00-11:00", "14:00-16:00"],
      tuesday: ["9:00-11:00", "14:00-16:00"],
      wednesday: ["9:00-11:00", "14:00-16:00"],
      thursday: ["9:00-11:00", "14:00-16:00"],
      friday: ["9:00-11:00", "14:00-16:00"],
      saturday: ["10:00-12:00"],
      sunday: ["10:00-12:00"]
    },
    rating: 4.8,
    reviewCount: 94,
    verified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Alex Kim",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    bio: "Cycling and spin instructor with a passion for high-energy cardio workouts. Creating engaging, music-driven classes that push limits safely.",
    specialties: ["Cycling", "Spin", "Cardio", "Endurance Training", "Music-Driven Workouts"],
    certifications: ["Spinning Instructor", "Cycling Coach", "Cardio Specialist"],
    hourlyRate: 60,
    location: {
      city: "Seattle",
      state: "WA",
      coordinates: { latitude: 47.6062, longitude: -122.3321 }
    },
    availability: {
      monday: ["6:00-8:00", "17:00-19:00"],
      tuesday: ["6:00-8:00", "17:00-19:00"],
      wednesday: ["6:00-8:00", "17:00-19:00"],
      thursday: ["6:00-8:00", "17:00-19:00"],
      friday: ["6:00-8:00", "17:00-19:00"],
      saturday: ["8:00-10:00"],
      sunday: ["8:00-10:00"]
    },
    rating: 4.6,
    reviewCount: 78,
    verified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Maria Garcia",
    photo: "https://images.unsplash.com/photo-1487412720507-e7ab37603f6b?w=150&h=150&fit=crop&crop=face",
    bio: "Zumba instructor and Latin dance specialist. Bringing energy, rhythm, and fun to fitness through dance-based workouts that feel like a party.",
    specialties: ["Zumba", "Latin Dance", "Cardio Dance", "Rhythm Training", "Group Fitness"],
    certifications: ["Zumba Instructor", "Latin Dance Teacher", "Group Fitness Instructor"],
    hourlyRate: 55,
    location: {
      city: "Austin",
      state: "TX",
      coordinates: { latitude: 30.2672, longitude: -97.7431 }
    },
    availability: {
      monday: ["10:00-12:00", "18:00-20:00"],
      tuesday: ["10:00-12:00", "18:00-20:00"],
      wednesday: ["10:00-12:00", "18:00-20:00"],
      thursday: ["10:00-12:00", "18:00-20:00"],
      friday: ["10:00-12:00", "18:00-20:00"],
      saturday: ["11:00-13:00"],
      sunday: ["11:00-13:00"]
    },
    rating: 4.7,
    reviewCount: 112,
    verified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "James Wilson",
    photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
    bio: "Powerlifting coach and strength specialist. Helping athletes and fitness enthusiasts build raw strength and power through proper technique and programming.",
    specialties: ["Powerlifting", "Strength Training", "Olympic Lifting", "Sports Performance", "Technique Coaching"],
    certifications: ["Powerlifting Coach", "Strength & Conditioning Specialist", "Olympic Lifting Coach"],
    hourlyRate: 95,
    location: {
      city: "Denver",
      state: "CO",
      coordinates: { latitude: 39.7392, longitude: -104.9903 }
    },
    availability: {
      monday: ["6:00-8:00", "17:00-19:00"],
      tuesday: ["6:00-8:00", "17:00-19:00"],
      wednesday: ["6:00-8:00", "17:00-19:00"],
      thursday: ["6:00-8:00", "17:00-19:00"],
      friday: ["6:00-8:00", "17:00-19:00"],
      saturday: ["8:00-10:00"],
      sunday: ["8:00-10:00"]
    },
    rating: 4.9,
    reviewCount: 167,
    verified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

async function setupInstructorMarketplace() {
  try {
    console.log('Setting up instructor marketplace...')
    
    // Add sample instructors to the marketplace
    for (const instructor of sampleInstructors) {
      const docRef = await addDoc(collection(db, 'instructors'), instructor)
      console.log(`Added instructor: ${instructor.name} (ID: ${docRef.id})`)
    }
    
    console.log('✅ Instructor marketplace setup complete!')
    console.log(`Added ${sampleInstructors.length} sample instructors`)
    console.log('\nYou can now test the invitation system by:')
    console.log('1. Going to the merchant dashboard')
    console.log('2. Clicking "Invite Instructor"')
    console.log('3. Searching for instructors in the marketplace')
    
  } catch (error) {
    console.error('Error setting up instructor marketplace:', error)
  }
}

// Run the setup
setupInstructorMarketplace() 