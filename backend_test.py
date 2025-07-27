#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime, timedelta
import time

# Configuration
BASE_URL = "https://c114112e-8151-4a5e-b14f-b58ea49cf499.preview.emergentagent.com"
SERVER_API_BASE = f"{BASE_URL}/server-api"

# Test configuration
INSTRUCTOR_AUTH_TOKEN = "Bearer firebase-test-instructor-token"
CUSTOMER_AUTH_TOKEN = "Bearer firebase-test-customer-token"
INVALID_AUTH_TOKEN = "Bearer invalid-token"

class ClassManagementTester:
    def __init__(self):
        self.passed_tests = 0
        self.failed_tests = 0
        self.total_tests = 0
        
    def log_test(self, test_name, passed, message=""):
        self.total_tests += 1
        if passed:
            self.passed_tests += 1
            print(f"✅ {test_name}")
            if message:
                print(f"   {message}")
        else:
            self.failed_tests += 1
            print(f"❌ {test_name}")
            if message:
                print(f"   {message}")
        print()

    def test_authentication_requirements(self):
        """Test authentication requirements for both endpoints"""
        print("🔐 TESTING AUTHENTICATION REQUIREMENTS")
        print("=" * 60)
        
        # Test GET /server-api/instructor/classes without authentication
        try:
            response = requests.get(f"{SERVER_API_BASE}/instructor/classes", timeout=10)
            if response.status_code == 401:
                self.log_test("GET /instructor/classes - No Auth Returns 401", True, 
                            f"Status: {response.status_code}, Response: {response.text[:100]}")
            else:
                self.log_test("GET /instructor/classes - No Auth Returns 401", False, 
                            f"Expected 401, got {response.status_code}: {response.text[:100]}")
        except Exception as e:
            self.log_test("GET /instructor/classes - No Auth Returns 401", False, f"Request failed: {str(e)}")

        # Test POST /server-api/instructor/classes without authentication
        try:
            test_class_data = {
                "title": "Test Yoga Class",
                "description": "A test yoga class",
                "type": "Yoga",
                "location": "Test Studio",
                "date": "2025-02-01",
                "time": "10:00"
            }
            response = requests.post(f"{SERVER_API_BASE}/instructor/classes", 
                                   json=test_class_data, timeout=10)
            if response.status_code == 401:
                self.log_test("POST /instructor/classes - No Auth Returns 401", True, 
                            f"Status: {response.status_code}, Response: {response.text[:100]}")
            else:
                self.log_test("POST /instructor/classes - No Auth Returns 401", False, 
                            f"Expected 401, got {response.status_code}: {response.text[:100]}")
        except Exception as e:
            self.log_test("POST /instructor/classes - No Auth Returns 401", False, f"Request failed: {str(e)}")

        # Test with invalid authentication token
        try:
            headers = {"Authorization": INVALID_AUTH_TOKEN}
            response = requests.get(f"{SERVER_API_BASE}/instructor/classes", 
                                  headers=headers, timeout=10)
            if response.status_code in [401, 403]:
                self.log_test("GET /instructor/classes - Invalid Auth Returns 401/403", True, 
                            f"Status: {response.status_code}, Response: {response.text[:100]}")
            else:
                self.log_test("GET /instructor/classes - Invalid Auth Returns 401/403", False, 
                            f"Expected 401/403, got {response.status_code}: {response.text[:100]}")
        except Exception as e:
            self.log_test("GET /instructor/classes - Invalid Auth Returns 401/403", False, f"Request failed: {str(e)}")

        # Test with customer role (should be rejected)
        try:
            headers = {"Authorization": CUSTOMER_AUTH_TOKEN}
            response = requests.get(f"{SERVER_API_BASE}/instructor/classes", 
                                  headers=headers, timeout=10)
            if response.status_code in [403, 404]:
                self.log_test("GET /instructor/classes - Customer Role Returns 403/404", True, 
                            f"Status: {response.status_code}, Response: {response.text[:100]}")
            else:
                self.log_test("GET /instructor/classes - Customer Role Returns 403/404", False, 
                            f"Expected 403/404, got {response.status_code}: {response.text[:100]}")
        except Exception as e:
            self.log_test("GET /instructor/classes - Customer Role Returns 403/404", False, f"Request failed: {str(e)}")

    def test_class_creation(self):
        """Test class creation functionality"""
        print("📝 TESTING CLASS CREATION")
        print("=" * 60)
        
        headers = {"Authorization": INSTRUCTOR_AUTH_TOKEN}
        
        # Test creating class with all required fields
        try:
            test_class_data = {
                "title": "Advanced Vinyasa Flow",
                "description": "A challenging vinyasa flow class for experienced practitioners",
                "type": "Yoga",
                "level": "Advanced",
                "duration": 90,
                "price": 45,
                "capacity": 20,
                "location": "Zen Yoga Studio",
                "date": "2025-02-15",
                "time": "18:00",
                "recurring": False,
                "requirements": "Previous yoga experience required",
                "amenities": ["Yoga mats provided", "Water station", "Changing rooms"]
            }
            
            response = requests.post(f"{SERVER_API_BASE}/instructor/classes", 
                                   json=test_class_data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                response_data = response.json()
                if "message" in response_data and "classId" in response_data and "class" in response_data:
                    self.log_test("POST /instructor/classes - Create Class Success", True, 
                                f"Class created with ID: {response_data.get('classId')}")
                    
                    # Validate class data structure
                    class_data = response_data.get("class", {})
                    required_fields = ["id", "title", "description", "type", "instructorId", "instructorName", "status"]
                    missing_fields = [field for field in required_fields if field not in class_data]
                    
                    if not missing_fields:
                        self.log_test("Class Data Structure Validation", True, 
                                    f"All required fields present: {required_fields}")
                    else:
                        self.log_test("Class Data Structure Validation", False, 
                                    f"Missing fields: {missing_fields}")
                        
                    # Validate instructor association
                    if (class_data.get("instructorId") and 
                        class_data.get("instructorName") and 
                        class_data.get("status") == "scheduled"):
                        self.log_test("Instructor Association Validation", True, 
                                    f"Instructor ID: {class_data.get('instructorId')}, Status: {class_data.get('status')}")
                    else:
                        self.log_test("Instructor Association Validation", False, 
                                    f"Invalid instructor data or status")
                else:
                    self.log_test("POST /instructor/classes - Create Class Success", False, 
                                f"Missing required response fields: {response.text[:200]}")
            else:
                self.log_test("POST /instructor/classes - Create Class Success", False, 
                            f"Expected 200, got {response.status_code}: {response.text[:200]}")
        except Exception as e:
            self.log_test("POST /instructor/classes - Create Class Success", False, f"Request failed: {str(e)}")

        # Test creating class with minimal required fields
        try:
            minimal_class_data = {
                "title": "Basic Yoga Class",
                "description": "A simple yoga class for beginners",
                "type": "Yoga",
                "location": "Community Center",
                "date": "2025-02-20",
                "time": "10:00"
            }
            
            response = requests.post(f"{SERVER_API_BASE}/instructor/classes", 
                                   json=minimal_class_data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                response_data = response.json()
                class_data = response_data.get("class", {})
                
                # Check default values
                if (class_data.get("level") == "All Levels" and 
                    class_data.get("duration") == 60 and 
                    class_data.get("price") == 25 and 
                    class_data.get("capacity") == 15):
                    self.log_test("Default Values Assignment", True, 
                                f"Defaults applied correctly: level={class_data.get('level')}, duration={class_data.get('duration')}")
                else:
                    self.log_test("Default Values Assignment", False, 
                                f"Incorrect defaults: level={class_data.get('level')}, duration={class_data.get('duration')}")
            else:
                self.log_test("POST /instructor/classes - Minimal Fields Success", False, 
                            f"Expected 200, got {response.status_code}: {response.text[:200]}")
        except Exception as e:
            self.log_test("POST /instructor/classes - Minimal Fields Success", False, f"Request failed: {str(e)}")

        # Test validation for missing required fields
        missing_field_tests = [
            ({"description": "Test", "type": "Yoga", "location": "Studio", "date": "2025-02-01", "time": "10:00"}, "title"),
            ({"title": "Test", "type": "Yoga", "location": "Studio", "date": "2025-02-01", "time": "10:00"}, "description"),
            ({"title": "Test", "description": "Test", "location": "Studio", "date": "2025-02-01", "time": "10:00"}, "type"),
            ({"title": "Test", "description": "Test", "type": "Yoga", "date": "2025-02-01", "time": "10:00"}, "location"),
            ({"title": "Test", "description": "Test", "type": "Yoga", "location": "Studio", "time": "10:00"}, "date"),
            ({"title": "Test", "description": "Test", "type": "Yoga", "location": "Studio", "date": "2025-02-01"}, "time")
        ]
        
        for test_data, missing_field in missing_field_tests:
            try:
                response = requests.post(f"{SERVER_API_BASE}/instructor/classes", 
                                       json=test_data, headers=headers, timeout=10)
                if response.status_code == 400:
                    self.log_test(f"Validation - Missing {missing_field} Returns 400", True, 
                                f"Status: {response.status_code}")
                else:
                    self.log_test(f"Validation - Missing {missing_field} Returns 400", False, 
                                f"Expected 400, got {response.status_code}: {response.text[:100]}")
            except Exception as e:
                self.log_test(f"Validation - Missing {missing_field} Returns 400", False, f"Request failed: {str(e)}")

    def test_class_retrieval(self):
        """Test class retrieval functionality"""
        print("📋 TESTING CLASS RETRIEVAL")
        print("=" * 60)
        
        headers = {"Authorization": INSTRUCTOR_AUTH_TOKEN}
        
        # Test fetching classes for instructor
        try:
            response = requests.get(f"{SERVER_API_BASE}/instructor/classes", 
                                  headers=headers, timeout=10)
            
            if response.status_code == 200:
                response_data = response.json()
                if "classes" in response_data:
                    classes = response_data["classes"]
                    self.log_test("GET /instructor/classes - Success Response", True, 
                                f"Retrieved {len(classes)} classes")
                    
                    # Test response structure
                    if isinstance(classes, list):
                        self.log_test("Classes Array Structure", True, 
                                    f"Classes returned as array with {len(classes)} items")
                        
                        # If classes exist, validate structure
                        if classes:
                            first_class = classes[0]
                            required_fields = ["id", "title", "description", "instructorId", "createdAt"]
                            missing_fields = [field for field in required_fields if field not in first_class]
                            
                            if not missing_fields:
                                self.log_test("Class Object Structure", True, 
                                            f"Class objects contain required fields")
                            else:
                                self.log_test("Class Object Structure", False, 
                                            f"Missing fields in class object: {missing_fields}")
                                
                            # Test sorting (newest first)
                            if len(classes) > 1:
                                dates_sorted = True
                                for i in range(len(classes) - 1):
                                    if classes[i].get("createdAt", "") < classes[i + 1].get("createdAt", ""):
                                        dates_sorted = False
                                        break
                                
                                self.log_test("Classes Sorted by Creation Date", dates_sorted, 
                                            f"Classes sorted newest first: {dates_sorted}")
                        else:
                            self.log_test("Empty Classes Array", True, 
                                        "No classes found for instructor (empty array returned)")
                    else:
                        self.log_test("Classes Array Structure", False, 
                                    f"Classes should be array, got: {type(classes)}")
                else:
                    self.log_test("GET /instructor/classes - Success Response", False, 
                                f"Missing 'classes' field in response: {response.text[:200]}")
            else:
                self.log_test("GET /instructor/classes - Success Response", False, 
                            f"Expected 200, got {response.status_code}: {response.text[:200]}")
        except Exception as e:
            self.log_test("GET /instructor/classes - Success Response", False, f"Request failed: {str(e)}")

        # Test with customer role (should fail)
        try:
            customer_headers = {"Authorization": CUSTOMER_AUTH_TOKEN}
            response = requests.get(f"{SERVER_API_BASE}/instructor/classes", 
                                  headers=customer_headers, timeout=10)
            
            if response.status_code in [403, 404]:
                self.log_test("GET /instructor/classes - Customer Role Rejected", True, 
                            f"Customer role properly rejected with status {response.status_code}")
            else:
                self.log_test("GET /instructor/classes - Customer Role Rejected", False, 
                            f"Expected 403/404, got {response.status_code}: {response.text[:100]}")
        except Exception as e:
            self.log_test("GET /instructor/classes - Customer Role Rejected", False, f"Request failed: {str(e)}")

    def test_data_validation_and_integration(self):
        """Test data validation and MongoDB integration"""
        print("🔍 TESTING DATA VALIDATION & INTEGRATION")
        print("=" * 60)
        
        headers = {"Authorization": INSTRUCTOR_AUTH_TOKEN}
        
        # Test comprehensive class creation with all fields
        try:
            comprehensive_class_data = {
                "title": "Comprehensive Test Class",
                "description": "A comprehensive test class with all possible fields",
                "type": "HIIT",
                "level": "Intermediate",
                "duration": 45,
                "price": 30,
                "capacity": 25,
                "location": "Fitness Center Downtown",
                "date": "2025-03-01",
                "time": "19:00",
                "recurring": True,
                "requirements": "Basic fitness level required, bring water bottle",
                "amenities": ["Towels provided", "Shower facilities", "Parking available", "Equipment included"]
            }
            
            response = requests.post(f"{SERVER_API_BASE}/instructor/classes", 
                                   json=comprehensive_class_data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                response_data = response.json()
                class_data = response_data.get("class", {})
                
                # Validate all fields are preserved
                fields_to_check = ["title", "description", "type", "level", "duration", "price", "capacity", "location", "date", "time", "recurring", "requirements"]
                all_fields_correct = True
                incorrect_fields = []
                
                for field in fields_to_check:
                    if class_data.get(field) != comprehensive_class_data[field]:
                        all_fields_correct = False
                        incorrect_fields.append(f"{field}: expected {comprehensive_class_data[field]}, got {class_data.get(field)}")
                
                if all_fields_correct:
                    self.log_test("Comprehensive Data Preservation", True, 
                                f"All {len(fields_to_check)} fields preserved correctly")
                else:
                    self.log_test("Comprehensive Data Preservation", False, 
                                f"Incorrect fields: {incorrect_fields}")
                
                # Validate amenities array
                if isinstance(class_data.get("amenities"), list) and len(class_data.get("amenities", [])) == 4:
                    self.log_test("Amenities Array Handling", True, 
                                f"Amenities array preserved with {len(class_data.get('amenities', []))} items")
                else:
                    self.log_test("Amenities Array Handling", False, 
                                f"Amenities not properly handled: {class_data.get('amenities')}")
                
                # Validate automatic fields
                auto_fields = ["id", "instructorId", "instructorName", "instructorEmail", "enrolled", "status", "createdAt", "updatedAt"]
                missing_auto_fields = [field for field in auto_fields if field not in class_data]
                
                if not missing_auto_fields:
                    self.log_test("Automatic Fields Generation", True, 
                                f"All automatic fields generated: {auto_fields}")
                else:
                    self.log_test("Automatic Fields Generation", False, 
                                f"Missing automatic fields: {missing_auto_fields}")
                
                # Validate initial values
                if (class_data.get("enrolled") == 0 and 
                    class_data.get("status") == "scheduled" and 
                    isinstance(class_data.get("enrolledStudents"), list) and 
                    len(class_data.get("enrolledStudents", [])) == 0):
                    self.log_test("Initial Values Validation", True, 
                                f"Correct initial values: enrolled=0, status=scheduled, enrolledStudents=[]")
                else:
                    self.log_test("Initial Values Validation", False, 
                                f"Incorrect initial values: enrolled={class_data.get('enrolled')}, status={class_data.get('status')}")
                    
            else:
                self.log_test("Comprehensive Class Creation", False, 
                            f"Expected 200, got {response.status_code}: {response.text[:200]}")
        except Exception as e:
            self.log_test("Comprehensive Class Creation", False, f"Request failed: {str(e)}")

        # Test data type validation
        try:
            invalid_data_class = {
                "title": "Data Type Test",
                "description": "Testing data type validation",
                "type": "Yoga",
                "level": "Beginner",
                "duration": "invalid_duration",  # Should be integer
                "price": "invalid_price",        # Should be float
                "capacity": "invalid_capacity",  # Should be integer
                "location": "Test Studio",
                "date": "2025-03-15",
                "time": "10:00"
            }
            
            response = requests.post(f"{SERVER_API_BASE}/instructor/classes", 
                                   json=invalid_data_class, headers=headers, timeout=10)
            
            # The API should handle type conversion or return appropriate defaults
            if response.status_code == 200:
                response_data = response.json()
                class_data = response_data.get("class", {})
                
                # Check if defaults were applied for invalid types
                if (isinstance(class_data.get("duration"), int) and 
                    isinstance(class_data.get("price"), (int, float)) and 
                    isinstance(class_data.get("capacity"), int)):
                    self.log_test("Data Type Handling", True, 
                                f"Invalid types converted to defaults: duration={class_data.get('duration')}, price={class_data.get('price')}, capacity={class_data.get('capacity')}")
                else:
                    self.log_test("Data Type Handling", False, 
                                f"Data types not properly handled")
            else:
                # If API returns error for invalid types, that's also acceptable
                self.log_test("Data Type Validation", True, 
                            f"API properly rejects invalid data types with status {response.status_code}")
        except Exception as e:
            self.log_test("Data Type Handling", False, f"Request failed: {str(e)}")

    def test_error_handling_and_edge_cases(self):
        """Test error handling and edge cases"""
        print("⚠️ TESTING ERROR HANDLING & EDGE CASES")
        print("=" * 60)
        
        headers = {"Authorization": INSTRUCTOR_AUTH_TOKEN}
        
        # Test malformed JSON
        try:
            response = requests.post(f"{SERVER_API_BASE}/instructor/classes", 
                                   data="invalid json", 
                                   headers={**headers, "Content-Type": "application/json"}, 
                                   timeout=10)
            
            if response.status_code in [400, 500]:
                self.log_test("Malformed JSON Handling", True, 
                            f"Malformed JSON properly rejected with status {response.status_code}")
            else:
                self.log_test("Malformed JSON Handling", False, 
                            f"Expected 400/500, got {response.status_code}: {response.text[:100]}")
        except Exception as e:
            self.log_test("Malformed JSON Handling", False, f"Request failed: {str(e)}")

        # Test empty request body
        try:
            response = requests.post(f"{SERVER_API_BASE}/instructor/classes", 
                                   json={}, headers=headers, timeout=10)
            
            if response.status_code == 400:
                self.log_test("Empty Request Body Handling", True, 
                            f"Empty body properly rejected with status {response.status_code}")
            else:
                self.log_test("Empty Request Body Handling", False, 
                            f"Expected 400, got {response.status_code}: {response.text[:100]}")
        except Exception as e:
            self.log_test("Empty Request Body Handling", False, f"Request failed: {str(e)}")

        # Test very long field values
        try:
            long_value_class = {
                "title": "A" * 1000,  # Very long title
                "description": "B" * 5000,  # Very long description
                "type": "Yoga",
                "location": "Test Studio",
                "date": "2025-03-20",
                "time": "10:00"
            }
            
            response = requests.post(f"{SERVER_API_BASE}/instructor/classes", 
                                   json=long_value_class, headers=headers, timeout=10)
            
            # API should either accept it or reject with appropriate error
            if response.status_code in [200, 400]:
                self.log_test("Long Field Values Handling", True, 
                            f"Long values handled appropriately with status {response.status_code}")
            else:
                self.log_test("Long Field Values Handling", False, 
                            f"Unexpected status {response.status_code}: {response.text[:100]}")
        except Exception as e:
            self.log_test("Long Field Values Handling", False, f"Request failed: {str(e)}")

        # Test CORS headers
        try:
            response = requests.options(f"{SERVER_API_BASE}/instructor/classes", timeout=10)
            
            cors_headers = [
                'Access-Control-Allow-Origin',
                'Access-Control-Allow-Methods',
                'Access-Control-Allow-Headers'
            ]
            
            present_headers = [header for header in cors_headers if header in response.headers]
            
            if len(present_headers) >= 2:  # At least 2 CORS headers should be present
                self.log_test("CORS Headers Configuration", True, 
                            f"CORS headers present: {present_headers}")
            else:
                self.log_test("CORS Headers Configuration", False, 
                            f"Missing CORS headers. Present: {present_headers}")
        except Exception as e:
            self.log_test("CORS Headers Configuration", False, f"Request failed: {str(e)}")

    def test_integration_scenarios(self):
        """Test integration scenarios and workflows"""
        print("🔄 TESTING INTEGRATION SCENARIOS")
        print("=" * 60)
        
        headers = {"Authorization": INSTRUCTOR_AUTH_TOKEN}
        
        # Test create class then retrieve it
        try:
            # Create a class
            test_class = {
                "title": "Integration Test Class",
                "description": "A class created for integration testing",
                "type": "Pilates",
                "level": "Beginner",
                "duration": 60,
                "price": 25,
                "capacity": 15,
                "location": "Integration Test Studio",
                "date": "2025-04-01",
                "time": "14:00"
            }
            
            create_response = requests.post(f"{SERVER_API_BASE}/instructor/classes", 
                                          json=test_class, headers=headers, timeout=10)
            
            if create_response.status_code == 200:
                created_class_data = create_response.json()
                class_id = created_class_data.get("classId")
                
                # Wait a moment for database consistency
                time.sleep(1)
                
                # Retrieve classes
                get_response = requests.get(f"{SERVER_API_BASE}/instructor/classes", 
                                          headers=headers, timeout=10)
                
                if get_response.status_code == 200:
                    retrieved_data = get_response.json()
                    classes = retrieved_data.get("classes", [])
                    
                    # Check if created class is in the list
                    created_class_found = any(cls.get("id") == class_id for cls in classes)
                    
                    if created_class_found:
                        self.log_test("Create-Then-Retrieve Integration", True, 
                                    f"Created class found in retrieval list with ID: {class_id}")
                    else:
                        self.log_test("Create-Then-Retrieve Integration", False, 
                                    f"Created class not found in retrieval list. Class ID: {class_id}")
                else:
                    self.log_test("Create-Then-Retrieve Integration", False, 
                                f"Failed to retrieve classes after creation: {get_response.status_code}")
            else:
                self.log_test("Create-Then-Retrieve Integration", False, 
                            f"Failed to create class for integration test: {create_response.status_code}")
        except Exception as e:
            self.log_test("Create-Then-Retrieve Integration", False, f"Integration test failed: {str(e)}")

        # Test multiple class creation and ordering
        try:
            classes_to_create = [
                {
                    "title": "First Class",
                    "description": "First test class",
                    "type": "Yoga",
                    "location": "Studio A",
                    "date": "2025-04-05",
                    "time": "09:00"
                },
                {
                    "title": "Second Class", 
                    "description": "Second test class",
                    "type": "HIIT",
                    "location": "Studio B",
                    "date": "2025-04-06",
                    "time": "10:00"
                }
            ]
            
            created_class_ids = []
            
            for i, class_data in enumerate(classes_to_create):
                response = requests.post(f"{SERVER_API_BASE}/instructor/classes", 
                                       json=class_data, headers=headers, timeout=10)
                if response.status_code == 200:
                    class_id = response.json().get("classId")
                    created_class_ids.append(class_id)
                    time.sleep(0.5)  # Small delay to ensure different creation times
                else:
                    self.log_test(f"Multiple Classes Creation - Class {i+1}", False, 
                                f"Failed to create class {i+1}: {response.status_code}")
                    break
            
            if len(created_class_ids) == 2:
                # Retrieve and check ordering
                get_response = requests.get(f"{SERVER_API_BASE}/instructor/classes", 
                                          headers=headers, timeout=10)
                
                if get_response.status_code == 200:
                    classes = get_response.json().get("classes", [])
                    
                    # Find our created classes
                    our_classes = [cls for cls in classes if cls.get("id") in created_class_ids]
                    
                    if len(our_classes) == 2:
                        # Check if they're ordered by creation date (newest first)
                        if our_classes[0].get("title") == "Second Class":
                            self.log_test("Multiple Classes Creation & Ordering", True, 
                                        f"Classes created and ordered correctly (newest first)")
                        else:
                            self.log_test("Multiple Classes Creation & Ordering", False, 
                                        f"Classes not ordered correctly. First class title: {our_classes[0].get('title')}")
                    else:
                        self.log_test("Multiple Classes Creation & Ordering", False, 
                                    f"Expected 2 created classes, found {len(our_classes)}")
                else:
                    self.log_test("Multiple Classes Creation & Ordering", False, 
                                f"Failed to retrieve classes: {get_response.status_code}")
        except Exception as e:
            self.log_test("Multiple Classes Creation & Ordering", False, f"Multiple classes test failed: {str(e)}")

    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 STARTING CLASS MANAGEMENT SYSTEM TESTING")
        print("=" * 80)
        print(f"Testing endpoints at: {SERVER_API_BASE}")
        print(f"Base URL: {BASE_URL}")
        print("=" * 80)
        print()
        
        # Run all test suites
        self.test_authentication_requirements()
        self.test_class_creation()
        self.test_class_retrieval()
        self.test_data_validation_and_integration()
        self.test_error_handling_and_edge_cases()
        self.test_integration_scenarios()
        
        # Print summary
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.total_tests}")
        print(f"Passed: {self.passed_tests} ✅")
        print(f"Failed: {self.failed_tests} ❌")
        
        if self.total_tests > 0:
            success_rate = (self.passed_tests / self.total_tests) * 100
            print(f"Success Rate: {success_rate:.1f}%")
            
            if success_rate >= 90:
                print("🎉 EXCELLENT: Class Management System is working excellently!")
            elif success_rate >= 75:
                print("✅ GOOD: Class Management System is working well with minor issues.")
            elif success_rate >= 50:
                print("⚠️ MODERATE: Class Management System has some issues that need attention.")
            else:
                print("❌ CRITICAL: Class Management System has significant issues requiring immediate attention.")
        
        print("=" * 80)
        
        return self.passed_tests, self.failed_tests, self.total_tests

if __name__ == "__main__":
    tester = ClassManagementTester()
    passed, failed, total = tester.run_all_tests()
    
    # Exit with appropriate code
    if failed == 0:
        sys.exit(0)  # All tests passed
    else:
        sys.exit(1)  # Some tests failed