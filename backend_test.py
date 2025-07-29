#!/usr/bin/env python3
"""
Comprehensive Communication Layer Backend Testing
Tests all communication endpoints mentioned in the review request
"""

import requests
import json
import time
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://3fc0018d-7103-4d9d-bf5e-c269670ae862.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/server-api"

# Mock Firebase token for testing (matches backend mock implementation)
MOCK_TOKEN = "mock-firebase-token"
HEADERS = {
    "Authorization": f"Bearer {MOCK_TOKEN}",
    "Content-Type": "application/json"
}

class CommunicationLayerTester:
    def __init__(self):
        self.test_results = []
        self.total_tests = 0
        self.passed_tests = 0
        
    def log_test(self, test_name, success, details="", response_data=None):
        """Log test results"""
        self.total_tests += 1
        if success:
            self.passed_tests += 1
            status = "✅ PASS"
        else:
            status = "❌ FAIL"
            
        result = {
            "test": test_name,
            "status": status,
            "success": success,
            "details": details,
            "response_data": response_data,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if response_data and not success:
            print(f"   Response: {response_data}")
        print()

    def test_authentication_protection(self, endpoint, method="GET"):
        """Test that endpoints require authentication"""
        try:
            if method == "GET":
                response = requests.get(f"{API_BASE}{endpoint}")
            elif method == "POST":
                response = requests.post(f"{API_BASE}{endpoint}", json={})
            elif method == "PUT":
                response = requests.put(f"{API_BASE}{endpoint}", json={})
            elif method == "DELETE":
                response = requests.delete(f"{API_BASE}{endpoint}")
                
            if response.status_code == 401:
                self.log_test(f"Authentication Protection - {method} {endpoint}", True, 
                            "Correctly returns 401 for unauthenticated requests")
                return True
            else:
                self.log_test(f"Authentication Protection - {method} {endpoint}", False, 
                            f"Expected 401, got {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test(f"Authentication Protection - {method} {endpoint}", False, 
                        f"Request failed: {str(e)}")
            return False

    def test_message_thread_management(self):
        """Test message thread management endpoints"""
        print("=== TESTING MESSAGE THREAD MANAGEMENT ===")
        
        # Test GET /messages/threads
        try:
            response = requests.get(f"{API_BASE}/messages/threads", headers=HEADERS)
            if response.status_code == 200:
                data = response.json()
                if 'success' in data and 'threads' in data:
                    self.log_test("GET /messages/threads", True, 
                                f"Successfully retrieved threads. Response structure correct.")
                else:
                    self.log_test("GET /messages/threads", False, 
                                "Response missing required fields (success, threads)", data)
            else:
                self.log_test("GET /messages/threads", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("GET /messages/threads", False, f"Request failed: {str(e)}")

        # Test authentication protection
        self.test_authentication_protection("/messages/threads", "GET")

        # Test POST /messages/threads/create (create new thread)
        thread_data = {
            "type": "direct",
            "participantIds": ["user1", "user2"],
            "name": "Test Thread",
            "initialMessage": "Hello, this is a test message"
        }
        
        try:
            response = requests.post(f"{API_BASE}/messages/threads/create", 
                                   headers=HEADERS, json=thread_data)
            if response.status_code in [200, 201]:
                data = response.json()
                if 'success' in data or 'threadId' in data:
                    self.log_test("POST /messages/threads/create", True, 
                                "Successfully created message thread")
                else:
                    self.log_test("POST /messages/threads/create", False, 
                                "Response missing success indicator", data)
            else:
                self.log_test("POST /messages/threads/create", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("POST /messages/threads/create", False, f"Request failed: {str(e)}")

        # Test authentication protection for POST
        self.test_authentication_protection("/messages/threads/create", "POST")

    def test_message_system(self):
        """Test message sending and retrieval"""
        print("=== TESTING MESSAGE SYSTEM ===")
        
        # Test GET /messages/threads/{threadId}/messages
        test_thread_id = "test-thread-123"
        try:
            response = requests.get(f"{API_BASE}/messages/threads/{test_thread_id}/messages", 
                                  headers=HEADERS)
            if response.status_code == 200:
                data = response.json()
                if 'success' in data and 'messages' in data:
                    self.log_test("GET /messages/threads/{threadId}/messages", True, 
                                f"Successfully retrieved messages for thread")
                else:
                    self.log_test("GET /messages/threads/{threadId}/messages", False, 
                                "Response missing required fields", data)
            else:
                self.log_test("GET /messages/threads/{threadId}/messages", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("GET /messages/threads/{threadId}/messages", False, f"Request failed: {str(e)}")

        # Test POST /messages/send
        message_data = {
            "threadId": "test-thread-123",
            "content": "This is a test message",
            "type": "text"
        }
        
        try:
            response = requests.post(f"{API_BASE}/messages/send", 
                                   headers=HEADERS, json=message_data)
            if response.status_code in [200, 201]:
                data = response.json()
                if 'success' in data or 'messageId' in data:
                    self.log_test("POST /messages/send", True, 
                                "Successfully sent message")
                else:
                    self.log_test("POST /messages/send", False, 
                                "Response missing success indicator", data)
            else:
                self.log_test("POST /messages/send", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("POST /messages/send", False, f"Request failed: {str(e)}")

        # Test POST /messages/threads/{threadId}/read (mark as read)
        try:
            response = requests.post(f"{API_BASE}/messages/threads/{test_thread_id}/read", 
                                   headers=HEADERS, json={})
            if response.status_code in [200, 201]:
                data = response.json()
                if 'success' in data:
                    self.log_test("POST /messages/threads/{threadId}/read", True, 
                                "Successfully marked messages as read")
                else:
                    self.log_test("POST /messages/threads/{threadId}/read", False, 
                                "Response missing success indicator", data)
            else:
                self.log_test("POST /messages/threads/{threadId}/read", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("POST /messages/threads/{threadId}/read", False, f"Request failed: {str(e)}")

        # Test authentication protection
        self.test_authentication_protection("/messages/send", "POST")

    def test_notification_system(self):
        """Test notification system endpoints"""
        print("=== TESTING NOTIFICATION SYSTEM ===")
        
        # Test GET /notifications
        try:
            response = requests.get(f"{API_BASE}/notifications", headers=HEADERS)
            if response.status_code == 200:
                data = response.json()
                if 'success' in data and 'notifications' in data and 'unreadCount' in data:
                    self.log_test("GET /notifications", True, 
                                f"Successfully retrieved notifications with unread count: {data.get('unreadCount', 0)}")
                else:
                    self.log_test("GET /notifications", False, 
                                "Response missing required fields (success, notifications, unreadCount)", data)
            else:
                self.log_test("GET /notifications", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("GET /notifications", False, f"Request failed: {str(e)}")

        # Test POST /notifications/send
        notification_data = {
            "type": "in_app",
            "recipients": ["user1", "user2"],
            "subject": "Test Notification",
            "message": "This is a test notification"
        }
        
        try:
            response = requests.post(f"{API_BASE}/notifications/send", 
                                   headers=HEADERS, json=notification_data)
            if response.status_code in [200, 201]:
                data = response.json()
                if 'notificationId' in data or 'message' in data:
                    self.log_test("POST /notifications/send", True, 
                                "Successfully sent notification")
                else:
                    self.log_test("POST /notifications/send", False, 
                                "Response missing success indicator", data)
            else:
                self.log_test("POST /notifications/send", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("POST /notifications/send", False, f"Request failed: {str(e)}")

        # Test POST /notifications/{notificationId}/read
        test_notification_id = "test-notification-123"
        try:
            response = requests.post(f"{API_BASE}/notifications/{test_notification_id}/read", 
                                   headers=HEADERS, json={})
            if response.status_code in [200, 201]:
                data = response.json()
                if 'success' in data:
                    self.log_test("POST /notifications/{notificationId}/read", True, 
                                "Successfully marked notification as read")
                else:
                    self.log_test("POST /notifications/{notificationId}/read", False, 
                                "Response missing success indicator", data)
            else:
                self.log_test("POST /notifications/{notificationId}/read", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("POST /notifications/{notificationId}/read", False, f"Request failed: {str(e)}")

        # Test POST /notifications/mark-all-read
        try:
            response = requests.post(f"{API_BASE}/notifications/mark-all-read", 
                                   headers=HEADERS, json={})
            if response.status_code in [200, 201]:
                data = response.json()
                if 'success' in data:
                    self.log_test("POST /notifications/mark-all-read", True, 
                                "Successfully marked all notifications as read")
                else:
                    self.log_test("POST /notifications/mark-all-read", False, 
                                "Response missing success indicator", data)
            else:
                self.log_test("POST /notifications/mark-all-read", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("POST /notifications/mark-all-read", False, f"Request failed: {str(e)}")

        # Test DELETE /notifications/{notificationId}
        try:
            response = requests.delete(f"{API_BASE}/notifications/{test_notification_id}", 
                                     headers=HEADERS)
            if response.status_code in [200, 204]:
                self.log_test("DELETE /notifications/{notificationId}", True, 
                            "Successfully deleted notification")
            else:
                self.log_test("DELETE /notifications/{notificationId}", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("DELETE /notifications/{notificationId}", False, f"Request failed: {str(e)}")

        # Test authentication protection
        self.test_authentication_protection("/notifications", "GET")
        self.test_authentication_protection("/notifications/send", "POST")

    def test_notification_settings(self):
        """Test notification settings endpoints"""
        print("=== TESTING NOTIFICATION SETTINGS ===")
        
        # Test GET /notifications/settings
        try:
            response = requests.get(f"{API_BASE}/notifications/settings", headers=HEADERS)
            if response.status_code == 200:
                data = response.json()
                if 'success' in data and 'settings' in data:
                    settings = data['settings']
                    expected_fields = ['email', 'sms', 'push', 'inApp', 'bookingConfirmations']
                    if any(field in settings for field in expected_fields):
                        self.log_test("GET /notifications/settings", True, 
                                    f"Successfully retrieved notification settings")
                    else:
                        self.log_test("GET /notifications/settings", False, 
                                    "Settings missing expected fields", data)
                else:
                    self.log_test("GET /notifications/settings", False, 
                                "Response missing required fields (success, settings)", data)
            else:
                self.log_test("GET /notifications/settings", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("GET /notifications/settings", False, f"Request failed: {str(e)}")

        # Test PUT /notifications/settings
        settings_data = {
            "settings": {
                "email": True,
                "sms": False,
                "push": True,
                "inApp": True,
                "bookingConfirmations": True,
                "classReminders": True,
                "paymentAlerts": True,
                "promotions": False
            }
        }
        
        try:
            response = requests.put(f"{API_BASE}/notifications/settings", 
                                  headers=HEADERS, json=settings_data)
            if response.status_code in [200, 201]:
                data = response.json()
                if 'success' in data:
                    self.log_test("PUT /notifications/settings", True, 
                                "Successfully updated notification settings")
                else:
                    self.log_test("PUT /notifications/settings", False, 
                                "Response missing success indicator", data)
            else:
                self.log_test("PUT /notifications/settings", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("PUT /notifications/settings", False, f"Request failed: {str(e)}")

        # Test authentication protection
        self.test_authentication_protection("/notifications/settings", "GET")
        self.test_authentication_protection("/notifications/settings", "PUT")

    def test_communication_dashboard(self):
        """Test communication dashboard endpoints (merchant only)"""
        print("=== TESTING COMMUNICATION DASHBOARD (MERCHANT ONLY) ===")
        
        # Test GET /communication/stats
        try:
            response = requests.get(f"{API_BASE}/communication/stats", headers=HEADERS)
            if response.status_code == 200:
                data = response.json()
                if 'success' in data and 'stats' in data:
                    stats = data['stats']
                    expected_fields = ['messagesSent', 'openRate', 'responseRate', 'totalThreads']
                    if any(field in stats for field in expected_fields):
                        self.log_test("GET /communication/stats", True, 
                                    f"Successfully retrieved communication stats")
                    else:
                        self.log_test("GET /communication/stats", False, 
                                    "Stats missing expected fields", data)
                else:
                    self.log_test("GET /communication/stats", False, 
                                "Response missing required fields (success, stats)", data)
            elif response.status_code == 403:
                self.log_test("GET /communication/stats", True, 
                            "Correctly returns 403 for non-merchant users (role-based access control working)")
            else:
                self.log_test("GET /communication/stats", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("GET /communication/stats", False, f"Request failed: {str(e)}")

        # Test GET /communication/broadcasts
        try:
            response = requests.get(f"{API_BASE}/communication/broadcasts", headers=HEADERS)
            if response.status_code == 200:
                data = response.json()
                if 'success' in data and 'broadcasts' in data:
                    self.log_test("GET /communication/broadcasts", True, 
                                f"Successfully retrieved broadcast history")
                else:
                    self.log_test("GET /communication/broadcasts", False, 
                                "Response missing required fields (success, broadcasts)", data)
            elif response.status_code == 403:
                self.log_test("GET /communication/broadcasts", True, 
                            "Correctly returns 403 for non-merchant users (role-based access control working)")
            else:
                self.log_test("GET /communication/broadcasts", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("GET /communication/broadcasts", False, f"Request failed: {str(e)}")

        # Test GET /communication/templates
        try:
            response = requests.get(f"{API_BASE}/communication/templates", headers=HEADERS)
            if response.status_code == 200:
                data = response.json()
                if 'success' in data and 'templates' in data:
                    self.log_test("GET /communication/templates", True, 
                                f"Successfully retrieved message templates")
                else:
                    self.log_test("GET /communication/templates", False, 
                                "Response missing required fields (success, templates)", data)
            elif response.status_code == 403:
                self.log_test("GET /communication/templates", True, 
                            "Correctly returns 403 for non-merchant users (role-based access control working)")
            else:
                self.log_test("GET /communication/templates", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("GET /communication/templates", False, f"Request failed: {str(e)}")

        # Test POST /communication/broadcast
        broadcast_data = {
            "recipients": ["all_customers"],
            "subject": "Test Broadcast",
            "message": "This is a test broadcast message",
            "type": "promotional"
        }
        
        try:
            response = requests.post(f"{API_BASE}/communication/broadcast", 
                                   headers=HEADERS, json=broadcast_data)
            if response.status_code in [200, 201]:
                data = response.json()
                if 'success' in data or 'broadcastId' in data:
                    self.log_test("POST /communication/broadcast", True, 
                                "Successfully sent broadcast message")
                else:
                    self.log_test("POST /communication/broadcast", False, 
                                "Response missing success indicator", data)
            elif response.status_code == 403:
                self.log_test("POST /communication/broadcast", True, 
                            "Correctly returns 403 for non-merchant users (role-based access control working)")
            else:
                self.log_test("POST /communication/broadcast", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("POST /communication/broadcast", False, f"Request failed: {str(e)}")

        # Test authentication protection
        self.test_authentication_protection("/communication/stats", "GET")
        self.test_authentication_protection("/communication/broadcast", "POST")

    def run_all_tests(self):
        """Run all communication layer tests"""
        print("🚀 STARTING COMPREHENSIVE COMMUNICATION LAYER BACKEND TESTING")
        print("=" * 80)
        
        # Run all test suites
        self.test_message_thread_management()
        self.test_message_system()
        self.test_notification_system()
        self.test_notification_settings()
        self.test_communication_dashboard()
        
        # Print summary
        print("=" * 80)
        print("📊 COMMUNICATION LAYER TESTING SUMMARY")
        print("=" * 80)
        print(f"Total Tests: {self.total_tests}")
        print(f"Passed: {self.passed_tests}")
        print(f"Failed: {self.total_tests - self.passed_tests}")
        print(f"Success Rate: {(self.passed_tests/self.total_tests)*100:.1f}%")
        
        # Print failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['details']}")
        
        # Print successful tests summary
        successful_tests = [test for test in self.test_results if test['success']]
        if successful_tests:
            print(f"\n✅ SUCCESSFUL TESTS ({len(successful_tests)}):")
            for test in successful_tests:
                print(f"  - {test['test']}")
        
        return self.passed_tests, self.total_tests

if __name__ == "__main__":
    tester = CommunicationLayerTester()
    passed, total = tester.run_all_tests()
    
    # Exit with appropriate code
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Communication layer is fully functional.")
        sys.exit(0)
    else:
        print(f"\n⚠️  {total - passed} tests failed. Communication layer needs fixes.")
        sys.exit(1)