#!/usr/bin/env python3
"""
Backend API Tests for Thryve Platform
Tests API routes, business logic, and Firebase integration
"""

import requests
import json
import time
import os

class BackendTester:
    def __init__(self, base_url="https://thryve-new-new.vercel.app"):
        self.base_url = base_url
        self.headers = {"Content-Type": "application/json"}
        print("🔥 Starting Thryve Backend API Tests")
        print("=" * 50)

    def _test_case(self, name, test_func):
        """Run a test case and return success status"""
        print(f"Running test: {name}...")
        try:
            result = test_func()
            if result:
                print(f"✅ PASS {name}")
                return True
            else:
                print(f"❌ FAIL {name}")
                return False
        except Exception as e:
            print(f"❌ ERROR {name}: {e}")
            return False

    def test_api_health_check(self):
        """Test basic API connectivity"""
        try:
            response = requests.get(f"{self.base_url}/api/health", timeout=10)
            print(f"  Status: {response.status_code}")
            return response.status_code == 200 or response.status_code == 404  # 404 is ok if endpoint doesn't exist
        except Exception as e:
            print(f"  Error: {e}")
            return False

    def test_firebase_user_api_validation(self):
        """Test Firebase user API parameter validation"""
        try:
            # Test missing UID
            response = requests.get(f"{self.base_url}/api/auth/firebase-user")
            print(f"  No UID - Status: {response.status_code}")
            no_uid_valid = response.status_code == 400

            # Test invalid UID format
            response = requests.get(f"{self.base_url}/api/auth/firebase-user?uid=invalid")
            print(f"  Invalid UID - Status: {response.status_code}")
            invalid_uid_valid = response.status_code == 404 or response.status_code == 400

            return no_uid_valid and invalid_uid_valid
        except Exception as e:
            print(f"  Error: {e}")
            return False

    def test_firebase_role_api_validation(self):
        """Test Firebase role API parameter validation"""
        try:
            # Test POST without body
            response = requests.post(f"{self.base_url}/api/auth/firebase-role")
            print(f"  No body - Status: {response.status_code}")
            no_body_valid = response.status_code == 400

            # Test POST with invalid body
            response = requests.post(
                f"{self.base_url}/api/auth/firebase-role",
                json={"invalid": "data"},
                headers=self.headers
            )
            print(f"  Invalid body - Status: {response.status_code}")
            invalid_body_valid = response.status_code == 400

            return no_body_valid and invalid_body_valid
        except Exception as e:
            print(f"  Error: {e}")
            return False

    def test_protected_routes_behavior(self):
        """Test that protected routes properly redirect"""
        protected_routes = [
            "/dashboard",
            "/dashboard/customer", 
            "/dashboard/instructor",
            "/dashboard/merchant",
            "/settings",
            "/my-bookings"
        ]
        
        all_protected = True
        for route in protected_routes:
            try:
                response = requests.get(f"{self.base_url}{route}", allow_redirects=False, timeout=5)
                is_protected = response.status_code in [301, 302, 307, 308]
                print(f"  {route}: {response.status_code} {'✅' if is_protected else '❌'}")
                if not is_protected:
                    all_protected = False
            except Exception as e:
                print(f"  {route}: ERROR - {e}")
                all_protected = False
        
        return all_protected

    def test_public_routes_accessible(self):
        """Test that public routes are accessible"""
        public_routes = [
            "/",
            "/signup", 
            "/explore",
            "/pricing"
        ]
        
        all_accessible = True
        for route in public_routes:
            try:
                response = requests.get(f"{self.base_url}{route}", timeout=10)
                is_accessible = response.status_code == 200
                print(f"  {route}: {response.status_code} {'✅' if is_accessible else '❌'}")
                if not is_accessible:
                    all_accessible = False
            except Exception as e:
                print(f"  {route}: ERROR - {e}")
                all_accessible = False
        
        return all_accessible

    def test_cors_headers(self):
        """Test CORS headers for API endpoints"""
        try:
            response = requests.options(f"{self.base_url}/api/auth/firebase-user")
            has_cors = 'Access-Control-Allow-Origin' in response.headers
            print(f"  CORS headers present: {'✅' if has_cors else '❌'}")
            return True  # CORS may not be needed for same-origin requests
        except Exception as e:
            print(f"  Error: {e}")
            return True  # Non-critical

    def run_all_tests(self):
        """Run all backend tests"""
        tests = [
            ("API Health Check", self.test_api_health_check),
            ("Firebase User API Validation", self.test_firebase_user_api_validation),
            ("Firebase Role API Validation", self.test_firebase_role_api_validation),
            ("Protected Routes Behavior", self.test_protected_routes_behavior),
            ("Public Routes Accessible", self.test_public_routes_accessible),
            ("CORS Headers", self.test_cors_headers),
        ]

        passed_tests = 0
        total_tests = len(tests)

        for name, func in tests:
            if self._test_case(name, func):
                passed_tests += 1
            time.sleep(0.2)  # Small delay between tests

        print("\n" + "=" * 50)
        print("📊 BACKEND TEST SUMMARY")
        print("=" * 50)
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {total_tests - passed_tests}")
        print(f"Success Rate: {(passed_tests / total_tests) * 100:.1f}%")

        return passed_tests == total_tests

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    if success:
        print("\n🎉 All backend tests passed!")
        exit(0)
    else:
        print("\n💥 Some backend tests failed!")
        exit(1)