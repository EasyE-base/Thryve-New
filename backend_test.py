#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Thryve Fitness Platform
Focus: Stripe Payment Flow Testing including new checkout session functionality
"""

import requests
import json
import time
import os
from datetime import datetime, timedelta

# Configuration
BASE_URL = "https://a0166285-5fbd-430a-a296-ff63ae399ac4.preview.emergentagent.com/api"
HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

class StripePaymentFlowTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.headers = HEADERS
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
    
    def test_create_checkout_session(self):
        """Test POST /api/stripe/create-checkout-session endpoint"""
        print("\n=== Testing Stripe Checkout Session Creation ===")
        
        # Test 1: Valid checkout session creation
        test_data = {
            "classId": "morning-vinyasa-flow",
            "sessionId": "session-1", 
            "className": "Morning Vinyasa Flow",
            "sessionTime": "Tomorrow at 08:00",
            "amount": 35,
            "userId": "test-user-123",
            "instructorId": "sarah-johnson"
        }
        
        try:
            response = requests.post(f"{self.base_url}/stripe/create-checkout-session", 
                                   json=test_data, headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'sessionId' in data and 'bookingId' in data:
                    self.log_result("Create Checkout Session - Valid Data", True, 
                                  f"Session created successfully with ID: {data.get('sessionId')[:20]}...")
                    return data  # Return for use in other tests
                else:
                    self.log_result("Create Checkout Session - Valid Data", False, 
                                  "Response missing required fields", data)
            else:
                self.log_result("Create Checkout Session - Valid Data", False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Create Checkout Session - Valid Data", False, f"Request failed: {str(e)}")
        
        # Test 2: Missing required fields
        invalid_data = {
            "classId": "morning-vinyasa-flow",
            # Missing sessionId, className, amount, userId
        }
        
        try:
            response = requests.post(f"{self.base_url}/stripe/create-checkout-session", 
                                   json=invalid_data, headers=self.headers, timeout=10)
            
            if response.status_code == 400:
                self.log_result("Create Checkout Session - Missing Fields", True, 
                              "Correctly returned 400 for missing required fields")
            else:
                self.log_result("Create Checkout Session - Missing Fields", False, 
                              f"Expected 400, got {response.status_code}")
        except Exception as e:
            self.log_result("Create Checkout Session - Missing Fields", False, f"Request failed: {str(e)}")
        
        # Test 3: Non-existent class
        nonexistent_data = {
            "classId": "non-existent-class-id",
            "sessionId": "session-1", 
            "className": "Non-existent Class",
            "sessionTime": "Tomorrow at 08:00",
            "amount": 35,
            "userId": "test-user-123",
            "instructorId": "sarah-johnson"
        }
        
        try:
            response = requests.post(f"{self.base_url}/stripe/create-checkout-session", 
                                   json=nonexistent_data, headers=self.headers, timeout=10)
            
            if response.status_code == 404:
                self.log_result("Create Checkout Session - Non-existent Class", True, 
                              "Correctly returned 404 for non-existent class")
            else:
                self.log_result("Create Checkout Session - Non-existent Class", False, 
                              f"Expected 404, got {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Create Checkout Session - Non-existent Class", False, f"Request failed: {str(e)}")
    
    def test_booking_by_session(self):
        """Test GET /api/booking/by-session endpoint"""
        print("\n=== Testing Booking Retrieval by Session ===")
        
        # Test 1: Missing session ID parameter
        try:
            response = requests.get(f"{self.base_url}/booking/by-session", 
                                  headers=self.headers, timeout=10)
            
            if response.status_code == 400:
                self.log_result("Booking by Session - Missing Session ID", True, 
                              "Correctly returned 400 for missing session ID")
            else:
                self.log_result("Booking by Session - Missing Session ID", False, 
                              f"Expected 400, got {response.status_code}")
        except Exception as e:
            self.log_result("Booking by Session - Missing Session ID", False, f"Request failed: {str(e)}")
        
        # Test 2: Invalid session ID
        try:
            response = requests.get(f"{self.base_url}/booking/by-session?sessionId=invalid-session-id", 
                                  headers=self.headers, timeout=10)
            
            if response.status_code == 404:
                self.log_result("Booking by Session - Invalid Session ID", True, 
                              "Correctly returned 404 for invalid session ID")
            else:
                self.log_result("Booking by Session - Invalid Session ID", False, 
                              f"Expected 404, got {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Booking by Session - Invalid Session ID", False, f"Request failed: {str(e)}")
        
        # Test 3: Valid session ID (using a test session ID)
        test_session_id = "cs_test_example123"
        try:
            response = requests.get(f"{self.base_url}/booking/by-session?sessionId={test_session_id}", 
                                  headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'booking' in data:
                    self.log_result("Booking by Session - Valid Session ID", True, 
                                  "Successfully retrieved booking data")
                else:
                    self.log_result("Booking by Session - Valid Session ID", False, 
                                  "Response missing booking field", data)
            elif response.status_code == 404:
                self.log_result("Booking by Session - Valid Session ID", True, 
                              "Correctly returned 404 for non-existent booking (expected for test)")
            else:
                self.log_result("Booking by Session - Valid Session ID", False, 
                              f"Unexpected status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Booking by Session - Valid Session ID", False, f"Request failed: {str(e)}")
    
    def test_existing_stripe_endpoints(self):
        """Test existing Stripe endpoints for regression"""
        print("\n=== Testing Existing Stripe Endpoints ===")
        
        # Test 1: Create Payment Intent (should require auth)
        payment_data = {
            "classId": "morning-vinyasa-flow",
            "amount": 35,
            "currency": "usd"
        }
        
        try:
            response = requests.post(f"{self.base_url}/stripe/create-payment-intent", 
                                   json=payment_data, headers=self.headers, timeout=10)
            
            if response.status_code == 401:
                self.log_result("Create Payment Intent - Auth Required", True, 
                              "Correctly returned 401 for unauthenticated request")
            else:
                self.log_result("Create Payment Intent - Auth Required", False, 
                              f"Expected 401, got {response.status_code}")
        except Exception as e:
            self.log_result("Create Payment Intent - Auth Required", False, f"Request failed: {str(e)}")
        
        # Test 2: Stripe Connect Account (should require auth)
        try:
            response = requests.post(f"{self.base_url}/stripe/connect/account", 
                                   json={}, headers=self.headers, timeout=10)
            
            if response.status_code == 401:
                self.log_result("Stripe Connect Account - Auth Required", True, 
                              "Correctly returned 401 for unauthenticated request")
            else:
                self.log_result("Stripe Connect Account - Auth Required", False, 
                              f"Expected 401, got {response.status_code}")
        except Exception as e:
            self.log_result("Stripe Connect Account - Auth Required", False, f"Request failed: {str(e)}")
        
        # Test 3: Stripe Webhooks endpoint
        try:
            response = requests.post(f"{self.base_url}/stripe/webhooks", 
                                   json={"test": "data"}, headers=self.headers, timeout=10)
            
            # Webhook endpoint should handle signature verification
            if response.status_code in [400, 401, 403]:
                self.log_result("Stripe Webhooks - Signature Verification", True, 
                              f"Correctly rejected request without proper signature (HTTP {response.status_code})")
            else:
                self.log_result("Stripe Webhooks - Signature Verification", False, 
                              f"Unexpected response {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Stripe Webhooks - Signature Verification", False, f"Request failed: {str(e)}")
    
    def test_classes_api_integration(self):
        """Test classes API integration for payment flow"""
        print("\n=== Testing Classes API Integration ===")
        
        # Test 1: Get classes list
        try:
            response = requests.get(f"{self.base_url}/classes", headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'classes' in data and isinstance(data['classes'], list):
                    self.log_result("Classes API - List Classes", True, 
                                  f"Successfully retrieved {len(data['classes'])} classes")
                    
                    # Test class detail retrieval for payment integration
                    if data['classes']:
                        class_id = data['classes'][0].get('id')
                        if class_id:
                            self.test_class_detail_for_payment(class_id)
                else:
                    self.log_result("Classes API - List Classes", False, 
                                  "Response missing classes array", data)
            else:
                self.log_result("Classes API - List Classes", False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Classes API - List Classes", False, f"Request failed: {str(e)}")
    
    def test_class_detail_for_payment(self, class_id):
        """Test class detail API for payment integration"""
        try:
            response = requests.get(f"{self.base_url}/classes/{class_id}", 
                                  headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['id', 'title', 'instructor', 'sessions']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.log_result("Class Detail for Payment", True, 
                                  f"Class {class_id} has all required fields for payment integration")
                else:
                    self.log_result("Class Detail for Payment", False, 
                                  f"Class {class_id} missing fields: {missing_fields}")
            else:
                self.log_result("Class Detail for Payment", False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Class Detail for Payment", False, f"Request failed: {str(e)}")
    
    def test_data_integration(self):
        """Test data integration and MongoDB operations"""
        print("\n=== Testing Data Integration ===")
        
        # Test creating a checkout session and verify data structure
        test_data = {
            "classId": "morning-vinyasa-flow",
            "sessionId": "test-session-" + str(int(time.time())), 
            "className": "Test Integration Class",
            "sessionTime": "Test Time",
            "amount": 25,
            "userId": "integration-test-user",
            "instructorId": "test-instructor"
        }
        
        try:
            response = requests.post(f"{self.base_url}/stripe/create-checkout-session", 
                                   json=test_data, headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                session_id = data.get('sessionId')
                booking_id = data.get('bookingId')
                
                if session_id and booking_id:
                    self.log_result("Data Integration - Booking Creation", True, 
                                  "Successfully created booking with Stripe session")
                    
                    # Test retrieving the booking
                    time.sleep(1)  # Brief delay for data consistency
                    self.test_booking_retrieval_integration(session_id)
                else:
                    self.log_result("Data Integration - Booking Creation", False, 
                                  "Missing session or booking ID in response")
            else:
                self.log_result("Data Integration - Booking Creation", False, 
                              f"Failed to create checkout session: HTTP {response.status_code}")
        except Exception as e:
            self.log_result("Data Integration - Booking Creation", False, f"Request failed: {str(e)}")
    
    def test_booking_retrieval_integration(self, session_id):
        """Test booking retrieval after creation"""
        try:
            response = requests.get(f"{self.base_url}/booking/by-session?sessionId={session_id}", 
                                  headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                booking = data.get('booking', {})
                
                # Verify booking structure
                required_fields = ['id', 'userId', 'classId', 'status', 'paymentStatus']
                missing_fields = [field for field in required_fields if field not in booking]
                
                if not missing_fields:
                    self.log_result("Data Integration - Booking Retrieval", True, 
                                  "Successfully retrieved booking with correct structure")
                else:
                    self.log_result("Data Integration - Booking Retrieval", False, 
                                  f"Booking missing required fields: {missing_fields}")
            else:
                self.log_result("Data Integration - Booking Retrieval", False, 
                              f"Failed to retrieve booking: HTTP {response.status_code}")
        except Exception as e:
            self.log_result("Data Integration - Booking Retrieval", False, f"Request failed: {str(e)}")
    
    def test_error_handling(self):
        """Test error handling scenarios"""
        print("\n=== Testing Error Handling ===")
        
        # Test 1: Malformed JSON
        try:
            response = requests.post(f"{self.base_url}/stripe/create-checkout-session", 
                                   data="invalid json", 
                                   headers={'Content-Type': 'application/json'}, 
                                   timeout=10)
            
            if response.status_code in [400, 500]:
                self.log_result("Error Handling - Malformed JSON", True, 
                              f"Correctly handled malformed JSON (HTTP {response.status_code})")
            else:
                self.log_result("Error Handling - Malformed JSON", False, 
                              f"Unexpected response to malformed JSON: {response.status_code}")
        except Exception as e:
            self.log_result("Error Handling - Malformed JSON", False, f"Request failed: {str(e)}")
        
        # Test 2: Invalid endpoint
        try:
            response = requests.get(f"{self.base_url}/invalid-endpoint", 
                                  headers=self.headers, timeout=10)
            
            if response.status_code == 404:
                self.log_result("Error Handling - Invalid Endpoint", True, 
                              "Correctly returned 404 for invalid endpoint")
            else:
                self.log_result("Error Handling - Invalid Endpoint", False, 
                              f"Expected 404, got {response.status_code}")
        except Exception as e:
            self.log_result("Error Handling - Invalid Endpoint", False, f"Request failed: {str(e)}")
    
    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting Comprehensive Stripe Payment Flow Testing")
        print(f"Base URL: {self.base_url}")
        print(f"Timestamp: {datetime.now().isoformat()}")
        
        # Run all test suites
        self.test_create_checkout_session()
        self.test_booking_by_session()
        self.test_existing_stripe_endpoints()
        self.test_classes_api_integration()
        self.test_data_integration()
        self.test_error_handling()
        
        # Generate summary
        self.generate_summary()
    
    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "="*60)
        print("🎯 STRIPE PAYMENT FLOW TESTING SUMMARY")
        print("="*60)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r['success']])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print(f"\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   ❌ {result['test']}: {result['message']}")
        
        print(f"\n📊 DETAILED RESULTS:")
        for result in self.test_results:
            status = "✅" if result['success'] else "❌"
            print(f"   {status} {result['test']}")
        
        return {
            'total': total_tests,
            'passed': passed_tests,
            'failed': failed_tests,
            'success_rate': (passed_tests/total_tests)*100,
            'results': self.test_results
        }

if __name__ == "__main__":
    tester = StripePaymentFlowTester()
    tester.run_all_tests()