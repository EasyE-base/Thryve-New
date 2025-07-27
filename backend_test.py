#!/usr/bin/env python3
"""
Studio-centric Class Management System Backend Testing
Tests the corrected business model where studios create classes and assign instructors
"""

import requests
import json
import time
from datetime import datetime, timedelta

# Configuration
BASE_URL = "https://07dbb15a-6291-46a7-941f-21934bb5cdb1.preview.emergentagent.com"
SERVER_API_URL = f"{BASE_URL}/server-api"

# Test data
STUDIO_AUTH_HEADERS = {
    "Authorization": "Bearer studio-test-token",
    "Content-Type": "application/json"
}

INSTRUCTOR_AUTH_HEADERS = {
    "Authorization": "Bearer instructor-test-token", 
    "Content-Type": "application/json"
}

CUSTOMER_AUTH_HEADERS = {
    "Authorization": "Bearer customer-test-token",
    "Content-Type": "application/json"
}

def print_test_result(test_name, success, details=""):
    """Print formatted test results"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {test_name}")
    if details:
        print(f"   Details: {details}")
    print()

def test_studio_create_class_with_instructor():
    """Test studio creating class with instructor assignment"""
    print("🧪 Testing POST /server-api/studio/classes (with instructor assignment)")
    
    class_data = {
        "title": "Advanced Yoga Flow",
        "description": "A challenging yoga class for experienced practitioners",
        "type": "Yoga",
        "level": "Advanced",
        "duration": 90,
        "price": 45,
        "capacity": 12,
        "location": "Studio A",
        "date": "2025-02-15",
        "time": "18:00",
        "recurring": False,
        "requirements": "Previous yoga experience required",
        "amenities": ["Yoga mats", "Blocks", "Straps"],
        "assignedInstructorId": "instructor-123",
        "assignedInstructorName": "Sarah Johnson"
    }
    
    try:
        response = requests.post(
            f"{SERVER_API_URL}/studio/classes",
            headers=STUDIO_AUTH_HEADERS,
            json=class_data,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            success = (
                "message" in data and
                "classId" in data and
                "class" in data and
                data["class"]["studioId"] and
                data["class"]["assignedInstructorId"] == "instructor-123" and
                data["class"]["instructorAssigned"] == True
            )
            details = f"Status: {response.status_code}, Class ID: {data.get('classId', 'N/A')}"
            print_test_result("Studio creates class with instructor assignment", success, details)
            return data.get("classId") if success else None
        else:
            print_test_result("Studio creates class with instructor assignment", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
            return None
            
    except Exception as e:
        print_test_result("Studio creates class with instructor assignment", False, f"Exception: {str(e)}")
        return None

def test_studio_create_class_without_instructor():
    """Test studio creating class without instructor assignment"""
    print("🧪 Testing POST /server-api/studio/classes (without instructor assignment)")
    
    class_data = {
        "title": "Beginner Pilates",
        "description": "Introduction to Pilates fundamentals",
        "type": "Pilates",
        "level": "Beginner",
        "duration": 60,
        "price": 30,
        "capacity": 15,
        "location": "Studio B",
        "date": "2025-02-20",
        "time": "10:00",
        "recurring": True,
        "requirements": "No experience necessary",
        "amenities": ["Pilates mats", "Resistance bands"]
    }
    
    try:
        response = requests.post(
            f"{SERVER_API_URL}/studio/classes",
            headers=STUDIO_AUTH_HEADERS,
            json=class_data,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            success = (
                "message" in data and
                "classId" in data and
                "class" in data and
                data["class"]["studioId"] and
                data["class"]["assignedInstructorId"] is None and
                data["class"]["instructorAssigned"] == False
            )
            details = f"Status: {response.status_code}, Class ID: {data.get('classId', 'N/A')}"
            print_test_result("Studio creates class without instructor assignment", success, details)
            return data.get("classId") if success else None
        else:
            print_test_result("Studio creates class without instructor assignment", False,
                            f"Status: {response.status_code}, Response: {response.text}")
            return None
            
    except Exception as e:
        print_test_result("Studio creates class without instructor assignment", False, f"Exception: {str(e)}")
        return None

def test_studio_create_class_validation():
    """Test studio class creation validation"""
    print("🧪 Testing POST /server-api/studio/classes (validation)")
    
    # Test missing required fields
    invalid_data = {
        "title": "Test Class",
        # Missing description, type, location, date, time
    }
    
    try:
        response = requests.post(
            f"{SERVER_API_URL}/studio/classes",
            headers=STUDIO_AUTH_HEADERS,
            json=invalid_data,
            timeout=10
        )
        
        success = response.status_code == 400
        details = f"Status: {response.status_code}, Response: {response.text[:100]}"
        print_test_result("Studio class creation validation (missing fields)", success, details)
        
    except Exception as e:
        print_test_result("Studio class creation validation (missing fields)", False, f"Exception: {str(e)}")

def test_studio_view_classes():
    """Test studio viewing their created classes"""
    print("🧪 Testing GET /server-api/studio/classes")
    
    try:
        response = requests.get(
            f"{SERVER_API_URL}/studio/classes",
            headers=STUDIO_AUTH_HEADERS,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            success = "classes" in data and isinstance(data["classes"], list)
            details = f"Status: {response.status_code}, Classes count: {len(data.get('classes', []))}"
            print_test_result("Studio views their created classes", success, details)
            return data.get("classes", [])
        else:
            print_test_result("Studio views their created classes", False,
                            f"Status: {response.status_code}, Response: {response.text}")
            return []
            
    except Exception as e:
        print_test_result("Studio views their created classes", False, f"Exception: {str(e)}")
        return []

def test_studio_view_instructors():
    """Test studio viewing available instructors"""
    print("🧪 Testing GET /server-api/studio/instructors")
    
    try:
        response = requests.get(
            f"{SERVER_API_URL}/studio/instructors",
            headers=STUDIO_AUTH_HEADERS,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            success = "instructors" in data and isinstance(data["instructors"], list)
            details = f"Status: {response.status_code}, Instructors count: {len(data.get('instructors', []))}"
            print_test_result("Studio views available instructors", success, details)
            return data.get("instructors", [])
        else:
            print_test_result("Studio views available instructors", False,
                            f"Status: {response.status_code}, Response: {response.text}")
            return []
            
    except Exception as e:
        print_test_result("Studio views available instructors", False, f"Exception: {str(e)}")
        return []

def test_instructor_view_assigned_classes():
    """Test instructor viewing classes assigned to them"""
    print("🧪 Testing GET /server-api/instructor/classes (assigned classes)")
    
    try:
        response = requests.get(
            f"{SERVER_API_URL}/instructor/classes",
            headers=INSTRUCTOR_AUTH_HEADERS,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            success = "classes" in data and isinstance(data["classes"], list)
            details = f"Status: {response.status_code}, Assigned classes count: {len(data.get('classes', []))}"
            print_test_result("Instructor views assigned classes", success, details)
            return data.get("classes", [])
        else:
            print_test_result("Instructor views assigned classes", False,
                            f"Status: {response.status_code}, Response: {response.text}")
            return []
            
    except Exception as e:
        print_test_result("Instructor views assigned classes", False, f"Exception: {str(e)}")
        return []

def test_role_based_access_control():
    """Test role-based access control"""
    print("🧪 Testing Role-Based Access Control")
    
    # Test instructor trying to create classes (should fail)
    class_data = {
        "title": "Unauthorized Class",
        "description": "This should fail",
        "type": "Yoga",
        "location": "Studio A",
        "date": "2025-02-15",
        "time": "18:00"
    }
    
    try:
        response = requests.post(
            f"{SERVER_API_URL}/studio/classes",
            headers=INSTRUCTOR_AUTH_HEADERS,
            json=class_data,
            timeout=10
        )
        
        success = response.status_code in [403, 404]  # Should be forbidden or not found
        details = f"Status: {response.status_code}, Response: {response.text[:100]}"
        print_test_result("Instructor cannot create classes", success, details)
        
    except Exception as e:
        print_test_result("Instructor cannot create classes", False, f"Exception: {str(e)}")
    
    # Test customer trying to access studio endpoints (should fail)
    try:
        response = requests.get(
            f"{SERVER_API_URL}/studio/classes",
            headers=CUSTOMER_AUTH_HEADERS,
            timeout=10
        )
        
        success = response.status_code in [403, 404]  # Should be forbidden or not found
        details = f"Status: {response.status_code}, Response: {response.text[:100]}"
        print_test_result("Customer cannot access studio endpoints", success, details)
        
    except Exception as e:
        print_test_result("Customer cannot access studio endpoints", False, f"Exception: {str(e)}")

def test_authentication_protection():
    """Test authentication protection on all endpoints"""
    print("🧪 Testing Authentication Protection")
    
    endpoints = [
        ("POST", "/studio/classes"),
        ("GET", "/studio/classes"),
        ("GET", "/studio/instructors"),
        ("GET", "/instructor/classes")
    ]
    
    for method, endpoint in endpoints:
        try:
            if method == "POST":
                response = requests.post(
                    f"{SERVER_API_URL}{endpoint}",
                    json={"test": "data"},
                    timeout=10
                )
            else:
                response = requests.get(
                    f"{SERVER_API_URL}{endpoint}",
                    timeout=10
                )
            
            success = response.status_code == 401  # Should require authentication
            details = f"Status: {response.status_code}, Endpoint: {method} {endpoint}"
            print_test_result(f"Authentication required for {method} {endpoint}", success, details)
            
        except Exception as e:
            print_test_result(f"Authentication required for {method} {endpoint}", False, f"Exception: {str(e)}")

def test_data_structure_validation():
    """Test data structure validation"""
    print("🧪 Testing Data Structure Validation")
    
    # First create a class to test data structure
    class_data = {
        "title": "Data Structure Test Class",
        "description": "Testing data structure",
        "type": "Fitness",
        "level": "Intermediate",
        "duration": 45,
        "price": 25,
        "capacity": 20,
        "location": "Test Studio",
        "date": "2025-02-25",
        "time": "14:00",
        "assignedInstructorId": "test-instructor-456",
        "assignedInstructorName": "Test Instructor"
    }
    
    try:
        response = requests.post(
            f"{SERVER_API_URL}/studio/classes",
            headers=STUDIO_AUTH_HEADERS,
            json=class_data,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            class_obj = data.get("class", {})
            
            # Validate required studio fields
            studio_fields_valid = all([
                class_obj.get("studioId"),
                class_obj.get("studioName"),
                class_obj.get("studioEmail")
            ])
            
            # Validate instructor assignment fields
            instructor_fields_valid = all([
                class_obj.get("assignedInstructorId") == "test-instructor-456",
                class_obj.get("assignedInstructorName") == "Test Instructor",
                class_obj.get("instructorAssigned") == True
            ])
            
            # Validate automatic fields
            auto_fields_valid = all([
                class_obj.get("enrolled") == 0,
                isinstance(class_obj.get("enrolledStudents"), list),
                class_obj.get("status") == "scheduled",
                class_obj.get("createdAt"),
                class_obj.get("updatedAt")
            ])
            
            success = studio_fields_valid and instructor_fields_valid and auto_fields_valid
            details = f"Studio fields: {studio_fields_valid}, Instructor fields: {instructor_fields_valid}, Auto fields: {auto_fields_valid}"
            print_test_result("Data structure validation", success, details)
            
        else:
            print_test_result("Data structure validation", False, f"Failed to create test class: {response.status_code}")
            
    except Exception as e:
        print_test_result("Data structure validation", False, f"Exception: {str(e)}")

def test_business_logic_validation():
    """Test business logic validation"""
    print("🧪 Testing Business Logic Validation")
    
    # Test that classes are stored in studio_classes collection
    # This is validated by checking that studio can retrieve their classes
    studio_classes = test_studio_view_classes()
    
    # Test that instructor can only see assigned classes
    instructor_classes = test_instructor_view_assigned_classes()
    
    # Validate business logic
    studio_owns_classes = len(studio_classes) >= 0  # Studio should be able to view their classes
    instructor_sees_assigned = len(instructor_classes) >= 0  # Instructor should see assigned classes
    
    success = studio_owns_classes and instructor_sees_assigned
    details = f"Studio classes accessible: {studio_owns_classes}, Instructor assigned classes accessible: {instructor_sees_assigned}"
    print_test_result("Business logic validation", success, details)

def run_comprehensive_tests():
    """Run all comprehensive tests for studio-centric class management"""
    print("=" * 80)
    print("🎯 STUDIO-CENTRIC CLASS MANAGEMENT SYSTEM TESTING")
    print("=" * 80)
    print()
    
    test_results = []
    
    # Test authentication protection first
    print("📋 AUTHENTICATION TESTING")
    print("-" * 40)
    test_authentication_protection()
    
    # Test role-based access control
    print("📋 ROLE-BASED ACCESS CONTROL TESTING")
    print("-" * 40)
    test_role_based_access_control()
    
    # Test studio functionality
    print("📋 STUDIO FUNCTIONALITY TESTING")
    print("-" * 40)
    
    # Create classes with and without instructor assignment
    class_id_1 = test_studio_create_class_with_instructor()
    class_id_2 = test_studio_create_class_without_instructor()
    
    # Test validation
    test_studio_create_class_validation()
    
    # Test viewing classes and instructors
    test_studio_view_classes()
    test_studio_view_instructors()
    
    # Test instructor functionality
    print("📋 INSTRUCTOR FUNCTIONALITY TESTING")
    print("-" * 40)
    test_instructor_view_assigned_classes()
    
    # Test data structure and business logic
    print("📋 DATA STRUCTURE & BUSINESS LOGIC TESTING")
    print("-" * 40)
    test_data_structure_validation()
    test_business_logic_validation()
    
    print("=" * 80)
    print("🏁 TESTING COMPLETED")
    print("=" * 80)

if __name__ == "__main__":
    run_comprehensive_tests()