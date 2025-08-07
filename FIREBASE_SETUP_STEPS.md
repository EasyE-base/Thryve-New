# Firebase Setup Steps

## 🎯 **Step-by-Step Firebase Setup**

### **Step 1: Create Firebase Project**

1. **Go to Firebase Console:**
   ```
   https://console.firebase.google.com/
   ```

2. **Create New Project:**
   - Click "Create a project"
   - Project name: `thryve-fitness`
   - Enable Google Analytics (optional)
   - Click "Create project"

### **Step 2: Enable Firestore Database**

1. **In Firebase Console:**
   - Go to "Firestore Database" in the left sidebar
   - Click "Create database"
   - Choose "Start in test mode" (we'll add security rules later)
   - Select a location (choose closest to your users)
   - Click "Done"

### **Step 3: Enable Authentication**

1. **In Firebase Console:**
   - Go to "Authentication" in the left sidebar
   - Click "Get started"
   - Go to "Sign-in method" tab
   - Enable "Email/Password"
   - Enable "Google" (optional)
   - Click "Save"

### **Step 4: Get Your Firebase Config**

1. **In Firebase Console:**
   - Go to "Project Settings" (gear icon)
   - Scroll down to "Your apps" section
   - Click "Add app" > "Web app"
   - App nickname: `thryve-web`
   - Click "Register app"
   - Copy the config object

2. **Update your `.env` file:**
   ```bash
   # Replace the fake values in .env with your real Firebase config:
   NEXT_PUBLIC_FIREBASE_API_KEY=your_real_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_real_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_real_app_id
   ```

### **Step 5: Deploy Security Rules**

1. **In Firebase Console:**
   - Go to "Firestore Database" > "Rules"
   - Replace the default rules with the content from `firestore-security-rules.txt`
   - Click "Publish"

### **Step 6: Test Connection**

1. **Run the test script:**
   ```bash
   node scripts/test-firestore-connection.js
   ```

2. **Expected output:**
   ```
   Firebase Config: {
     apiKey: 'SET',
     authDomain: 'SET',
     projectId: 'SET',
     storageBucket: 'SET',
     messagingSenderId: 'SET',
     appId: 'SET'
   }
   🔍 Testing Firestore connection...
   🔐 Authenticating...
   ✅ Authentication successful: [user-id]
   📖 Testing read access...
   ✅ Firestore connection successful!
   Found 0 documents in users collection
   ✍️ Testing write access...
   ✅ Write access successful! Document ID: [document-id]
   ```

### **Step 7: Set Up Sample Data**

1. **Run the instructor marketplace setup:**
   ```bash
   node scripts/setup-instructor-marketplace.js
   ```

## 🎉 **Once Complete:**

Your instructor invitation system will be **100% functional** with:
- Real instructor marketplace data
- Live invitation tracking
- Email notifications
- Real-time analytics
- Complete invitation workflow

## ⚠️ **Important Notes:**

1. **Security Rules:** The rules in `firestore-security-rules.txt` are production-ready
2. **Authentication:** Users can sign up with email/password or Google
3. **Data Structure:** All collections are properly structured for the invitation system
4. **Testing:** The system will work immediately once Firebase is connected

## 🚀 **Estimated Time:**
- **Firebase Setup:** 10 minutes
- **Config Update:** 2 minutes
- **Testing:** 5 minutes
- **Total:** ~17 minutes to have a fully functional system 