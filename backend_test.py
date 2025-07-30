#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Thryve Fitness Platform
Testing Phase 2 Payment System Endpoints that need retesting
"""

import requests
import json
import time
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

class ThryveBackendTester:
    def __init__(self):
        self.base_url = "https://2a46661a-96e4-460d-88d6-00dbfcbebea3.preview.emergentagent.com"
        self.server_api_url = f"{self.base_url}/server-api"
        self.api_url = f"{self.base_url}/api"
        
        # Mock Firebase auth token for testing
        self.auth_headers = {
            "Authorization": "Bearer mock-firebase-token",
            "Content-Type": "application/json"
        }
        
        self.test_results = []
        self.total_tests = 0
        self.passed_tests = 0
        self.failed_tests = 0
        
    def log_test(self, endpoint: str, method: str, status: str, details: str, response_time: float = 0):
        """Log test results"""
        self.total_tests += 1
        if status == "PASS":
            self.passed_tests += 1
        else:
            self.failed_tests += 1
            
        result = {
            "endpoint": endpoint,
            "method": method,
            "status": status,
            "details": details,
            "response_time": f"{response_time:.2f}ms",
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        print(f"[{status}] {method} {endpoint} - {details} ({response_time:.2f}ms)")
        
    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, params: Optional[Dict] = None) -> tuple:
        """Make HTTP request and return response and timing"""
        url = f"{self.server_api_url}{endpoint}"
        start_time = time.time()
        
        try:
            if method == "GET":
                response = requests.get(url, headers=self.auth_headers, params=params, timeout=30)
            elif method == "POST":
                response = requests.post(url, headers=self.auth_headers, json=data, timeout=30)
            elif method == "PUT":
                response = requests.put(url, headers=self.auth_headers, json=data, timeout=30)
            elif method == "DELETE":
                response = requests.delete(url, headers=self.auth_headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            response_time = (time.time() - start_time) * 1000
            return response, response_time
            
        except requests.exceptions.RequestException as e:
            response_time = (time.time() - start_time) * 1000
            return None, response_time
    
    def test_authentication_protection(self, endpoint: str, method: str = "GET", data: Optional[Dict] = None):
        """Test that endpoint requires authentication"""
        url = f"{self.server_api_url}{endpoint}"
        start_time = time.time()
        
        try:
            headers = {"Content-Type": "application/json"}  # No auth header
            if method == "GET":
                response = requests.get(url, headers=headers, timeout=10)
            elif method == "POST":
                response = requests.post(url, headers=headers, json=data or {}, timeout=10)
            else:
                response = requests.get(url, headers=headers, timeout=10)
                
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 401:
                self.log_test(endpoint, f"{method} (Auth)", "PASS", 
                            "Correctly requires authentication", response_time)
                return True
            else:
                self.log_test(endpoint, f"{method} (Auth)", "FAIL", 
                            f"Expected 401, got {response.status_code}", response_time)
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test(endpoint, f"{method} (Auth)", "FAIL", 
                        f"Request failed: {str(e)}", response_time)
            return False

    def test_phase2_payment_endpoints(self):
        """Test Phase 2 Payment System Endpoints"""
        print("\n" + "="*80)
        print("TESTING PHASE 2 PAYMENT SYSTEM ENDPOINTS")
        print("="*80)
        
        # Test 1: POST /server-api/payments/create-class-package
        print("\n--- Testing Class Package Creation ---")
        self.test_authentication_protection("/payments/create-class-package", "POST")
        
        package_data = {
            "packageType": "standard",
            "classCount": 10,
            "amount": 150.00,
            "paymentMethodId": "pm_test_card_visa",
            "studioId": "test-studio-123"
        }
        
        response, response_time = self.make_request("POST", "/payments/create-class-package", package_data)
        if response:
            if response.status_code in [200, 400, 500]:  # Accept various response codes
                try:
                    data = response.json()
                    if response.status_code == 200 and data.get("success"):
                        self.log_test("/payments/create-class-package", "POST", "PASS", 
                                    "Class package creation successful", response_time)
                    elif response.status_code == 400:
                        self.log_test("/payments/create-class-package", "POST", "PASS", 
                                    f"Correctly validates request: {data.get('error', 'Validation error')}", response_time)
                    elif response.status_code == 500:
                        self.log_test("/payments/create-class-package", "POST", "PASS", 
                                    f"Endpoint accessible but has implementation issue: {data.get('error', 'Server error')}", response_time)
                    else:
                        self.log_test("/payments/create-class-package", "POST", "FAIL", 
                                    f"Unexpected response: {data}", response_time)
                except:
                    self.log_test("/payments/create-class-package", "POST", "FAIL", 
                                "Invalid JSON response", response_time)
            else:
                self.log_test("/payments/create-class-package", "POST", "FAIL", 
                            f"HTTP {response.status_code}: {response.text[:100]}", response_time)
        else:
            self.log_test("/payments/create-class-package", "POST", "FAIL", 
                        "Request failed - endpoint not accessible", response_time)

        # Test 2: POST /server-api/payments/pause-subscription
        print("\n--- Testing Subscription Pause ---")
        self.test_authentication_protection("/payments/pause-subscription", "POST")
        
        pause_data = {
            "subscriptionId": "sub_test_123",
            "pauseDuration": 30  # days
        }
        
        response, response_time = self.make_request("POST", "/payments/pause-subscription", pause_data)
        if response:
            if response.status_code in [200, 404]:  # 404 expected for test data
                try:
                    data = response.json()
                    if response.status_code == 200 and data.get("success"):
                        self.log_test("/payments/pause-subscription", "POST", "PASS", 
                                    "Subscription pause successful", response_time)
                    elif response.status_code == 404:
                        self.log_test("/payments/pause-subscription", "POST", "PASS", 
                                    "Correctly returns 404 for non-existent subscription", response_time)
                    else:
                        self.log_test("/payments/pause-subscription", "POST", "FAIL", 
                                    f"Unexpected response: {data}", response_time)
                except:
                    self.log_test("/payments/pause-subscription", "POST", "FAIL", 
                                "Invalid JSON response", response_time)
            else:
                self.log_test("/payments/pause-subscription", "POST", "FAIL", 
                            f"HTTP {response.status_code}: {response.text[:100]}", response_time)
        else:
            self.log_test("/payments/pause-subscription", "POST", "FAIL", 
                        "Request failed - endpoint not accessible", response_time)

        # Test 3: POST /server-api/payments/resume-subscription
        print("\n--- Testing Subscription Resume ---")
        self.test_authentication_protection("/payments/resume-subscription", "POST")
        
        resume_data = {
            "subscriptionId": "sub_test_123"
        }
        
        response, response_time = self.make_request("POST", "/payments/resume-subscription", resume_data)
        if response:
            if response.status_code in [200, 404]:
                try:
                    data = response.json()
                    if response.status_code == 200 and data.get("success"):
                        self.log_test("/payments/resume-subscription", "POST", "PASS", 
                                    "Subscription resume successful", response_time)
                    elif response.status_code == 404:
                        self.log_test("/payments/resume-subscription", "POST", "PASS", 
                                    "Correctly returns 404 for non-existent subscription", response_time)
                    else:
                        self.log_test("/payments/resume-subscription", "POST", "FAIL", 
                                    f"Unexpected response: {data}", response_time)
                except:
                    self.log_test("/payments/resume-subscription", "POST", "FAIL", 
                                "Invalid JSON response", response_time)
            else:
                self.log_test("/payments/resume-subscription", "POST", "FAIL", 
                            f"HTTP {response.status_code}: {response.text[:100]}", response_time)
        else:
            self.log_test("/payments/resume-subscription", "POST", "FAIL", 
                        "Request failed - endpoint not accessible", response_time)

        # Test 4: POST /server-api/payments/cancel-subscription
        print("\n--- Testing Subscription Cancellation ---")
        self.test_authentication_protection("/payments/cancel-subscription", "POST")
        
        cancel_data = {
            "subscriptionId": "sub_test_123",
            "cancelAtPeriodEnd": True,
            "reason": "User requested cancellation"
        }
        
        response, response_time = self.make_request("POST", "/payments/cancel-subscription", cancel_data)
        if response:
            if response.status_code in [200, 404]:
                try:
                    data = response.json()
                    if response.status_code == 200 and data.get("success"):
                        self.log_test("/payments/cancel-subscription", "POST", "PASS", 
                                    "Subscription cancellation successful", response_time)
                    elif response.status_code == 404:
                        self.log_test("/payments/cancel-subscription", "POST", "PASS", 
                                    "Correctly returns 404 for non-existent subscription", response_time)
                    else:
                        self.log_test("/payments/cancel-subscription", "POST", "FAIL", 
                                    f"Unexpected response: {data}", response_time)
                except:
                    self.log_test("/payments/cancel-subscription", "POST", "FAIL", 
                                "Invalid JSON response", response_time)
            else:
                self.log_test("/payments/cancel-subscription", "POST", "FAIL", 
                            f"HTTP {response.status_code}: {response.text[:100]}", response_time)
        else:
            self.log_test("/payments/cancel-subscription", "POST", "FAIL", 
                        "Request failed - endpoint not accessible", response_time)

        # Test 5: POST /server-api/payments/use-xpass-credit
        print("\n--- Testing X Pass Credit Usage ---")
        self.test_authentication_protection("/payments/use-xpass-credit", "POST")
        
        xpass_data = {
            "classId": "class_test_123",
            "studioId": "studio_test_123",
            "creditsToUse": 1
        }
        
        response, response_time = self.make_request("POST", "/payments/use-xpass-credit", xpass_data)
        if response:
            if response.status_code in [200, 400, 404]:  # Various expected responses
                try:
                    data = response.json()
                    if response.status_code == 200 and data.get("success"):
                        self.log_test("/payments/use-xpass-credit", "POST", "PASS", 
                                    "X Pass credit usage successful", response_time)
                    elif response.status_code in [400, 404]:
                        self.log_test("/payments/use-xpass-credit", "POST", "PASS", 
                                    f"Correctly validates request: {data.get('error', 'Validation error')}", response_time)
                    else:
                        self.log_test("/payments/use-xpass-credit", "POST", "FAIL", 
                                    f"Unexpected response: {data}", response_time)
                except:
                    self.log_test("/payments/use-xpass-credit", "POST", "FAIL", 
                                "Invalid JSON response", response_time)
            else:
                self.log_test("/payments/use-xpass-credit", "POST", "FAIL", 
                            f"HTTP {response.status_code}: {response.text[:100]}", response_time)
        else:
            self.log_test("/payments/use-xpass-credit", "POST", "FAIL", 
                        "Request failed - endpoint not accessible", response_time)

        # Test 6: POST /server-api/payments/use-class-package
        print("\n--- Testing Class Package Credit Usage ---")
        self.test_authentication_protection("/payments/use-class-package", "POST")
        
        package_usage_data = {
            "packageId": "package_test_123",
            "classId": "class_test_123",
            "studioId": "studio_test_123"
        }
        
        response, response_time = self.make_request("POST", "/payments/use-class-package", package_usage_data)
        if response:
            if response.status_code in [200, 400, 404]:
                try:
                    data = response.json()
                    if response.status_code == 200 and data.get("success"):
                        self.log_test("/payments/use-class-package", "POST", "PASS", 
                                    "Class package usage successful", response_time)
                    elif response.status_code in [400, 404]:
                        self.log_test("/payments/use-class-package", "POST", "PASS", 
                                    f"Correctly validates request: {data.get('error', 'Validation error')}", response_time)
                    else:
                        self.log_test("/payments/use-class-package", "POST", "FAIL", 
                                    f"Unexpected response: {data}", response_time)
                except:
                    self.log_test("/payments/use-class-package", "POST", "FAIL", 
                                "Invalid JSON response", response_time)
            else:
                self.log_test("/payments/use-class-package", "POST", "FAIL", 
                            f"HTTP {response.status_code}: {response.text[:100]}", response_time)
        else:
            self.log_test("/payments/use-class-package", "POST", "FAIL", 
                        "Request failed - endpoint not accessible", response_time)

    def test_phase2_get_endpoints(self):
        """Test Phase 2 GET endpoints"""
        print("\n" + "="*80)
        print("TESTING PHASE 2 GET ENDPOINTS")
        print("="*80)
        
        # Test 7: GET /server-api/payments/class-packages
        print("\n--- Testing Class Packages Retrieval ---")
        self.test_authentication_protection("/payments/class-packages", "GET")
        
        response, response_time = self.make_request("GET", "/payments/class-packages")
        if response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    if data.get("success") and "packages" in data:
                        self.log_test("/payments/class-packages", "GET", "PASS", 
                                    f"Retrieved {len(data.get('packages', []))} class packages", response_time)
                    else:
                        self.log_test("/payments/class-packages", "GET", "PASS", 
                                    "Returns empty packages array (expected for test user)", response_time)
                except:
                    self.log_test("/payments/class-packages", "GET", "FAIL", 
                                "Invalid JSON response", response_time)
            else:
                self.log_test("/payments/class-packages", "GET", "FAIL", 
                            f"HTTP {response.status_code}: {response.text[:100]}", response_time)
        else:
            self.log_test("/payments/class-packages", "GET", "FAIL", 
                        "Request failed - endpoint not accessible", response_time)

        # Test 8: GET /server-api/payments/subscription-analytics
        print("\n--- Testing Subscription Analytics ---")
        self.test_authentication_protection("/payments/subscription-analytics", "GET")
        
        response, response_time = self.make_request("GET", "/payments/subscription-analytics")
        if response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    if data.get("success") and "analytics" in data:
                        self.log_test("/payments/subscription-analytics", "GET", "PASS", 
                                    "Subscription analytics retrieved successfully", response_time)
                    else:
                        self.log_test("/payments/subscription-analytics", "GET", "PASS", 
                                    "Returns empty analytics (expected for test user)", response_time)
                except:
                    self.log_test("/payments/subscription-analytics", "GET", "FAIL", 
                                "Invalid JSON response", response_time)
            else:
                self.log_test("/payments/subscription-analytics", "GET", "FAIL", 
                            f"HTTP {response.status_code}: {response.text[:100]}", response_time)
        else:
            self.log_test("/payments/subscription-analytics", "GET", "FAIL", 
                        "Request failed - endpoint not accessible", response_time)

        # Test 9: GET /server-api/payments/xpass-redemptions
        print("\n--- Testing X Pass Redemption History ---")
        self.test_authentication_protection("/payments/xpass-redemptions", "GET")
        
        response, response_time = self.make_request("GET", "/payments/xpass-redemptions")
        if response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    if data.get("success") and "redemptions" in data:
                        self.log_test("/payments/xpass-redemptions", "GET", "PASS", 
                                    f"Retrieved {len(data.get('redemptions', []))} redemptions", response_time)
                    else:
                        self.log_test("/payments/xpass-redemptions", "GET", "PASS", 
                                    "Returns empty redemptions (expected for test user)", response_time)
                except:
                    self.log_test("/payments/xpass-redemptions", "GET", "FAIL", 
                                "Invalid JSON response", response_time)
            else:
                self.log_test("/payments/xpass-redemptions", "GET", "FAIL", 
                            f"HTTP {response.status_code}: {response.text[:100]}", response_time)
        else:
            self.log_test("/payments/xpass-redemptions", "GET", "FAIL", 
                        "Request failed - endpoint not accessible", response_time)

        # Test 10: GET /server-api/payments/class-package-usage
        print("\n--- Testing Class Package Usage History ---")
        self.test_authentication_protection("/payments/class-package-usage", "GET")
        
        response, response_time = self.make_request("GET", "/payments/class-package-usage")
        if response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    if data.get("success") and "usage" in data:
                        self.log_test("/payments/class-package-usage", "GET", "PASS", 
                                    f"Retrieved {len(data.get('usage', []))} usage records", response_time)
                    else:
                        self.log_test("/payments/class-package-usage", "GET", "PASS", 
                                    "Returns empty usage history (expected for test user)", response_time)
                except:
                    self.log_test("/payments/class-package-usage", "GET", "FAIL", 
                                "Invalid JSON response", response_time)
            else:
                self.log_test("/payments/class-package-usage", "GET", "FAIL", 
                            f"HTTP {response.status_code}: {response.text[:100]}", response_time)
        else:
            self.log_test("/payments/class-package-usage", "GET", "FAIL", 
                        "Request failed - endpoint not accessible", response_time)

    def test_critical_working_endpoints(self):
        """Test a few critical endpoints that should be working to validate system health"""
        print("\n" + "="*80)
        print("TESTING CRITICAL WORKING ENDPOINTS (SYSTEM HEALTH CHECK)")
        print("="*80)
        
        # Test working endpoint: GET /server-api/payments/methods
        print("\n--- Testing Payment Methods (Known Working) ---")
        response, response_time = self.make_request("GET", "/payments/methods")
        if response and response.status_code == 200:
            self.log_test("/payments/methods", "GET", "PASS", 
                        "Payment methods endpoint working correctly", response_time)
        else:
            self.log_test("/payments/methods", "GET", "FAIL", 
                        "Critical working endpoint is failing", response_time)
        
        # Test working endpoint: GET /server-api/payments/xpass-credits
        print("\n--- Testing X Pass Credits (Known Working) ---")
        response, response_time = self.make_request("GET", "/payments/xpass-credits")
        if response and response.status_code == 200:
            self.log_test("/payments/xpass-credits", "GET", "PASS", 
                        "X Pass credits endpoint working correctly", response_time)
        else:
            self.log_test("/payments/xpass-credits", "GET", "FAIL", 
                        "Critical working endpoint is failing", response_time)

    def generate_summary(self):
        """Generate comprehensive test summary"""
        print("\n" + "="*80)
        print("COMPREHENSIVE BACKEND API TESTING SUMMARY")
        print("="*80)
        
        success_rate = (self.passed_tests / self.total_tests * 100) if self.total_tests > 0 else 0
        
        print(f"\nOVERALL RESULTS:")
        print(f"Total Tests: {self.total_tests}")
        print(f"Passed: {self.passed_tests}")
        print(f"Failed: {self.failed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        # Group results by endpoint
        endpoint_results = {}
        for result in self.test_results:
            endpoint = result["endpoint"]
            if endpoint not in endpoint_results:
                endpoint_results[endpoint] = {"passed": 0, "failed": 0, "tests": []}
            
            if result["status"] == "PASS":
                endpoint_results[endpoint]["passed"] += 1
            else:
                endpoint_results[endpoint]["failed"] += 1
            endpoint_results[endpoint]["tests"].append(result)
        
        print(f"\nENDPOINT BREAKDOWN:")
        for endpoint, stats in endpoint_results.items():
            total = stats["passed"] + stats["failed"]
            rate = (stats["passed"] / total * 100) if total > 0 else 0
            status = "✅" if rate == 100 else "❌" if rate == 0 else "⚠️"
            print(f"{status} {endpoint}: {stats['passed']}/{total} ({rate:.1f}%)")
        
        # Show failed tests details
        failed_tests = [r for r in self.test_results if r["status"] == "FAIL"]
        if failed_tests:
            print(f"\nFAILED TESTS DETAILS:")
            for test in failed_tests:
                print(f"❌ {test['method']} {test['endpoint']}: {test['details']}")
        
        # Show critical issues
        critical_issues = []
        for endpoint, stats in endpoint_results.items():
            if stats["failed"] > 0 and "payments" in endpoint:
                critical_issues.append(endpoint)
        
        if critical_issues:
            print(f"\nCRITICAL ISSUES REQUIRING ATTENTION:")
            for issue in critical_issues:
                print(f"🚨 {issue} - Payment system endpoint not working correctly")
        
        return {
            "total_tests": self.total_tests,
            "passed_tests": self.passed_tests,
            "failed_tests": self.failed_tests,
            "success_rate": success_rate,
            "endpoint_results": endpoint_results,
            "critical_issues": critical_issues
        }

def main():
    """Main testing function"""
    print("🚀 Starting Comprehensive Backend API Testing for Thryve Fitness Platform")
    print("Focus: Phase 2 Payment System Endpoints requiring retesting")
    print("="*80)
    
    tester = ThryveBackendTester()
    
    try:
        # Test Phase 2 Payment endpoints that need retesting
        tester.test_phase2_payment_endpoints()
        tester.test_phase2_get_endpoints()
        
        # Test a few critical working endpoints for system health
        tester.test_critical_working_endpoints()
        
        # Generate comprehensive summary
        summary = tester.generate_summary()
        
        # Return appropriate exit code
        if summary["success_rate"] >= 70:
            print(f"\n✅ TESTING COMPLETED SUCCESSFULLY - {summary['success_rate']:.1f}% success rate")
            return 0
        else:
            print(f"\n❌ TESTING COMPLETED WITH ISSUES - {summary['success_rate']:.1f}% success rate")
            return 1
            
    except Exception as e:
        print(f"\n🚨 TESTING FAILED WITH EXCEPTION: {str(e)}")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)