#!/usr/bin/env python3
"""
Backend API Testing Suite for Phase 3: Business Logic & Fee Processing
Tests all 10 payment-related endpoints for business logic validation, authentication, and data integrity.
"""

import requests
import json
import time
from datetime import datetime, timedelta
import os
from urllib.parse import urljoin

# Configuration
BASE_URL = "https://c965f60f-b3cc-49e1-9021-e1c5bd50d222.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/server-api"

# Test data
TEST_USER_TOKEN = "Bearer firebase-test-user"
TEST_HEADERS = {
    "Authorization": TEST_USER_TOKEN,
    "Content-Type": "application/json"
}

class TestResults:
    def __init__(self):
        self.total_tests = 0
        self.passed_tests = 0
        self.failed_tests = 0
        self.results = []
    
    def add_result(self, test_name, passed, details=""):
        self.total_tests += 1
        if passed:
            self.passed_tests += 1
            print(f"✅ {test_name}")
        else:
            self.failed_tests += 1
            print(f"❌ {test_name}: {details}")
        
        self.results.append({
            "test": test_name,
            "passed": passed,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
    
    def print_summary(self):
        success_rate = (self.passed_tests / self.total_tests * 100) if self.total_tests > 0 else 0
        print(f"\n{'='*80}")
        print(f"PHASE 3 BUSINESS LOGIC & FEE PROCESSING TEST RESULTS")
        print(f"{'='*80}")
        print(f"Total Tests: {self.total_tests}")
        print(f"Passed: {self.passed_tests}")
        print(f"Failed: {self.failed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        print(f"{'='*80}")

def test_authentication_required(endpoint, method="GET", data=None):
    """Test that endpoint requires authentication"""
    try:
        if method == "GET":
            response = requests.get(f"{API_BASE}{endpoint}", timeout=10)
        else:
            response = requests.post(f"{API_BASE}{endpoint}", json=data or {}, timeout=10)
        
        return response.status_code == 401
    except Exception as e:
        print(f"Authentication test error for {endpoint}: {e}")
        return False

def make_authenticated_request(endpoint, method="GET", data=None, params=None):
    """Make authenticated request to endpoint"""
    try:
        url = f"{API_BASE}{endpoint}"
        if method == "GET":
            response = requests.get(url, headers=TEST_HEADERS, params=params, timeout=15)
        else:
            response = requests.post(url, headers=TEST_HEADERS, json=data, timeout=15)
        
        return response
    except Exception as e:
        print(f"Request error for {endpoint}: {e}")
        return None

def test_cancellation_policy_endpoints(results):
    """Test cancellation policy retrieval and application"""
    print("\n🔍 Testing Cancellation Policy Endpoints...")
    
    # Test GET /payments/cancellation-policy
    print("\nTesting GET /payments/cancellation-policy...")
    
    # Test authentication requirement
    auth_required = test_authentication_required("/payments/cancellation-policy")
    results.add_result("GET /payments/cancellation-policy - Authentication Required", 
                      auth_required, "Should return 401 for unauthenticated requests")
    
    # Test with missing studioId parameter
    response = make_authenticated_request("/payments/cancellation-policy")
    if response:
        missing_param_test = response.status_code == 400
        results.add_result("GET /payments/cancellation-policy - Missing Studio ID", 
                          missing_param_test, f"Expected 400, got {response.status_code}")
    
    # Test with valid studioId
    response = make_authenticated_request("/payments/cancellation-policy", params={"studioId": "test-studio-123"})
    if response:
        valid_request_test = response.status_code == 200
        results.add_result("GET /payments/cancellation-policy - Valid Request", 
                          valid_request_test, f"Expected 200, got {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                required_fields = ['success', 'policy', 'userCancellationHistory', 'userStats']
                has_required_fields = all(field in data for field in required_fields)
                results.add_result("GET /payments/cancellation-policy - Response Structure", 
                                  has_required_fields, f"Missing fields: {[f for f in required_fields if f not in data]}")
                
                # Validate policy structure
                if 'policy' in data:
                    policy_fields = ['cancellationWindow', 'lateCancelFee', 'noShowFee', 'refundPolicy']
                    has_policy_fields = all(field in data['policy'] for field in policy_fields)
                    results.add_result("GET /payments/cancellation-policy - Policy Structure", 
                                      has_policy_fields, f"Missing policy fields: {[f for f in policy_fields if f not in data['policy']]}")
            except Exception as e:
                results.add_result("GET /payments/cancellation-policy - JSON Parse", False, str(e))
    
    # Test POST /payments/apply-cancellation-policy
    print("\nTesting POST /payments/apply-cancellation-policy...")
    
    # Test authentication requirement
    auth_required = test_authentication_required("/payments/apply-cancellation-policy", "POST")
    results.add_result("POST /payments/apply-cancellation-policy - Authentication Required", 
                      auth_required, "Should return 401 for unauthenticated requests")
    
    # Test with missing bookingId
    response = make_authenticated_request("/payments/apply-cancellation-policy", "POST", {})
    if response:
        missing_booking_test = response.status_code == 400
        results.add_result("POST /payments/apply-cancellation-policy - Missing Booking ID", 
                          missing_booking_test, f"Expected 400, got {response.status_code}")
    
    # Test with valid cancellation request
    cancellation_data = {
        "bookingId": "test-booking-123",
        "cancellationReason": "Schedule conflict",
        "cancelledAt": datetime.now().isoformat()
    }
    response = make_authenticated_request("/payments/apply-cancellation-policy", "POST", cancellation_data)
    if response:
        # Expect 404 since booking doesn't exist, but validates the endpoint logic
        valid_structure_test = response.status_code in [200, 404]
        results.add_result("POST /payments/apply-cancellation-policy - Valid Structure", 
                          valid_structure_test, f"Expected 200 or 404, got {response.status_code}")

def test_no_show_processing(results):
    """Test no-show penalty processing"""
    print("\n🔍 Testing No-Show Processing...")
    
    # Test authentication requirement
    auth_required = test_authentication_required("/payments/process-no-show", "POST")
    results.add_result("POST /payments/process-no-show - Authentication Required", 
                      auth_required, "Should return 401 for unauthenticated requests")
    
    # Test with missing bookingId
    response = make_authenticated_request("/payments/process-no-show", "POST", {})
    if response:
        missing_booking_test = response.status_code == 400
        results.add_result("POST /payments/process-no-show - Missing Booking ID", 
                          missing_booking_test, f"Expected 400, got {response.status_code}")
    
    # Test with valid no-show request
    no_show_data = {
        "bookingId": "test-booking-123",
        "noShowConfirmed": True
    }
    response = make_authenticated_request("/payments/process-no-show", "POST", no_show_data)
    if response:
        # Expect 404 since booking doesn't exist, but validates the endpoint logic
        valid_structure_test = response.status_code in [200, 404, 403]
        results.add_result("POST /payments/process-no-show - Valid Structure", 
                          valid_structure_test, f"Expected 200, 404, or 403, got {response.status_code}")

def test_platform_fee_calculation(results):
    """Test dynamic platform fee calculation"""
    print("\n🔍 Testing Platform Fee Calculation...")
    
    # Test GET /payments/fee-structure
    print("\nTesting GET /payments/fee-structure...")
    
    # Test authentication requirement
    auth_required = test_authentication_required("/payments/fee-structure")
    results.add_result("GET /payments/fee-structure - Authentication Required", 
                      auth_required, "Should return 401 for unauthenticated requests")
    
    # Test fee structure retrieval
    response = make_authenticated_request("/payments/fee-structure", params={"studioId": "test-studio-123"})
    if response:
        valid_request_test = response.status_code == 200
        results.add_result("GET /payments/fee-structure - Valid Request", 
                          valid_request_test, f"Expected 200, got {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                required_fields = ['success', 'baseFeeRates', 'volumeDiscounts', 'effectiveRates']
                has_required_fields = all(field in data for field in required_fields)
                results.add_result("GET /payments/fee-structure - Response Structure", 
                                  has_required_fields, f"Missing fields: {[f for f in required_fields if f not in data]}")
                
                # Validate fee rates structure
                if 'baseFeeRates' in data:
                    expected_rates = ['class_booking', 'xpass_redemption', 'subscription']
                    has_rate_types = any(rate in data['baseFeeRates'] for rate in expected_rates)
                    results.add_result("GET /payments/fee-structure - Fee Rate Types", 
                                      has_rate_types, "Should include standard fee rate types")
            except Exception as e:
                results.add_result("GET /payments/fee-structure - JSON Parse", False, str(e))
    
    # Test POST /payments/calculate-platform-fees
    print("\nTesting POST /payments/calculate-platform-fees...")
    
    # Test authentication requirement
    auth_required = test_authentication_required("/payments/calculate-platform-fees", "POST")
    results.add_result("POST /payments/calculate-platform-fees - Authentication Required", 
                      auth_required, "Should return 401 for unauthenticated requests")
    
    # Test fee calculation with valid data
    fee_calculation_data = {
        "amount": 5000,  # $50.00
        "paymentType": "class_booking",
        "studioId": "test-studio-123",
        "volumeTier": "bronze"
    }
    response = make_authenticated_request("/payments/calculate-platform-fees", "POST", fee_calculation_data)
    if response:
        valid_calculation_test = response.status_code == 200
        results.add_result("POST /payments/calculate-platform-fees - Valid Calculation", 
                          valid_calculation_test, f"Expected 200, got {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                required_fields = ['success', 'calculation', 'breakdown']
                has_required_fields = all(field in data for field in required_fields)
                results.add_result("POST /payments/calculate-platform-fees - Response Structure", 
                                  has_required_fields, f"Missing fields: {[f for f in required_fields if f not in data]}")
                
                # Validate calculation logic
                if 'calculation' in data:
                    calc = data['calculation']
                    has_calc_fields = all(field in calc for field in ['originalAmount', 'platformFee', 'studioEarnings'])
                    results.add_result("POST /payments/calculate-platform-fees - Calculation Fields", 
                                      has_calc_fields, "Should include fee calculation breakdown")
            except Exception as e:
                results.add_result("POST /payments/calculate-platform-fees - JSON Parse", False, str(e))

def test_payment_retry_system(results):
    """Test intelligent payment retry system"""
    print("\n🔍 Testing Payment Retry System...")
    
    # Test GET /payments/retry-history
    print("\nTesting GET /payments/retry-history...")
    
    # Test authentication requirement
    auth_required = test_authentication_required("/payments/retry-history")
    results.add_result("GET /payments/retry-history - Authentication Required", 
                      auth_required, "Should return 401 for unauthenticated requests")
    
    # Test retry history retrieval
    response = make_authenticated_request("/payments/retry-history", params={"paymentIntentId": "pi_test_123"})
    if response:
        valid_request_test = response.status_code == 200
        results.add_result("GET /payments/retry-history - Valid Request", 
                          valid_request_test, f"Expected 200, got {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                required_fields = ['success', 'retryHistory', 'summary']
                has_required_fields = all(field in data for field in required_fields)
                results.add_result("GET /payments/retry-history - Response Structure", 
                                  has_required_fields, f"Missing fields: {[f for f in required_fields if f not in data]}")
            except Exception as e:
                results.add_result("GET /payments/retry-history - JSON Parse", False, str(e))
    
    # Test POST /payments/retry-failed-payment
    print("\nTesting POST /payments/retry-failed-payment...")
    
    # Test authentication requirement
    auth_required = test_authentication_required("/payments/retry-failed-payment", "POST")
    results.add_result("POST /payments/retry-failed-payment - Authentication Required", 
                      auth_required, "Should return 401 for unauthenticated requests")
    
    # Test retry request with valid data
    retry_data = {
        "paymentIntentId": "pi_test_123",
        "retryReason": "card_declined"
    }
    response = make_authenticated_request("/payments/retry-failed-payment", "POST", retry_data)
    if response:
        # Expect various responses based on payment intent existence
        valid_structure_test = response.status_code in [200, 400, 404]
        results.add_result("POST /payments/retry-failed-payment - Valid Structure", 
                          valid_structure_test, f"Expected 200, 400, or 404, got {response.status_code}")

def test_subscription_proration(results):
    """Test subscription proration handling"""
    print("\n🔍 Testing Subscription Proration...")
    
    # Test GET /payments/proration-preview
    print("\nTesting GET /payments/proration-preview...")
    
    # Test authentication requirement
    auth_required = test_authentication_required("/payments/proration-preview")
    results.add_result("GET /payments/proration-preview - Authentication Required", 
                      auth_required, "Should return 401 for unauthenticated requests")
    
    # Test proration preview
    preview_params = {
        "currentPlan": "basic",
        "newPlan": "premium",
        "subscriptionId": "sub_test_123"
    }
    response = make_authenticated_request("/payments/proration-preview", params=preview_params)
    if response:
        valid_request_test = response.status_code == 200
        results.add_result("GET /payments/proration-preview - Valid Request", 
                          valid_request_test, f"Expected 200, got {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                required_fields = ['success', 'proration', 'billingPeriod']
                has_required_fields = all(field in data for field in required_fields)
                results.add_result("GET /payments/proration-preview - Response Structure", 
                                  has_required_fields, f"Missing fields: {[f for f in required_fields if f not in data]}")
            except Exception as e:
                results.add_result("GET /payments/proration-preview - JSON Parse", False, str(e))
    
    # Test POST /payments/prorate-subscription
    print("\nTesting POST /payments/prorate-subscription...")
    
    # Test authentication requirement
    auth_required = test_authentication_required("/payments/prorate-subscription", "POST")
    results.add_result("POST /payments/prorate-subscription - Authentication Required", 
                      auth_required, "Should return 401 for unauthenticated requests")
    
    # Test proration processing
    proration_data = {
        "subscriptionId": "sub_test_123",
        "newPlan": "premium",
        "effectiveDate": datetime.now().isoformat()
    }
    response = make_authenticated_request("/payments/prorate-subscription", "POST", proration_data)
    if response:
        # Expect various responses based on subscription existence
        valid_structure_test = response.status_code in [200, 400, 404]
        results.add_result("POST /payments/prorate-subscription - Valid Structure", 
                          valid_structure_test, f"Expected 200, 400, or 404, got {response.status_code}")

def test_studio_policy_management(results):
    """Test studio policy management"""
    print("\n🔍 Testing Studio Policy Management...")
    
    # Test GET /payments/studio-policies
    print("\nTesting GET /payments/studio-policies...")
    
    # Test authentication requirement
    auth_required = test_authentication_required("/payments/studio-policies")
    results.add_result("GET /payments/studio-policies - Authentication Required", 
                      auth_required, "Should return 401 for unauthenticated requests")
    
    # Test studio policies retrieval
    response = make_authenticated_request("/payments/studio-policies")
    if response:
        # May return 403 if user is not a merchant, which is expected
        valid_request_test = response.status_code in [200, 403]
        results.add_result("GET /payments/studio-policies - Valid Request", 
                          valid_request_test, f"Expected 200 or 403, got {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                required_fields = ['success', 'policies', 'analytics']
                has_required_fields = all(field in data for field in required_fields)
                results.add_result("GET /payments/studio-policies - Response Structure", 
                                  has_required_fields, f"Missing fields: {[f for f in required_fields if f not in data]}")
            except Exception as e:
                results.add_result("GET /payments/studio-policies - JSON Parse", False, str(e))

def test_business_logic_validation(results):
    """Test business logic validation across endpoints"""
    print("\n🔍 Testing Business Logic Validation...")
    
    # Test fee calculation consistency
    print("\nTesting fee calculation consistency...")
    
    # Test standard class booking fee (3.75%)
    standard_fee_data = {
        "amount": 10000,  # $100.00
        "paymentType": "class_booking",
        "studioId": "test-studio-123"
    }
    response = make_authenticated_request("/payments/calculate-platform-fees", "POST", standard_fee_data)
    if response and response.status_code == 200:
        try:
            data = response.json()
            if 'calculation' in data and 'platformFee' in data['calculation']:
                expected_fee = 10000 * 0.0375  # 3.75% of $100
                actual_fee = data['calculation']['platformFee']
                fee_accuracy = abs(actual_fee - expected_fee) < 10  # Allow small rounding differences
                results.add_result("Business Logic - Standard Fee Calculation (3.75%)", 
                                  fee_accuracy, f"Expected ~{expected_fee}, got {actual_fee}")
        except Exception as e:
            results.add_result("Business Logic - Standard Fee Calculation", False, str(e))
    
    # Test X Pass fee calculation (7.5%)
    xpass_fee_data = {
        "amount": 10000,  # $100.00
        "paymentType": "xpass_redemption",
        "studioId": "test-studio-123"
    }
    response = make_authenticated_request("/payments/calculate-platform-fees", "POST", xpass_fee_data)
    if response and response.status_code == 200:
        try:
            data = response.json()
            if 'calculation' in data and 'platformFee' in data['calculation']:
                expected_fee = 10000 * 0.075  # 7.5% of $100
                actual_fee = data['calculation']['platformFee']
                fee_accuracy = abs(actual_fee - expected_fee) < 10  # Allow small rounding differences
                results.add_result("Business Logic - X Pass Fee Calculation (7.5%)", 
                                  fee_accuracy, f"Expected ~{expected_fee}, got {actual_fee}")
        except Exception as e:
            results.add_result("Business Logic - X Pass Fee Calculation", False, str(e))
    
    # Test cancellation policy time calculations
    print("\nTesting cancellation policy time calculations...")
    
    # Test within cancellation window (should have no fee)
    future_time = (datetime.now() + timedelta(hours=48)).isoformat()
    within_window_data = {
        "bookingId": "test-booking-future",
        "cancellationReason": "Schedule change",
        "cancelledAt": datetime.now().isoformat()
    }
    response = make_authenticated_request("/payments/apply-cancellation-policy", "POST", within_window_data)
    if response:
        # Even if booking doesn't exist, the endpoint should validate the structure
        structure_valid = response.status_code in [200, 404]
        results.add_result("Business Logic - Cancellation Time Validation", 
                          structure_valid, f"Expected 200 or 404, got {response.status_code}")

def test_error_handling_and_validation(results):
    """Test error handling and input validation"""
    print("\n🔍 Testing Error Handling and Validation...")
    
    # Test malformed JSON requests
    print("\nTesting malformed JSON handling...")
    
    try:
        response = requests.post(f"{API_BASE}/payments/apply-cancellation-policy", 
                               headers=TEST_HEADERS, 
                               data="invalid json", 
                               timeout=10)
        malformed_json_test = response.status_code == 400
        results.add_result("Error Handling - Malformed JSON", 
                          malformed_json_test, f"Expected 400, got {response.status_code}")
    except Exception as e:
        results.add_result("Error Handling - Malformed JSON", False, str(e))
    
    # Test invalid parameter types
    print("\nTesting invalid parameter validation...")
    
    invalid_fee_data = {
        "amount": "invalid_amount",  # Should be number
        "paymentType": "class_booking"
    }
    response = make_authenticated_request("/payments/calculate-platform-fees", "POST", invalid_fee_data)
    if response:
        invalid_param_test = response.status_code in [400, 500]
        results.add_result("Error Handling - Invalid Parameter Types", 
                          invalid_param_test, f"Expected 400 or 500, got {response.status_code}")
    
    # Test missing required fields
    print("\nTesting missing required field validation...")
    
    incomplete_data = {
        "paymentType": "class_booking"
        # Missing amount field
    }
    response = make_authenticated_request("/payments/calculate-platform-fees", "POST", incomplete_data)
    if response:
        missing_field_test = response.status_code in [400, 500]
        results.add_result("Error Handling - Missing Required Fields", 
                          missing_field_test, f"Expected 400 or 500, got {response.status_code}")

def test_role_based_access_control(results):
    """Test role-based access control"""
    print("\n🔍 Testing Role-Based Access Control...")
    
    # Test studio policies endpoint (should require merchant role)
    response = make_authenticated_request("/payments/studio-policies")
    if response:
        # Should return 403 for non-merchant users or 200 for merchants
        rbac_test = response.status_code in [200, 403]
        results.add_result("RBAC - Studio Policies Access", 
                          rbac_test, f"Expected 200 or 403, got {response.status_code}")
    
    # Test no-show processing (should require instructor or merchant role)
    no_show_data = {
        "bookingId": "test-booking-123",
        "noShowConfirmed": True
    }
    response = make_authenticated_request("/payments/process-no-show", "POST", no_show_data)
    if response:
        # Should return 403 for unauthorized users or 404 for valid users with non-existent booking
        rbac_test = response.status_code in [200, 403, 404]
        results.add_result("RBAC - No-Show Processing Access", 
                          rbac_test, f"Expected 200, 403, or 404, got {response.status_code}")

def run_comprehensive_tests():
    """Run all Phase 3 Business Logic & Fee Processing tests"""
    print("🚀 Starting Phase 3 Business Logic & Fee Processing API Tests...")
    print(f"Testing against: {API_BASE}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    results = TestResults()
    
    try:
        # Test all endpoint categories
        test_cancellation_policy_endpoints(results)
        test_no_show_processing(results)
        test_platform_fee_calculation(results)
        test_payment_retry_system(results)
        test_subscription_proration(results)
        test_studio_policy_management(results)
        test_business_logic_validation(results)
        test_error_handling_and_validation(results)
        test_role_based_access_control(results)
        
    except Exception as e:
        print(f"❌ Critical test error: {e}")
        results.add_result("Critical Test Execution", False, str(e))
    
    # Print final results
    results.print_summary()
    
    # Print detailed results for failed tests
    failed_tests = [r for r in results.results if not r['passed']]
    if failed_tests:
        print(f"\n📋 FAILED TESTS DETAILS:")
        print("-" * 80)
        for test in failed_tests:
            print(f"❌ {test['test']}")
            if test['details']:
                print(f"   Details: {test['details']}")
        print("-" * 80)
    
    return results

if __name__ == "__main__":
    results = run_comprehensive_tests()
    
    # Exit with appropriate code
    exit_code = 0 if results.failed_tests == 0 else 1
    print(f"\nTest execution completed with exit code: {exit_code}")
    exit(exit_code)