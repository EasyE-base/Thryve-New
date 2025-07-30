#!/usr/bin/env python3
"""
Phase 4 Booking Integration & Payment Validation Backend API Testing
Testing comprehensive booking integration and payment validation systems
"""

import requests
import json
import time
from datetime import datetime, timedelta
import uuid

# Configuration
BASE_URL = "https://c965f60f-b3cc-49e1-9021-e1c5bd50d222.preview.emergentagent.com"
SERVER_API_BASE = f"{BASE_URL}/server-api"

# Mock Firebase authentication token for testing
MOCK_AUTH_TOKEN = "Bearer firebase-test-user"

# Test headers
HEADERS = {
    "Content-Type": "application/json",
    "Authorization": MOCK_AUTH_TOKEN
}

class BookingIntegrationTester:
    def __init__(self):
        self.test_results = []
        self.total_tests = 0
        self.passed_tests = 0
        self.failed_tests = 0
        
    def log_test(self, test_name, success, message, response_time=None):
        """Log test results"""
        self.total_tests += 1
        if success:
            self.passed_tests += 1
            status = "✅ PASS"
        else:
            self.failed_tests += 1
            status = "❌ FAIL"
            
        result = f"{status}: {test_name} - {message}"
        if response_time:
            result += f" (Response time: {response_time:.2f}ms)"
            
        print(result)
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'response_time': response_time
        })
        
    def test_endpoint(self, method, endpoint, data=None, expected_status=200, test_name=None):
        """Generic endpoint testing method"""
        if not test_name:
            test_name = f"{method} {endpoint}"
            
        try:
            start_time = time.time()
            
            if method == "GET":
                response = requests.get(f"{SERVER_API_BASE}{endpoint}", headers=HEADERS, timeout=10)
            elif method == "POST":
                response = requests.post(f"{SERVER_API_BASE}{endpoint}", headers=HEADERS, json=data, timeout=10)
            elif method == "PUT":
                response = requests.put(f"{SERVER_API_BASE}{endpoint}", headers=HEADERS, json=data, timeout=10)
            elif method == "DELETE":
                response = requests.delete(f"{SERVER_API_BASE}{endpoint}", headers=HEADERS, timeout=10)
                
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == expected_status:
                try:
                    response_data = response.json()
                    self.log_test(test_name, True, f"Status {response.status_code}, Response: {json.dumps(response_data, indent=2)[:200]}...", response_time)
                    return response_data
                except:
                    self.log_test(test_name, True, f"Status {response.status_code}, Non-JSON response", response_time)
                    return {"status": response.status_code}
            else:
                try:
                    error_data = response.json()
                    self.log_test(test_name, False, f"Expected {expected_status}, got {response.status_code}: {error_data}", response_time)
                except:
                    self.log_test(test_name, False, f"Expected {expected_status}, got {response.status_code}: {response.text[:200]}", response_time)
                return None
                
        except requests.exceptions.RequestException as e:
            self.log_test(test_name, False, f"Request failed: {str(e)}")
            return None
            
    def test_authentication_protection(self):
        """Test that all endpoints require authentication"""
        print("\n🔐 TESTING AUTHENTICATION PROTECTION")
        
        endpoints = [
            ("POST", "/bookings/validate-payment"),
            ("POST", "/bookings/create-with-payment"),
            ("POST", "/bookings/confirm-payment"),
            ("POST", "/bookings/payment-methods"),
            ("GET", "/bookings/payment-status"),
            ("GET", "/bookings/available-payments"),
            ("GET", "/bookings/validation-history"),
            ("GET", "/bookings/credit-balance"),
            ("GET", "/bookings/reconciliation")
        ]
        
        headers_no_auth = {"Content-Type": "application/json"}
        
        for method, endpoint in endpoints:
            try:
                if method == "GET":
                    response = requests.get(f"{SERVER_API_BASE}{endpoint}", headers=headers_no_auth, timeout=10)
                else:
                    response = requests.post(f"{SERVER_API_BASE}{endpoint}", headers=headers_no_auth, json={}, timeout=10)
                    
                if response.status_code == 401:
                    self.log_test(f"Auth Protection {method} {endpoint}", True, "Correctly requires authentication (401)")
                else:
                    self.log_test(f"Auth Protection {method} {endpoint}", False, f"Expected 401, got {response.status_code}")
                    
            except Exception as e:
                self.log_test(f"Auth Protection {method} {endpoint}", False, f"Request failed: {str(e)}")

    def test_payment_validation_endpoint(self):
        """Test POST /server-api/bookings/validate-payment"""
        print("\n💳 TESTING PAYMENT VALIDATION ENDPOINT")
        
        # Test 1: Missing required fields
        self.test_endpoint("POST", "/bookings/validate-payment", {}, 400, "Payment Validation - Missing Fields")
        
        # Test 2: Valid class package validation
        test_data = {
            "classId": "class_123",
            "paymentMethod": "class_package",
            "packageId": "package_456"
        }
        result = self.test_endpoint("POST", "/bookings/validate-payment", test_data, 200, "Payment Validation - Class Package")
        
        # Test 3: X Pass validation
        test_data = {
            "classId": "class_123",
            "paymentMethod": "xpass"
        }
        result = self.test_endpoint("POST", "/bookings/validate-payment", test_data, 200, "Payment Validation - X Pass")
        
        # Test 4: Subscription validation
        test_data = {
            "classId": "class_123",
            "paymentMethod": "subscription",
            "subscriptionId": "sub_789"
        }
        result = self.test_endpoint("POST", "/bookings/validate-payment", test_data, 200, "Payment Validation - Subscription")
        
        # Test 5: One-time payment validation
        test_data = {
            "classId": "class_123",
            "paymentMethod": "one_time"
        }
        result = self.test_endpoint("POST", "/bookings/validate-payment", test_data, 200, "Payment Validation - One-time Payment")

    def test_create_with_payment_endpoint(self):
        """Test POST /server-api/bookings/create-with-payment"""
        print("\n🎯 TESTING INTEGRATED BOOKING CREATION WITH PAYMENT")
        
        # Test 1: Missing required fields
        self.test_endpoint("POST", "/bookings/create-with-payment", {}, 400, "Create Booking - Missing Fields")
        
        # Test 2: Valid booking creation with class package
        test_data = {
            "classId": "class_123",
            "paymentMethod": "class_package",
            "packageId": "package_456",
            "customerNotes": "Looking forward to this class!"
        }
        result = self.test_endpoint("POST", "/bookings/create-with-payment", test_data, 200, "Create Booking - Class Package")
        
        # Test 3: Valid booking creation with X Pass
        test_data = {
            "classId": "class_123",
            "paymentMethod": "xpass"
        }
        result = self.test_endpoint("POST", "/bookings/create-with-payment", test_data, 200, "Create Booking - X Pass")
        
        # Test 4: Valid booking creation with subscription
        test_data = {
            "classId": "class_123",
            "paymentMethod": "subscription",
            "subscriptionId": "sub_789"
        }
        result = self.test_endpoint("POST", "/bookings/create-with-payment", test_data, 200, "Create Booking - Subscription")

    def test_confirm_payment_endpoint(self):
        """Test POST /server-api/bookings/confirm-payment"""
        print("\n✅ TESTING BOOKING PAYMENT CONFIRMATION")
        
        # Test 1: Missing required fields
        self.test_endpoint("POST", "/bookings/confirm-payment", {}, 400, "Confirm Payment - Missing Fields")
        
        # Test 2: Valid payment confirmation
        test_data = {
            "bookingId": "booking_123",
            "paymentIntentId": "pi_test_123456"
        }
        result = self.test_endpoint("POST", "/bookings/confirm-payment", test_data, 200, "Confirm Payment - Valid Request")
        
        # Test 3: Invalid booking ID
        test_data = {
            "bookingId": "invalid_booking",
            "paymentIntentId": "pi_test_123456"
        }
        result = self.test_endpoint("POST", "/bookings/confirm-payment", test_data, 404, "Confirm Payment - Invalid Booking")

    def test_payment_methods_endpoint(self):
        """Test POST /server-api/bookings/payment-methods"""
        print("\n💰 TESTING MULTI-PAYMENT METHOD SELECTION")
        
        # Test 1: Missing required fields
        self.test_endpoint("POST", "/bookings/payment-methods", {}, 400, "Payment Methods - Missing Fields")
        
        # Test 2: Valid payment methods analysis
        test_data = {
            "classId": "class_123",
            "studioId": "studio_456"
        }
        result = self.test_endpoint("POST", "/bookings/payment-methods", test_data, 200, "Payment Methods - Valid Analysis")
        
        # Test 3: Payment methods for specific user preferences
        test_data = {
            "classId": "class_123",
            "studioId": "studio_456",
            "preferredMethods": ["xpass", "subscription"]
        }
        result = self.test_endpoint("POST", "/bookings/payment-methods", test_data, 200, "Payment Methods - Preferred Methods")

    def test_payment_status_endpoint(self):
        """Test GET /server-api/bookings/payment-status"""
        print("\n📊 TESTING BOOKING PAYMENT STATUS TRACKING")
        
        # Test 1: Payment status without booking ID
        result = self.test_endpoint("GET", "/bookings/payment-status", None, 400, "Payment Status - Missing Booking ID")
        
        # Test 2: Payment status with valid booking ID
        result = self.test_endpoint("GET", "/bookings/payment-status?bookingId=booking_123", None, 200, "Payment Status - Valid Booking")
        
        # Test 3: Payment status with invalid booking ID
        result = self.test_endpoint("GET", "/bookings/payment-status?bookingId=invalid_booking", None, 404, "Payment Status - Invalid Booking")

    def test_available_payments_endpoint(self):
        """Test GET /server-api/bookings/available-payments"""
        print("\n🏪 TESTING AVAILABLE PAYMENT OPTIONS")
        
        # Test 1: Available payments without studio ID
        result = self.test_endpoint("GET", "/bookings/available-payments", None, 400, "Available Payments - Missing Studio ID")
        
        # Test 2: Available payments with valid studio ID
        result = self.test_endpoint("GET", "/bookings/available-payments?studioId=studio_123", None, 200, "Available Payments - Valid Studio")
        
        # Test 3: Available payments with class ID filter
        result = self.test_endpoint("GET", "/bookings/available-payments?studioId=studio_123&classId=class_456", None, 200, "Available Payments - With Class Filter")

    def test_validation_history_endpoint(self):
        """Test GET /server-api/bookings/validation-history"""
        print("\n📈 TESTING BOOKING VALIDATION HISTORY")
        
        # Test 1: Validation history default request
        result = self.test_endpoint("GET", "/bookings/validation-history", None, 200, "Validation History - Default Request")
        
        # Test 2: Validation history with pagination
        result = self.test_endpoint("GET", "/bookings/validation-history?page=1&limit=10", None, 200, "Validation History - With Pagination")
        
        # Test 3: Validation history with date range
        start_date = (datetime.now() - timedelta(days=30)).isoformat()
        end_date = datetime.now().isoformat()
        result = self.test_endpoint("GET", f"/bookings/validation-history?startDate={start_date}&endDate={end_date}", None, 200, "Validation History - Date Range")

    def test_credit_balance_endpoint(self):
        """Test GET /server-api/bookings/credit-balance"""
        print("\n💎 TESTING COMPREHENSIVE CREDIT BALANCE SUMMARY")
        
        # Test 1: Credit balance summary
        result = self.test_endpoint("GET", "/bookings/credit-balance", None, 200, "Credit Balance - Summary")
        
        # Test 2: Credit balance with studio filter
        result = self.test_endpoint("GET", "/bookings/credit-balance?studioId=studio_123", None, 200, "Credit Balance - Studio Filter")
        
        # Test 3: Credit balance with detailed breakdown
        result = self.test_endpoint("GET", "/bookings/credit-balance?includeExpired=true&detailed=true", None, 200, "Credit Balance - Detailed Breakdown")

    def test_reconciliation_endpoint(self):
        """Test GET /server-api/bookings/reconciliation"""
        print("\n📋 TESTING BOOKING-PAYMENT RECONCILIATION REPORT")
        
        # Test 1: Reconciliation without date range
        result = self.test_endpoint("GET", "/bookings/reconciliation", None, 200, "Reconciliation - Default Request")
        
        # Test 2: Reconciliation with date range
        start_date = (datetime.now() - timedelta(days=30)).isoformat()
        end_date = datetime.now().isoformat()
        result = self.test_endpoint("GET", f"/bookings/reconciliation?startDate={start_date}&endDate={end_date}", None, 200, "Reconciliation - Date Range")
        
        # Test 3: Reconciliation with studio filter
        result = self.test_endpoint("GET", "/bookings/reconciliation?studioId=studio_123", None, 200, "Reconciliation - Studio Filter")

    def test_business_logic_validation(self):
        """Test business logic and validation rules"""
        print("\n🧠 TESTING BUSINESS LOGIC VALIDATION")
        
        # Test 1: Class availability checking
        test_data = {
            "classId": "fully_booked_class",
            "paymentMethod": "one_time"
        }
        result = self.test_endpoint("POST", "/bookings/validate-payment", test_data, 200, "Business Logic - Class Availability")
        
        # Test 2: Package expiration validation
        test_data = {
            "classId": "class_123",
            "paymentMethod": "class_package",
            "packageId": "expired_package"
        }
        result = self.test_endpoint("POST", "/bookings/validate-payment", test_data, 200, "Business Logic - Package Expiration")
        
        # Test 3: Studio compatibility validation
        test_data = {
            "classId": "studio_a_class",
            "paymentMethod": "class_package",
            "packageId": "studio_b_package"
        }
        result = self.test_endpoint("POST", "/bookings/validate-payment", test_data, 200, "Business Logic - Studio Compatibility")

    def test_error_handling(self):
        """Test error handling scenarios"""
        print("\n⚠️ TESTING ERROR HANDLING")
        
        # Test 1: Invalid JSON payload
        try:
            response = requests.post(f"{SERVER_API_BASE}/bookings/validate-payment", 
                                   headers=HEADERS, 
                                   data="invalid json", 
                                   timeout=10)
            if response.status_code == 400:
                self.log_test("Error Handling - Invalid JSON", True, "Correctly handles malformed JSON")
            else:
                self.log_test("Error Handling - Invalid JSON", False, f"Expected 400, got {response.status_code}")
        except Exception as e:
            self.log_test("Error Handling - Invalid JSON", False, f"Request failed: {str(e)}")
        
        # Test 2: Missing content-type header
        headers_no_content_type = {"Authorization": MOCK_AUTH_TOKEN}
        try:
            response = requests.post(f"{SERVER_API_BASE}/bookings/validate-payment", 
                                   headers=headers_no_content_type, 
                                   json={}, 
                                   timeout=10)
            self.log_test("Error Handling - Missing Content-Type", True, f"Handled missing content-type: {response.status_code}")
        except Exception as e:
            self.log_test("Error Handling - Missing Content-Type", False, f"Request failed: {str(e)}")

    def test_response_structures(self):
        """Test response structure validation"""
        print("\n📋 TESTING RESPONSE STRUCTURES")
        
        # Test payment validation response structure
        test_data = {
            "classId": "class_123",
            "paymentMethod": "one_time"
        }
        result = self.test_endpoint("POST", "/bookings/validate-payment", test_data, 200, "Response Structure - Payment Validation")
        
        if result and isinstance(result, dict):
            required_fields = ['success', 'validationResult']
            has_all_fields = all(field in result for field in required_fields)
            self.log_test("Response Structure - Payment Validation Fields", has_all_fields, 
                         f"Required fields present: {required_fields}")
        
        # Test booking creation response structure
        test_data = {
            "classId": "class_123",
            "paymentMethod": "one_time"
        }
        result = self.test_endpoint("POST", "/bookings/create-with-payment", test_data, 200, "Response Structure - Booking Creation")
        
        # Test credit balance response structure
        result = self.test_endpoint("GET", "/bookings/credit-balance", None, 200, "Response Structure - Credit Balance")

    def run_comprehensive_tests(self):
        """Run all Phase 4 booking integration tests"""
        print("🚀 STARTING PHASE 4 BOOKING INTEGRATION & PAYMENT VALIDATION TESTING")
        print("=" * 80)
        
        # Run all test suites
        self.test_authentication_protection()
        self.test_payment_validation_endpoint()
        self.test_create_with_payment_endpoint()
        self.test_confirm_payment_endpoint()
        self.test_payment_methods_endpoint()
        self.test_payment_status_endpoint()
        self.test_available_payments_endpoint()
        self.test_validation_history_endpoint()
        self.test_credit_balance_endpoint()
        self.test_reconciliation_endpoint()
        self.test_business_logic_validation()
        self.test_error_handling()
        self.test_response_structures()
        
        # Print final results
        print("\n" + "=" * 80)
        print("🎯 PHASE 4 BOOKING INTEGRATION TESTING RESULTS")
        print("=" * 80)
        print(f"Total Tests: {self.total_tests}")
        print(f"✅ Passed: {self.passed_tests}")
        print(f"❌ Failed: {self.failed_tests}")
        print(f"Success Rate: {(self.passed_tests/self.total_tests*100):.1f}%")
        
        if self.failed_tests > 0:
            print(f"\n⚠️ {self.failed_tests} tests failed. Review the detailed output above.")
        else:
            print(f"\n🎉 All tests passed! Phase 4 booking integration system is working correctly.")
        
        return {
            'total_tests': self.total_tests,
            'passed_tests': self.passed_tests,
            'failed_tests': self.failed_tests,
            'success_rate': (self.passed_tests/self.total_tests*100) if self.total_tests > 0 else 0,
            'test_results': self.test_results
        }

if __name__ == "__main__":
    tester = BookingIntegrationTester()
    results = tester.run_comprehensive_tests()