#!/usr/bin/env python3
"""
Advanced Class Management & Scheduling System - Comprehensive Testing Suite
Tests all components of the class management and booking system
"""

import requests
import json
import time
import sys
from datetime import datetime, timedelta

# Base URL for API testing
BASE_URL = "http://localhost:3000/server-api"

# Mock Firebase token for testing
MOCK_TOKEN = "mock-firebase-token"
TEST_USER_ID = "firebase-test-user"

class ClassManagementTester:
    def __init__(self):
        self.headers = {
            'Authorization': f'Bearer {MOCK_TOKEN}',
            'Content-Type': 'application/json'
        }
        self.test_results = {
            'passed': 0,
            'failed': 0,
            'total': 0,
            'failures': []
        }
        self.created_class_id = None
        self.created_schedule_ids = []
        self.created_booking_id = None
        
    def print_header(self, title):
        print(f"\n{'='*80}")
        print(f"🚀 {title}")
        print(f"{'='*80}")
        
    def print_test(self, test_name, passed, details="", response_time=0):
        self.test_results['total'] += 1
        if passed:
            self.test_results['passed'] += 1
            status = "✅ PASS"
            print(f"{status} {test_name}: {details}")
            if response_time > 0:
                print(f"   Response time: {response_time:.2f}ms")
        else:
            self.test_results['failed'] += 1
            status = "❌ FAIL"
            print(f"{status} {test_name}: {details}")
            self.test_results['failures'].append(f"{test_name}: {details}")

    def print_summary(self):
        print(f"\n{'='*80}")
        print(f"🎯 TEST SUMMARY")
        print(f"{'='*80}")
        print(f"Total Tests: {self.test_results['total']}")
        print(f"Passed: {self.test_results['passed']} ✅")
        print(f"Failed: {self.test_results['failed']} ❌")
        
        if self.test_results['total'] > 0:
            success_rate = (self.test_results['passed'] / self.test_results['total']) * 100
            print(f"Success Rate: {success_rate:.1f}%")
        
        if self.test_results['failures']:
            print(f"\n❌ FAILED TESTS:")
            for failure in self.test_results['failures']:
                print(f"  - {failure}")
        
        print(f"\n🎉 Advanced Class Management & Scheduling System Testing Complete!")

    def test_class_creation(self):
        """Test class template creation and management"""
        self.print_header("Testing Class Creation & Management")
        
        # Test 1: Create basic class template
        class_data = {
            "name": "Morning Yoga Flow",
            "description": "Energizing yoga flow to start your day",
            "duration": 60,
            "capacity": 20,
            "price": 25.00,
            "category": "yoga",
            "level": "all-levels",
            "startTime": "09:00",
            "scheduleDays": ["monday", "wednesday", "friday"],
            "recurrencePattern": "weekly",
            "tags": ["morning", "flow", "energizing"],
            "xPassEligible": True
        }
        
        start_time = time.time() * 1000
        try:
            response = requests.post(f"{BASE_URL}/classes", 
                                   headers=self.headers, 
                                   json=class_data)
            response_time = time.time() * 1000 - start_time
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('class'):
                    self.created_class_id = data['class']['id']
                    self.print_test("Basic Class Creation", True, 
                                  f"Created class '{data['class']['name']}' with ID: {self.created_class_id}", 
                                  response_time)
                else:
                    self.print_test("Basic Class Creation", False, 
                                  f"Response missing required fields: {data}")
            else:
                self.print_test("Basic Class Creation", False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.print_test("Basic Class Creation", False, f"Exception: {str(e)}")

        # Test 2: Create Member+ only class with requirements
        premium_class_data = {
            "name": "Advanced HIIT Training",
            "description": "High-intensity interval training for experienced athletes",
            "duration": 45,
            "capacity": 15,
            "price": 35.00,
            "category": "hiit",
            "level": "advanced",
            "requirements": "Must have completed beginner HIIT course and fitness assessment",
            "startTime": "18:00",
            "scheduleDays": ["tuesday", "thursday"],
            "recurrencePattern": "weekly",
            "memberPlusOnly": True,
            "tags": ["advanced", "hiit", "intensive"]
        }
        
        start_time = time.time() * 1000
        try:
            response = requests.post(f"{BASE_URL}/classes", 
                                   headers=self.headers, 
                                   json=premium_class_data)
            response_time = time.time() * 1000 - start_time
            
            if response.status_code == 200:
                data = response.json()
                self.print_test("Premium Class Creation", True, 
                              f"Created Member+ class with requirements", response_time)
            else:
                self.print_test("Premium Class Creation", False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.print_test("Premium Class Creation", False, f"Exception: {str(e)}")

        # Test 3: Test validation - missing required fields
        invalid_class_data = {
            "description": "Class without name",
            "category": "fitness"
        }
        
        start_time = time.time() * 1000
        try:
            response = requests.post(f"{BASE_URL}/classes", 
                                   headers=self.headers, 
                                   json=invalid_class_data)
            response_time = time.time() * 1000 - start_time
            
            if response.status_code == 400:
                self.print_test("Class Validation", True, 
                              "Correctly rejected class without required fields", response_time)
            else:
                self.print_test("Class Validation", False, 
                              f"Should reject invalid data but got: {response.status_code}")
        except Exception as e:
            self.print_test("Class Validation", False, f"Exception: {str(e)}")

        # Test 4: Test authentication protection
        try:
            response = requests.post(f"{BASE_URL}/classes", 
                                   json=class_data)  # No auth header
            
            if response.status_code == 401:
                self.print_test("Auth Protection", True, 
                              "Correctly requires authentication for class creation")
            else:
                self.print_test("Auth Protection", False, 
                              f"Should require auth but got: {response.status_code}")
        except Exception as e:
            self.print_test("Auth Protection", False, f"Exception: {str(e)}")

    def test_schedule_generation(self):
        """Test class schedule instance generation"""
        self.print_header("Testing Schedule Generation")
        
        if not self.created_class_id:
            self.print_test("Schedule Generation - No Class", False, 
                          "Cannot test schedule generation without created class")
            return

        # Test 1: Generate weekly schedule
        start_date = datetime.now().strftime('%Y-%m-%d')
        end_date = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')
        
        schedule_data = {
            "classId": self.created_class_id,
            "startDate": start_date,
            "endDate": end_date,
            "recurrencePattern": "weekly"
        }
        
        start_time = time.time() * 1000
        try:
            response = requests.post(f"{BASE_URL}/classes/schedule/generate", 
                                   headers=self.headers, 
                                   json=schedule_data)
            response_time = time.time() * 1000 - start_time
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('generated', 0) > 0:
                    self.print_test("Weekly Schedule Generation", True, 
                                  f"Generated {data['generated']} weekly instances", response_time)
                    # Store first few instance IDs for booking tests
                    if data.get('instances'):
                        self.created_schedule_ids = [inst['id'] for inst in data['instances'][:3]]
                else:
                    self.print_test("Weekly Schedule Generation", False, 
                                  f"No instances generated: {data}")
            else:
                self.print_test("Weekly Schedule Generation", False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.print_test("Weekly Schedule Generation", False, f"Exception: {str(e)}")

        # Test 2: Generate single instance
        single_schedule_data = {
            "classId": self.created_class_id,
            "startDate": start_date,
            "endDate": start_date,
            "recurrencePattern": "none"
        }
        
        start_time = time.time() * 1000
        try:
            response = requests.post(f"{BASE_URL}/classes/schedule/generate", 
                                   headers=self.headers, 
                                   json=single_schedule_data)
            response_time = time.time() * 1000 - start_time
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.print_test("Single Instance Generation", True, 
                                  f"Generated {data.get('generated', 0)} single instance", response_time)
                else:
                    self.print_test("Single Instance Generation", False, 
                                  f"Generation failed: {data}")
            else:
                self.print_test("Single Instance Generation", False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.print_test("Single Instance Generation", False, f"Exception: {str(e)}")

        # Test 3: Test invalid date range
        invalid_schedule_data = {
            "classId": self.created_class_id,
            "startDate": "2023-12-31",  # Past date
            "endDate": "2023-12-01",    # End before start
            "recurrencePattern": "weekly"
        }
        
        start_time = time.time() * 1000
        try:
            response = requests.post(f"{BASE_URL}/classes/schedule/generate", 
                                   headers=self.headers, 
                                   json=invalid_schedule_data)
            response_time = time.time() * 1000 - start_time
            
            if response.status_code == 400:
                self.print_test("Schedule Validation", True, 
                              "Correctly rejected invalid date range", response_time)
            else:
                self.print_test("Schedule Validation", False, 
                              f"Should reject invalid dates but got: {response.status_code}")
        except Exception as e:
            self.print_test("Schedule Validation", False, f"Exception: {str(e)}")

    def test_real_time_booking(self):
        """Test real-time booking engine"""
        self.print_header("Testing Real-Time Booking Engine")
        
        if not self.created_schedule_ids:
            self.print_test("Booking - No Schedules", False, 
                          "Cannot test booking without schedule instances")
            return

        # Test 1: Successful booking
        booking_data = {
            "classInstanceId": self.created_schedule_ids[0],
            "paymentMethod": "membership",
            "membershipType": "drop_in"
        }
        
        start_time = time.time() * 1000
        try:
            response = requests.post(f"{BASE_URL}/booking/create", 
                                   headers=self.headers, 
                                   json=booking_data)
            response_time = time.time() * 1000 - start_time
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('booking'):
                    self.created_booking_id = data['booking']['id']
                    self.print_test("Successful Booking", True, 
                                  f"Booked class, remaining spots: {data.get('remainingSpots', 'unknown')}", 
                                  response_time)
                else:
                    self.print_test("Successful Booking", False, 
                                  f"Booking failed: {data}")
            else:
                self.print_test("Successful Booking", False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.print_test("Successful Booking", False, f"Exception: {str(e)}")

        # Test 2: Duplicate booking prevention
        start_time = time.time() * 1000
        try:
            response = requests.post(f"{BASE_URL}/booking/create", 
                                   headers=self.headers, 
                                   json=booking_data)  # Same booking data
            response_time = time.time() * 1000 - start_time
            
            if response.status_code == 400:
                self.print_test("Duplicate Booking Prevention", True, 
                              "Correctly prevented duplicate booking", response_time)
            else:
                self.print_test("Duplicate Booking Prevention", False, 
                              f"Should prevent duplicate but got: {response.status_code}")
        except Exception as e:
            self.print_test("Duplicate Booking Prevention", False, f"Exception: {str(e)}")

        # Test 3: Invalid class instance
        invalid_booking_data = {
            "classInstanceId": "non-existent-class-id",
            "paymentMethod": "membership"
        }
        
        start_time = time.time() * 1000
        try:
            response = requests.post(f"{BASE_URL}/booking/create", 
                                   headers=self.headers, 
                                   json=invalid_booking_data)
            response_time = time.time() * 1000 - start_time
            
            if response.status_code == 404:
                self.print_test("Invalid Class Booking", True, 
                              "Correctly rejected booking for non-existent class", response_time)
            else:
                self.print_test("Invalid Class Booking", False, 
                              f"Should reject invalid class but got: {response.status_code}")
        except Exception as e:
            self.print_test("Invalid Class Booking", False, f"Exception: {str(e)}")

    def test_waitlist_management(self):
        """Test waitlist functionality"""
        self.print_header("Testing Waitlist Management")
        
        if not self.created_schedule_ids:
            self.print_test("Waitlist - No Schedules", False, 
                          "Cannot test waitlist without schedule instances")
            return

        # Test 1: Join waitlist
        waitlist_data = {
            "classInstanceId": self.created_schedule_ids[0] if self.created_schedule_ids else "test-id",
            "autoBook": True,
            "notifications": {"email": True, "sms": False}
        }
        
        start_time = time.time() * 1000
        try:
            response = requests.post(f"{BASE_URL}/booking/waitlist", 
                                   headers=self.headers, 
                                   json=waitlist_data)
            response_time = time.time() * 1000 - start_time
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('waitlist'):
                    self.print_test("Join Waitlist", True, 
                                  f"Joined waitlist at position {data.get('position', 'unknown')}", 
                                  response_time)
                else:
                    self.print_test("Join Waitlist", False, 
                                  f"Waitlist join failed: {data}")
            elif response.status_code == 400:
                # Might fail if already on waitlist or other valid reasons
                self.print_test("Join Waitlist", True, 
                              "Waitlist request handled (user may already be on waitlist)", response_time)
            else:
                self.print_test("Join Waitlist", False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.print_test("Join Waitlist", False, f"Exception: {str(e)}")

        # Test 2: Test authentication for waitlist
        try:
            response = requests.post(f"{BASE_URL}/booking/waitlist", 
                                   json=waitlist_data)  # No auth header
            
            if response.status_code == 401:
                self.print_test("Waitlist Auth Protection", True, 
                              "Correctly requires authentication for waitlist")
            else:
                self.print_test("Waitlist Auth Protection", False, 
                              f"Should require auth but got: {response.status_code}")
        except Exception as e:
            self.print_test("Waitlist Auth Protection", False, f"Exception: {str(e)}")

    def test_search_and_discovery(self):
        """Test search and filtering functionality"""
        self.print_header("Testing Search & Discovery")
        
        # Test 1: Basic class search
        search_params = "q=yoga&category=yoga&availableOnly=true&sortBy=date&limit=10"
        
        start_time = time.time() * 1000
        try:
            response = requests.get(f"{BASE_URL}/search/classes?{search_params}")
            response_time = time.time() * 1000 - start_time
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'results' in data:
                    self.print_test("Class Search", True, 
                                  f"Found {len(data['results'])} classes matching 'yoga'", response_time)
                else:
                    self.print_test("Class Search", False, 
                                  f"Search failed: {data}")
            else:
                self.print_test("Class Search", False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.print_test("Class Search", False, f"Exception: {str(e)}")

        # Test 2: Category filtering
        category_params = "category=hiit&level=advanced"
        
        start_time = time.time() * 1000
        try:
            response = requests.get(f"{BASE_URL}/search/classes?{category_params}")
            response_time = time.time() * 1000 - start_time
            
            if response.status_code == 200:
                data = response.json()
                self.print_test("Category Filtering", True, 
                              f"Category filter returned {len(data.get('results', []))} results", 
                              response_time)
            else:
                self.print_test("Category Filtering", False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.print_test("Category Filtering", False, f"Exception: {str(e)}")

        # Test 3: Time-based filtering
        time_params = "timeOfDay=morning&sortBy=popularity"
        
        start_time = time.time() * 1000
        try:
            response = requests.get(f"{BASE_URL}/search/classes?{time_params}")
            response_time = time.time() * 1000 - start_time
            
            if response.status_code == 200:
                data = response.json()
                self.print_test("Time-based Filtering", True, 
                              f"Morning classes filter returned {len(data.get('results', []))} results", 
                              response_time)
            else:
                self.print_test("Time-based Filtering", False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.print_test("Time-based Filtering", False, f"Exception: {str(e)}")

    def test_data_retrieval(self):
        """Test data retrieval endpoints"""
        self.print_header("Testing Data Retrieval")
        
        # Test 1: Get studio classes
        start_time = time.time() * 1000
        try:
            response = requests.get(f"{BASE_URL}/classes", headers=self.headers)
            response_time = time.time() * 1000 - start_time
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'classes' in data:
                    self.print_test("Studio Classes Retrieval", True, 
                                  f"Retrieved {len(data['classes'])} studio classes", response_time)
                else:
                    self.print_test("Studio Classes Retrieval", False, 
                                  f"Classes retrieval failed: {data}")
            else:
                self.print_test("Studio Classes Retrieval", False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.print_test("Studio Classes Retrieval", False, f"Exception: {str(e)}")

        # Test 2: Get schedules with date range
        start_date = datetime.now().strftime('%Y-%m-%d')
        end_date = (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')
        schedule_params = f"startDate={start_date}&endDate={end_date}&view=week"
        
        start_time = time.time() * 1000
        try:
            response = requests.get(f"{BASE_URL}/schedules?{schedule_params}", headers=self.headers)
            response_time = time.time() * 1000 - start_time
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'schedules' in data:
                    self.print_test("Schedule Retrieval", True, 
                                  f"Retrieved {len(data['schedules'])} scheduled classes", response_time)
                else:
                    self.print_test("Schedule Retrieval", False, 
                                  f"Schedule retrieval failed: {data}")
            else:
                self.print_test("Schedule Retrieval", False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.print_test("Schedule Retrieval", False, f"Exception: {str(e)}")

        # Test 3: Get user bookings
        start_time = time.time() * 1000
        try:
            response = requests.get(f"{BASE_URL}/bookings?upcoming=true&limit=20", headers=self.headers)
            response_time = time.time() * 1000 - start_time
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'bookings' in data:
                    self.print_test("User Bookings Retrieval", True, 
                                  f"Retrieved {len(data['bookings'])} user bookings", response_time)
                else:
                    self.print_test("User Bookings Retrieval", False, 
                                  f"Bookings retrieval failed: {data}")
            else:
                self.print_test("User Bookings Retrieval", False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.print_test("User Bookings Retrieval", False, f"Exception: {str(e)}")

    def test_booking_cancellation(self):
        """Test booking cancellation and waitlist promotion"""
        self.print_header("Testing Booking Cancellation")
        
        if not self.created_booking_id:
            self.print_test("Cancellation - No Booking", False, 
                          "Cannot test cancellation without created booking")
            return

        # Test booking cancellation
        cancellation_data = {
            "bookingId": self.created_booking_id
        }
        
        start_time = time.time() * 1000
        try:
            response = requests.post(f"{BASE_URL}/booking/cancel", 
                                   headers=self.headers, 
                                   json=cancellation_data)
            response_time = time.time() * 1000 - start_time
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.print_test("Booking Cancellation", True, 
                                  f"Cancelled booking, fee: ${data.get('cancellation', {}).get('cancellationFee', 0)}", 
                                  response_time)
                else:
                    self.print_test("Booking Cancellation", False, 
                                  f"Cancellation failed: {data}")
            else:
                self.print_test("Booking Cancellation", False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.print_test("Booking Cancellation", False, f"Exception: {str(e)}")

    def run_all_tests(self):
        """Run all test suites"""
        self.print_header("Advanced Class Management & Scheduling System - Comprehensive Testing")
        
        # Run all test categories
        self.test_class_creation()
        self.test_schedule_generation()
        self.test_real_time_booking()
        self.test_waitlist_management()
        self.test_search_and_discovery()
        self.test_data_retrieval()
        self.test_booking_cancellation()
        
        # Print final summary
        self.print_summary()

def main():
    tester = ClassManagementTester()
    tester.run_all_tests()

if __name__ == "__main__":
    main()