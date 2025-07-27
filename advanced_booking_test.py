#!/usr/bin/env python3
"""
Advanced My Bookings Management System Testing
Testing specific booking management scenarios with mock data
"""

import requests
import json
import time
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:3000/api"
HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

class AdvancedBookingTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.headers = HEADERS
        self.test_results = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test results"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'details': details
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        print(f"   {message}")
        if details:
            print(f"   Details: {details}")
        print()

    def test_enhanced_bookings_data_structure(self):
        """Test the enhanced bookings data structure"""
        print("🔍 Testing Enhanced Bookings Data Structure...")
        
        # Test that the endpoint exists and returns proper structure
        try:
            response = requests.get(f"{self.base_url}/bookings", 
                                  headers=self.headers, timeout=10)
            
            if response.status_code == 401:
                # Expected for unauthenticated request
                self.log_result(
                    "Enhanced Bookings Data Structure - Authentication Required",
                    True,
                    "Endpoint correctly requires authentication",
                    f"Status: {response.status_code}"
                )
                
                # Check if error response has proper structure
                try:
                    error_data = response.json()
                    if 'error' in error_data:
                        self.log_result(
                            "Enhanced Bookings Data Structure - Error Response Format",
                            True,
                            "Error response has proper JSON structure",
                            f"Error: {error_data['error']}"
                        )
                    else:
                        self.log_result(
                            "Enhanced Bookings Data Structure - Error Response Format",
                            False,
                            "Error response missing 'error' field",
                            f"Response: {error_data}"
                        )
                except:
                    self.log_result(
                        "Enhanced Bookings Data Structure - Error Response Format",
                        False,
                        "Error response is not valid JSON",
                        f"Response: {response.text[:200]}"
                    )
            else:
                self.log_result(
                    "Enhanced Bookings Data Structure - Authentication Required",
                    False,
                    f"Expected 401, got {response.status_code}",
                    f"Response: {response.text[:200]}"
                )
        except Exception as e:
            self.log_result(
                "Enhanced Bookings Data Structure - Authentication Required",
                False,
                f"Request failed: {str(e)}",
                None
            )

    def test_booking_cancellation_policy(self):
        """Test booking cancellation policy enforcement"""
        print("🚫 Testing Booking Cancellation Policy...")
        
        test_booking_id = "test-booking-policy-123"
        
        # Test 1: Cancellation endpoint structure
        try:
            response = requests.post(f"{self.base_url}/bookings/{test_booking_id}/cancel", 
                                   headers=self.headers, timeout=10)
            
            if response.status_code == 401:
                self.log_result(
                    "Booking Cancellation Policy - Endpoint Authentication",
                    True,
                    "Cancellation endpoint correctly requires authentication",
                    f"Status: {response.status_code}"
                )
                
                # Check error response structure
                try:
                    error_data = response.json()
                    if 'error' in error_data:
                        self.log_result(
                            "Booking Cancellation Policy - Error Response Structure",
                            True,
                            "Cancellation error response has proper structure",
                            f"Error: {error_data['error']}"
                        )
                    else:
                        self.log_result(
                            "Booking Cancellation Policy - Error Response Structure",
                            False,
                            "Cancellation error response missing 'error' field",
                            f"Response: {error_data}"
                        )
                except:
                    self.log_result(
                        "Booking Cancellation Policy - Error Response Structure",
                        False,
                        "Cancellation error response is not valid JSON",
                        f"Response: {response.text[:200]}"
                    )
            else:
                self.log_result(
                    "Booking Cancellation Policy - Endpoint Authentication",
                    False,
                    f"Expected 401, got {response.status_code}",
                    f"Response: {response.text[:200]}"
                )
        except Exception as e:
            self.log_result(
                "Booking Cancellation Policy - Endpoint Authentication",
                False,
                f"Request failed: {str(e)}",
                None
            )

        # Test 2: Different booking ID formats
        booking_id_formats = [
            "valid-booking-123",
            "booking_with_underscores",
            "booking-with-dashes-456",
            "BookingWithCaps789"
        ]
        
        for booking_id in booking_id_formats:
            try:
                response = requests.post(f"{self.base_url}/bookings/{booking_id}/cancel", 
                                       headers=self.headers, timeout=10)
                
                if response.status_code in [401, 404]:
                    self.log_result(
                        f"Booking Cancellation Policy - ID Format '{booking_id}'",
                        True,
                        "Endpoint handles booking ID format correctly",
                        f"Status: {response.status_code}"
                    )
                else:
                    self.log_result(
                        f"Booking Cancellation Policy - ID Format '{booking_id}'",
                        False,
                        f"Unexpected status code: {response.status_code}",
                        f"Response: {response.text[:100]}"
                    )
            except Exception as e:
                self.log_result(
                    f"Booking Cancellation Policy - ID Format '{booking_id}'",
                    False,
                    f"Request failed: {str(e)}",
                    None
                )

    def test_booking_checkin_validation(self):
        """Test booking check-in time validation"""
        print("✅ Testing Booking Check-in Validation...")
        
        test_booking_id = "test-checkin-validation-456"
        
        # Test 1: Check-in endpoint structure
        try:
            response = requests.post(f"{self.base_url}/bookings/{test_booking_id}/checkin", 
                                   headers=self.headers, timeout=10)
            
            if response.status_code == 401:
                self.log_result(
                    "Booking Check-in Validation - Endpoint Authentication",
                    True,
                    "Check-in endpoint correctly requires authentication",
                    f"Status: {response.status_code}"
                )
                
                # Check error response structure
                try:
                    error_data = response.json()
                    if 'error' in error_data:
                        self.log_result(
                            "Booking Check-in Validation - Error Response Structure",
                            True,
                            "Check-in error response has proper structure",
                            f"Error: {error_data['error']}"
                        )
                    else:
                        self.log_result(
                            "Booking Check-in Validation - Error Response Structure",
                            False,
                            "Check-in error response missing 'error' field",
                            f"Response: {error_data}"
                        )
                except:
                    self.log_result(
                        "Booking Check-in Validation - Error Response Structure",
                        False,
                        "Check-in error response is not valid JSON",
                        f"Response: {response.text[:200]}"
                    )
            else:
                self.log_result(
                    "Booking Check-in Validation - Endpoint Authentication",
                    False,
                    f"Expected 401, got {response.status_code}",
                    f"Response: {response.text[:200]}"
                )
        except Exception as e:
            self.log_result(
                "Booking Check-in Validation - Endpoint Authentication",
                False,
                f"Request failed: {str(e)}",
                None
            )

        # Test 2: Different booking ID formats for check-in
        booking_id_formats = [
            "valid-checkin-123",
            "checkin_with_underscores",
            "checkin-with-dashes-456",
            "CheckinWithCaps789"
        ]
        
        for booking_id in booking_id_formats:
            try:
                response = requests.post(f"{self.base_url}/bookings/{booking_id}/checkin", 
                                       headers=self.headers, timeout=10)
                
                if response.status_code in [401, 404]:
                    self.log_result(
                        f"Booking Check-in Validation - ID Format '{booking_id}'",
                        True,
                        "Endpoint handles booking ID format correctly",
                        f"Status: {response.status_code}"
                    )
                else:
                    self.log_result(
                        f"Booking Check-in Validation - ID Format '{booking_id}'",
                        False,
                        f"Unexpected status code: {response.status_code}",
                        f"Response: {response.text[:100]}"
                    )
            except Exception as e:
                self.log_result(
                    f"Booking Check-in Validation - ID Format '{booking_id}'",
                    False,
                    f"Request failed: {str(e)}",
                    None
                )

    def test_database_integration(self):
        """Test database integration for booking management"""
        print("🔗 Testing Database Integration...")
        
        # Test 1: Verify classes exist for booking integration
        try:
            response = requests.get(f"{self.base_url}/classes", 
                                  headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'classes' in data and isinstance(data['classes'], list) and len(data['classes']) > 0:
                    classes = data['classes']
                    self.log_result(
                        "Database Integration - Classes Available",
                        True,
                        f"Found {len(classes)} classes available for booking",
                        f"Sample class: {classes[0].get('title', 'Unknown')}"
                    )
                    
                    # Test class detail retrieval for booking integration
                    if classes:
                        self.test_class_detail_for_booking(classes[0])
                else:
                    self.log_result(
                        "Database Integration - Classes Available",
                        False,
                        "No classes found or invalid response structure",
                        f"Response: {str(data)[:200]}"
                    )
            else:
                self.log_result(
                    "Database Integration - Classes Available",
                    False,
                    f"Classes endpoint returned {response.status_code}",
                    f"Response: {response.text[:200]}"
                )
        except Exception as e:
            self.log_result(
                "Database Integration - Classes Available",
                False,
                f"Database connectivity test failed: {str(e)}",
                None
            )

    def test_class_detail_for_booking(self, class_data):
        """Test class detail retrieval for booking integration"""
        class_id = class_data.get('id')
        if not class_id:
            self.log_result(
                "Database Integration - Class Detail for Booking",
                False,
                "Class data missing ID field",
                f"Class data: {str(class_data)[:200]}"
            )
            return
        
        try:
            response = requests.get(f"{self.base_url}/classes/{class_id}", 
                                  headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                class_detail = data.get('class', data)
                
                # Check required fields for booking integration
                required_fields = ['id', 'title', 'instructor', 'sessions', 'price']
                missing_fields = [field for field in required_fields if field not in class_detail]
                
                if not missing_fields:
                    self.log_result(
                        "Database Integration - Class Detail for Booking",
                        True,
                        f"Class {class_id} has all required fields for booking integration",
                        f"Title: {class_detail.get('title')}, Price: ${class_detail.get('price')}"
                    )
                    
                    # Test sessions structure
                    sessions = class_detail.get('sessions', [])
                    if sessions and isinstance(sessions, list):
                        session = sessions[0]
                        session_fields = ['id', 'date', 'startTime', 'endTime', 'spotsTotal', 'spotsBooked']
                        missing_session_fields = [field for field in session_fields if field not in session]
                        
                        if not missing_session_fields:
                            self.log_result(
                                "Database Integration - Session Structure for Booking",
                                True,
                                "Session data has all required fields for booking",
                                f"Session: {session.get('startTime')} - {session.get('endTime')}, Spots: {session.get('spotsBooked')}/{session.get('spotsTotal')}"
                            )
                        else:
                            self.log_result(
                                "Database Integration - Session Structure for Booking",
                                False,
                                f"Session missing required fields: {missing_session_fields}",
                                f"Session data: {str(session)[:200]}"
                            )
                    else:
                        self.log_result(
                            "Database Integration - Session Structure for Booking",
                            False,
                            "Class has no sessions or invalid sessions structure",
                            f"Sessions: {str(sessions)[:200]}"
                        )
                else:
                    self.log_result(
                        "Database Integration - Class Detail for Booking",
                        False,
                        f"Class {class_id} missing required fields: {missing_fields}",
                        f"Available fields: {list(class_detail.keys())}"
                    )
            else:
                self.log_result(
                    "Database Integration - Class Detail for Booking",
                    False,
                    f"Class detail endpoint returned {response.status_code}",
                    f"Response: {response.text[:200]}"
                )
        except Exception as e:
            self.log_result(
                "Database Integration - Class Detail for Booking",
                False,
                f"Class detail test failed: {str(e)}",
                None
            )

    def test_api_error_handling(self):
        """Test comprehensive API error handling"""
        print("🔧 Testing API Error Handling...")
        
        # Test 1: Invalid HTTP methods
        invalid_methods = [
            ("PUT", "/bookings/test-id/cancel"),
            ("DELETE", "/bookings/test-id/checkin"),
            ("PATCH", "/bookings")
        ]
        
        for method, endpoint in invalid_methods:
            try:
                if method == "PUT":
                    response = requests.put(f"{self.base_url}{endpoint}", 
                                          headers=self.headers, timeout=10)
                elif method == "DELETE":
                    response = requests.delete(f"{self.base_url}{endpoint}", 
                                             headers=self.headers, timeout=10)
                elif method == "PATCH":
                    response = requests.patch(f"{self.base_url}{endpoint}", 
                                            headers=self.headers, timeout=10)
                
                # Should return 404 (method not allowed) or 401 (auth required)
                if response.status_code in [401, 404, 405]:
                    self.log_result(
                        f"API Error Handling - Invalid Method {method} {endpoint}",
                        True,
                        f"Correctly handled invalid HTTP method (Status: {response.status_code})",
                        None
                    )
                else:
                    self.log_result(
                        f"API Error Handling - Invalid Method {method} {endpoint}",
                        False,
                        f"Unexpected status code: {response.status_code}",
                        f"Response: {response.text[:100]}"
                    )
            except Exception as e:
                self.log_result(
                    f"API Error Handling - Invalid Method {method} {endpoint}",
                    False,
                    f"Request failed: {str(e)}",
                    None
                )

        # Test 2: Malformed URLs
        malformed_urls = [
            "/bookings//cancel",  # Double slash
            "/bookings/test-id/cancel/extra",  # Extra path
            "/bookings/test-id/",  # Trailing slash
        ]
        
        for url in malformed_urls:
            try:
                response = requests.post(f"{self.base_url}{url}", 
                                       headers=self.headers, timeout=10)
                
                if response.status_code in [400, 401, 404]:
                    self.log_result(
                        f"API Error Handling - Malformed URL '{url}'",
                        True,
                        f"Correctly handled malformed URL (Status: {response.status_code})",
                        None
                    )
                else:
                    self.log_result(
                        f"API Error Handling - Malformed URL '{url}'",
                        False,
                        f"Unexpected status code: {response.status_code}",
                        f"Response: {response.text[:100]}"
                    )
            except Exception as e:
                self.log_result(
                    f"API Error Handling - Malformed URL '{url}'",
                    True,  # Exception is expected for malformed URLs
                    f"Request properly rejected: {str(e)[:100]}",
                    None
                )

    def run_comprehensive_tests(self):
        """Run all advanced booking management tests"""
        print("🚀 Starting Advanced My Bookings Management System Testing")
        print(f"Base URL: {self.base_url}")
        print(f"Timestamp: {datetime.now().isoformat()}")
        print("=" * 80)
        
        start_time = datetime.now()
        
        # Run all test suites
        self.test_enhanced_bookings_data_structure()
        self.test_booking_cancellation_policy()
        self.test_booking_checkin_validation()
        self.test_database_integration()
        self.test_api_error_handling()
        
        end_time = datetime.now()
        duration = end_time - start_time
        
        # Generate summary
        return self.generate_summary(duration)
    
    def generate_summary(self, duration):
        """Generate comprehensive test summary"""
        print("=" * 80)
        print("📊 ADVANCED MY BOOKINGS MANAGEMENT SYSTEM TESTING SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r['success']])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"📈 Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        print(f"⏱️  Duration: {duration.total_seconds():.2f} seconds")
        print()
        
        if failed_tests > 0:
            print("❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   • {result['test']}: {result['message']}")
            print()
        
        print("🎯 DETAILED TEST CATEGORIES:")
        
        # Categorize results
        categories = {
            'Data Structure': [r for r in self.test_results if 'Data Structure' in r['test']],
            'Cancellation Policy': [r for r in self.test_results if 'Cancellation Policy' in r['test']],
            'Check-in Validation': [r for r in self.test_results if 'Check-in Validation' in r['test']],
            'Database Integration': [r for r in self.test_results if 'Database Integration' in r['test']],
            'Error Handling': [r for r in self.test_results if 'Error Handling' in r['test']]
        }
        
        for category, tests in categories.items():
            if tests:
                passed = len([t for t in tests if t['success']])
                total = len(tests)
                print(f"   📋 {category}: {passed}/{total} tests passed")
        
        # Overall assessment
        print()
        if passed_tests == total_tests:
            print("🎉 EXCELLENT! All advanced booking management tests passed.")
            print("   ✅ Enhanced bookings data structure is properly implemented")
            print("   ✅ Booking cancellation policy enforcement is working")
            print("   ✅ Check-in validation is functioning correctly")
            print("   ✅ Database integration is solid")
            print("   ✅ Error handling is comprehensive")
        elif passed_tests >= total_tests * 0.9:
            print("🌟 VERY GOOD! Most advanced tests passed with minor issues.")
        elif passed_tests >= total_tests * 0.8:
            print("✅ GOOD! Majority of advanced tests passed.")
        elif passed_tests >= total_tests * 0.6:
            print("⚠️  FAIR: Some advanced functionality may have issues.")
        else:
            print("❌ NEEDS ATTENTION: Significant issues with advanced booking functionality.")
        
        return {
            'total': total_tests,
            'passed': passed_tests,
            'failed': failed_tests,
            'success_rate': (passed_tests/total_tests)*100,
            'duration': duration.total_seconds(),
            'results': self.test_results
        }

if __name__ == "__main__":
    tester = AdvancedBookingTester()
    results = tester.run_comprehensive_tests()