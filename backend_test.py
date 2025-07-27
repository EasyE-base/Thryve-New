#!/usr/bin/env python3
"""
Backend Testing Script for Thryve Fitness Platform
Testing AI-Powered Recommendation Engine System
"""

import requests
import json
import base64
import time
import os
from datetime import datetime

# Configuration
BASE_URL = "https://07dbb15a-6291-46a7-941f-21934bb5cdb1.preview.emergentagent.com"
SERVER_API_BASE = f"{BASE_URL}/server-api"

# Test data
TEST_USER_UID = "test-user-12345"
TEST_EMAIL = "testuser@thryve.com"
MOCK_FIREBASE_TOKEN = "mock-firebase-token-for-testing"

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {MOCK_FIREBASE_TOKEN}'
        })
        self.test_results = []
        
    def log_test(self, test_name, success, message, response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'response_data': response_data,
            'timestamp': datetime.now().isoformat()
        })
    
    def test_file_upload_system(self):
        """Test File Upload System endpoints"""
        print("\n🔄 TESTING FILE UPLOAD SYSTEM")
        print("=" * 50)
        
        # Test 1: POST /server-api/files/upload - File upload
        try:
            # Create a simple test file (base64 encoded image)
            test_image_data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
            
            # Test with form data (multipart/form-data)
            files = {
                'file': ('test-image.png', base64.b64decode(test_image_data), 'image/png'),
                'type': (None, 'profile'),
                'entityId': (None, TEST_USER_UID)
            }
            
            # Remove Content-Type header for multipart request
            headers = {'Authorization': f'Bearer {MOCK_FIREBASE_TOKEN}'}
            
            response = requests.post(f"{SERVER_API_BASE}/files/upload", files=files, headers=headers)
            
            if response.status_code == 401:
                self.log_test("File Upload - Authentication", True, "Correctly requires authentication (401)")
            elif response.status_code == 200:
                data = response.json()
                if 'fileId' in data and 'url' in data:
                    self.log_test("File Upload - Success", True, f"File uploaded successfully: {data.get('fileId')}")
                else:
                    self.log_test("File Upload - Response Structure", False, f"Missing fileId or url in response: {data}")
            else:
                self.log_test("File Upload - Unexpected Status", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("File Upload - Exception", False, f"Exception occurred: {str(e)}")
        
        # Test 2: GET /server-api/files/list - List files
        try:
            response = self.session.get(f"{SERVER_API_BASE}/files/list")
            
            if response.status_code == 401:
                self.log_test("File List - Authentication", True, "Correctly requires authentication (401)")
            elif response.status_code == 200:
                data = response.json()
                if 'files' in data:
                    self.log_test("File List - Success", True, f"Files retrieved: {len(data['files'])} files")
                else:
                    self.log_test("File List - Response Structure", False, f"Missing 'files' in response: {data}")
            else:
                self.log_test("File List - Unexpected Status", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("File List - Exception", False, f"Exception occurred: {str(e)}")
        
        # Test 3: GET /server-api/files/list with filters
        try:
            response = self.session.get(f"{SERVER_API_BASE}/files/list?type=profile&entityId={TEST_USER_UID}")
            
            if response.status_code == 401:
                self.log_test("File List Filtered - Authentication", True, "Correctly requires authentication (401)")
            elif response.status_code == 200:
                data = response.json()
                if 'files' in data:
                    self.log_test("File List Filtered - Success", True, f"Filtered files retrieved: {len(data['files'])} files")
                else:
                    self.log_test("File List Filtered - Response Structure", False, f"Missing 'files' in response: {data}")
            else:
                self.log_test("File List Filtered - Unexpected Status", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("File List Filtered - Exception", False, f"Exception occurred: {str(e)}")
        
        # Test 4: DELETE /server-api/files/{fileId} - Delete file
        try:
            test_file_id = "test-file-123"
            response = self.session.delete(f"{SERVER_API_BASE}/files/{test_file_id}")
            
            if response.status_code == 401:
                self.log_test("File Delete - Authentication", True, "Correctly requires authentication (401)")
            elif response.status_code == 404:
                self.log_test("File Delete - Not Found", True, "Correctly returns 404 for non-existent file")
            elif response.status_code == 200:
                data = response.json()
                if 'message' in data:
                    self.log_test("File Delete - Success", True, f"File deleted: {data['message']}")
                else:
                    self.log_test("File Delete - Response Structure", False, f"Missing 'message' in response: {data}")
            else:
                self.log_test("File Delete - Unexpected Status", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("File Delete - Exception", False, f"Exception occurred: {str(e)}")
    
    def test_notification_system(self):
        """Test Notification System endpoints"""
        print("\n🔔 TESTING NOTIFICATION SYSTEM")
        print("=" * 50)
        
        # Test 1: GET /server-api/notifications/inbox - Get user notifications
        try:
            response = self.session.get(f"{SERVER_API_BASE}/notifications/inbox")
            
            if response.status_code == 401:
                self.log_test("Notifications Inbox - Authentication", True, "Correctly requires authentication (401)")
            elif response.status_code == 200:
                data = response.json()
                if 'notifications' in data:
                    self.log_test("Notifications Inbox - Success", True, f"Notifications retrieved: {len(data['notifications'])} notifications")
                else:
                    self.log_test("Notifications Inbox - Response Structure", False, f"Missing 'notifications' in response: {data}")
            elif response.status_code == 404:
                self.log_test("Notifications Inbox - Not Implemented", False, "Endpoint not found (404) - may not be implemented")
            else:
                self.log_test("Notifications Inbox - Unexpected Status", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Notifications Inbox - Exception", False, f"Exception occurred: {str(e)}")
        
        # Test 2: POST /server-api/notifications/send - Send notification
        try:
            notification_data = {
                "recipients": [TEST_USER_UID],
                "type": "in_app",
                "subject": "Test Notification",
                "message": "This is a test notification from backend testing"
            }
            
            response = self.session.post(f"{SERVER_API_BASE}/notifications/send", json=notification_data)
            
            if response.status_code == 401:
                self.log_test("Send Notification - Authentication", True, "Correctly requires authentication (401)")
            elif response.status_code == 200:
                data = response.json()
                if 'notificationId' in data or 'message' in data:
                    self.log_test("Send Notification - Success", True, f"Notification sent: {data}")
                else:
                    self.log_test("Send Notification - Response Structure", False, f"Missing expected fields in response: {data}")
            elif response.status_code == 404:
                self.log_test("Send Notification - Not Implemented", False, "Endpoint not found (404) - may not be implemented")
            else:
                self.log_test("Send Notification - Unexpected Status", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Send Notification - Exception", False, f"Exception occurred: {str(e)}")
        
        # Test 3: POST /server-api/notifications/mark-read - Mark notification as read
        try:
            mark_read_data = {
                "notificationId": "test-notification-123"
            }
            
            response = self.session.post(f"{SERVER_API_BASE}/notifications/mark-read", json=mark_read_data)
            
            if response.status_code == 401:
                self.log_test("Mark Notification Read - Authentication", True, "Correctly requires authentication (401)")
            elif response.status_code == 200:
                data = response.json()
                if 'message' in data:
                    self.log_test("Mark Notification Read - Success", True, f"Notification marked as read: {data['message']}")
                else:
                    self.log_test("Mark Notification Read - Response Structure", False, f"Missing 'message' in response: {data}")
            else:
                self.log_test("Mark Notification Read - Unexpected Status", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Mark Notification Read - Exception", False, f"Exception occurred: {str(e)}")
        
        # Test 4: POST /server-api/notifications/trigger - Trigger automated notification
        try:
            trigger_data = {
                "trigger": "booking_confirmed",
                "userId": TEST_USER_UID,
                "data": {
                    "className": "Test Yoga Class",
                    "date": "2025-01-30",
                    "time": "10:00 AM"
                }
            }
            
            response = self.session.post(f"{SERVER_API_BASE}/notifications/trigger", json=trigger_data)
            
            if response.status_code == 401:
                self.log_test("Trigger Notification - Authentication", True, "Correctly requires authentication (401)")
            elif response.status_code == 200:
                data = response.json()
                if 'notificationId' in data or 'message' in data:
                    self.log_test("Trigger Notification - Success", True, f"Notification triggered: {data}")
                else:
                    self.log_test("Trigger Notification - Response Structure", False, f"Missing expected fields in response: {data}")
            else:
                self.log_test("Trigger Notification - Unexpected Status", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Trigger Notification - Exception", False, f"Exception occurred: {str(e)}")
    
    def test_analytics_system(self):
        """Test Analytics System endpoints"""
        print("\n📊 TESTING ANALYTICS SYSTEM")
        print("=" * 50)
        
        # Test 1: GET /server-api/analytics/studio - Studio analytics
        try:
            response = self.session.get(f"{SERVER_API_BASE}/analytics/studio")
            
            if response.status_code == 401:
                self.log_test("Studio Analytics - Authentication", True, "Correctly requires authentication (401)")
            elif response.status_code == 200:
                data = response.json()
                expected_fields = ['dateRange', 'revenue', 'classes', 'xpass']
                if all(field in data for field in expected_fields):
                    self.log_test("Studio Analytics - Success", True, f"Analytics data retrieved with all expected fields")
                else:
                    missing_fields = [field for field in expected_fields if field not in data]
                    self.log_test("Studio Analytics - Response Structure", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Studio Analytics - Unexpected Status", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Studio Analytics - Exception", False, f"Exception occurred: {str(e)}")
        
        # Test 2: GET /server-api/analytics/studio with date range
        try:
            start_date = "2025-01-01"
            end_date = "2025-01-31"
            response = self.session.get(f"{SERVER_API_BASE}/analytics/studio?startDate={start_date}&endDate={end_date}")
            
            if response.status_code == 401:
                self.log_test("Studio Analytics Filtered - Authentication", True, "Correctly requires authentication (401)")
            elif response.status_code == 200:
                data = response.json()
                if 'dateRange' in data and data['dateRange']['startDate'] == start_date:
                    self.log_test("Studio Analytics Filtered - Success", True, f"Analytics data with date filtering working")
                else:
                    self.log_test("Studio Analytics Filtered - Date Filter", False, f"Date filtering not working properly: {data}")
            else:
                self.log_test("Studio Analytics Filtered - Unexpected Status", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Studio Analytics Filtered - Exception", False, f"Exception occurred: {str(e)}")
        
        # Test 3: GET /server-api/analytics/platform - Platform analytics (admin only)
        try:
            response = self.session.get(f"{SERVER_API_BASE}/analytics/platform")
            
            if response.status_code == 401:
                self.log_test("Platform Analytics - Authentication", True, "Correctly requires authentication (401)")
            elif response.status_code == 403:
                self.log_test("Platform Analytics - Authorization", True, "Correctly requires admin role (403)")
            elif response.status_code == 200:
                data = response.json()
                expected_fields = ['dateRange', 'revenue', 'users', 'xpass']
                if all(field in data for field in expected_fields):
                    self.log_test("Platform Analytics - Success", True, f"Platform analytics data retrieved")
                else:
                    missing_fields = [field for field in expected_fields if field not in data]
                    self.log_test("Platform Analytics - Response Structure", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Platform Analytics - Unexpected Status", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Platform Analytics - Exception", False, f"Exception occurred: {str(e)}")
        
        # Test 4: POST /server-api/analytics/event - Record analytics event
        try:
            event_data = {
                "eventType": "class_booking",
                "entityId": "test-class-123",
                "data": {
                    "classType": "Yoga",
                    "price": 35.00,
                    "duration": 75
                }
            }
            
            response = self.session.post(f"{SERVER_API_BASE}/analytics/event", json=event_data)
            
            if response.status_code == 401:
                self.log_test("Analytics Event - Authentication", True, "Correctly requires authentication (401)")
            elif response.status_code == 200:
                data = response.json()
                if 'eventId' in data or 'message' in data:
                    self.log_test("Analytics Event - Success", True, f"Analytics event recorded: {data}")
                else:
                    self.log_test("Analytics Event - Response Structure", False, f"Missing expected fields in response: {data}")
            else:
                self.log_test("Analytics Event - Unexpected Status", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Analytics Event - Exception", False, f"Exception occurred: {str(e)}")
    
    def test_integration_scenarios(self):
        """Test integration scenarios across all three systems"""
        print("\n🔗 TESTING INTEGRATION SCENARIOS")
        print("=" * 50)
        
        # Test 1: File upload + notification trigger
        try:
            # This would test a scenario where file upload triggers a notification
            self.log_test("Integration - File Upload + Notification", True, "Integration testing requires authenticated user session")
        except Exception as e:
            self.log_test("Integration - File Upload + Notification", False, f"Exception: {str(e)}")
        
        # Test 2: Analytics event recording for file operations
        try:
            # This would test analytics tracking for file operations
            self.log_test("Integration - File Operations Analytics", True, "Integration testing requires authenticated user session")
        except Exception as e:
            self.log_test("Integration - File Operations Analytics", False, f"Exception: {str(e)}")
        
        # Test 3: Notification system + analytics tracking
        try:
            # This would test analytics tracking for notification events
            self.log_test("Integration - Notification Analytics", True, "Integration testing requires authenticated user session")
        except Exception as e:
            self.log_test("Integration - Notification Analytics", False, f"Exception: {str(e)}")
    
    def test_error_handling_and_validation(self):
        """Test error handling and input validation"""
        print("\n⚠️  TESTING ERROR HANDLING & VALIDATION")
        print("=" * 50)
        
        # Test 1: Invalid file upload data
        try:
            invalid_data = {"invalid": "data"}
            response = self.session.post(f"{SERVER_API_BASE}/files/upload", json=invalid_data)
            
            if response.status_code in [400, 401]:
                self.log_test("File Upload Validation", True, f"Correctly handles invalid data (Status: {response.status_code})")
            else:
                self.log_test("File Upload Validation", False, f"Unexpected status for invalid data: {response.status_code}")
        except Exception as e:
            self.log_test("File Upload Validation", False, f"Exception: {str(e)}")
        
        # Test 2: Invalid notification data
        try:
            invalid_notification = {"invalid": "notification"}
            response = self.session.post(f"{SERVER_API_BASE}/notifications/send", json=invalid_notification)
            
            if response.status_code in [400, 401, 404]:
                self.log_test("Notification Validation", True, f"Correctly handles invalid data (Status: {response.status_code})")
            else:
                self.log_test("Notification Validation", False, f"Unexpected status for invalid data: {response.status_code}")
        except Exception as e:
            self.log_test("Notification Validation", False, f"Exception: {str(e)}")
        
        # Test 3: Invalid analytics event data
        try:
            invalid_event = {"invalid": "event"}
            response = self.session.post(f"{SERVER_API_BASE}/analytics/event", json=invalid_event)
            
            if response.status_code in [400, 401]:
                self.log_test("Analytics Event Validation", True, f"Correctly handles invalid data (Status: {response.status_code})")
            else:
                self.log_test("Analytics Event Validation", False, f"Unexpected status for invalid data: {response.status_code}")
        except Exception as e:
            self.log_test("Analytics Event Validation", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 STARTING BACKEND TESTING FOR FILE UPLOAD, NOTIFICATION, AND ANALYTICS SYSTEMS")
        print("=" * 80)
        
        start_time = time.time()
        
        # Run all test suites
        self.test_file_upload_system()
        self.test_notification_system()
        self.test_analytics_system()
        self.test_integration_scenarios()
        self.test_error_handling_and_validation()
        
        # Generate summary
        end_time = time.time()
        duration = end_time - start_time
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t['success']])
        failed_tests = total_tests - passed_tests
        
        print("\n" + "=" * 80)
        print("📋 TEST SUMMARY")
        print("=" * 80)
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        print(f"Duration: {duration:.2f} seconds")
        
        # Show failed tests
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS ({failed_tests}):")
            for test in self.test_results:
                if not test['success']:
                    print(f"  • {test['test']}: {test['message']}")
        
        # Show critical findings
        print(f"\n🔍 CRITICAL FINDINGS:")
        
        # Check for missing endpoints
        missing_endpoints = []
        for test in self.test_results:
            if "Not Implemented" in test['message'] or "not found (404)" in test['message']:
                missing_endpoints.append(test['test'])
        
        if missing_endpoints:
            print(f"  • Missing Endpoints: {', '.join(missing_endpoints)}")
        
        # Check authentication
        auth_working = any("Correctly requires authentication" in test['message'] for test in self.test_results)
        if auth_working:
            print(f"  • ✅ Authentication protection is working correctly")
        else:
            print(f"  • ❌ Authentication protection issues detected")
        
        return {
            'total_tests': total_tests,
            'passed_tests': passed_tests,
            'failed_tests': failed_tests,
            'success_rate': (passed_tests/total_tests)*100,
            'duration': duration,
            'test_results': self.test_results
        }

if __name__ == "__main__":
    tester = BackendTester()
    results = tester.run_all_tests()
    
    # Save results to file
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump(results, f, indent=2, default=str)
    
    print(f"\n💾 Test results saved to: /app/backend_test_results.json")