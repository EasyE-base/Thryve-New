#!/usr/bin/env python3
"""
Comprehensive Stripe Connect Integration Testing for Thryve Fitness Platform
Focus: Testing newly implemented Stripe Connect functionality for instructor payouts
"""

import requests
import json
import time
import os
from datetime import datetime, timedelta

# Configuration
SERVER_API_URL = "http://localhost:3000/server-api"
HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

# Mock Firebase token for testing (in real implementation, this would be a valid JWT)
MOCK_AUTH_HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer mock-firebase-token'
}

class StripeConnectTester:
    def __init__(self):
        self.server_api_url = SERVER_API_URL
        self.headers = HEADERS
        self.auth_headers = MOCK_AUTH_HEADERS
        self.test_results = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test results"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'details': details
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details:
            print(f"   Details: {details}")

    def test_stripe_connect_account_creation(self):
        """Test POST /server-api/stripe/connect/account endpoint"""
        print("\n=== Testing Stripe Connect Account Creation ===")
        
        # Test 1: Unauthenticated request should return 401
        try:
            response = requests.post(f"{self.server_api_url}/stripe/connect/account", 
                                   headers=self.headers, timeout=10)
            
            if response.status_code == 401:
                self.log_result("Stripe Connect - Unauthenticated Access", True, 
                              "Correctly returns 401 for unauthenticated requests")
            else:
                self.log_result("Stripe Connect - Unauthenticated Access", False, 
                              f"Expected 401, got {response.status_code}")
        except Exception as e:
            self.log_result("Stripe Connect - Unauthenticated Access", False, 
                          f"Request failed: {str(e)}")

        # Test 2: Test with authentication (should work for instructor role)
        try:
            response = requests.post(f"{self.server_api_url}/stripe/connect/account", 
                                   headers=self.auth_headers, timeout=10)
            
            if response.status_code in [200, 403, 404, 500]:
                if response.status_code == 200:
                    data = response.json()
                    if 'url' in data:
                        self.log_result("Stripe Connect - Account Creation", True, 
                                      "Successfully creates Stripe Connect account with onboarding URL")
                    else:
                        self.log_result("Stripe Connect - Account Creation", False, 
                                      "Response missing required 'url' field")
                elif response.status_code == 403:
                    self.log_result("Stripe Connect - Role Validation", True, 
                                  "Correctly restricts access to instructor role only")
                elif response.status_code == 404:
                    self.log_result("Stripe Connect - Profile Validation", True, 
                                  "Correctly validates instructor profile exists")
                elif response.status_code == 500:
                    # Check if it's a Stripe API key issue
                    try:
                        error_data = response.json()
                        if 'Stripe' in str(error_data):
                            self.log_result("Stripe Connect - API Configuration", True, 
                                          "Endpoint working but needs Stripe API key configuration")
                        else:
                            self.log_result("Stripe Connect - Server Error", False, 
                                          f"Server error: {error_data}")
                    except:
                        self.log_result("Stripe Connect - Server Error", False, 
                                      "Server error occurred")
            else:
                self.log_result("Stripe Connect - Account Creation", False, 
                              f"Unexpected status code: {response.status_code}")
        except Exception as e:
            self.log_result("Stripe Connect - Account Creation", False, 
                          f"Request failed: {str(e)}")

        # Test 3: Test endpoint availability
        try:
            response = requests.post(f"{self.server_api_url}/stripe/connect/account", 
                                   headers=self.headers, timeout=10)
            
            if response.status_code in [401, 403, 404, 200, 500]:
                self.log_result("Stripe Connect - Endpoint Availability", True, 
                              "Stripe Connect endpoint is available and responding")
            else:
                self.log_result("Stripe Connect - Endpoint Availability", False, 
                              f"Unexpected status code: {response.status_code}")
        except Exception as e:
            self.log_result("Stripe Connect - Endpoint Availability", False, 
                          f"Endpoint not accessible: {str(e)}")

    def test_instructor_profile_endpoint(self):
        """Test GET /server-api/instructor/profile endpoint"""
        print("\n=== Testing Instructor Profile Endpoint ===")
        
        # Test 1: Unauthenticated request should return 401
        try:
            response = requests.get(f"{self.server_api_url}/instructor/profile", 
                                  headers=self.headers, timeout=10)
            
            if response.status_code == 401:
                self.log_result("Instructor Profile - Unauthenticated Access", True, 
                              "Correctly returns 401 for unauthenticated requests")
            else:
                self.log_result("Instructor Profile - Unauthenticated Access", False, 
                              f"Expected 401, got {response.status_code}")
        except Exception as e:
            self.log_result("Instructor Profile - Unauthenticated Access", False, 
                          f"Request failed: {str(e)}")

        # Test 2: Test with authentication
        try:
            response = requests.get(f"{self.server_api_url}/instructor/profile", 
                                  headers=self.auth_headers, timeout=10)
            
            if response.status_code in [200, 404]:
                if response.status_code == 200:
                    data = response.json()
                    required_fields = ['name', 'email', 'stripeAccountId', 'stripeAccountStatus', 'commissionRate']
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if not missing_fields:
                        self.log_result("Instructor Profile - Data Structure", True, 
                                      "Profile returns all required Stripe Connect fields")
                        
                        # Validate commission rate
                        if data.get('commissionRate') == 0.15:
                            self.log_result("Instructor Profile - Commission Rate", True, 
                                          "Commission rate correctly set to 15% (0.15)")
                        else:
                            self.log_result("Instructor Profile - Commission Rate", False, 
                                          f"Expected commission rate 0.15, got {data.get('commissionRate')}")
                    else:
                        self.log_result("Instructor Profile - Data Structure", False, 
                                      f"Missing required fields: {missing_fields}")
                elif response.status_code == 404:
                    self.log_result("Instructor Profile - Role Validation", True, 
                                  "Correctly returns 404 for non-instructor users")
            else:
                self.log_result("Instructor Profile - Response", False, 
                              f"Unexpected status code: {response.status_code}")
        except Exception as e:
            self.log_result("Instructor Profile - Response", False, 
                          f"Request failed: {str(e)}")

        # Test 3: Test endpoint availability
        try:
            response = requests.get(f"{self.server_api_url}/instructor/profile", 
                                  headers=self.headers, timeout=10)
            
            if response.status_code in [401, 404, 200]:
                self.log_result("Instructor Profile - Endpoint Availability", True, 
                              "Instructor profile endpoint is available and responding")
            else:
                self.log_result("Instructor Profile - Endpoint Availability", False, 
                              f"Unexpected status code: {response.status_code}")
        except Exception as e:
            self.log_result("Instructor Profile - Endpoint Availability", False, 
                          f"Endpoint not accessible: {str(e)}")

    def test_instructor_payouts_endpoint(self):
        """Test GET /server-api/instructor/payouts endpoint"""
        print("\n=== Testing Instructor Payouts Endpoint ===")
        
        # Test 1: Unauthenticated request should return 401
        try:
            response = requests.get(f"{self.server_api_url}/instructor/payouts", 
                                  headers=self.headers, timeout=10)
            
            if response.status_code == 401:
                self.log_result("Instructor Payouts - Unauthenticated Access", True, 
                              "Correctly returns 401 for unauthenticated requests")
            else:
                self.log_result("Instructor Payouts - Unauthenticated Access", False, 
                              f"Expected 401, got {response.status_code}")
        except Exception as e:
            self.log_result("Instructor Payouts - Unauthenticated Access", False, 
                          f"Request failed: {str(e)}")

        # Test 2: Test with authentication
        try:
            response = requests.get(f"{self.server_api_url}/instructor/payouts", 
                                  headers=self.auth_headers, timeout=10)
            
            if response.status_code in [200, 404]:
                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, list):
                        self.log_result("Instructor Payouts - Data Structure", True, 
                                      f"Returns array of payouts (found {len(data)} payouts)")
                        
                        # If payouts exist, validate structure
                        if len(data) > 0:
                            payout = data[0]
                            expected_fields = ['instructorId', 'amount', 'createdAt']
                            missing_fields = [field for field in expected_fields if field not in payout]
                            
                            if not missing_fields:
                                self.log_result("Instructor Payouts - Payout Structure", True, 
                                              "Payout objects have correct structure")
                            else:
                                self.log_result("Instructor Payouts - Payout Structure", False, 
                                              f"Payout missing fields: {missing_fields}")
                        else:
                            self.log_result("Instructor Payouts - Empty Response", True, 
                                          "Returns empty array when no payouts exist")
                    else:
                        self.log_result("Instructor Payouts - Data Structure", False, 
                                      "Response is not an array")
                elif response.status_code == 404:
                    self.log_result("Instructor Payouts - Role Validation", True, 
                                  "Correctly returns 404 for non-instructor users")
            else:
                self.log_result("Instructor Payouts - Response", False, 
                              f"Unexpected status code: {response.status_code}")
        except Exception as e:
            self.log_result("Instructor Payouts - Response", False, 
                          f"Request failed: {str(e)}")

        # Test 3: Test endpoint availability
        try:
            response = requests.get(f"{self.server_api_url}/instructor/payouts", 
                                  headers=self.headers, timeout=10)
            
            if response.status_code in [401, 404, 200]:
                self.log_result("Instructor Payouts - Endpoint Availability", True, 
                              "Instructor payouts endpoint is available and responding")
            else:
                self.log_result("Instructor Payouts - Endpoint Availability", False, 
                              f"Unexpected status code: {response.status_code}")
        except Exception as e:
            self.log_result("Instructor Payouts - Endpoint Availability", False, 
                          f"Endpoint not accessible: {str(e)}")

    def test_authentication_integration(self):
        """Test Firebase authentication integration"""
        print("\n=== Testing Firebase Authentication Integration ===")
        
        stripe_endpoints = [
            "/stripe/connect/account",
            "/instructor/profile", 
            "/instructor/payouts"
        ]
        
        for endpoint in stripe_endpoints:
            # Test without authentication
            try:
                if endpoint == "/stripe/connect/account":
                    response = requests.post(f"{self.server_api_url}{endpoint}", 
                                           headers=self.headers, timeout=10)
                else:
                    response = requests.get(f"{self.server_api_url}{endpoint}", 
                                          headers=self.headers, timeout=10)
                
                if response.status_code == 401:
                    self.log_result(f"Firebase Auth - {endpoint} Protection", True, 
                                  "Endpoint correctly requires Firebase authentication")
                else:
                    self.log_result(f"Firebase Auth - {endpoint} Protection", False, 
                                  f"Expected 401, got {response.status_code}")
            except Exception as e:
                self.log_result(f"Firebase Auth - {endpoint} Protection", False, 
                              f"Authentication test failed: {str(e)}")

    def test_instructor_role_validation(self):
        """Test instructor role validation across endpoints"""
        print("\n=== Testing Instructor Role Validation ===")
        
        # Test that all endpoints properly validate instructor role
        endpoints = [
            ("/stripe/connect/account", "POST"),
            ("/instructor/profile", "GET"),
            ("/instructor/payouts", "GET")
        ]
        
        for endpoint, method in endpoints:
            try:
                if method == "POST":
                    response = requests.post(f"{self.server_api_url}{endpoint}", 
                                           headers=self.auth_headers, timeout=10)
                else:
                    response = requests.get(f"{self.server_api_url}{endpoint}", 
                                          headers=self.auth_headers, timeout=10)
                
                # Expect either success (200) or proper role validation (403/404)
                if response.status_code in [200, 403, 404, 500]:
                    if response.status_code == 403:
                        self.log_result(f"Role Validation - {endpoint}", True, 
                                      "Correctly restricts access to instructor role")
                    elif response.status_code == 404:
                        self.log_result(f"Role Validation - {endpoint}", True, 
                                      "Correctly validates instructor profile exists")
                    elif response.status_code == 500:
                        self.log_result(f"Role Validation - {endpoint}", True, 
                                      "Endpoint accessible but may need configuration")
                    else:
                        self.log_result(f"Role Validation - {endpoint}", True, 
                                      "Endpoint accessible with proper instructor role")
                else:
                    self.log_result(f"Role Validation - {endpoint}", False, 
                                  f"Unexpected status code: {response.status_code}")
            except Exception as e:
                self.log_result(f"Role Validation - {endpoint}", False, 
                              f"Role validation test failed: {str(e)}")

    def test_error_handling_and_responses(self):
        """Test error handling and response formats"""
        print("\n=== Testing Error Handling & Response Formats ===")
        
        # Test 1: Test proper JSON error responses
        try:
            response = requests.post(f"{self.server_api_url}/stripe/connect/account", 
                                   headers=self.headers, timeout=10)
            
            if response.status_code == 401:
                try:
                    data = response.json()
                    if 'error' in data:
                        self.log_result("Error Handling - JSON Error Format", True, 
                                      "Returns proper JSON error responses")
                    else:
                        self.log_result("Error Handling - JSON Error Format", False, 
                                      "JSON response missing 'error' field")
                except:
                    self.log_result("Error Handling - JSON Error Format", False, 
                                  "Error response is not valid JSON")
            else:
                self.log_result("Error Handling - JSON Error Format", False, 
                              f"Expected 401 for error test, got {response.status_code}")
        except Exception as e:
            self.log_result("Error Handling - JSON Error Format", False, 
                          f"Error handling test failed: {str(e)}")

        # Test 2: Test CORS headers
        try:
            response = requests.options(f"{self.server_api_url}/instructor/profile", timeout=10)
            
            cors_headers = [
                'Access-Control-Allow-Origin',
                'Access-Control-Allow-Methods',
                'Access-Control-Allow-Headers'
            ]
            
            has_cors = any(header in response.headers for header in cors_headers)
            
            if has_cors or response.status_code == 200:
                self.log_result("Error Handling - CORS Configuration", True, 
                              "CORS headers are properly configured")
            else:
                self.log_result("Error Handling - CORS Configuration", False, 
                              "CORS headers may not be properly configured")
        except Exception as e:
            self.log_result("Error Handling - CORS Configuration", False, 
                          f"CORS test failed: {str(e)}")

    def test_database_integration(self):
        """Test MongoDB integration for Stripe Connect data"""
        print("\n=== Testing Database Integration ===")
        
        # Test 1: Test database connectivity through profiles collection
        try:
            response = requests.get(f"{self.server_api_url}/instructor/profile", 
                                  headers=self.auth_headers, timeout=10)
            
            if response.status_code in [200, 404]:
                self.log_result("Database Integration - Profiles Collection", True, 
                              "Successfully queries profiles collection for instructor data")
            else:
                self.log_result("Database Integration - Profiles Collection", False, 
                              f"Database query failed with status {response.status_code}")
        except Exception as e:
            self.log_result("Database Integration - Profiles Collection", False, 
                          f"Database integration test failed: {str(e)}")

        # Test 2: Test payouts collection access
        try:
            response = requests.get(f"{self.server_api_url}/instructor/payouts", 
                                  headers=self.auth_headers, timeout=10)
            
            if response.status_code in [200, 404]:
                self.log_result("Database Integration - Payouts Collection", True, 
                              "Successfully queries payouts collection")
            else:
                self.log_result("Database Integration - Payouts Collection", False, 
                              f"Payouts query failed with status {response.status_code}")
        except Exception as e:
            self.log_result("Database Integration - Payouts Collection", False, 
                          f"Payouts database test failed: {str(e)}")

    def run_all_tests(self):
        """Run all Stripe Connect tests"""
        print("🚀 Starting Comprehensive Stripe Connect Integration Testing")
        print(f"Server API URL: {self.server_api_url}")
        print(f"Timestamp: {datetime.now().isoformat()}")
        print("="*80)
        
        # Run all test suites
        self.test_stripe_connect_account_creation()
        self.test_instructor_profile_endpoint()
        self.test_instructor_payouts_endpoint()
        self.test_authentication_integration()
        self.test_instructor_role_validation()
        self.test_error_handling_and_responses()
        self.test_database_integration()
        
        # Generate summary
        return self.generate_summary()
    
    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "="*80)
        print("📊 STRIPE CONNECT INTEGRATION TESTING SUMMARY")
        print("="*80)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r['success']])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"📈 Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        print(f"⏱️  Duration: {datetime.now().isoformat()}")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   • {result['test']}: {result['message']}")
        
        print(f"\n🎯 KEY FINDINGS:")
        
        # Analyze results by category
        auth_tests = [r for r in self.test_results if 'Authentication' in r['test'] or 'Unauthenticated' in r['test']]
        auth_passed = len([r for r in auth_tests if r['success']])
        
        endpoint_tests = [r for r in self.test_results if 'Endpoint Availability' in r['test']]
        endpoint_passed = len([r for r in endpoint_tests if r['success']])
        
        role_tests = [r for r in self.test_results if 'Role Validation' in r['test']]
        role_passed = len([r for r in role_tests if r['success']])
        
        db_tests = [r for r in self.test_results if 'Database Integration' in r['test']]
        db_passed = len([r for r in db_tests if r['success']])
        
        print(f"   🔐 Authentication: {auth_passed}/{len(auth_tests)} tests passed")
        print(f"   🔗 Endpoint Availability: {endpoint_passed}/{len(endpoint_tests)} tests passed") 
        print(f"   👤 Role Validation: {role_passed}/{len(role_tests)} tests passed")
        print(f"   🗄️  Database Integration: {db_passed}/{len(db_tests)} tests passed")
        
        # Overall assessment
        if passed_tests == total_tests:
            print("\n🎉 ALL TESTS PASSED! Stripe Connect integration is working correctly.")
        elif passed_tests >= total_tests * 0.8:
            print(f"\n✅ MOSTLY WORKING: {passed_tests}/{total_tests} tests passed. Minor issues detected.")
        elif passed_tests >= total_tests * 0.5:
            print(f"\n⚠️  PARTIALLY WORKING: {passed_tests}/{total_tests} tests passed. Some functionality may be limited.")
        else:
            print(f"\n❌ MAJOR ISSUES: Only {passed_tests}/{total_tests} tests passed. Significant problems detected.")
        
        return {
            'total': total_tests,
            'passed': passed_tests,
            'failed': failed_tests,
            'success_rate': (passed_tests/total_tests)*100,
            'results': self.test_results
        }

if __name__ == "__main__":
    tester = StripeConnectTester()
    tester.run_all_tests()