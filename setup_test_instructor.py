#!/usr/bin/env python3

import requests
import json

# Configuration
BASE_URL = "https://fc28d640-ef87-49de-b108-ffb68044b135.preview.emergentagent.com"
SERVER_API_BASE = f"{BASE_URL}/server-api"

def setup_test_instructor():
    """Create a test instructor profile for testing"""
    print("🔧 Setting up test instructor profile...")
    
    # Create instructor profile using the Firebase role management endpoint
    instructor_data = {
        "uid": "firebase-test-user",
        "email": "test@example.com",
        "role": "instructor"
    }
    
    try:
        response = requests.post(f"{SERVER_API_BASE}/auth/firebase-role", 
                               json=instructor_data, timeout=10)
        
        if response.status_code == 200:
            print("✅ Test instructor profile created successfully")
            print(f"   Response: {response.json()}")
            return True
        else:
            print(f"❌ Failed to create instructor profile: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error creating instructor profile: {str(e)}")
        return False

if __name__ == "__main__":
    setup_test_instructor()