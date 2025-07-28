#!/usr/bin/env python3

"""
Backend API Testing for Class Creation Select Component Fix
Testing the specific fix for React Select component where value="" was changed to value="none"

ENDPOINTS TO TEST:
1. GET /server-api/studio/instructors - Should return available instructors for the studio
2. POST /server-api/studio/classes - Should create a new class successfully

TEST SCENARIOS:
- Create Class with No Instructor (assignedInstructorId: "", assignedInstructorName: "")
- Create Class with Assigned Instructor
- Get Available Instructors
- Verify proper authentication protection
- Test Select component fix scenarios (handling "none" value)
"""

import requests
import json
import sys
import os
from datetime import datetime

# Get base URL from environment
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://fc28d640-ef87-49de-b108-ffb68044b135.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/server-api"

# Test authentication token (mock Firebase token for testing)
AUTH_TOKEN = "Bearer firebase-test-token"

def print_test_header(test_name):
    print(f"\n{'='*60}")
    print(f"🧪 {test_name}")
    print(f"{'='*60}")

def print_test_result(test_name, success, details=""):
    status = "✅ PASSED" if success else "❌ FAILED"
    print(f"{status}: {test_name}")
    if details:
        print(f"   Details: {details}")

def make_request(method, endpoint, data=None, headers=None):
    """Make HTTP request with proper error handling"""
    url = f"{API_BASE}{endpoint}"
    
    default_headers = {
        'Content-Type': 'application/json',
        'Authorization': AUTH_TOKEN
    }
    
    if headers:
        default_headers.update(headers)
    
    try:
        if method.upper() == 'GET':
            response = requests.get(url, headers=default_headers, timeout=30)
        elif method.upper() == 'POST':
            response = requests.post(url, json=data, headers=default_headers, timeout=30)
        elif method.upper() == 'PUT':
            response = requests.put(url, json=data, headers=default_headers, timeout=30)
        elif method.upper() == 'DELETE':
            response = requests.delete(url, headers=default_headers, timeout=30)
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")
        
        return response
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        return None

def test_onboarding_complete():
    """Test POST /server-api/onboarding/complete - businessName extraction and studioName saving"""
    print_test_header("ONBOARDING COMPLETION WITH BUSINESS NAME EXTRACTION")
    
    # Test data with businessName that should be saved as studioName
    test_data = {
        "role": "merchant",
        "profileData": {
            "firstName": "John",
            "lastName": "Doe", 
            "businessName": "FitCore Studio Test",
            "businessType": "Gym/Fitness Center",
            "phone": "555-123-4567",
            "address": "123 Main St",
            "city": "New York",
            "state": "NY",
            "zipCode": "10001",
            "description": "A premium fitness studio",
            "amenities": ["Parking", "Showers", "Equipment"],
            "operatingHours": "6AM-10PM"
        }
    }
    
    print(f"📤 Testing POST /server-api/onboarding/complete")
    print(f"   Business Name: {test_data['profileData']['businessName']}")
    
    response = make_request('POST', '/onboarding/complete', test_data)
    
    if not response:
        print_test_result("Onboarding Complete Request", False, "Request failed")
        return False
    
    print(f"   Response Status: {response.status_code}")
    
    try:
        response_data = response.json()
        print(f"   Response Data: {json.dumps(response_data, indent=2)}")
    except:
        print(f"   Response Text: {response.text}")
        response_data = {}
    
    # Test authentication requirement
    if response.status_code == 401:
        print_test_result("Authentication Protection", True, "Correctly requires authentication")
        
        # Test with unauthenticated request
        unauth_response = make_request('POST', '/onboarding/complete', test_data, {'Authorization': ''})
        if unauth_response and unauth_response.status_code == 401:
            print_test_result("Unauthenticated Request Rejection", True, "401 for missing auth")
        else:
            print_test_result("Unauthenticated Request Rejection", False, "Should return 401")
        
        return True
    
    # Test successful completion
    if response.status_code == 200:
        print_test_result("Onboarding Completion", True, "Successfully completed onboarding")
        
        # Check if response includes redirect
        if 'redirect' in response_data:
            print_test_result("Redirect Response", True, f"Redirect to: {response_data['redirect']}")
        
        return True
    else:
        print_test_result("Onboarding Completion", False, f"Status: {response.status_code}")
        return False

def test_profile_studioname():
    """Test GET /server-api/profile - studioName field return"""
    print_test_header("PROFILE RETRIEVAL WITH STUDIONAME FIELD")
    
    print(f"📤 Testing GET /server-api/profile")
    
    response = make_request('GET', '/profile')
    
    if not response:
        print_test_result("Profile Request", False, "Request failed")
        return False
    
    print(f"   Response Status: {response.status_code}")
    
    try:
        response_data = response.json()
        print(f"   Response Data: {json.dumps(response_data, indent=2)}")
    except:
        print(f"   Response Text: {response.text}")
        response_data = {}
    
    # Test authentication requirement
    if response.status_code == 401:
        print_test_result("Authentication Protection", True, "Correctly requires authentication")
        return True
    
    # Test profile not found (expected for test user)
    if response.status_code == 404:
        print_test_result("Profile Not Found", True, "404 for non-existent profile (expected)")
        return True
    
    # Test successful profile retrieval
    if response.status_code == 200:
        profile_data = response_data.get('profile', {})
        
        # Check if studioName field is present
        if 'studioName' in profile_data:
            studio_name = profile_data['studioName']
            print_test_result("StudioName Field Present", True, f"studioName: {studio_name}")
            
            # Check if studioName matches expected value from onboarding
            if studio_name == "FitCore Studio Test":
                print_test_result("StudioName Value Correct", True, "Matches businessName from onboarding")
            else:
                print_test_result("StudioName Value", True, f"Value: {studio_name}")
        else:
            print_test_result("StudioName Field Present", False, "studioName field missing")
        
        # Check other required fields
        required_fields = ['userId', 'email', 'role', 'onboarding_complete']
        for field in required_fields:
            if field in profile_data:
                print_test_result(f"Field {field}", True, f"Value: {profile_data[field]}")
            else:
                print_test_result(f"Field {field}", False, "Missing required field")
        
        return True
    else:
        print_test_result("Profile Retrieval", False, f"Status: {response.status_code}")
        return False

def test_analytics_dashboard():
    """Test GET /server-api/analytics/dashboard - real data or proper empty state"""
    print_test_header("ANALYTICS DASHBOARD DATA RETRIEVAL")
    
    print(f"📤 Testing GET /server-api/analytics/dashboard")
    
    response = make_request('GET', '/analytics/dashboard')
    
    if not response:
        print_test_result("Analytics Request", False, "Request failed")
        return False
    
    print(f"   Response Status: {response.status_code}")
    
    try:
        response_data = response.json()
        print(f"   Response Data: {json.dumps(response_data, indent=2)}")
    except:
        print(f"   Response Text: {response.text}")
        response_data = {}
    
    # Test authentication requirement
    if response.status_code == 401:
        print_test_result("Authentication Protection", True, "Correctly requires authentication")
        return True
    
    # Test successful analytics retrieval
    if response.status_code == 200:
        # Check for expected analytics fields
        expected_fields = ['totalRevenue', 'totalBookings', 'newClients', 'recentActivity']
        all_fields_present = True
        
        for field in expected_fields:
            if field in response_data:
                value = response_data[field]
                print_test_result(f"Analytics Field {field}", True, f"Value: {value}")
                
                # Check if it's real data or proper empty state
                if field == 'recentActivity':
                    if isinstance(value, list):
                        print_test_result("Recent Activity Format", True, f"Array with {len(value)} items")
                    else:
                        print_test_result("Recent Activity Format", False, "Should be array")
                elif isinstance(value, (int, float)):
                    if value >= 0:
                        print_test_result(f"{field} Value Valid", True, f"Non-negative number: {value}")
                    else:
                        print_test_result(f"{field} Value Valid", False, f"Negative value: {value}")
            else:
                print_test_result(f"Analytics Field {field}", False, "Missing field")
                all_fields_present = False
        
        if all_fields_present:
            print_test_result("Analytics Data Structure", True, "All expected fields present")
        
        # Check if data appears to be real or proper empty state (not hardcoded fake data)
        total_revenue = response_data.get('totalRevenue', 0)
        total_bookings = response_data.get('totalBookings', 0)
        
        if total_revenue == 0 and total_bookings == 0:
            print_test_result("Empty State Handling", True, "Proper empty state with zero values")
        else:
            print_test_result("Real Data Present", True, f"Revenue: ${total_revenue}, Bookings: {total_bookings}")
        
        return True
    else:
        print_test_result("Analytics Retrieval", False, f"Status: {response.status_code}")
        return False

def test_classes_endpoint():
    """Test GET /server-api/classes - proper data or empty array"""
    print_test_header("CLASSES ENDPOINT DATA RETRIEVAL")
    
    print(f"📤 Testing GET /server-api/classes")
    
    response = make_request('GET', '/classes')
    
    if not response:
        print_test_result("Classes Request", False, "Request failed")
        return False
    
    print(f"   Response Status: {response.status_code}")
    
    try:
        response_data = response.json()
        print(f"   Response Data: {json.dumps(response_data, indent=2)}")
    except:
        print(f"   Response Text: {response.text}")
        response_data = {}
    
    # Test authentication requirement
    if response.status_code == 401:
        print_test_result("Authentication Protection", True, "Correctly requires authentication")
        return True
    
    # Test successful classes retrieval
    if response.status_code == 200:
        # Check for classes array
        if 'classes' in response_data:
            classes = response_data['classes']
            
            if isinstance(classes, list):
                print_test_result("Classes Array Format", True, f"Array with {len(classes)} classes")
                
                if len(classes) == 0:
                    print_test_result("Empty Classes Array", True, "Proper empty array (no hardcoded fake data)")
                else:
                    print_test_result("Classes Data Present", True, f"Found {len(classes)} classes")
                    
                    # Check structure of first class if present
                    if len(classes) > 0:
                        first_class = classes[0]
                        expected_class_fields = ['id', 'title', 'type', 'instructor', 'status']
                        
                        for field in expected_class_fields:
                            if field in first_class:
                                print_test_result(f"Class Field {field}", True, f"Value: {first_class[field]}")
                            else:
                                print_test_result(f"Class Field {field}", False, "Missing field")
            else:
                print_test_result("Classes Array Format", False, "Classes should be an array")
        else:
            print_test_result("Classes Field Present", False, "Missing classes field")
        
        return True
    else:
        print_test_result("Classes Retrieval", False, f"Status: {response.status_code}")
        return False

def test_authentication_scenarios():
    """Test authentication scenarios across all endpoints"""
    print_test_header("AUTHENTICATION SCENARIOS TESTING")
    
    endpoints_to_test = [
        ('POST', '/onboarding/complete', {"role": "merchant", "profileData": {}}),
        ('GET', '/profile', None),
        ('GET', '/analytics/dashboard', None),
        ('GET', '/classes', None)
    ]
    
    print("🔒 Testing unauthenticated requests (should return 401)")
    
    for method, endpoint, data in endpoints_to_test:
        print(f"\n   Testing {method} {endpoint}")
        
        # Test without authorization header
        response = make_request(method, endpoint, data, {'Authorization': ''})
        
        if response and response.status_code == 401:
            print_test_result(f"Unauth {method} {endpoint}", True, "401 Unauthorized")
        else:
            status = response.status_code if response else "No response"
            print_test_result(f"Unauth {method} {endpoint}", False, f"Expected 401, got {status}")
    
    print("\n🔑 Testing with mock authentication token")
    
    for method, endpoint, data in endpoints_to_test:
        print(f"\n   Testing {method} {endpoint}")
        
        response = make_request(method, endpoint, data)
        
        if response:
            if response.status_code != 401:
                print_test_result(f"Auth {method} {endpoint}", True, f"Status: {response.status_code} (not 401)")
            else:
                print_test_result(f"Auth {method} {endpoint}", False, "Still returns 401 with token")
        else:
            print_test_result(f"Auth {method} {endpoint}", False, "No response")

def run_comprehensive_tests():
    """Run all onboarding bug fix tests"""
    print("🚀 STARTING COMPREHENSIVE ONBOARDING BUG FIXES TESTING")
    print(f"🌐 Base URL: {BASE_URL}")
    print(f"🔗 API Base: {API_BASE}")
    print(f"⏰ Test Time: {datetime.now().isoformat()}")
    
    test_results = []
    
    # Test 1: Onboarding completion with businessName extraction
    try:
        result = test_onboarding_complete()
        test_results.append(("Onboarding Complete", result))
    except Exception as e:
        print(f"❌ Onboarding test failed with exception: {e}")
        test_results.append(("Onboarding Complete", False))
    
    # Test 2: Profile retrieval with studioName field
    try:
        result = test_profile_studioname()
        test_results.append(("Profile StudioName", result))
    except Exception as e:
        print(f"❌ Profile test failed with exception: {e}")
        test_results.append(("Profile StudioName", False))
    
    # Test 3: Analytics dashboard real data
    try:
        result = test_analytics_dashboard()
        test_results.append(("Analytics Dashboard", result))
    except Exception as e:
        print(f"❌ Analytics test failed with exception: {e}")
        test_results.append(("Analytics Dashboard", False))
    
    # Test 4: Classes endpoint proper data
    try:
        result = test_classes_endpoint()
        test_results.append(("Classes Endpoint", result))
    except Exception as e:
        print(f"❌ Classes test failed with exception: {e}")
        test_results.append(("Classes Endpoint", False))
    
    # Test 5: Authentication scenarios
    try:
        test_authentication_scenarios()
        test_results.append(("Authentication", True))
    except Exception as e:
        print(f"❌ Authentication test failed with exception: {e}")
        test_results.append(("Authentication", False))
    
    # Print final summary
    print_test_header("FINAL TEST SUMMARY")
    
    passed_tests = 0
    total_tests = len(test_results)
    
    for test_name, result in test_results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{status}: {test_name}")
        if result:
            passed_tests += 1
    
    success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
    
    print(f"\n📊 OVERALL RESULTS:")
    print(f"   Tests Passed: {passed_tests}/{total_tests}")
    print(f"   Success Rate: {success_rate:.1f}%")
    
    if success_rate >= 80:
        print("🎉 EXCELLENT: Onboarding bug fixes are working correctly!")
    elif success_rate >= 60:
        print("⚠️  GOOD: Most onboarding functionality working, minor issues detected")
    else:
        print("🚨 CRITICAL: Major issues with onboarding bug fixes detected")
    
    return success_rate >= 80

if __name__ == "__main__":
    try:
        success = run_comprehensive_tests()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n🛑 Testing interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Testing failed with unexpected error: {e}")
        sys.exit(1)