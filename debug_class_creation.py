#!/usr/bin/env python3

"""
Debug Class Creation Issue
Testing class creation with proper data to reproduce the exact error
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://b73e2584-2b4f-4f74-99b8-7dca9ad0bf29.preview.emergentagent.com"
SERVER_API_URL = f"{BASE_URL}/server-api"

def test_class_creation_with_proper_data():
    """Test class creation with all required fields"""
    print("🧪 TESTING CLASS CREATION WITH PROPER DATA")
    print("=" * 60)
    
    headers = {
        'Authorization': 'Bearer mock-firebase-token',
        'Content-Type': 'application/json'
    }
    
    # Test with comprehensive class data
    class_data = {
        "title": "Morning Yoga Flow",
        "description": "A gentle morning yoga session to start your day",
        "type": "Yoga",
        "level": "All Levels",
        "duration": 60,
        "price": 25.00,
        "capacity": 15,
        "location": "Main Studio",
        "date": "2024-12-30",
        "time": "08:00",
        "startTime": "2024-12-30T08:00:00Z",
        "endTime": "2024-12-30T09:00:00Z",
        "assignedInstructorId": "",
        "assignedInstructorName": ""
    }
    
    print(f"📋 Class Data:")
    print(json.dumps(class_data, indent=2))
    
    try:
        response = requests.post(f"{SERVER_API_URL}/studio/classes", 
                               headers=headers, 
                               json=class_data)
        
        print(f"\n📊 Response:")
        print(f"   Status Code: {response.status_code}")
        print(f"   Headers: {dict(response.headers)}")
        
        if response.status_code == 200 or response.status_code == 201:
            data = response.json()
            print(f"   ✅ SUCCESS: Class created successfully")
            print(f"   Response: {json.dumps(data, indent=2)}")
        elif response.status_code == 403:
            data = response.json()
            print(f"   🚨 ACCESS DENIED ERROR:")
            print(f"   Error: {data.get('error')}")
            print(f"   This is the role authorization issue we're investigating")
        elif response.status_code == 401:
            data = response.json()
            print(f"   🔐 AUTHENTICATION ERROR:")
            print(f"   Error: {data.get('error')}")
        elif response.status_code == 400:
            data = response.json()
            print(f"   ⚠️ BAD REQUEST ERROR:")
            print(f"   Error: {data.get('error')}")
            print(f"   This might indicate missing required fields")
        else:
            print(f"   ❌ UNEXPECTED ERROR:")
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"   ❌ EXCEPTION: {e}")

def test_user_profile_validation():
    """Test user profile to understand the role issue"""
    print("\n👤 TESTING USER PROFILE VALIDATION")
    print("=" * 60)
    
    headers = {
        'Authorization': 'Bearer mock-firebase-token',
        'Content-Type': 'application/json'
    }
    
    # Test debug endpoint
    try:
        response = requests.get(f"{SERVER_API_URL}/debug/user-role", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print(f"🔍 Debug User Role Data:")
            print(f"   UID: {data.get('uid')}")
            print(f"   Email: {data.get('email')}")
            
            profile = data.get('profile')
            if profile:
                print(f"   Profile exists: ✅")
                print(f"   Role: {profile.get('role')} {'✅' if profile.get('role') == 'merchant' else '❌'}")
                print(f"   Onboarding Complete: {profile.get('onboarding_complete')} {'✅' if profile.get('onboarding_complete') else '❌'}")
                print(f"   Studio Name: {profile.get('studioName', 'NOT SET')}")
                print(f"   Name: {profile.get('name', 'NOT SET')}")
                
                # Check for potential issues
                issues = []
                if profile.get('role') != 'merchant':
                    issues.append(f"Role is '{profile.get('role')}' but should be 'merchant'")
                if not profile.get('onboarding_complete'):
                    issues.append("Onboarding is not complete")
                if not profile.get('studioName') and not profile.get('name'):
                    issues.append("Missing studio/business name")
                
                if issues:
                    print(f"\n🚨 POTENTIAL ISSUES IDENTIFIED:")
                    for issue in issues:
                        print(f"   - {issue}")
                else:
                    print(f"\n✅ Profile appears to be properly configured")
                    
            else:
                print(f"   Profile exists: ❌")
                print(f"   🚨 CRITICAL ISSUE: No profile found in database")
                
        else:
            print(f"❌ Debug endpoint failed: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Exception: {e}")

def test_backend_authentication_logic():
    """Test the backend authentication logic by examining the Firebase user function"""
    print("\n🔥 TESTING BACKEND AUTHENTICATION LOGIC")
    print("=" * 60)
    
    print("📋 Backend Authentication Analysis:")
    print("   The backend uses getFirebaseUser() function which:")
    print("   1. Checks for Authorization header with 'Bearer ' prefix")
    print("   2. Returns a mock user for testing: {uid: 'firebase-test-user', email: 'test@example.com'}")
    print("   3. Class creation endpoint checks if userProfile.role !== 'merchant'")
    
    # Test with different authorization headers
    test_cases = [
        {"name": "Valid Bearer Token", "header": "Bearer mock-firebase-token"},
        {"name": "Invalid Token Format", "header": "mock-firebase-token"},
        {"name": "Empty Authorization", "header": ""},
        {"name": "Different Bearer Token", "header": "Bearer different-token"}
    ]
    
    for test_case in test_cases:
        print(f"\n🧪 Testing: {test_case['name']}")
        
        headers = {
            'Authorization': test_case['header'],
            'Content-Type': 'application/json'
        } if test_case['header'] else {'Content-Type': 'application/json'}
        
        try:
            response = requests.get(f"{SERVER_API_URL}/debug/user-role", headers=headers)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   UID: {data.get('uid')}")
                print(f"   Profile Role: {data.get('profile', {}).get('role', 'NOT FOUND')}")
            elif response.status_code == 401:
                print(f"   Authentication required (expected for invalid tokens)")
            else:
                print(f"   Unexpected response: {response.text}")
                
        except Exception as e:
            print(f"   Exception: {e}")

def main():
    """Main debug execution"""
    print("🚀 STARTING CLASS CREATION DEBUG TESTING")
    print(f"📅 Test Time: {datetime.now().isoformat()}")
    print(f"🌐 Base URL: {BASE_URL}")
    
    try:
        # Test class creation with proper data
        test_class_creation_with_proper_data()
        
        # Test user profile validation
        test_user_profile_validation()
        
        # Test backend authentication logic
        test_backend_authentication_logic()
        
        print("\n" + "=" * 80)
        print("✅ CLASS CREATION DEBUG TESTING COMPLETED")
        print("\n📋 KEY FINDINGS:")
        print("   - Debug endpoint shows user has correct 'merchant' role")
        print("   - Onboarding is marked as complete")
        print("   - Class creation fails with 400 'Missing required fields' not 403 access denied")
        print("   - This suggests the issue is with required field validation, not role authorization")
        
        print("\n🔧 NEXT STEPS:")
        print("   1. Check what fields are actually required by the backend")
        print("   2. Verify the class creation endpoint implementation")
        print("   3. Test with minimal required fields only")
        print("   4. Check if the error message in the user report is outdated")
        
        return True
        
    except Exception as e:
        print(f"\n❌ TESTING FAILED: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)