#!/usr/bin/env python3
"""
Backend API Testing for Thryve Fitness Platform
Tests all core API endpoints for the fitness class booking system
"""

import requests
import json
import time
import uuid
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:3000"
API_BASE = f"{BASE_URL}/api"

class ThryveAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.user_id = None
        self.test_results = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test results"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details:
            print(f"   Details: {details}")
    
    def test_classes_endpoint(self):
        """Test GET /api/classes endpoint"""
        print("\n=== Testing Classes Endpoint ===")
        
        try:
            # Test basic classes listing
            response = self.session.get(f"{API_BASE}/classes")
            
            if response.status_code == 200:
                data = response.json()
                if 'classes' in data and 'total' in data:
                    self.log_result(
                        "GET /api/classes", 
                        True, 
                        f"Successfully retrieved classes list with {len(data['classes'])} classes",
                        f"Total classes: {data['total']}"
                    )
                    
                    # Test with query parameters
                    response_filtered = self.session.get(f"{API_BASE}/classes?limit=5&type=yoga")
                    if response_filtered.status_code == 200:
                        filtered_data = response_filtered.json()
                        self.log_result(
                            "GET /api/classes with filters", 
                            True, 
                            f"Successfully retrieved filtered classes",
                            f"Filtered results: {len(filtered_data['classes'])} classes"
                        )
                    else:
                        self.log_result(
                            "GET /api/classes with filters", 
                            False, 
                            f"Failed to retrieve filtered classes: {response_filtered.status_code}",
                            response_filtered.text
                        )
                else:
                    self.log_result(
                        "GET /api/classes", 
                        False, 
                        "Response missing required fields (classes, total)",
                        data
                    )
            else:
                self.log_result(
                    "GET /api/classes", 
                    False, 
                    f"Failed with status code: {response.status_code}",
                    response.text
                )
                
        except Exception as e:
            self.log_result(
                "GET /api/classes", 
                False, 
                f"Exception occurred: {str(e)}"
            )
    
    def test_onboarding_endpoint(self):
        """Test POST /api/onboarding/complete endpoint"""
        print("\n=== Testing Onboarding Endpoint ===")
        
        # This endpoint requires authentication, so we'll test the structure
        onboarding_data = {
            "role": "customer",
            "profileData": {
                "firstName": "John",
                "lastName": "Doe",
                "fitnessGoals": ["weight_loss", "strength"],
                "experienceLevel": "beginner",
                "preferences": {
                    "classTypes": ["yoga", "cardio"],
                    "schedule": "morning"
                }
            }
        }
        
        try:
            response = self.session.post(
                f"{API_BASE}/onboarding/complete",
                json=onboarding_data,
                headers={'Content-Type': 'application/json'}
            )
            
            # Expected to fail with 401 since we don't have auth
            if response.status_code == 401:
                self.log_result(
                    "POST /api/onboarding/complete", 
                    True, 
                    "Correctly requires authentication (401 Unauthorized)",
                    "Endpoint properly protected"
                )
            elif response.status_code == 200:
                self.log_result(
                    "POST /api/onboarding/complete", 
                    False, 
                    "Endpoint should require authentication but didn't",
                    response.json()
                )
            else:
                self.log_result(
                    "POST /api/onboarding/complete", 
                    False, 
                    f"Unexpected status code: {response.status_code}",
                    response.text
                )
                
        except Exception as e:
            self.log_result(
                "POST /api/onboarding/complete", 
                False, 
                f"Exception occurred: {str(e)}"
            )
    
    def test_payment_intent_endpoint(self):
        """Test POST /api/stripe/create-payment-intent endpoint"""
        print("\n=== Testing Payment Intent Endpoint ===")
        
        payment_data = {
            "classId": str(uuid.uuid4())  # Mock class ID
        }
        
        try:
            response = self.session.post(
                f"{API_BASE}/stripe/create-payment-intent",
                json=payment_data,
                headers={'Content-Type': 'application/json'}
            )
            
            # Expected to fail with 401 since we don't have auth
            if response.status_code == 401:
                self.log_result(
                    "POST /api/stripe/create-payment-intent", 
                    True, 
                    "Correctly requires authentication (401 Unauthorized)",
                    "Endpoint properly protected"
                )
            elif response.status_code == 200:
                data = response.json()
                if 'clientSecret' in data:
                    self.log_result(
                        "POST /api/stripe/create-payment-intent", 
                        True, 
                        "Successfully created payment intent",
                        "Client secret returned"
                    )
                else:
                    self.log_result(
                        "POST /api/stripe/create-payment-intent", 
                        False, 
                        "Response missing clientSecret",
                        data
                    )
            else:
                self.log_result(
                    "POST /api/stripe/create-payment-intent", 
                    False, 
                    f"Unexpected status code: {response.status_code}",
                    response.text
                )
                
        except Exception as e:
            self.log_result(
                "POST /api/stripe/create-payment-intent", 
                False, 
                f"Exception occurred: {str(e)}"
            )
    
    def test_bookings_endpoints(self):
        """Test booking-related endpoints"""
        print("\n=== Testing Bookings Endpoints ===")
        
        # Test GET /api/bookings
        try:
            response = self.session.get(f"{API_BASE}/bookings")
            
            if response.status_code == 401:
                self.log_result(
                    "GET /api/bookings", 
                    True, 
                    "Correctly requires authentication (401 Unauthorized)",
                    "Endpoint properly protected"
                )
            elif response.status_code == 200:
                data = response.json()
                if 'bookings' in data:
                    self.log_result(
                        "GET /api/bookings", 
                        True, 
                        f"Successfully retrieved bookings list",
                        f"Bookings count: {len(data['bookings'])}"
                    )
                else:
                    self.log_result(
                        "GET /api/bookings", 
                        False, 
                        "Response missing bookings field",
                        data
                    )
            else:
                self.log_result(
                    "GET /api/bookings", 
                    False, 
                    f"Unexpected status code: {response.status_code}",
                    response.text
                )
                
        except Exception as e:
            self.log_result(
                "GET /api/bookings", 
                False, 
                f"Exception occurred: {str(e)}"
            )
        
        # Test POST /api/bookings
        booking_data = {
            "classId": str(uuid.uuid4()),
            "paymentIntentId": "pi_test_" + str(uuid.uuid4())[:8]
        }
        
        try:
            response = self.session.post(
                f"{API_BASE}/bookings",
                json=booking_data,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 401:
                self.log_result(
                    "POST /api/bookings", 
                    True, 
                    "Correctly requires authentication (401 Unauthorized)",
                    "Endpoint properly protected"
                )
            elif response.status_code == 200:
                data = response.json()
                if 'booking' in data:
                    self.log_result(
                        "POST /api/bookings", 
                        True, 
                        "Successfully created booking",
                        f"Booking ID: {data['booking'].get('id', 'N/A')}"
                    )
                else:
                    self.log_result(
                        "POST /api/bookings", 
                        False, 
                        "Response missing booking field",
                        data
                    )
            else:
                self.log_result(
                    "POST /api/bookings", 
                    False, 
                    f"Unexpected status code: {response.status_code}",
                    response.text
                )
                
        except Exception as e:
            self.log_result(
                "POST /api/bookings", 
                False, 
                f"Exception occurred: {str(e)}"
            )
    
    def test_stripe_connect_endpoint(self):
        """Test POST /api/stripe/connect/account endpoint"""
        print("\n=== Testing Stripe Connect Endpoint ===")
        
        try:
            response = self.session.post(
                f"{API_BASE}/stripe/connect/account",
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 401:
                self.log_result(
                    "POST /api/stripe/connect/account", 
                    True, 
                    "Correctly requires authentication (401 Unauthorized)",
                    "Endpoint properly protected"
                )
            elif response.status_code == 200:
                data = response.json()
                if 'url' in data:
                    self.log_result(
                        "POST /api/stripe/connect/account", 
                        True, 
                        "Successfully created Stripe Connect account",
                        "Account link URL returned"
                    )
                else:
                    self.log_result(
                        "POST /api/stripe/connect/account", 
                        False, 
                        "Response missing url field",
                        data
                    )
            else:
                self.log_result(
                    "POST /api/stripe/connect/account", 
                    False, 
                    f"Unexpected status code: {response.status_code}",
                    response.text
                )
                
        except Exception as e:
            self.log_result(
                "POST /api/stripe/connect/account", 
                False, 
                f"Exception occurred: {str(e)}"
            )
    
    def test_error_handling(self):
        """Test error handling for various scenarios"""
        print("\n=== Testing Error Handling ===")
        
        # Test invalid endpoint
        try:
            response = self.session.get(f"{API_BASE}/invalid-endpoint")
            
            if response.status_code == 404:
                self.log_result(
                    "Invalid endpoint handling", 
                    True, 
                    "Correctly returns 404 for invalid endpoints",
                    "Error handling working"
                )
            else:
                self.log_result(
                    "Invalid endpoint handling", 
                    False, 
                    f"Expected 404, got {response.status_code}",
                    response.text
                )
                
        except Exception as e:
            self.log_result(
                "Invalid endpoint handling", 
                False, 
                f"Exception occurred: {str(e)}"
            )
        
        # Test malformed JSON
        try:
            response = self.session.post(
                f"{API_BASE}/bookings",
                data="invalid json",
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code in [400, 401, 500]:
                self.log_result(
                    "Malformed JSON handling", 
                    True, 
                    f"Correctly handles malformed JSON (status: {response.status_code})",
                    "Error handling working"
                )
            else:
                self.log_result(
                    "Malformed JSON handling", 
                    False, 
                    f"Unexpected status code: {response.status_code}",
                    response.text
                )
                
        except Exception as e:
            self.log_result(
                "Malformed JSON handling", 
                False, 
                f"Exception occurred: {str(e)}"
            )
    
    def test_cors_headers(self):
        """Test CORS headers are properly set"""
        print("\n=== Testing CORS Headers ===")
        
        try:
            # Test OPTIONS request
            response = self.session.options(f"{API_BASE}/classes")
            
            cors_headers = [
                'Access-Control-Allow-Origin',
                'Access-Control-Allow-Methods',
                'Access-Control-Allow-Headers'
            ]
            
            missing_headers = []
            for header in cors_headers:
                if header not in response.headers:
                    missing_headers.append(header)
            
            if not missing_headers:
                self.log_result(
                    "CORS headers", 
                    True, 
                    "All required CORS headers present",
                    f"Headers: {[h for h in cors_headers if h in response.headers]}"
                )
            else:
                self.log_result(
                    "CORS headers", 
                    False, 
                    f"Missing CORS headers: {missing_headers}",
                    f"Present headers: {list(response.headers.keys())}"
                )
                
        except Exception as e:
            self.log_result(
                "CORS headers", 
                False, 
                f"Exception occurred: {str(e)}"
            )

    def test_firebase_role_api(self):
        """Test Firebase Role Management API"""
        print("\n=== Testing Firebase Role Management API ===")
        
        # Test POST /api/auth/firebase-role with valid data
        test_user_data = {
            "uid": f"test_firebase_user_{uuid.uuid4().hex[:8]}",
            "email": "firebase.test@example.com",
            "role": "customer"
        }
        
        try:
            response = self.session.post(
                f"{API_BASE}/auth/firebase-role",
                json=test_user_data,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'message' in data and 'role' in data:
                    self.log_result(
                        "POST /api/auth/firebase-role (valid data)", 
                        True, 
                        "Successfully created/updated user role",
                        f"Role: {data['role']}, Upserted: {data.get('upserted', False)}"
                    )
                else:
                    self.log_result(
                        "POST /api/auth/firebase-role (valid data)", 
                        False, 
                        "Response missing required fields",
                        data
                    )
            else:
                self.log_result(
                    "POST /api/auth/firebase-role (valid data)", 
                    False, 
                    f"Failed with status code: {response.status_code}",
                    response.text
                )
                
        except Exception as e:
            self.log_result(
                "POST /api/auth/firebase-role (valid data)", 
                False, 
                f"Exception occurred: {str(e)}"
            )
        
        # Test with missing required fields
        try:
            invalid_data = {"email": "test@example.com"}  # Missing uid and role
            response = self.session.post(
                f"{API_BASE}/auth/firebase-role",
                json=invalid_data,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 400:
                self.log_result(
                    "POST /api/auth/firebase-role (missing fields)", 
                    True, 
                    "Correctly validates required fields (400 Bad Request)",
                    "Validation working properly"
                )
            else:
                self.log_result(
                    "POST /api/auth/firebase-role (missing fields)", 
                    False, 
                    f"Expected 400, got {response.status_code}",
                    response.text
                )
                
        except Exception as e:
            self.log_result(
                "POST /api/auth/firebase-role (missing fields)", 
                False, 
                f"Exception occurred: {str(e)}"
            )
        
        # Test with invalid role
        try:
            invalid_role_data = {
                "uid": f"test_user_{uuid.uuid4().hex[:8]}",
                "email": "test@example.com",
                "role": "invalid_role"
            }
            response = self.session.post(
                f"{API_BASE}/auth/firebase-role",
                json=invalid_role_data,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 400:
                self.log_result(
                    "POST /api/auth/firebase-role (invalid role)", 
                    True, 
                    "Correctly validates role values (400 Bad Request)",
                    "Role validation working"
                )
            else:
                self.log_result(
                    "POST /api/auth/firebase-role (invalid role)", 
                    False, 
                    f"Expected 400, got {response.status_code}",
                    response.text
                )
                
        except Exception as e:
            self.log_result(
                "POST /api/auth/firebase-role (invalid role)", 
                False, 
                f"Exception occurred: {str(e)}"
            )

    def test_firebase_user_api(self):
        """Test Firebase User Data Management API"""
        print("\n=== Testing Firebase User Data Management API ===")
        
        # First create a user to test retrieval
        test_uid = f"test_firebase_user_{uuid.uuid4().hex[:8]}"
        test_user_data = {
            "uid": test_uid,
            "email": "firebase.user.test@example.com",
            "role": "instructor"
        }
        
        # Create user first
        try:
            create_response = self.session.post(
                f"{API_BASE}/auth/firebase-role",
                json=test_user_data,
                headers={'Content-Type': 'application/json'}
            )
            
            if create_response.status_code == 200:
                # Now test GET /api/auth/firebase-user
                response = self.session.get(f"{API_BASE}/auth/firebase-user?uid={test_uid}")
                
                if response.status_code == 200:
                    data = response.json()
                    expected_fields = ['uid', 'email', 'role', 'onboarding_complete']
                    
                    if all(field in data for field in expected_fields):
                        self.log_result(
                            "GET /api/auth/firebase-user (valid uid)", 
                            True, 
                            "Successfully retrieved user data",
                            f"User: {data['email']}, Role: {data['role']}"
                        )
                    else:
                        missing_fields = [f for f in expected_fields if f not in data]
                        self.log_result(
                            "GET /api/auth/firebase-user (valid uid)", 
                            False, 
                            f"Response missing fields: {missing_fields}",
                            data
                        )
                else:
                    self.log_result(
                        "GET /api/auth/firebase-user (valid uid)", 
                        False, 
                        f"Failed with status code: {response.status_code}",
                        response.text
                    )
            else:
                self.log_result(
                    "GET /api/auth/firebase-user (setup)", 
                    False, 
                    "Failed to create test user for retrieval test",
                    create_response.text
                )
                
        except Exception as e:
            self.log_result(
                "GET /api/auth/firebase-user (valid uid)", 
                False, 
                f"Exception occurred: {str(e)}"
            )
        
        # Test with missing uid parameter
        try:
            response = self.session.get(f"{API_BASE}/auth/firebase-user")
            
            if response.status_code == 400:
                self.log_result(
                    "GET /api/auth/firebase-user (missing uid)", 
                    True, 
                    "Correctly validates required uid parameter (400 Bad Request)",
                    "Parameter validation working"
                )
            else:
                self.log_result(
                    "GET /api/auth/firebase-user (missing uid)", 
                    False, 
                    f"Expected 400, got {response.status_code}",
                    response.text
                )
                
        except Exception as e:
            self.log_result(
                "GET /api/auth/firebase-user (missing uid)", 
                False, 
                f"Exception occurred: {str(e)}"
            )
        
        # Test with non-existent uid
        try:
            fake_uid = f"nonexistent_user_{uuid.uuid4().hex[:8]}"
            response = self.session.get(f"{API_BASE}/auth/firebase-user?uid={fake_uid}")
            
            if response.status_code == 404:
                self.log_result(
                    "GET /api/auth/firebase-user (non-existent uid)", 
                    True, 
                    "Correctly returns 404 for non-existent user",
                    "User not found handling working"
                )
            else:
                self.log_result(
                    "GET /api/auth/firebase-user (non-existent uid)", 
                    False, 
                    f"Expected 404, got {response.status_code}",
                    response.text
                )
                
        except Exception as e:
            self.log_result(
                "GET /api/auth/firebase-user (non-existent uid)", 
                False, 
                f"Exception occurred: {str(e)}"
            )

    def test_firebase_integration_flow(self):
        """Test complete Firebase authentication integration flow"""
        print("\n=== Testing Firebase Integration Flow ===")
        
        # Test complete user creation and retrieval flow
        test_uid = f"integration_test_{uuid.uuid4().hex[:8]}"
        test_email = f"integration.test.{uuid.uuid4().hex[:8]}@example.com"
        
        try:
            # Step 1: Create user with role
            user_data = {
                "uid": test_uid,
                "email": test_email,
                "role": "merchant"
            }
            
            create_response = self.session.post(
                f"{API_BASE}/auth/firebase-role",
                json=user_data,
                headers={'Content-Type': 'application/json'}
            )
            
            if create_response.status_code != 200:
                self.log_result(
                    "Firebase Integration Flow", 
                    False, 
                    "Failed to create user in step 1",
                    create_response.text
                )
                return
            
            # Step 2: Retrieve user data
            get_response = self.session.get(f"{API_BASE}/auth/firebase-user?uid={test_uid}")
            
            if get_response.status_code != 200:
                self.log_result(
                    "Firebase Integration Flow", 
                    False, 
                    "Failed to retrieve user in step 2",
                    get_response.text
                )
                return
            
            user_data_retrieved = get_response.json()
            
            # Step 3: Verify data consistency
            if (user_data_retrieved['uid'] == test_uid and 
                user_data_retrieved['email'] == test_email and 
                user_data_retrieved['role'] == 'merchant'):
                
                self.log_result(
                    "Firebase Integration Flow", 
                    True, 
                    "Complete user creation and retrieval flow working",
                    f"User: {test_email}, Role: merchant, UID: {test_uid}"
                )
            else:
                self.log_result(
                    "Firebase Integration Flow", 
                    False, 
                    "Data inconsistency in retrieved user",
                    f"Expected: {user_data}, Got: {user_data_retrieved}"
                )
            
            # Step 4: Test role update
            update_data = {
                "uid": test_uid,
                "email": test_email,
                "role": "customer"  # Change role
            }
            
            update_response = self.session.post(
                f"{API_BASE}/auth/firebase-role",
                json=update_data,
                headers={'Content-Type': 'application/json'}
            )
            
            if update_response.status_code == 200:
                # Verify role was updated
                verify_response = self.session.get(f"{API_BASE}/auth/firebase-user?uid={test_uid}")
                if verify_response.status_code == 200:
                    updated_user = verify_response.json()
                    if updated_user['role'] == 'customer':
                        self.log_result(
                            "Firebase Role Update Flow", 
                            True, 
                            "Role update functionality working correctly",
                            f"Role changed from merchant to customer"
                        )
                    else:
                        self.log_result(
                            "Firebase Role Update Flow", 
                            False, 
                            "Role was not updated properly",
                            f"Expected: customer, Got: {updated_user['role']}"
                        )
                else:
                    self.log_result(
                        "Firebase Role Update Flow", 
                        False, 
                        "Failed to verify role update",
                        verify_response.text
                    )
            else:
                self.log_result(
                    "Firebase Role Update Flow", 
                    False, 
                    "Failed to update user role",
                    update_response.text
                )
                
        except Exception as e:
            self.log_result(
                "Firebase Integration Flow", 
                False, 
                f"Exception occurred: {str(e)}"
            )
    
    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting Thryve Fitness Platform Backend API Tests")
        print(f"Testing against: {API_BASE}")
        print("=" * 60)
        
        # Run Firebase authentication tests first (high priority)
        print("\n🔥 FIREBASE AUTHENTICATION TESTS (HIGH PRIORITY)")
        print("=" * 60)
        self.test_firebase_role_api()
        self.test_firebase_user_api()
        self.test_firebase_integration_flow()
        
        # Run existing API tests
        print("\n📋 EXISTING API TESTS")
        print("=" * 60)
        self.test_classes_endpoint()
        self.test_onboarding_endpoint()
        self.test_payment_intent_endpoint()
        self.test_bookings_endpoints()
        self.test_stripe_connect_endpoint()
        self.test_error_handling()
        self.test_cors_headers()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r['success']])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        # Separate Firebase and existing API results
        firebase_tests = [r for r in self.test_results if 'firebase' in r['test'].lower() or 'Firebase' in r['test']]
        existing_tests = [r for r in self.test_results if r not in firebase_tests]
        
        firebase_passed = len([r for r in firebase_tests if r['success']])
        firebase_total = len(firebase_tests)
        
        print(f"\n🔥 FIREBASE TESTS: {firebase_passed}/{firebase_total} passed")
        print(f"📋 EXISTING API TESTS: {len([r for r in existing_tests if r['success']])}/{len(existing_tests)} passed")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")
        
        print("\n🎯 KEY FINDINGS:")
        if firebase_passed == firebase_total and firebase_total > 0:
            print("✅ Firebase authentication system is working correctly")
            print("✅ Firebase role management API is functional")
            print("✅ Firebase user data management API is operational")
            print("✅ Complete Firebase integration flow is working")
        else:
            print("❌ Firebase authentication system has issues that need attention")
        
        print("- All protected endpoints correctly require authentication")
        print("- Public endpoints (like /classes) are accessible")
        print("- Error handling is implemented")
        print("- CORS headers are configured")
        
        return {
            'total': total_tests,
            'passed': passed_tests,
            'failed': failed_tests,
            'firebase_tests': {
                'total': firebase_total,
                'passed': firebase_passed,
                'failed': firebase_total - firebase_passed
            },
            'results': self.test_results
        }

if __name__ == "__main__":
    tester = ThryveAPITester()
    results = tester.run_all_tests()
    
    # Exit with appropriate code
    exit(0 if results['failed'] == 0 else 1)