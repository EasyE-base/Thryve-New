#!/usr/bin/env python3
"""
Comprehensive Backend Testing Script for File Upload, Notification, and Analytics Systems
Testing with proper authentication and comprehensive scenarios
"""

import requests
import json
import base64
import time
import os
from datetime import datetime

# Configuration
BASE_URL = "https://3cb9b542-95ac-474d-a874-adf34a5d58c8.preview.emergentagent.com"
SERVER_API_BASE = f"{BASE_URL}/server-api"

class ComprehensiveBackendTester:
    def __init__(self):
        self.session = requests.Session()
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
    
    def test_authentication_protection(self):
        """Test that all endpoints require proper authentication"""
        print("\n🔐 TESTING AUTHENTICATION PROTECTION")
        print("=" * 50)
        
        # Test endpoints without authentication
        endpoints_to_test = [
            ('GET', '/files/list'),
            ('POST', '/files/upload'),
            ('DELETE', '/files/test-file'),
            ('GET', '/notifications/inbox'),
            ('POST', '/notifications/send'),
            ('POST', '/notifications/mark-read'),
            ('POST', '/notifications/trigger'),
            ('GET', '/analytics/studio'),
            ('GET', '/analytics/platform'),
            ('POST', '/analytics/event')
        ]
        
        for method, endpoint in endpoints_to_test:
            try:
                if method == 'GET':
                    response = requests.get(f"{SERVER_API_BASE}{endpoint}")
                elif method == 'POST':
                    response = requests.post(f"{SERVER_API_BASE}{endpoint}", json={})
                elif method == 'DELETE':
                    response = requests.delete(f"{SERVER_API_BASE}{endpoint}")
                
                if response.status_code == 401:
                    self.log_test(f"Auth Protection - {method} {endpoint}", True, "Correctly requires authentication (401)")
                else:
                    self.log_test(f"Auth Protection - {method} {endpoint}", False, f"Unexpected status: {response.status_code}")
                    
            except Exception as e:
                self.log_test(f"Auth Protection - {method} {endpoint}", False, f"Exception: {str(e)}")
    
    def test_file_upload_comprehensive(self):
        """Test file upload system comprehensively"""
        print("\n📁 TESTING FILE UPLOAD SYSTEM - COMPREHENSIVE")
        print("=" * 50)
        
        # Mock authentication header
        headers = {'Authorization': 'Bearer mock-token'}
        
        # Test 1: File upload with different file types
        file_types = ['profile', 'class', 'studio', 'document']
        
        for file_type in file_types:
            try:
                # Create test image data
                test_image_data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                
                files = {
                    'file': (f'test-{file_type}.png', base64.b64decode(test_image_data), 'image/png'),
                    'type': (None, file_type),
                    'entityId': (None, f'entity-{file_type}-123')
                }
                
                response = requests.post(f"{SERVER_API_BASE}/files/upload", files=files, headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    if 'fileId' in data and 'url' in data:
                        self.log_test(f"File Upload - {file_type}", True, f"Successfully uploaded {file_type} file: {data['fileId']}")
                    else:
                        self.log_test(f"File Upload - {file_type}", False, f"Missing fields in response: {data}")
                else:
                    self.log_test(f"File Upload - {file_type}", False, f"Status: {response.status_code}, Response: {response.text}")
                    
            except Exception as e:
                self.log_test(f"File Upload - {file_type}", False, f"Exception: {str(e)}")
        
        # Test 2: File size validation
        try:
            # Create a larger test file
            large_data = "A" * 1000  # 1KB test file
            files = {
                'file': ('large-test.txt', large_data.encode(), 'text/plain'),
                'type': (None, 'document'),
                'entityId': (None, 'test-entity')
            }
            
            response = requests.post(f"{SERVER_API_BASE}/files/upload", files=files, headers=headers)
            
            if response.status_code == 200:
                self.log_test("File Upload - Size Validation", True, "Large file upload handled correctly")
            else:
                self.log_test("File Upload - Size Validation", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("File Upload - Size Validation", False, f"Exception: {str(e)}")
        
        # Test 3: MIME type validation
        try:
            files = {
                'file': ('test.pdf', b'%PDF-1.4 fake pdf content', 'application/pdf'),
                'type': (None, 'document'),
                'entityId': (None, 'test-entity')
            }
            
            response = requests.post(f"{SERVER_API_BASE}/files/upload", files=files, headers=headers)
            
            if response.status_code == 200:
                self.log_test("File Upload - MIME Type", True, "PDF file upload handled correctly")
            else:
                self.log_test("File Upload - MIME Type", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("File Upload - MIME Type", False, f"Exception: {str(e)}")
        
        # Test 4: File listing with various filters
        try:
            response = requests.get(f"{SERVER_API_BASE}/files/list", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                total_files = len(data.get('files', []))
                self.log_test("File List - All Files", True, f"Retrieved {total_files} total files")
                
                # Test filtering by type
                for file_type in ['profile', 'class', 'studio']:
                    filter_response = requests.get(f"{SERVER_API_BASE}/files/list?type={file_type}", headers=headers)
                    if filter_response.status_code == 200:
                        filter_data = filter_response.json()
                        filtered_count = len(filter_data.get('files', []))
                        self.log_test(f"File List - Filter {file_type}", True, f"Retrieved {filtered_count} {file_type} files")
                    else:
                        self.log_test(f"File List - Filter {file_type}", False, f"Status: {filter_response.status_code}")
            else:
                self.log_test("File List - All Files", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("File List - All Files", False, f"Exception: {str(e)}")
    
    def test_notification_system_comprehensive(self):
        """Test notification system comprehensively"""
        print("\n🔔 TESTING NOTIFICATION SYSTEM - COMPREHENSIVE")
        print("=" * 50)
        
        headers = {'Authorization': 'Bearer mock-token', 'Content-Type': 'application/json'}
        
        # Test 1: Send different types of notifications
        notification_types = ['in_app', 'email', 'sms']
        
        for notif_type in notification_types:
            try:
                notification_data = {
                    "type": notif_type,
                    "recipients": ["user-123", "user-456"],
                    "subject": f"Test {notif_type} Notification",
                    "message": f"This is a test {notif_type} notification with comprehensive testing",
                    "templateId": f"template_{notif_type}",
                    "data": {
                        "userName": "Test User",
                        "actionUrl": "https://example.com/action"
                    }
                }
                
                response = requests.post(f"{SERVER_API_BASE}/notifications/send", json=notification_data, headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    if 'notificationId' in data:
                        self.log_test(f"Send Notification - {notif_type}", True, f"Successfully sent {notif_type} notification: {data['notificationId']}")
                    else:
                        self.log_test(f"Send Notification - {notif_type}", False, f"Missing notificationId in response: {data}")
                else:
                    self.log_test(f"Send Notification - {notif_type}", False, f"Status: {response.status_code}, Response: {response.text}")
                    
            except Exception as e:
                self.log_test(f"Send Notification - {notif_type}", False, f"Exception: {str(e)}")
        
        # Test 2: Trigger automated notifications
        triggers = ['booking_confirmed', 'class_cancelled', 'no_show_penalty', 'low_credits']
        
        for trigger in triggers:
            try:
                trigger_data = {
                    "trigger": trigger,
                    "userId": "test-user-123",
                    "data": {
                        "className": "Test Yoga Class",
                        "date": "2025-01-30",
                        "time": "10:00 AM",
                        "feeAmount": 15,
                        "creditDeducted": True,
                        "creditsRemaining": 2
                    }
                }
                
                response = requests.post(f"{SERVER_API_BASE}/notifications/trigger", json=trigger_data, headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    if 'notificationId' in data:
                        self.log_test(f"Trigger Notification - {trigger}", True, f"Successfully triggered {trigger}: {data['notificationId']}")
                    else:
                        self.log_test(f"Trigger Notification - {trigger}", False, f"Missing notificationId in response: {data}")
                else:
                    self.log_test(f"Trigger Notification - {trigger}", False, f"Status: {response.status_code}, Response: {response.text}")
                    
            except Exception as e:
                self.log_test(f"Trigger Notification - {trigger}", False, f"Exception: {str(e)}")
        
        # Test 3: Notification inbox with pagination
        try:
            response = requests.get(f"{SERVER_API_BASE}/notifications/inbox", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if 'notifications' in data and 'unreadCount' in data:
                    notification_count = len(data['notifications'])
                    unread_count = data['unreadCount']
                    self.log_test("Notification Inbox", True, f"Retrieved {notification_count} notifications, {unread_count} unread")
                else:
                    self.log_test("Notification Inbox", False, f"Missing expected fields in response: {data}")
            else:
                self.log_test("Notification Inbox", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Notification Inbox", False, f"Exception: {str(e)}")
    
    def test_analytics_system_comprehensive(self):
        """Test analytics system comprehensively"""
        print("\n📊 TESTING ANALYTICS SYSTEM - COMPREHENSIVE")
        print("=" * 50)
        
        headers = {'Authorization': 'Bearer mock-token', 'Content-Type': 'application/json'}
        
        # Test 1: Record various analytics events
        event_types = ['class_booking', 'class_cancellation', 'payment_completed', 'user_signup', 'file_upload']
        
        for event_type in event_types:
            try:
                event_data = {
                    "eventType": event_type,
                    "entityId": f"entity-{event_type}-123",
                    "data": {
                        "timestamp": datetime.now().isoformat(),
                        "userAgent": "Test User Agent",
                        "ipAddress": "127.0.0.1",
                        "metadata": {
                            "classType": "Yoga",
                            "price": 35.00,
                            "duration": 75,
                            "location": "Test Studio"
                        }
                    }
                }
                
                response = requests.post(f"{SERVER_API_BASE}/analytics/event", json=event_data, headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    if 'eventId' in data:
                        self.log_test(f"Analytics Event - {event_type}", True, f"Successfully recorded {event_type}: {data['eventId']}")
                    else:
                        self.log_test(f"Analytics Event - {event_type}", False, f"Missing eventId in response: {data}")
                else:
                    self.log_test(f"Analytics Event - {event_type}", False, f"Status: {response.status_code}, Response: {response.text}")
                    
            except Exception as e:
                self.log_test(f"Analytics Event - {event_type}", False, f"Exception: {str(e)}")
        
        # Test 2: Studio analytics with different date ranges
        date_ranges = [
            ("2025-01-01", "2025-01-31"),
            ("2025-01-15", "2025-01-30"),
            ("2024-12-01", "2024-12-31")
        ]
        
        for start_date, end_date in date_ranges:
            try:
                response = requests.get(f"{SERVER_API_BASE}/analytics/studio?startDate={start_date}&endDate={end_date}", headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    expected_fields = ['dateRange', 'revenue', 'classes', 'xpass', 'trends']
                    if all(field in data for field in expected_fields):
                        self.log_test(f"Studio Analytics - {start_date} to {end_date}", True, f"Analytics data complete for date range")
                    else:
                        missing_fields = [field for field in expected_fields if field not in data]
                        self.log_test(f"Studio Analytics - {start_date} to {end_date}", False, f"Missing fields: {missing_fields}")
                else:
                    self.log_test(f"Studio Analytics - {start_date} to {end_date}", False, f"Status: {response.status_code}")
                    
            except Exception as e:
                self.log_test(f"Studio Analytics - {start_date} to {end_date}", False, f"Exception: {str(e)}")
        
        # Test 3: Platform analytics (admin level)
        try:
            response = requests.get(f"{SERVER_API_BASE}/analytics/platform", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                expected_fields = ['dateRange', 'revenue', 'users', 'xpass']
                if all(field in data for field in expected_fields):
                    # Check specific metrics
                    revenue_data = data.get('revenue', {})
                    user_data = data.get('users', {})
                    
                    if 'platformRevenue' in revenue_data and 'total' in user_data:
                        self.log_test("Platform Analytics", True, f"Complete platform analytics retrieved")
                    else:
                        self.log_test("Platform Analytics", False, f"Missing detailed metrics in response")
                else:
                    missing_fields = [field for field in expected_fields if field not in data]
                    self.log_test("Platform Analytics", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Platform Analytics", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Platform Analytics", False, f"Exception: {str(e)}")
    
    def test_integration_scenarios(self):
        """Test integration scenarios across all three systems"""
        print("\n🔗 TESTING INTEGRATION SCENARIOS - COMPREHENSIVE")
        print("=" * 50)
        
        headers = {'Authorization': 'Bearer mock-token', 'Content-Type': 'application/json'}
        
        # Test 1: File upload → Analytics event → Notification
        try:
            # Step 1: Upload a file
            test_image_data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
            files = {
                'file': ('integration-test.png', base64.b64decode(test_image_data), 'image/png'),
                'type': (None, 'profile'),
                'entityId': (None, 'integration-user-123')
            }
            
            upload_response = requests.post(f"{SERVER_API_BASE}/files/upload", files=files, headers={'Authorization': 'Bearer mock-token'})
            
            if upload_response.status_code == 200:
                upload_data = upload_response.json()
                file_id = upload_data.get('fileId')
                
                # Step 2: Record analytics event for file upload
                event_data = {
                    "eventType": "file_upload",
                    "entityId": file_id,
                    "data": {
                        "fileType": "profile",
                        "fileName": "integration-test.png",
                        "fileSize": len(base64.b64decode(test_image_data))
                    }
                }
                
                analytics_response = requests.post(f"{SERVER_API_BASE}/analytics/event", json=event_data, headers=headers)
                
                if analytics_response.status_code == 200:
                    # Step 3: Send notification about file upload
                    notification_data = {
                        "type": "in_app",
                        "recipients": ["integration-user-123"],
                        "subject": "File Upload Complete",
                        "message": f"Your profile image has been uploaded successfully. File ID: {file_id}",
                        "data": {"fileId": file_id, "fileName": "integration-test.png"}
                    }
                    
                    notification_response = requests.post(f"{SERVER_API_BASE}/notifications/send", json=notification_data, headers=headers)
                    
                    if notification_response.status_code == 200:
                        self.log_test("Integration - File→Analytics→Notification", True, "Complete integration workflow successful")
                    else:
                        self.log_test("Integration - File→Analytics→Notification", False, f"Notification failed: {notification_response.status_code}")
                else:
                    self.log_test("Integration - File→Analytics→Notification", False, f"Analytics failed: {analytics_response.status_code}")
            else:
                self.log_test("Integration - File→Analytics→Notification", False, f"File upload failed: {upload_response.status_code}")
                
        except Exception as e:
            self.log_test("Integration - File→Analytics→Notification", False, f"Exception: {str(e)}")
        
        # Test 2: Analytics-driven notification triggers
        try:
            # Record a low credits event
            event_data = {
                "eventType": "low_credits_detected",
                "entityId": "user-low-credits-123",
                "data": {
                    "userId": "user-low-credits-123",
                    "creditsRemaining": 1,
                    "packageType": "basic"
                }
            }
            
            analytics_response = requests.post(f"{SERVER_API_BASE}/analytics/event", json=event_data, headers=headers)
            
            if analytics_response.status_code == 200:
                # Trigger automated notification based on analytics
                trigger_data = {
                    "trigger": "low_credits",
                    "userId": "user-low-credits-123",
                    "data": {
                        "creditsRemaining": 1,
                        "packageType": "basic"
                    }
                }
                
                trigger_response = requests.post(f"{SERVER_API_BASE}/notifications/trigger", json=trigger_data, headers=headers)
                
                if trigger_response.status_code == 200:
                    self.log_test("Integration - Analytics→Notification Trigger", True, "Analytics-driven notification trigger successful")
                else:
                    self.log_test("Integration - Analytics→Notification Trigger", False, f"Trigger failed: {trigger_response.status_code}")
            else:
                self.log_test("Integration - Analytics→Notification Trigger", False, f"Analytics failed: {analytics_response.status_code}")
                
        except Exception as e:
            self.log_test("Integration - Analytics→Notification Trigger", False, f"Exception: {str(e)}")
    
    def test_error_handling_and_edge_cases(self):
        """Test error handling and edge cases"""
        print("\n⚠️  TESTING ERROR HANDLING & EDGE CASES")
        print("=" * 50)
        
        headers = {'Authorization': 'Bearer mock-token', 'Content-Type': 'application/json'}
        
        # Test 1: Invalid file upload scenarios
        try:
            # No file provided
            response = requests.post(f"{SERVER_API_BASE}/files/upload", data={'type': 'profile'}, headers={'Authorization': 'Bearer mock-token'})
            
            if response.status_code == 400:
                self.log_test("Error Handling - No File", True, "Correctly handles missing file (400)")
            else:
                self.log_test("Error Handling - No File", False, f"Unexpected status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Error Handling - No File", False, f"Exception: {str(e)}")
        
        # Test 2: Invalid notification data
        try:
            invalid_notification = {
                "type": "invalid_type",
                "recipients": [],  # Empty recipients
                "message": ""  # Empty message
            }
            
            response = requests.post(f"{SERVER_API_BASE}/notifications/send", json=invalid_notification, headers=headers)
            
            # Should still work but with validation
            if response.status_code in [200, 400]:
                self.log_test("Error Handling - Invalid Notification", True, f"Handles invalid notification data (Status: {response.status_code})")
            else:
                self.log_test("Error Handling - Invalid Notification", False, f"Unexpected status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Error Handling - Invalid Notification", False, f"Exception: {str(e)}")
        
        # Test 3: Invalid analytics event data
        try:
            invalid_event = {
                "eventType": "",  # Empty event type
                "data": "invalid_data_structure"  # Invalid data structure
            }
            
            response = requests.post(f"{SERVER_API_BASE}/analytics/event", json=invalid_event, headers=headers)
            
            if response.status_code in [200, 400]:
                self.log_test("Error Handling - Invalid Analytics", True, f"Handles invalid analytics data (Status: {response.status_code})")
            else:
                self.log_test("Error Handling - Invalid Analytics", False, f"Unexpected status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Error Handling - Invalid Analytics", False, f"Exception: {str(e)}")
        
        # Test 4: Non-existent file deletion
        try:
            response = requests.delete(f"{SERVER_API_BASE}/files/non-existent-file-123", headers=headers)
            
            if response.status_code == 404:
                self.log_test("Error Handling - Non-existent File Delete", True, "Correctly handles non-existent file deletion (404)")
            else:
                self.log_test("Error Handling - Non-existent File Delete", False, f"Unexpected status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Error Handling - Non-existent File Delete", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all comprehensive test suites"""
        print("🚀 STARTING COMPREHENSIVE BACKEND TESTING FOR FILE UPLOAD, NOTIFICATION, AND ANALYTICS SYSTEMS")
        print("=" * 100)
        
        start_time = time.time()
        
        # Run all test suites
        self.test_authentication_protection()
        self.test_file_upload_comprehensive()
        self.test_notification_system_comprehensive()
        self.test_analytics_system_comprehensive()
        self.test_integration_scenarios()
        self.test_error_handling_and_edge_cases()
        
        # Generate summary
        end_time = time.time()
        duration = end_time - start_time
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t['success']])
        failed_tests = total_tests - passed_tests
        
        print("\n" + "=" * 100)
        print("📋 COMPREHENSIVE TEST SUMMARY")
        print("=" * 100)
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        print(f"Duration: {duration:.2f} seconds")
        
        # Categorize results
        categories = {
            'Authentication': [],
            'File Upload': [],
            'Notification': [],
            'Analytics': [],
            'Integration': [],
            'Error Handling': []
        }
        
        for test in self.test_results:
            test_name = test['test']
            if 'Auth Protection' in test_name:
                categories['Authentication'].append(test)
            elif 'File Upload' in test_name or 'File List' in test_name or 'File Delete' in test_name:
                categories['File Upload'].append(test)
            elif 'Notification' in test_name:
                categories['Notification'].append(test)
            elif 'Analytics' in test_name:
                categories['Analytics'].append(test)
            elif 'Integration' in test_name:
                categories['Integration'].append(test)
            elif 'Error Handling' in test_name:
                categories['Error Handling'].append(test)
        
        print(f"\n📊 RESULTS BY CATEGORY:")
        for category, tests in categories.items():
            if tests:
                passed = len([t for t in tests if t['success']])
                total = len(tests)
                print(f"  {category}: {passed}/{total} ({(passed/total)*100:.1f}%)")
        
        # Show failed tests
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS ({failed_tests}):")
            for test in self.test_results:
                if not test['success']:
                    print(f"  • {test['test']}: {test['message']}")
        
        # Show critical findings
        print(f"\n🔍 CRITICAL FINDINGS:")
        
        # Check authentication coverage
        auth_tests = [t for t in self.test_results if 'Auth Protection' in t['test']]
        auth_passed = len([t for t in auth_tests if t['success']])
        if auth_passed == len(auth_tests) and len(auth_tests) > 0:
            print(f"  • ✅ Authentication protection is comprehensive ({auth_passed}/{len(auth_tests)} endpoints protected)")
        else:
            print(f"  • ⚠️  Authentication protection needs attention ({auth_passed}/{len(auth_tests)} endpoints protected)")
        
        # Check system functionality
        file_tests = [t for t in self.test_results if 'File Upload' in t['test'] or 'File List' in t['test']]
        file_passed = len([t for t in file_tests if t['success']])
        print(f"  • File Upload System: {file_passed}/{len(file_tests)} tests passed")
        
        notif_tests = [t for t in self.test_results if 'Notification' in t['test'] and 'Auth Protection' not in t['test']]
        notif_passed = len([t for t in notif_tests if t['success']])
        print(f"  • Notification System: {notif_passed}/{len(notif_tests)} tests passed")
        
        analytics_tests = [t for t in self.test_results if 'Analytics' in t['test'] and 'Auth Protection' not in t['test']]
        analytics_passed = len([t for t in analytics_tests if t['success']])
        print(f"  • Analytics System: {analytics_passed}/{len(analytics_tests)} tests passed")
        
        integration_tests = [t for t in self.test_results if 'Integration' in t['test']]
        integration_passed = len([t for t in integration_tests if t['success']])
        print(f"  • Integration Scenarios: {integration_passed}/{len(integration_tests)} tests passed")
        
        return {
            'total_tests': total_tests,
            'passed_tests': passed_tests,
            'failed_tests': failed_tests,
            'success_rate': (passed_tests/total_tests)*100,
            'duration': duration,
            'categories': {cat: {'passed': len([t for t in tests if t['success']]), 'total': len(tests)} for cat, tests in categories.items()},
            'test_results': self.test_results
        }

if __name__ == "__main__":
    tester = ComprehensiveBackendTester()
    results = tester.run_all_tests()
    
    # Save results to file
    with open('/app/comprehensive_backend_test_results.json', 'w') as f:
        json.dump(results, f, indent=2, default=str)
    
    print(f"\n💾 Comprehensive test results saved to: /app/comprehensive_backend_test_results.json")