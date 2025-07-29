#!/usr/bin/env python3

import requests
import json
import time
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://3fc0018d-7103-4d9d-bf5e-c269670ae862.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/server-api"

# Test data for different roles
TEST_USERS = {
    'customer': {
        'uid': 'test-customer-uid-001',
        'email': 'customer@test.com',
        'role': 'customer',
        'profileData': {
            'firstName': 'John',
            'lastName': 'Customer',
            'fitnessGoals': ['weight_loss', 'strength'],
            'healthRestrictions': ['none'],
            'emergencyContact': {
                'name': 'Jane Customer',
                'phone': '555-0123'
            },
            'notifications': {
                'email': True,
                'sms': False
            }
        }
    },
    'instructor': {
        'uid': 'test-instructor-uid-001', 
        'email': 'instructor@test.com',
        'role': 'instructor',
        'profileData': {
            'firstName': 'Sarah',
            'lastName': 'Instructor',
            'certifications': [
                {'name': 'RYT-500', 'issuer': 'Yoga Alliance', 'year': 2020}
            ],
            'specialties': ['Vinyasa Yoga', 'Meditation'],
            'teachingPreferences': {
                'classSize': 'small',
                'musicStyle': 'ambient'
            },
            'availability': {
                'monday': ['09:00', '18:00'],
                'tuesday': ['09:00', '18:00']
            },
            'verification': {
                'insurance': True,
                'background_check': True
            }
        }
    },
    'merchant': {
        'uid': 'test-merchant-uid-001',
        'email': 'merchant@test.com', 
        'role': 'merchant',
        'profileData': {
            'businessName': 'Test Fitness Studio',
            'businessInfo': {
                'type': 'fitness_studio',
                'description': 'A premium fitness studio'
            },
            'location': {
                'address': '123 Fitness St',
                'city': 'San Francisco',
                'state': 'CA'
            },
            'facilityDetails': {
                'capacity': 50,
                'amenities': ['parking', 'showers']
            },
            'operatingHours': {
                'monday': {'open': '06:00', 'close': '22:00'}
            },
            'policies': {
                'cancellation': '24 hours',
                'late_policy': 'strict'
            }
        }
    }
}

def make_request(method, endpoint, data=None, headers=None, auth_token=None):
    """Make HTTP request with proper error handling"""
    url = f"{API_BASE}{endpoint}"
    
    default_headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    
    if headers:
        default_headers.update(headers)
        
    if auth_token:
        default_headers['Authorization'] = f'Bearer {auth_token}'
    
    try:
        if method == 'GET':
            response = requests.get(url, headers=default_headers, timeout=30)
        elif method == 'POST':
            response = requests.post(url, json=data, headers=default_headers, timeout=30)
        elif method == 'PUT':
            response = requests.put(url, json=data, headers=default_headers, timeout=30)
        elif method == 'DELETE':
            response = requests.delete(url, headers=default_headers, timeout=30)
        else:
            raise ValueError(f"Unsupported method: {method}")
            
        return response
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        return None

def test_onboarding_status_endpoint():
    """Test the GET /server-api/onboarding/status endpoint comprehensively"""
    print("\n" + "="*80)
    print("🧪 TESTING: GET /server-api/onboarding/status - Comprehensive Onboarding Status Testing")
    print("="*80)
    
    test_results = []
    
    # Test 1: Unauthenticated request should return 401
    print("\n📋 Test 1: Unauthenticated Access")
    response = make_request('GET', '/onboarding/status')
    if response and response.status_code == 401:
        print("✅ PASS: Correctly returns 401 for unauthenticated requests")
        test_results.append(True)
    else:
        print(f"❌ FAIL: Expected 401, got {response.status_code if response else 'No response'}")
        test_results.append(False)
    
    # Test 2: Authenticated request without profile (new user)
    print("\n📋 Test 2: New User Without Profile")
    mock_token = "mock-firebase-token-new-user"
    response = make_request('GET', '/onboarding/status', auth_token=mock_token)
    
    if response and response.status_code == 200:
        data = response.json()
        expected_fields = ['onboarding_complete', 'current_step', 'completed_steps', 'total_steps', 'profile_data', 'last_saved']
        
        if all(field in data for field in expected_fields):
            if (data['onboarding_complete'] == False and 
                data['current_step'] == 1 and 
                data['completed_steps'] == [] and
                data['total_steps'] == 3 and  # Default for new users
                data['profile_data'] is None):
                print("✅ PASS: Correct default structure for new users")
                print(f"   📊 Response: {json.dumps(data, indent=2)}")
                test_results.append(True)
            else:
                print("❌ FAIL: Incorrect default values for new users")
                print(f"   📊 Response: {json.dumps(data, indent=2)}")
                test_results.append(False)
        else:
            print("❌ FAIL: Missing required fields in response")
            test_results.append(False)
    else:
        print(f"❌ FAIL: Expected 200, got {response.status_code if response else 'No response'}")
        test_results.append(False)
    
    # Test 3-5: Test role-specific total_steps
    for role, expected_steps in [('customer', 4), ('instructor', 5), ('merchant', 6)]:
        print(f"\n📋 Test {3 + ['customer', 'instructor', 'merchant'].index(role)}: {role.title()} Role - {expected_steps} Steps")
        
        # First complete onboarding for this role
        user_data = TEST_USERS[role]
        complete_response = make_request('POST', '/onboarding/complete', 
                                       data={'role': role, 'profileData': user_data['profileData']},
                                       auth_token=mock_token)
        
        if complete_response and complete_response.status_code == 200:
            # Now check status
            status_response = make_request('GET', '/onboarding/status', auth_token=mock_token)
            
            if status_response and status_response.status_code == 200:
                status_data = status_response.json()
                
                if (status_data.get('total_steps') == expected_steps and
                    status_data.get('user_role') == role and
                    status_data.get('onboarding_complete') == True and
                    status_data.get('current_step') == expected_steps and
                    len(status_data.get('completed_steps', [])) == expected_steps):
                    print(f"✅ PASS: Correct {expected_steps}-step flow for {role}")
                    print(f"   📊 Total Steps: {status_data.get('total_steps')}")
                    print(f"   📊 Current Step: {status_data.get('current_step')}")
                    print(f"   📊 Completed Steps: {status_data.get('completed_steps')}")
                    print(f"   📊 User Role: {status_data.get('user_role')}")
                    test_results.append(True)
                else:
                    print(f"❌ FAIL: Incorrect step configuration for {role}")
                    print(f"   📊 Response: {json.dumps(status_data, indent=2)}")
                    test_results.append(False)
            else:
                print(f"❌ FAIL: Status check failed for {role}")
                test_results.append(False)
        else:
            print(f"❌ FAIL: Onboarding completion failed for {role}")
            test_results.append(False)
    
    # Test 6: Profile data persistence
    print(f"\n📋 Test 6: Profile Data Persistence")
    status_response = make_request('GET', '/onboarding/status', auth_token=mock_token)
    
    if status_response and status_response.status_code == 200:
        status_data = status_response.json()
        profile_data = status_data.get('profile_data')
        
        if profile_data and 'businessName' in profile_data:
            print("✅ PASS: Profile data correctly persisted and retrieved")
            print(f"   📊 Business Name: {profile_data.get('businessName')}")
            test_results.append(True)
        else:
            print("❌ FAIL: Profile data not properly persisted")
            print(f"   📊 Profile Data: {profile_data}")
            test_results.append(False)
    else:
        print("❌ FAIL: Could not retrieve status for profile data test")
        test_results.append(False)
    
    # Test 7: Response structure validation
    print(f"\n📋 Test 7: Complete Response Structure Validation")
    status_response = make_request('GET', '/onboarding/status', auth_token=mock_token)
    
    if status_response and status_response.status_code == 200:
        status_data = status_response.json()
        required_fields = [
            'onboarding_complete', 'current_step', 'completed_steps', 
            'total_steps', 'profile_data', 'last_saved', 'user_role'
        ]
        
        missing_fields = [field for field in required_fields if field not in status_data]
        
        if not missing_fields:
            print("✅ PASS: All required fields present in response")
            print(f"   📊 Fields: {list(status_data.keys())}")
            test_results.append(True)
        else:
            print(f"❌ FAIL: Missing required fields: {missing_fields}")
            test_results.append(False)
    else:
        print("❌ FAIL: Could not retrieve status for structure validation")
        test_results.append(False)
    
    # Summary
    passed_tests = sum(test_results)
    total_tests = len(test_results)
    success_rate = (passed_tests / total_tests) * 100
    
    print(f"\n" + "="*80)
    print(f"📊 ONBOARDING STATUS ENDPOINT TEST SUMMARY")
    print(f"="*80)
    print(f"✅ Passed: {passed_tests}/{total_tests} tests ({success_rate:.1f}%)")
    
    if success_rate == 100:
        print("🎉 ALL TESTS PASSED! Onboarding status endpoint is working perfectly.")
    elif success_rate >= 80:
        print("⚠️  Most tests passed with minor issues.")
    else:
        print("❌ CRITICAL ISSUES FOUND! Onboarding status endpoint needs attention.")
    
    return success_rate >= 80

def test_end_to_end_onboarding_flow():
    """Test complete end-to-end onboarding flow"""
    print("\n" + "="*80)
    print("🔄 TESTING: End-to-End Onboarding Flow")
    print("="*80)
    
    test_results = []
    mock_token = "mock-firebase-token-e2e"
    
    for role in ['customer', 'instructor', 'merchant']:
        print(f"\n📋 Testing {role.title()} End-to-End Flow")
        
        # Step 1: Check initial status (should be incomplete)
        print(f"   🔍 Step 1: Initial status check")
        initial_status = make_request('GET', '/onboarding/status', auth_token=mock_token)
        
        if initial_status and initial_status.status_code == 200:
            initial_data = initial_status.json()
            if not initial_data.get('onboarding_complete', True):
                print(f"   ✅ Initial status: Incomplete (as expected)")
            else:
                print(f"   ⚠️  Initial status: Already complete")
        
        # Step 2: Complete onboarding
        print(f"   🔄 Step 2: Complete onboarding")
        user_data = TEST_USERS[role]
        complete_response = make_request('POST', '/onboarding/complete',
                                       data={'role': role, 'profileData': user_data['profileData']},
                                       auth_token=mock_token)
        
        if complete_response and complete_response.status_code == 200:
            complete_data = complete_response.json()
            if 'redirect' in complete_data and f'/dashboard/{role}' in complete_data['redirect']:
                print(f"   ✅ Onboarding completed with correct redirect")
                test_results.append(True)
            else:
                print(f"   ❌ Onboarding completion response incorrect")
                test_results.append(False)
        else:
            print(f"   ❌ Onboarding completion failed")
            test_results.append(False)
            continue
        
        # Step 3: Verify final status
        print(f"   🔍 Step 3: Final status verification")
        final_status = make_request('GET', '/onboarding/status', auth_token=mock_token)
        
        if final_status and final_status.status_code == 200:
            final_data = final_status.json()
            expected_steps = {'customer': 4, 'instructor': 5, 'merchant': 6}[role]
            
            if (final_data.get('onboarding_complete') == True and
                final_data.get('current_step') == expected_steps and
                len(final_data.get('completed_steps', [])) == expected_steps and
                final_data.get('total_steps') == expected_steps):
                print(f"   ✅ Final status: Complete with correct step counts")
                test_results.append(True)
            else:
                print(f"   ❌ Final status: Incorrect completion state")
                print(f"      📊 Data: {json.dumps(final_data, indent=6)}")
                test_results.append(False)
        else:
            print(f"   ❌ Final status check failed")
            test_results.append(False)
    
    # Summary
    passed_tests = sum(test_results)
    total_tests = len(test_results)
    success_rate = (passed_tests / total_tests) * 100
    
    print(f"\n" + "="*80)
    print(f"📊 END-TO-END FLOW TEST SUMMARY")
    print(f"="*80)
    print(f"✅ Passed: {passed_tests}/{total_tests} tests ({success_rate:.1f}%)")
    
    return success_rate >= 80

def test_performance_and_error_handling():
    """Test performance and error handling"""
    print("\n" + "="*80)
    print("⚡ TESTING: Performance & Error Handling")
    print("="*80)
    
    test_results = []
    mock_token = "mock-firebase-token-perf"
    
    # Performance test
    print("\n📋 Performance Test: Response Times")
    response_times = []
    
    for i in range(5):
        start_time = time.time()
        response = make_request('GET', '/onboarding/status', auth_token=mock_token)
        end_time = time.time()
        
        if response and response.status_code == 200:
            response_time = (end_time - start_time) * 1000  # Convert to ms
            response_times.append(response_time)
            print(f"   🔄 Request {i+1}: {response_time:.2f}ms")
    
    if response_times:
        avg_time = sum(response_times) / len(response_times)
        if avg_time < 1000:  # Less than 1 second
            print(f"   ✅ Average response time: {avg_time:.2f}ms (Good)")
            test_results.append(True)
        else:
            print(f"   ⚠️  Average response time: {avg_time:.2f}ms (Slow)")
            test_results.append(False)
    else:
        print("   ❌ No successful responses for performance test")
        test_results.append(False)
    
    # Error handling tests
    print("\n📋 Error Handling Tests")
    
    # Test invalid auth token
    print("   🔍 Invalid auth token")
    invalid_response = make_request('GET', '/onboarding/status', auth_token="invalid-token")
    if invalid_response and invalid_response.status_code == 401:
        print("   ✅ Correctly handles invalid auth token")
        test_results.append(True)
    else:
        print("   ❌ Does not properly handle invalid auth token")
        test_results.append(False)
    
    # Test malformed requests
    print("   🔍 Malformed completion request")
    malformed_response = make_request('POST', '/onboarding/complete',
                                    data={'invalid': 'data'},
                                    auth_token=mock_token)
    if malformed_response and malformed_response.status_code == 400:
        print("   ✅ Correctly handles malformed completion request")
        test_results.append(True)
    else:
        print("   ❌ Does not properly handle malformed requests")
        test_results.append(False)
    
    # Summary
    passed_tests = sum(test_results)
    total_tests = len(test_results)
    success_rate = (passed_tests / total_tests) * 100
    
    print(f"\n" + "="*80)
    print(f"📊 PERFORMANCE & ERROR HANDLING SUMMARY")
    print(f"="*80)
    print(f"✅ Passed: {passed_tests}/{total_tests} tests ({success_rate:.1f}%)")
    
    return success_rate >= 80

def main():
    """Run all onboarding system tests"""
    print("🚀 COMPREHENSIVE ONBOARDING SYSTEM TESTING")
    print("=" * 80)
    print(f"🌐 Testing against: {BASE_URL}")
    print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Run all test suites
    test_suites = [
        ("Onboarding Status Endpoint", test_onboarding_status_endpoint),
        ("End-to-End Onboarding Flow", test_end_to_end_onboarding_flow),
        ("Performance & Error Handling", test_performance_and_error_handling)
    ]
    
    results = []
    for suite_name, test_function in test_suites:
        print(f"\n🧪 Running: {suite_name}")
        try:
            result = test_function()
            results.append((suite_name, result))
        except Exception as e:
            print(f"❌ Test suite failed with exception: {e}")
            results.append((suite_name, False))
    
    # Final summary
    print("\n" + "="*80)
    print("🏁 FINAL TEST RESULTS SUMMARY")
    print("="*80)
    
    passed_suites = 0
    for suite_name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{status}: {suite_name}")
        if passed:
            passed_suites += 1
    
    overall_success_rate = (passed_suites / len(results)) * 100
    print(f"\n📊 Overall Success Rate: {passed_suites}/{len(results)} suites ({overall_success_rate:.1f}%)")
    
    if overall_success_rate == 100:
        print("🎉 ALL TEST SUITES PASSED! The onboarding system is working perfectly.")
        return 0
    elif overall_success_rate >= 80:
        print("⚠️  Most tests passed. Minor issues may need attention.")
        return 0
    else:
        print("❌ CRITICAL ISSUES FOUND! The onboarding system needs immediate attention.")
        return 1

if __name__ == "__main__":
    sys.exit(main())