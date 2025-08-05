#!/usr/bin/env python3
"""
Firebase/Next.js Authentication Backend Tests
Tests the Firebase Auth integration, API endpoints, and user flows.
"""

import requests
import json
import time
from typing import Dict, Any, Optional

class AuthBackendTester:
    def __init__(self, base_url: str = "https://thryve-new-new.vercel.app"):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_results = []
        
    def log_test(self, test_name: str, passed: bool, details: str = ""):
        """Log test results"""
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        self.test_results.append({
            "test": test_name,
            "passed": passed,
            "details": details,
            "timestamp": time.time()
        })
    
    def test_landing_page_auth_state(self):
        """Test landing page shows correct auth state for unauthenticated users"""
        try:
            response = self.session.get(f"{self.base_url}/")
            
            # Check status code
            if response.status_code != 200:
                self.log_test("Landing Page Access", False, f"Status: {response.status_code}")
                return
            
            content = response.text
            
            # Check for correct unauthenticated state
            has_sign_in = "Sign In" in content
            has_sign_up = "Sign Up" in content or "Get Started" in content
            has_dashboard = "Dashboard" in content
            has_messages = "Messages" in content
            has_notifications = "Notifications" in content
            
            # For unauthenticated users, should have Sign In/Sign Up but NOT Dashboard/Messages/Notifications
            correct_auth_state = has_sign_in and has_sign_up and not (has_dashboard or has_messages or has_notifications)
            
            details = f"SignIn: {has_sign_in}, SignUp: {has_sign_up}, Dashboard: {has_dashboard}, Messages: {has_messages}, Notifications: {has_notifications}"
            self.log_test("Landing Page Auth State", correct_auth_state, details)
            
        except Exception as e:
            self.log_test("Landing Page Auth State", False, f"Error: {str(e)}")
    
    def test_api_auth_endpoints(self):
        """Test Firebase auth API endpoints"""
        # Test /api/auth/firebase-user endpoint
        try:
            response = self.session.get(f"{self.base_url}/api/auth/firebase-user")
            
            # Should return 400 for missing uid
            if response.status_code == 400:
                self.log_test("Firebase User API (No UID)", True, "Correctly returns 400 for missing uid")
            else:
                self.log_test("Firebase User API (No UID)", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Firebase User API (No UID)", False, f"Error: {str(e)}")
        
        # Test /api/auth/firebase-role endpoint
        try:
            response = self.session.post(f"{self.base_url}/api/auth/firebase-role", 
                                       json={}, 
                                       headers={'Content-Type': 'application/json'})
            
            # Should return 400 for missing data
            if response.status_code == 400:
                self.log_test("Firebase Role API (No Data)", True, "Correctly returns 400 for missing data")
            else:
                self.log_test("Firebase Role API (No Data)", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Firebase Role API (No Data)", False, f"Error: {str(e)}")
    
    def test_protected_routes_redirect(self):
        """Test that protected routes redirect properly"""
        protected_routes = [
            "/dashboard",
            "/dashboard/customer",
            "/dashboard/instructor", 
            "/dashboard/merchant",
            "/onboarding/customer",
            "/onboarding/instructor",
            "/onboarding/merchant"
        ]
        
        for route in protected_routes:
            try:
                response = self.session.get(f"{self.base_url}{route}", allow_redirects=False)
                
                # Should redirect (3xx) or return error for unauthenticated access
                is_protected = response.status_code in [301, 302, 303, 307, 308, 401, 403]
                
                details = f"Status: {response.status_code}"
                if 'location' in response.headers:
                    details += f", Redirects to: {response.headers['location']}"
                
                self.log_test(f"Protected Route {route}", is_protected, details)
                
            except Exception as e:
                self.log_test(f"Protected Route {route}", False, f"Error: {str(e)}")
    
    def test_signup_page_functionality(self):
        """Test signup page loads and has required elements"""
        try:
            response = self.session.get(f"{self.base_url}/signup")
            
            if response.status_code != 200:
                self.log_test("Signup Page Access", False, f"Status: {response.status_code}")
                return
            
            content = response.text
            
            # Check for signup form elements
            has_email_field = 'type="email"' in content or 'name="email"' in content
            has_password_field = 'type="password"' in content or 'name="password"' in content
            has_submit_button = 'type="submit"' in content or 'Sign Up' in content
            
            form_complete = has_email_field and has_password_field and has_submit_button
            
            details = f"Email: {has_email_field}, Password: {has_password_field}, Submit: {has_submit_button}"
            self.log_test("Signup Page Form", form_complete, details)
            
        except Exception as e:
            self.log_test("Signup Page Form", False, f"Error: {str(e)}")
    
    def test_role_selection_page(self):
        """Test role selection page"""
        try:
            response = self.session.get(f"{self.base_url}/signup/role-selection")
            
            if response.status_code != 200:
                self.log_test("Role Selection Access", False, f"Status: {response.status_code}")
                return
            
            content = response.text
            
            # Check for role options
            has_customer_role = 'customer' in content.lower() or 'client' in content.lower()
            has_instructor_role = 'instructor' in content.lower()
            has_merchant_role = 'merchant' in content.lower() or 'studio' in content.lower()
            
            has_all_roles = has_customer_role and has_instructor_role and has_merchant_role
            
            details = f"Customer: {has_customer_role}, Instructor: {has_instructor_role}, Merchant: {has_merchant_role}"
            self.log_test("Role Selection Options", has_all_roles, details)
            
        except Exception as e:
            self.log_test("Role Selection Options", False, f"Error: {str(e)}")
    
    def test_navigation_links(self):
        """Test critical navigation links work"""
        navigation_links = [
            "/explore",
            "/pricing", 
            "/xpass"
        ]
        
        for link in navigation_links:
            try:
                response = self.session.get(f"{self.base_url}{link}")
                
                # Should be accessible (200) or redirect (3xx)
                is_accessible = response.status_code in [200, 301, 302, 303, 307, 308]
                
                details = f"Status: {response.status_code}"
                self.log_test(f"Navigation Link {link}", is_accessible, details)
                
            except Exception as e:
                self.log_test(f"Navigation Link {link}", False, f"Error: {str(e)}")
    
    def run_all_tests(self):
        """Run all authentication backend tests"""
        print("🔥 Starting Firebase/Next.js Authentication Backend Tests")
        print("=" * 60)
        
        self.test_landing_page_auth_state()
        self.test_api_auth_endpoints()
        self.test_protected_routes_redirect()
        self.test_signup_page_functionality()
        self.test_role_selection_page()
        self.test_navigation_links()
        
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t['passed']])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n🚨 FAILED TESTS:")
            for test in self.test_results:
                if not test['passed']:
                    print(f"  - {test['test']}: {test['details']}")
        
        return passed_tests == total_tests

if __name__ == "__main__":
    tester = AuthBackendTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 All tests passed!")
        exit(0)
    else:
        print("\n💥 Some tests failed!")
        exit(1)