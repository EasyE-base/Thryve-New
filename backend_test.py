#!/usr/bin/env python3

"""
Phase 2 Subscription Management System Backend API Testing
Testing all 10 new subscription management endpoints for the Thryve fitness platform.

Endpoints to test:
1. POST /server-api/payments/create-class-package - Purchase Class Packages
2. POST /server-api/payments/pause-subscription - Pause Recurring Subscription  
3. POST /server-api/payments/resume-subscription - Resume Paused Subscription
4. POST /server-api/payments/cancel-subscription - Cancel Subscription
5. POST /server-api/payments/use-xpass-credit - X Pass Credit Redemption
6. POST /server-api/payments/use-class-package - Class Package Credit Usage
7. GET /server-api/payments/class-packages - Retrieve User Class Packages
8. GET /server-api/payments/subscription-analytics - Subscription Analytics Dashboard
9. GET /server-api/payments/xpass-redemptions - X Pass Redemption History
10. GET /server-api/payments/class-package-usage - Class Package Usage History
"""

import requests
import json
import time
import os
import sys
from datetime import datetime, timedelta

# Configuration
BASE_URL = "https://c965f60f-b3cc-49e1-9021-e1c5bd50d222.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/server-api"

# Test authentication token (mock Firebase token)
AUTH_TOKEN = "Bearer firebase-test-token"
HEADERS = {
    "Authorization": AUTH_TOKEN,
    "Content-Type": "application/json"
}

# Test data
TEST_STUDIO_ID = "test-studio-123"
TEST_CLASS_ID = "test-class-456"
TEST_SUBSCRIPTION_ID = "sub_test123"
TEST_PACKAGE_ID = "pkg_test123"

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
            status = "✅ PASS"
        else:
            self.failed_tests += 1
            status = "❌ FAIL"
        
        result = f"{status}: {test_name}"
        if details:
            result += f" - {details}"
        
        self.results.append(result)
        print(result)
    
    def print_summary(self):
        print("\n" + "="*80)
        print("PHASE 2 SUBSCRIPTION MANAGEMENT SYSTEM - TEST SUMMARY")
        print("="*80)
        print(f"Total Tests: {self.total_tests}")
        print(f"Passed: {self.passed_tests}")
        print(f"Failed: {self.failed_tests}")
        print(f"Success Rate: {(self.passed_tests/self.total_tests*100):.1f}%")
        print("="*80)
        
        if self.failed_tests > 0:
            print("\nFAILED TESTS:")
            for result in self.results:
                if "❌ FAIL" in result:
                    print(result)

def make_request(method, endpoint, data=None, headers=None):
    """Make HTTP request with error handling"""
    if headers is None:
        headers = HEADERS
    
    url = f"{API_BASE}{endpoint}"
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=30)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers, timeout=30)
        elif method == "PUT":
            response = requests.put(url, json=data, headers=headers, timeout=30)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers, timeout=30)
        
        # Debug: Print response details for failed requests
        if response.status_code >= 400:
            print(f"DEBUG: {method} {endpoint} returned {response.status_code}")
            try:
                error_data = response.json()
                print(f"DEBUG: Error response: {error_data}")
            except:
                print(f"DEBUG: Raw response: {response.text[:200]}")
        
        return response
    except requests.exceptions.RequestException as e:
        print(f"Request error for {method} {endpoint}: {e}")
        return None

def test_authentication_protection(results):
    """Test that all endpoints require authentication"""
    print("\n🔐 TESTING AUTHENTICATION PROTECTION")
    print("-" * 50)
    
    endpoints = [
        ("GET", "/payments/class-packages"),
        ("GET", "/payments/subscription-analytics"),
        ("GET", "/payments/xpass-redemptions"),
        ("GET", "/payments/class-package-usage"),
        ("POST", "/payments/create-class-package"),
        ("POST", "/payments/pause-subscription"),
        ("POST", "/payments/resume-subscription"),
        ("POST", "/payments/cancel-subscription"),
        ("POST", "/payments/use-xpass-credit"),
        ("POST", "/payments/use-class-package")
    ]
    
    no_auth_headers = {"Content-Type": "application/json"}
    
    for method, endpoint in endpoints:
        response = make_request(method, endpoint, {}, no_auth_headers)
        if response:
            passed = response.status_code == 401
            results.add_result(
                f"Auth protection {method} {endpoint}",
                passed,
                f"Status: {response.status_code}, Expected: 401"
            )
        else:
            results.add_result(f"Auth protection {method} {endpoint}", False, "Request failed")

def test_get_class_packages(results):
    """Test GET /server-api/payments/class-packages"""
    print("\n📦 TESTING CLASS PACKAGES RETRIEVAL")
    print("-" * 50)
    
    # Test basic retrieval
    response = make_request("GET", "/payments/class-packages")
    if response:
        passed = response.status_code == 200
        results.add_result(
            "Get class packages - basic",
            passed,
            f"Status: {response.status_code}"
        )
        
        if passed:
            try:
                data = response.json()
                print(f"DEBUG: Class packages response keys: {list(data.keys())}")
                has_packages = "packages" in data
                has_total = "totalPackages" in data
                has_summary = "summary" in data
                
                results.add_result(
                    "Class packages response structure",
                    has_packages and has_total and has_summary,
                    f"Has packages: {has_packages}, total: {has_total}, summary: {has_summary}"
                )
            except json.JSONDecodeError:
                results.add_result("Class packages JSON parsing", False, "Invalid JSON response")
    else:
        results.add_result("Get class packages - basic", False, "Request failed")
    
    # Test with status filter
    response = make_request("GET", "/payments/class-packages?status=active")
    if response:
        passed = response.status_code == 200
        results.add_result(
            "Get class packages - status filter",
            passed,
            f"Status: {response.status_code}"
        )
    
    # Test with studio filter
    response = make_request("GET", f"/payments/class-packages?studioId={TEST_STUDIO_ID}")
    if response:
        passed = response.status_code == 200
        results.add_result(
            "Get class packages - studio filter",
            passed,
            f"Status: {response.status_code}"
        )

def test_subscription_analytics(results):
    """Test GET /server-api/payments/subscription-analytics"""
    print("\n📊 TESTING SUBSCRIPTION ANALYTICS")
    print("-" * 50)
    
    response = make_request("GET", "/payments/subscription-analytics")
    if response:
        passed = response.status_code == 200
        results.add_result(
            "Get subscription analytics",
            passed,
            f"Status: {response.status_code}"
        )
        
        if passed:
            try:
                data = response.json()
                print(f"DEBUG: Subscription analytics response keys: {list(data.keys())}")
                # Check for expected analytics fields
                expected_fields = ["dateRange", "subscriptions", "revenue", "analytics"]
                has_fields = all(field in data for field in expected_fields)
                
                results.add_result(
                    "Subscription analytics structure",
                    has_fields,
                    f"Has required fields: {has_fields}"
                )
            except json.JSONDecodeError:
                results.add_result("Subscription analytics JSON parsing", False, "Invalid JSON response")
    else:
        results.add_result("Get subscription analytics", False, "Request failed")
    
    # Test with date range
    start_date = (datetime.now() - timedelta(days=30)).isoformat()
    end_date = datetime.now().isoformat()
    response = make_request("GET", f"/payments/subscription-analytics?startDate={start_date}&endDate={end_date}")
    if response:
        passed = response.status_code == 200
        results.add_result(
            "Subscription analytics - date range",
            passed,
            f"Status: {response.status_code}"
        )

def test_xpass_redemptions(results):
    """Test GET /server-api/payments/xpass-redemptions"""
    print("\n🎫 TESTING X PASS REDEMPTION HISTORY")
    print("-" * 50)
    
    response = make_request("GET", "/payments/xpass-redemptions")
    if response:
        passed = response.status_code == 200
        results.add_result(
            "Get X Pass redemptions",
            passed,
            f"Status: {response.status_code}"
        )
        
        if passed:
            try:
                data = response.json()
                has_redemptions = "redemptions" in data
                has_pagination = "pagination" in data
                has_total = "totalRedemptions" in data
                
                results.add_result(
                    "X Pass redemptions structure",
                    has_redemptions and has_pagination and has_total,
                    f"Has redemptions: {has_redemptions}, pagination: {has_pagination}, total: {has_total}"
                )
            except json.JSONDecodeError:
                results.add_result("X Pass redemptions JSON parsing", False, "Invalid JSON response")
    else:
        results.add_result("Get X Pass redemptions", False, "Request failed")
    
    # Test with pagination
    response = make_request("GET", "/payments/xpass-redemptions?limit=10&offset=0")
    if response:
        passed = response.status_code == 200
        results.add_result(
            "X Pass redemptions - pagination",
            passed,
            f"Status: {response.status_code}"
        )
    
    # Test with studio filter
    response = make_request("GET", f"/payments/xpass-redemptions?studioId={TEST_STUDIO_ID}")
    if response:
        passed = response.status_code == 200
        results.add_result(
            "X Pass redemptions - studio filter",
            passed,
            f"Status: {response.status_code}"
        )

def test_class_package_usage(results):
    """Test GET /server-api/payments/class-package-usage"""
    print("\n📈 TESTING CLASS PACKAGE USAGE HISTORY")
    print("-" * 50)
    
    response = make_request("GET", "/payments/class-package-usage")
    if response:
        passed = response.status_code == 200
        results.add_result(
            "Get class package usage",
            passed,
            f"Status: {response.status_code}"
        )
        
        if passed:
            try:
                data = response.json()
                has_usage = "usage" in data
                has_total = "totalUsage" in data
                has_packages = "packageSummary" in data
                
                results.add_result(
                    "Class package usage structure",
                    has_usage and has_total and has_packages,
                    f"Has usage: {has_usage}, total: {has_total}, packages: {has_packages}"
                )
            except json.JSONDecodeError:
                results.add_result("Class package usage JSON parsing", False, "Invalid JSON response")
    else:
        results.add_result("Get class package usage", False, "Request failed")
    
    # Test with package filter
    response = make_request("GET", f"/payments/class-package-usage?packageId={TEST_PACKAGE_ID}")
    if response:
        passed = response.status_code == 200
        results.add_result(
            "Class package usage - package filter",
            passed,
            f"Status: {response.status_code}"
        )

def test_create_class_package(results):
    """Test POST /server-api/payments/create-class-package"""
    print("\n🛒 TESTING CLASS PACKAGE CREATION")
    print("-" * 50)
    
    # Test 5-class package
    package_data = {
        "packageType": "basic",
        "classCount": 5,
        "amount": 125.00,  # $25 per class
        "studioId": TEST_STUDIO_ID,
        "expirationDays": 90,
        "paymentMethodId": "pm_test_card"
    }
    
    response = make_request("POST", "/payments/create-class-package", package_data)
    if response:
        passed = response.status_code == 200
        results.add_result(
            "Create 5-class package",
            passed,
            f"Status: {response.status_code}"
        )
        
        if passed:
            try:
                data = response.json()
                has_package_id = "packageId" in data
                has_platform_fee = "platformFee" in data
                has_expiration = "expirationDate" in data
                
                results.add_result(
                    "Class package creation response",
                    has_package_id and has_platform_fee and has_expiration,
                    f"Has packageId: {has_package_id}, platformFee: {has_platform_fee}, expiration: {has_expiration}"
                )
            except json.JSONDecodeError:
                results.add_result("Class package creation JSON parsing", False, "Invalid JSON response")
    else:
        results.add_result("Create 5-class package", False, "Request failed")
    
    # Test 10-class package
    package_data_10 = {
        "packageType": "standard",
        "classCount": 10,
        "amount": 220.00,  # $22 per class
        "studioId": TEST_STUDIO_ID,
        "expirationDays": 90,
        "paymentMethodId": "pm_test_card"
    }
    
    response = make_request("POST", "/payments/create-class-package", package_data_10)
    if response:
        passed = response.status_code == 200
        results.add_result(
            "Create 10-class package",
            passed,
            f"Status: {response.status_code}"
        )
    
    # Test 15-class package
    package_data_15 = {
        "packageType": "premium",
        "classCount": 15,
        "amount": 300.00,  # $20 per class
        "studioId": TEST_STUDIO_ID,
        "expirationDays": 90,
        "paymentMethodId": "pm_test_card"
    }
    
    response = make_request("POST", "/payments/create-class-package", package_data_15)
    if response:
        passed = response.status_code == 200
        results.add_result(
            "Create 15-class package",
            passed,
            f"Status: {response.status_code}"
        )
    
    # Test missing required fields
    invalid_data = {
        "packageType": "basic",
        "classCount": 5
        # Missing amount, studioId, paymentMethodId
    }
    
    response = make_request("POST", "/payments/create-class-package", invalid_data)
    if response:
        passed = response.status_code == 400
        results.add_result(
            "Class package validation - missing fields",
            passed,
            f"Status: {response.status_code}, Expected: 400"
        )

def test_pause_subscription(results):
    """Test POST /server-api/payments/pause-subscription"""
    print("\n⏸️ TESTING SUBSCRIPTION PAUSE")
    print("-" * 50)
    
    # Test basic pause
    pause_data = {
        "subscriptionId": TEST_SUBSCRIPTION_ID,
        "pauseDuration": 30  # 30 days
    }
    
    response = make_request("POST", "/payments/pause-subscription", pause_data)
    if response:
        passed = response.status_code == 200
        results.add_result(
            "Pause subscription - 30 days",
            passed,
            f"Status: {response.status_code}"
        )
        
        if passed:
            try:
                data = response.json()
                has_message = "message" in data
                has_subscription = "subscription" in data
                has_resume_date = "resumeDate" in data
                
                results.add_result(
                    "Pause subscription response",
                    has_message and has_subscription and has_resume_date,
                    f"Has message: {has_message}, subscription: {has_subscription}, resumeDate: {has_resume_date}"
                )
            except json.JSONDecodeError:
                results.add_result("Pause subscription JSON parsing", False, "Invalid JSON response")
    else:
        results.add_result("Pause subscription - 30 days", False, "Request failed")
    
    # Test custom pause duration
    pause_data_60 = {
        "subscriptionId": TEST_SUBSCRIPTION_ID,
        "pauseDuration": 60  # 60 days
    }
    
    response = make_request("POST", "/payments/pause-subscription", pause_data_60)
    if response:
        passed = response.status_code == 200
        results.add_result(
            "Pause subscription - 60 days",
            passed,
            f"Status: {response.status_code}"
        )
    
    # Test missing subscription ID
    invalid_data = {"pauseDuration": 30}
    
    response = make_request("POST", "/payments/pause-subscription", invalid_data)
    if response:
        passed = response.status_code == 400
        results.add_result(
            "Pause subscription validation - missing ID",
            passed,
            f"Status: {response.status_code}, Expected: 400"
        )

def test_resume_subscription(results):
    """Test POST /server-api/payments/resume-subscription"""
    print("\n▶️ TESTING SUBSCRIPTION RESUME")
    print("-" * 50)
    
    resume_data = {
        "subscriptionId": TEST_SUBSCRIPTION_ID
    }
    
    response = make_request("POST", "/payments/resume-subscription", resume_data)
    if response:
        passed = response.status_code == 200
        results.add_result(
            "Resume subscription",
            passed,
            f"Status: {response.status_code}"
        )
        
        if passed:
            try:
                data = response.json()
                has_message = "message" in data
                has_subscription = "subscription" in data
                
                results.add_result(
                    "Resume subscription response",
                    has_message and has_subscription,
                    f"Has message: {has_message}, subscription: {has_subscription}"
                )
            except json.JSONDecodeError:
                results.add_result("Resume subscription JSON parsing", False, "Invalid JSON response")
    else:
        results.add_result("Resume subscription", False, "Request failed")
    
    # Test missing subscription ID
    response = make_request("POST", "/payments/resume-subscription", {})
    if response:
        passed = response.status_code == 400
        results.add_result(
            "Resume subscription validation - missing ID",
            passed,
            f"Status: {response.status_code}, Expected: 400"
        )

def test_cancel_subscription(results):
    """Test POST /server-api/payments/cancel-subscription"""
    print("\n🚫 TESTING SUBSCRIPTION CANCELLATION")
    print("-" * 50)
    
    # Test immediate cancellation
    cancel_data = {
        "subscriptionId": TEST_SUBSCRIPTION_ID,
        "cancelImmediately": True,
        "cancelationReason": "User requested immediate cancellation"
    }
    
    response = make_request("POST", "/payments/cancel-subscription", cancel_data)
    if response:
        passed = response.status_code == 200
        results.add_result(
            "Cancel subscription - immediate",
            passed,
            f"Status: {response.status_code}"
        )
        
        if passed:
            try:
                data = response.json()
                has_message = "message" in data
                has_subscription = "subscription" in data
                has_cancellation_date = "cancellationDate" in data
                
                results.add_result(
                    "Cancel subscription response",
                    has_message and has_subscription and has_cancellation_date,
                    f"Has message: {has_message}, subscription: {has_subscription}, cancellationDate: {has_cancellation_date}"
                )
            except json.JSONDecodeError:
                results.add_result("Cancel subscription JSON parsing", False, "Invalid JSON response")
    else:
        results.add_result("Cancel subscription - immediate", False, "Request failed")
    
    # Test end-of-period cancellation
    cancel_data_eop = {
        "subscriptionId": TEST_SUBSCRIPTION_ID,
        "cancelImmediately": False,
        "cancelationReason": "User requested end-of-period cancellation"
    }
    
    response = make_request("POST", "/payments/cancel-subscription", cancel_data_eop)
    if response:
        passed = response.status_code == 200
        results.add_result(
            "Cancel subscription - end of period",
            passed,
            f"Status: {response.status_code}"
        )
    
    # Test missing subscription ID
    response = make_request("POST", "/payments/cancel-subscription", {"cancelImmediately": True})
    if response:
        passed = response.status_code == 400
        results.add_result(
            "Cancel subscription validation - missing ID",
            passed,
            f"Status: {response.status_code}, Expected: 400"
        )

def test_use_xpass_credit(results):
    """Test POST /server-api/payments/use-xpass-credit"""
    print("\n🎫 TESTING X PASS CREDIT USAGE")
    print("-" * 50)
    
    # Test basic X Pass credit usage
    xpass_data = {
        "classId": TEST_CLASS_ID,
        "studioId": TEST_STUDIO_ID,
        "creditsToUse": 1
    }
    
    response = make_request("POST", "/payments/use-xpass-credit", xpass_data)
    if response:
        passed = response.status_code == 200
        results.add_result(
            "Use X Pass credit - single credit",
            passed,
            f"Status: {response.status_code}"
        )
        
        if passed:
            try:
                data = response.json()
                has_message = "message" in data
                has_remaining = "remainingCredits" in data
                has_transaction = "transactionId" in data
                
                results.add_result(
                    "X Pass credit usage response",
                    has_message and has_remaining and has_transaction,
                    f"Has message: {has_message}, remaining: {has_remaining}, transaction: {has_transaction}"
                )
            except json.JSONDecodeError:
                results.add_result("X Pass credit usage JSON parsing", False, "Invalid JSON response")
    else:
        results.add_result("Use X Pass credit - single credit", False, "Request failed")
    
    # Test multiple credits usage
    xpass_data_multi = {
        "classId": TEST_CLASS_ID,
        "studioId": TEST_STUDIO_ID,
        "creditsToUse": 2
    }
    
    response = make_request("POST", "/payments/use-xpass-credit", xpass_data_multi)
    if response:
        passed = response.status_code == 200
        results.add_result(
            "Use X Pass credit - multiple credits",
            passed,
            f"Status: {response.status_code}"
        )
    
    # Test missing required fields
    invalid_data = {"classId": TEST_CLASS_ID}  # Missing studioId
    
    response = make_request("POST", "/payments/use-xpass-credit", invalid_data)
    if response:
        passed = response.status_code == 400
        results.add_result(
            "X Pass credit validation - missing fields",
            passed,
            f"Status: {response.status_code}, Expected: 400"
        )

def test_use_class_package(results):
    """Test POST /server-api/payments/use-class-package"""
    print("\n📦 TESTING CLASS PACKAGE CREDIT USAGE")
    print("-" * 50)
    
    # Test basic class package usage
    package_data = {
        "packageId": TEST_PACKAGE_ID,
        "classId": TEST_CLASS_ID,
        "studioId": TEST_STUDIO_ID
    }
    
    response = make_request("POST", "/payments/use-class-package", package_data)
    if response:
        passed = response.status_code == 200
        results.add_result(
            "Use class package credit",
            passed,
            f"Status: {response.status_code}"
        )
        
        if passed:
            try:
                data = response.json()
                has_message = "message" in data
                has_remaining = "remainingClasses" in data
                has_usage_id = "usageId" in data
                
                results.add_result(
                    "Class package usage response",
                    has_message and has_remaining and has_usage_id,
                    f"Has message: {has_message}, remaining: {has_remaining}, usageId: {has_usage_id}"
                )
            except json.JSONDecodeError:
                results.add_result("Class package usage JSON parsing", False, "Invalid JSON response")
    else:
        results.add_result("Use class package credit", False, "Request failed")
    
    # Test missing required fields
    invalid_data = {"packageId": TEST_PACKAGE_ID}  # Missing classId and studioId
    
    response = make_request("POST", "/payments/use-class-package", invalid_data)
    if response:
        passed = response.status_code == 400
        results.add_result(
            "Class package validation - missing fields",
            passed,
            f"Status: {response.status_code}, Expected: 400"
        )

def test_business_logic_validation(results):
    """Test business logic and validation rules"""
    print("\n🧠 TESTING BUSINESS LOGIC VALIDATION")
    print("-" * 50)
    
    # Test platform fee calculation (3.75% for class packages)
    package_data = {
        "packageType": "basic",
        "classCount": 5,
        "amount": 100.00,
        "studioId": TEST_STUDIO_ID,
        "expirationDays": 90,
        "paymentMethodId": "pm_test_card"
    }
    
    response = make_request("POST", "/payments/create-class-package", package_data)
    if response and response.status_code == 200:
        try:
            data = response.json()
            platform_fee = data.get("platformFee", 0)
            expected_fee = 100.00 * 0.0375  # 3.75%
            fee_correct = abs(platform_fee - expected_fee) < 0.01
            
            results.add_result(
                "Platform fee calculation (3.75%)",
                fee_correct,
                f"Expected: ${expected_fee:.2f}, Got: ${platform_fee:.2f}"
            )
        except (json.JSONDecodeError, KeyError):
            results.add_result("Platform fee calculation", False, "Could not verify fee calculation")
    
    # Test expiration date calculation
    response = make_request("GET", "/payments/class-packages")
    if response and response.status_code == 200:
        try:
            data = response.json()
            packages = data.get("packages", [])
            if packages:
                # Check if packages have proper expiration tracking
                has_expiration = any("expirationDate" in pkg for pkg in packages)
                has_status = any("status" in pkg for pkg in packages)
                
                results.add_result(
                    "Expiration tracking",
                    has_expiration and has_status,
                    f"Has expiration: {has_expiration}, has status: {has_status}"
                )
        except (json.JSONDecodeError, KeyError):
            results.add_result("Expiration tracking", False, "Could not verify expiration tracking")

def test_error_handling(results):
    """Test error handling scenarios"""
    print("\n⚠️ TESTING ERROR HANDLING")
    print("-" * 50)
    
    # Test invalid JSON
    try:
        response = requests.post(
            f"{API_BASE}/payments/create-class-package",
            data="invalid json",
            headers=HEADERS,
            timeout=30
        )
        passed = response.status_code in [400, 500]
        results.add_result(
            "Invalid JSON handling",
            passed,
            f"Status: {response.status_code}"
        )
    except Exception as e:
        results.add_result("Invalid JSON handling", False, f"Exception: {e}")
    
    # Test non-existent subscription
    cancel_data = {
        "subscriptionId": "non_existent_sub",
        "cancelImmediately": True
    }
    
    response = make_request("POST", "/payments/cancel-subscription", cancel_data)
    if response:
        passed = response.status_code in [404, 400]
        results.add_result(
            "Non-existent subscription handling",
            passed,
            f"Status: {response.status_code}"
        )
    
    # Test non-existent package
    package_data = {
        "packageId": "non_existent_pkg",
        "classId": TEST_CLASS_ID,
        "studioId": TEST_STUDIO_ID
    }
    
    response = make_request("POST", "/payments/use-class-package", package_data)
    if response:
        passed = response.status_code in [404, 400]
        results.add_result(
            "Non-existent package handling",
            passed,
            f"Status: {response.status_code}"
        )

def main():
    """Run all Phase 2 Subscription Management System tests"""
    print("🚀 STARTING PHASE 2 SUBSCRIPTION MANAGEMENT SYSTEM BACKEND TESTING")
    print("=" * 80)
    print(f"Base URL: {BASE_URL}")
    print(f"API Base: {API_BASE}")
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)
    
    results = TestResults()
    
    # Run all test suites
    test_authentication_protection(results)
    test_get_class_packages(results)
    test_subscription_analytics(results)
    test_xpass_redemptions(results)
    test_class_package_usage(results)
    test_create_class_package(results)
    test_pause_subscription(results)
    test_resume_subscription(results)
    test_cancel_subscription(results)
    test_use_xpass_credit(results)
    test_use_class_package(results)
    test_business_logic_validation(results)
    test_error_handling(results)
    
    # Print final summary
    results.print_summary()
    
    # Return success/failure for script exit code
    return results.failed_tests == 0

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)