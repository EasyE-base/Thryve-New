#!/usr/bin/env python3

"""
Role Authorization Scenarios Testing
Testing different scenarios that could cause the "Access denied: You must be a studio owner to create classes" error
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://3fc0018d-7103-4d9d-bf5e-c269670ae862.preview.emergentagent.com"
SERVER_API_URL = f"{BASE_URL}/server-api"

def test_scenario_1_no_profile():
    """Scenario 1: User has no profile in database"""
    print("🧪 SCENARIO 1: User with no profile in database")
    print("-" * 50)
    
    # First, let's create a user with no profile by using a different UID
    headers = {
        'Authorization': 'Bearer different-user-token',
        'Content-Type': 'application/json'
    }
    
    # Test debug endpoint first
    try:
        response = requests.get(f"{SERVER_API_URL}/debug/user-role", headers=headers)
        print(f"Debug endpoint status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Profile exists: {'Yes' if data.get('profile') else 'No'}")
            if not data.get('profile'):
                print("✅ Successfully simulated user with no profile")
                
                # Now test class creation
                class_data = {
                    "title": "Test Class",
                    "description": "Test description",
                    "type": "Yoga",
                    "location": "Test Studio",
                    "date": "2024-12-30",
                    "time": "10:00"
                }
                
                response = requests.post(f"{SERVER_API_URL}/studio/classes", 
                                       headers=headers, json=class_data)
                print(f"Class creation status: {response.status_code}")
                
                if response.status_code == 403:
                    data = response.json()
                    print(f"🚨 ACCESS DENIED ERROR REPRODUCED:")
                    print(f"Error: {data.get('error')}")
                    return True
                else:
                    print(f"Unexpected response: {response.text}")
                    
    except Exception as e:
        print(f"Exception: {e}")
    
    return False

def test_scenario_2_wrong_role():
    """Scenario 2: User has wrong role (customer/instructor instead of merchant)"""
    print("\n🧪 SCENARIO 2: User with wrong role")
    print("-" * 50)
    
    # Create a user with customer role
    test_users = [
        {"uid": "customer-user", "email": "customer@test.com", "role": "customer"},
        {"uid": "instructor-user", "email": "instructor@test.com", "role": "instructor"}
    ]
    
    for user in test_users:
        print(f"\nTesting user with role: {user['role']}")
        
        # First create the user with wrong role
        try:
            response = requests.post(f"{SERVER_API_URL}/auth/firebase-role", json=user)
            if response.status_code == 200:
                print(f"✅ Created user with {user['role']} role")
                
                # Test class creation with this user
                headers = {
                    'Authorization': f"Bearer {user['uid']}-token",
                    'Content-Type': 'application/json'
                }
                
                class_data = {
                    "title": "Test Class",
                    "description": "Test description", 
                    "type": "Yoga",
                    "location": "Test Studio",
                    "date": "2024-12-30",
                    "time": "10:00"
                }
                
                response = requests.post(f"{SERVER_API_URL}/studio/classes", 
                                       headers=headers, json=class_data)
                print(f"Class creation status: {response.status_code}")
                
                if response.status_code == 403:
                    data = response.json()
                    print(f"🚨 ACCESS DENIED ERROR REPRODUCED:")
                    print(f"Error: {data.get('error')}")
                    if "studio owner" in data.get('error', '').lower():
                        print("✅ This matches the reported error message")
                        return True
                else:
                    print(f"Response: {response.text}")
                    
        except Exception as e:
            print(f"Exception: {e}")
    
    return False

def test_scenario_3_incomplete_onboarding():
    """Scenario 3: User has merchant role but incomplete onboarding"""
    print("\n🧪 SCENARIO 3: Merchant with incomplete onboarding")
    print("-" * 50)
    
    # Create a merchant user but don't complete onboarding
    user_data = {
        "uid": "incomplete-merchant",
        "email": "incomplete@test.com", 
        "role": "merchant"
    }
    
    try:
        # Create user with merchant role
        response = requests.post(f"{SERVER_API_URL}/auth/firebase-role", json=user_data)
        if response.status_code == 200:
            print("✅ Created merchant user without completing onboarding")
            
            # Test class creation
            headers = {
                'Authorization': 'Bearer incomplete-merchant-token',
                'Content-Type': 'application/json'
            }
            
            class_data = {
                "title": "Test Class",
                "description": "Test description",
                "type": "Yoga", 
                "location": "Test Studio",
                "date": "2024-12-30",
                "time": "10:00"
            }
            
            response = requests.post(f"{SERVER_API_URL}/studio/classes", 
                                   headers=headers, json=class_data)
            print(f"Class creation status: {response.status_code}")
            
            if response.status_code == 403:
                data = response.json()
                print(f"🚨 ACCESS DENIED ERROR REPRODUCED:")
                print(f"Error: {data.get('error')}")
                return True
            else:
                print(f"Response: {response.text}")
                
    except Exception as e:
        print(f"Exception: {e}")
    
    return False

def test_scenario_4_authentication_issues():
    """Scenario 4: Authentication token issues"""
    print("\n🧪 SCENARIO 4: Authentication token issues")
    print("-" * 50)
    
    test_cases = [
        {"name": "No Authorization Header", "headers": {'Content-Type': 'application/json'}},
        {"name": "Invalid Token Format", "headers": {'Authorization': 'invalid-token', 'Content-Type': 'application/json'}},
        {"name": "Empty Bearer Token", "headers": {'Authorization': 'Bearer ', 'Content-Type': 'application/json'}},
        {"name": "Malformed Bearer", "headers": {'Authorization': 'Bearer', 'Content-Type': 'application/json'}}
    ]
    
    class_data = {
        "title": "Test Class",
        "description": "Test description",
        "type": "Yoga",
        "location": "Test Studio", 
        "date": "2024-12-30",
        "time": "10:00"
    }
    
    for test_case in test_cases:
        print(f"\nTesting: {test_case['name']}")
        
        try:
            response = requests.post(f"{SERVER_API_URL}/studio/classes", 
                                   headers=test_case['headers'], json=class_data)
            print(f"Status: {response.status_code}")
            
            if response.status_code == 401:
                data = response.json()
                print(f"Authentication error: {data.get('error')}")
            elif response.status_code == 403:
                data = response.json()
                print(f"🚨 ACCESS DENIED: {data.get('error')}")
            else:
                print(f"Response: {response.text}")
                
        except Exception as e:
            print(f"Exception: {e}")

def test_scenario_5_database_issues():
    """Scenario 5: Database connectivity or query issues"""
    print("\n🧪 SCENARIO 5: Database connectivity simulation")
    print("-" * 50)
    
    print("📋 This scenario would require:")
    print("   - Database connection failures")
    print("   - Profile collection query failures")
    print("   - Network timeouts during profile lookup")
    print("   - MongoDB service interruptions")
    print("\n⚠️ These cannot be easily simulated in this test environment")
    print("   but would result in 500 errors or authentication failures")

def test_current_working_scenario():
    """Test the current working scenario for comparison"""
    print("\n🧪 CURRENT WORKING SCENARIO: Properly configured merchant")
    print("-" * 50)
    
    headers = {
        'Authorization': 'Bearer mock-firebase-token',
        'Content-Type': 'application/json'
    }
    
    # Test debug endpoint
    try:
        response = requests.get(f"{SERVER_API_URL}/debug/user-role", headers=headers)
        if response.status_code == 200:
            data = response.json()
            profile = data.get('profile', {})
            print(f"✅ Profile exists: {bool(profile)}")
            print(f"✅ Role: {profile.get('role')}")
            print(f"✅ Onboarding complete: {profile.get('onboarding_complete')}")
            
            # Test class creation
            class_data = {
                "title": "Working Test Class",
                "description": "This should work",
                "type": "Yoga",
                "location": "Test Studio",
                "date": "2024-12-30", 
                "time": "10:00"
            }
            
            response = requests.post(f"{SERVER_API_URL}/studio/classes", 
                                   headers=headers, json=class_data)
            print(f"✅ Class creation status: {response.status_code}")
            
            if response.status_code == 200:
                print("✅ Class creation successful - this is the expected behavior")
                return True
            else:
                print(f"❌ Unexpected failure: {response.text}")
                
    except Exception as e:
        print(f"Exception: {e}")
    
    return False

def main():
    """Main test execution"""
    print("🚀 STARTING ROLE AUTHORIZATION SCENARIOS TESTING")
    print(f"📅 Test Time: {datetime.now().isoformat()}")
    print("=" * 80)
    
    scenarios_results = []
    
    try:
        # Test different scenarios that could cause the access denied error
        scenarios_results.append(("No Profile", test_scenario_1_no_profile()))
        scenarios_results.append(("Wrong Role", test_scenario_2_wrong_role()))
        scenarios_results.append(("Incomplete Onboarding", test_scenario_3_incomplete_onboarding()))
        
        test_scenario_4_authentication_issues()
        test_scenario_5_database_issues()
        
        # Test current working scenario
        scenarios_results.append(("Current Working", test_current_working_scenario()))
        
        print("\n" + "=" * 80)
        print("📋 SCENARIO TEST RESULTS")
        print("=" * 80)
        
        reproduced_scenarios = []
        for scenario, reproduced in scenarios_results:
            status = "🚨 REPRODUCED" if reproduced else "✅ No Issue"
            print(f"{status}: {scenario}")
            if reproduced:
                reproduced_scenarios.append(scenario)
        
        print("\n🔍 ANALYSIS:")
        if reproduced_scenarios:
            print(f"✅ Successfully reproduced the error in scenarios: {', '.join(reproduced_scenarios)}")
            print("🎯 ROOT CAUSE IDENTIFIED:")
            print("   The 'Access denied: You must be a studio owner to create classes' error occurs when:")
            print("   1. User profile doesn't exist in the database, OR")
            print("   2. User has a role other than 'merchant' (customer/instructor), OR") 
            print("   3. User has merchant role but incomplete onboarding")
        else:
            print("⚠️ Could not reproduce the exact error in test scenarios")
            print("🔍 POSSIBLE EXPLANATIONS:")
            print("   1. The user's issue has been resolved since the report")
            print("   2. The issue is intermittent or environment-specific")
            print("   3. The issue occurs with real Firebase authentication vs mock tokens")
            print("   4. Database connectivity issues during profile lookup")
        
        print("\n🛠️ RECOMMENDATIONS:")
        print("   1. Verify user profile exists and has 'merchant' role")
        print("   2. Check if onboarding was completed successfully")
        print("   3. Validate Firebase authentication token")
        print("   4. Monitor database connectivity and query performance")
        print("   5. Add better error logging for profile lookup failures")
        
        return True
        
    except Exception as e:
        print(f"\n❌ TESTING FAILED: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)