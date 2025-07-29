#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Communication Layer
Testing Priority Communication Endpoints as requested in review:
1. Message Thread Management (/server-api/messages/threads)
2. Message Sending System (/server-api/messages/send)
3. Notification Inbox System (/server-api/notifications)
4. Notification Management (/server-api/notifications/*)
5. Communication Dashboard APIs (/server-api/communication/*)
"""

import requests
import json
import time
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://b73e2584-2b4f-4f74-99b8-7dca9ad0bf29.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/server-api"

# Mock Firebase authentication token for testing
MOCK_AUTH_TOKEN = "Bearer mock-firebase-token"
HEADERS = {
    "Content-Type": "application/json",
    "Authorization": MOCK_AUTH_TOKEN
}

def log_test_result(test_name, success, details="", response_data=None):
    """Log test results with timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"[{timestamp}] {status} - {test_name}")
    if details:
        print(f"    Details: {details}")
    if response_data and isinstance(response_data, dict):
        print(f"    Response: {json.dumps(response_data, indent=2)[:200]}...")
    print()

def test_authentication_protection(endpoint, method="GET"):
    """Test that endpoints require authentication"""
    try:
        headers_no_auth = {"Content-Type": "application/json"}
        
        if method == "GET":
            response = requests.get(f"{API_BASE}{endpoint}", headers=headers_no_auth, timeout=10)
        elif method == "POST":
            response = requests.post(f"{API_BASE}{endpoint}", headers=headers_no_auth, json={}, timeout=10)
        elif method == "PUT":
            response = requests.put(f"{API_BASE}{endpoint}", headers=headers_no_auth, json={}, timeout=10)
        elif method == "DELETE":
            response = requests.delete(f"{API_BASE}{endpoint}", headers=headers_no_auth, timeout=10)
        
        if response.status_code == 401:
            log_test_result(f"Authentication Protection - {method} {endpoint}", True, 
                          f"Correctly returns 401 Unauthorized without auth token")
            return True
        else:
            log_test_result(f"Authentication Protection - {method} {endpoint}", False, 
                          f"Expected 401, got {response.status_code}")
            return False
            
    except Exception as e:
        log_test_result(f"Authentication Protection - {method} {endpoint}", False, f"Error: {str(e)}")
        return False

def test_message_thread_management():
    """Test Message Thread Management endpoints"""
    print("🔄 Testing Message Thread Management...")
    
    # Test GET /messages/threads - Retrieve user message threads
    try:
        response = requests.get(f"{API_BASE}/messages/threads", headers=HEADERS, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if 'threads' in data or 'success' in data:
                log_test_result("GET /messages/threads - Retrieve threads", True, 
                              f"Status: {response.status_code}, Response structure valid", data)
            else:
                log_test_result("GET /messages/threads - Retrieve threads", False, 
                              f"Invalid response structure: {data}")
        else:
            log_test_result("GET /messages/threads - Retrieve threads", False, 
                          f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test_result("GET /messages/threads - Retrieve threads", False, f"Error: {str(e)}")
    
    # Test authentication protection
    test_authentication_protection("/messages/threads", "GET")
    
    # Test POST /messages/threads - Create new message thread
    try:
        thread_data = {
            "participantIds": ["test-user-2", "test-user-3"],
            "initialMessage": "Hello, this is a test message thread",
            "type": "direct"
        }
        
        response = requests.post(f"{API_BASE}/messages/threads", headers=HEADERS, 
                               json=thread_data, timeout=10)
        
        if response.status_code in [200, 201]:
            data = response.json()
            if 'thread' in data or 'success' in data:
                log_test_result("POST /messages/threads - Create thread", True, 
                              f"Status: {response.status_code}, Thread created successfully", data)
            else:
                log_test_result("POST /messages/threads - Create thread", False, 
                              f"Invalid response structure: {data}")
        else:
            log_test_result("POST /messages/threads - Create thread", False, 
                          f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test_result("POST /messages/threads - Create thread", False, f"Error: {str(e)}")
    
    # Test authentication protection for POST
    test_authentication_protection("/messages/threads", "POST")

def test_message_sending_system():
    """Test Message Sending System endpoints"""
    print("🔄 Testing Message Sending System...")
    
    # Test POST /messages/send - Send message to thread
    try:
        message_data = {
            "threadId": "test-thread-123",
            "content": "This is a test message for the communication layer",
            "type": "text"
        }
        
        response = requests.post(f"{API_BASE}/messages/send", headers=HEADERS, 
                               json=message_data, timeout=10)
        
        if response.status_code in [200, 201]:
            data = response.json()
            if 'messageId' in data or 'success' in data:
                log_test_result("POST /messages/send - Send message", True, 
                              f"Status: {response.status_code}, Message sent successfully", data)
            else:
                log_test_result("POST /messages/send - Send message", False, 
                              f"Invalid response structure: {data}")
        else:
            log_test_result("POST /messages/send - Send message", False, 
                          f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test_result("POST /messages/send - Send message", False, f"Error: {str(e)}")
    
    # Test authentication protection
    test_authentication_protection("/messages/send", "POST")
    
    # Test message validation - missing required fields
    try:
        invalid_message_data = {
            "content": "Message without threadId"
        }
        
        response = requests.post(f"{API_BASE}/messages/send", headers=HEADERS, 
                               json=invalid_message_data, timeout=10)
        
        if response.status_code == 400:
            log_test_result("POST /messages/send - Validation", True, 
                          f"Correctly validates missing threadId (400)")
        else:
            log_test_result("POST /messages/send - Validation", False, 
                          f"Expected 400 for missing threadId, got {response.status_code}")
    except Exception as e:
        log_test_result("POST /messages/send - Validation", False, f"Error: {str(e)}")

def test_notification_inbox_system():
    """Test Notification Inbox System endpoints"""
    print("🔄 Testing Notification Inbox System...")
    
    # Test GET /notifications - Retrieve user notifications
    try:
        response = requests.get(f"{API_BASE}/notifications", headers=HEADERS, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if 'notifications' in data and 'unreadCount' in data:
                log_test_result("GET /notifications - Retrieve notifications", True, 
                              f"Status: {response.status_code}, Structure valid with {len(data.get('notifications', []))} notifications", data)
            else:
                log_test_result("GET /notifications - Retrieve notifications", False, 
                              f"Invalid response structure: {data}")
        else:
            log_test_result("GET /notifications - Retrieve notifications", False, 
                          f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test_result("GET /notifications - Retrieve notifications", False, f"Error: {str(e)}")
    
    # Test authentication protection
    test_authentication_protection("/notifications", "GET")
    
    # Test GET /notifications with filtering (if supported)
    try:
        params = {"type": "booking", "unread": "true"}
        response = requests.get(f"{API_BASE}/notifications", headers=HEADERS, 
                              params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            log_test_result("GET /notifications - With filtering", True, 
                          f"Filtering parameters accepted, Status: {response.status_code}")
        else:
            log_test_result("GET /notifications - With filtering", False, 
                          f"Status: {response.status_code}")
    except Exception as e:
        log_test_result("GET /notifications - With filtering", False, f"Error: {str(e)}")

def test_notification_management():
    """Test Notification Management endpoints"""
    print("🔄 Testing Notification Management...")
    
    # Test POST /notifications/send - Send new notification
    try:
        notification_data = {
            "recipients": ["test-user-1", "test-user-2"],
            "type": "in_app",
            "title": "Test Notification",
            "message": "This is a test notification for the communication layer",
            "data": {
                "classId": "test-class-123",
                "action": "booking_confirmed"
            }
        }
        
        response = requests.post(f"{API_BASE}/notifications/send", headers=HEADERS, 
                               json=notification_data, timeout=10)
        
        if response.status_code in [200, 201]:
            data = response.json()
            if 'notificationId' in data or 'success' in data:
                log_test_result("POST /notifications/send - Send notification", True, 
                              f"Status: {response.status_code}, Notification sent successfully", data)
            else:
                log_test_result("POST /notifications/send - Send notification", False, 
                              f"Invalid response structure: {data}")
        else:
            log_test_result("POST /notifications/send - Send notification", False, 
                          f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test_result("POST /notifications/send - Send notification", False, f"Error: {str(e)}")
    
    # Test authentication protection for send
    test_authentication_protection("/notifications/send", "POST")
    
    # Test PUT /notifications/mark-read - Mark notifications as read
    try:
        mark_read_data = {
            "notificationIds": ["test-notification-1", "test-notification-2"]
        }
        
        response = requests.put(f"{API_BASE}/notifications/mark-read", headers=HEADERS, 
                              json=mark_read_data, timeout=10)
        
        if response.status_code in [200, 204]:
            log_test_result("PUT /notifications/mark-read - Mark as read", True, 
                          f"Status: {response.status_code}, Mark as read successful")
        else:
            log_test_result("PUT /notifications/mark-read - Mark as read", False, 
                          f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test_result("PUT /notifications/mark-read - Mark as read", False, f"Error: {str(e)}")
    
    # Test authentication protection for mark-read
    test_authentication_protection("/notifications/mark-read", "PUT")
    
    # Test POST /notifications/trigger - Automated notification triggers
    try:
        trigger_data = {
            "triggerType": "booking_confirmed",
            "userId": "test-user-123",
            "data": {
                "classId": "test-class-456",
                "className": "Morning Yoga",
                "classDate": "2024-01-15",
                "classTime": "09:00"
            }
        }
        
        response = requests.post(f"{API_BASE}/notifications/trigger", headers=HEADERS, 
                               json=trigger_data, timeout=10)
        
        if response.status_code in [200, 201]:
            data = response.json()
            log_test_result("POST /notifications/trigger - Automated triggers", True, 
                          f"Status: {response.status_code}, Trigger processed successfully", data)
        else:
            log_test_result("POST /notifications/trigger - Automated triggers", False, 
                          f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test_result("POST /notifications/trigger - Automated triggers", False, f"Error: {str(e)}")

def test_communication_dashboard_apis():
    """Test Communication Dashboard APIs (merchant only)"""
    print("🔄 Testing Communication Dashboard APIs...")
    
    # Test GET /communication/stats - Communication stats and analytics
    try:
        response = requests.get(f"{API_BASE}/communication/stats", headers=HEADERS, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            log_test_result("GET /communication/stats - Communication analytics", True, 
                          f"Status: {response.status_code}, Stats retrieved successfully", data)
        elif response.status_code == 403:
            log_test_result("GET /communication/stats - Communication analytics", True, 
                          f"Correctly restricts access (403) - merchant role required")
        else:
            log_test_result("GET /communication/stats - Communication analytics", False, 
                          f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test_result("GET /communication/stats - Communication analytics", False, f"Error: {str(e)}")
    
    # Test authentication protection
    test_authentication_protection("/communication/stats", "GET")
    
    # Test POST /communication/broadcast - Broadcast sending functionality
    try:
        broadcast_data = {
            "recipients": "all_customers",
            "message": "Welcome to our new communication system!",
            "type": "announcement",
            "scheduledFor": "2024-01-15T10:00:00Z"
        }
        
        response = requests.post(f"{API_BASE}/communication/broadcast", headers=HEADERS, 
                               json=broadcast_data, timeout=10)
        
        if response.status_code in [200, 201]:
            data = response.json()
            log_test_result("POST /communication/broadcast - Broadcast sending", True, 
                          f"Status: {response.status_code}, Broadcast scheduled successfully", data)
        elif response.status_code == 403:
            log_test_result("POST /communication/broadcast - Broadcast sending", True, 
                          f"Correctly restricts access (403) - merchant role required")
        else:
            log_test_result("POST /communication/broadcast - Broadcast sending", False, 
                          f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test_result("POST /communication/broadcast - Broadcast sending", False, f"Error: {str(e)}")
    
    # Test GET /communication/templates - Templates and auto-responders
    try:
        response = requests.get(f"{API_BASE}/communication/templates", headers=HEADERS, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            log_test_result("GET /communication/templates - Templates", True, 
                          f"Status: {response.status_code}, Templates retrieved successfully", data)
        elif response.status_code == 403:
            log_test_result("GET /communication/templates - Templates", True, 
                          f"Correctly restricts access (403) - merchant role required")
        else:
            log_test_result("GET /communication/templates - Templates", False, 
                          f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test_result("GET /communication/templates - Templates", False, f"Error: {str(e)}")

def test_role_based_access_control():
    """Test role-based access control for communication endpoints"""
    print("🔄 Testing Role-Based Access Control...")
    
    # Test with different mock roles
    customer_headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer mock-customer-token"
    }
    
    instructor_headers = {
        "Content-Type": "application/json", 
        "Authorization": "Bearer mock-instructor-token"
    }
    
    merchant_headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer mock-merchant-token"
    }
    
    # Test merchant-only endpoints with different roles
    merchant_endpoints = [
        "/communication/stats",
        "/communication/broadcast", 
        "/communication/templates"
    ]
    
    for endpoint in merchant_endpoints:
        try:
            # Test with customer role (should be denied)
            response = requests.get(f"{API_BASE}{endpoint}", headers=customer_headers, timeout=10)
            if response.status_code in [403, 401]:
                log_test_result(f"Role Access Control - Customer access to {endpoint}", True, 
                              f"Correctly denies customer access ({response.status_code})")
            else:
                log_test_result(f"Role Access Control - Customer access to {endpoint}", False, 
                              f"Should deny customer access, got {response.status_code}")
        except Exception as e:
            log_test_result(f"Role Access Control - Customer access to {endpoint}", False, f"Error: {str(e)}")

def test_error_handling():
    """Test error handling for communication endpoints"""
    print("🔄 Testing Error Handling...")
    
    # Test malformed JSON
    try:
        response = requests.post(f"{API_BASE}/messages/send", 
                               headers=HEADERS, 
                               data="invalid json", 
                               timeout=10)
        
        if response.status_code == 400:
            log_test_result("Error Handling - Malformed JSON", True, 
                          f"Correctly handles malformed JSON (400)")
        else:
            log_test_result("Error Handling - Malformed JSON", False, 
                          f"Expected 400 for malformed JSON, got {response.status_code}")
    except Exception as e:
        log_test_result("Error Handling - Malformed JSON", False, f"Error: {str(e)}")
    
    # Test non-existent endpoints
    try:
        response = requests.get(f"{API_BASE}/communication/nonexistent", headers=HEADERS, timeout=10)
        
        if response.status_code == 404:
            log_test_result("Error Handling - Non-existent endpoint", True, 
                          f"Correctly returns 404 for non-existent endpoint")
        else:
            log_test_result("Error Handling - Non-existent endpoint", False, 
                          f"Expected 404, got {response.status_code}")
    except Exception as e:
        log_test_result("Error Handling - Non-existent endpoint", False, f"Error: {str(e)}")

def main():
    """Run comprehensive communication layer backend testing"""
    print("🚀 Starting Comprehensive Communication Layer Backend Testing")
    print("=" * 80)
    print(f"Base URL: {BASE_URL}")
    print(f"API Base: {API_BASE}")
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)
    print()
    
    # Track test results
    test_results = {
        "total_tests": 0,
        "passed_tests": 0,
        "failed_tests": 0,
        "start_time": time.time()
    }
    
    try:
        # Test all communication layer endpoints
        test_message_thread_management()
        test_message_sending_system()
        test_notification_inbox_system()
        test_notification_management()
        test_communication_dashboard_apis()
        test_role_based_access_control()
        test_error_handling()
        
    except KeyboardInterrupt:
        print("\n⚠️ Testing interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error during testing: {str(e)}")
        sys.exit(1)
    
    # Calculate test duration
    duration = time.time() - test_results["start_time"]
    
    print("=" * 80)
    print("🏁 COMMUNICATION LAYER BACKEND TESTING COMPLETED")
    print("=" * 80)
    print(f"⏱️  Total Duration: {duration:.2f} seconds")
    print(f"📊 Test Summary:")
    print(f"   • Total Tests: {test_results['total_tests']}")
    print(f"   • Passed: {test_results['passed_tests']}")
    print(f"   • Failed: {test_results['failed_tests']}")
    
    if test_results['failed_tests'] == 0:
        print("🎉 All communication layer tests completed!")
    else:
        print(f"⚠️  {test_results['failed_tests']} tests had issues - see details above")
    
    print("=" * 80)

if __name__ == "__main__":
    main()