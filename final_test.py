#!/usr/bin/env python3
"""
Final Comprehensive Test for Studio-centric Class Management System
"""

import requests
import json
import time

BASE_URL = "https://07dbb15a-6291-46a7-941f-21934bb5cdb1.preview.emergentagent.com"
SERVER_API_URL = f"{BASE_URL}/server-api"

AUTH_HEADERS = {
    "Authorization": "Bearer test-token",
    "Content-Type": "application/json"
}

def set_user_role(role):
    """Helper to set the test user role"""
    user_data = {
        'uid': 'firebase-test-user',
        'email': 'test@example.com',
        'role': role
    }
    response = requests.post(f"{SERVER_API_URL}/auth/firebase-role", json=user_data, timeout=10)
    return response.status_code == 200

def test_complete_workflow():
    """Test the complete studio-centric workflow"""
    print("🎯 TESTING COMPLETE STUDIO-CENTRIC WORKFLOW")
    print("=" * 60)
    
    # Step 1: Set user as studio/merchant
    print("1. Setting up studio user...")
    if set_user_role('merchant'):
        print("   ✅ Studio user setup successful")
    else:
        print("   ❌ Studio user setup failed")
        return
    
    # Step 2: Studio creates class with instructor assignment
    print("2. Studio creates class with instructor assignment...")
    class_data = {
        "title": "Studio Yoga Class",
        "description": "A yoga class created by studio and assigned to instructor",
        "type": "Yoga",
        "level": "Intermediate",
        "duration": 75,
        "price": 40,
        "capacity": 20,
        "location": "Main Studio",
        "date": "2025-03-01",
        "time": "09:00",
        "assignedInstructorId": "firebase-test-user",
        "assignedInstructorName": "Test Instructor"
    }
    
    response = requests.post(f"{SERVER_API_URL}/studio/classes", headers=AUTH_HEADERS, json=class_data, timeout=10)
    if response.status_code == 200:
        data = response.json()
        class_id = data.get('classId')
        print(f"   ✅ Class created successfully: {class_id}")
        
        # Validate data structure
        class_obj = data.get('class', {})
        studio_fields = all([class_obj.get('studioId'), class_obj.get('studioName')])
        instructor_fields = all([class_obj.get('assignedInstructorId'), class_obj.get('instructorAssigned')])
        
        if studio_fields and instructor_fields:
            print("   ✅ Data structure validation passed")
        else:
            print("   ❌ Data structure validation failed")
    else:
        print(f"   ❌ Class creation failed: {response.status_code}")
        return
    
    # Step 3: Studio views their classes
    print("3. Studio views their created classes...")
    response = requests.get(f"{SERVER_API_URL}/studio/classes", headers=AUTH_HEADERS, timeout=10)
    if response.status_code == 200:
        data = response.json()
        classes_count = len(data.get('classes', []))
        print(f"   ✅ Studio can view their classes: {classes_count} classes found")
    else:
        print(f"   ❌ Studio cannot view classes: {response.status_code}")
    
    # Step 4: Studio views available instructors
    print("4. Studio views available instructors...")
    response = requests.get(f"{SERVER_API_URL}/studio/instructors", headers=AUTH_HEADERS, timeout=10)
    if response.status_code == 200:
        data = response.json()
        instructors_count = len(data.get('instructors', []))
        print(f"   ✅ Studio can view instructors: {instructors_count} instructors available")
    else:
        print(f"   ❌ Studio cannot view instructors: {response.status_code}")
    
    # Step 5: Switch to instructor role
    print("5. Switching to instructor role...")
    if set_user_role('instructor'):
        print("   ✅ Instructor role setup successful")
    else:
        print("   ❌ Instructor role setup failed")
        return
    
    # Step 6: Instructor views assigned classes
    print("6. Instructor views assigned classes...")
    response = requests.get(f"{SERVER_API_URL}/instructor/classes", headers=AUTH_HEADERS, timeout=10)
    if response.status_code == 200:
        data = response.json()
        assigned_classes = data.get('classes', [])
        assigned_count = len(assigned_classes)
        print(f"   ✅ Instructor can view assigned classes: {assigned_count} classes assigned")
        
        # Validate that instructor sees the class assigned by studio
        if assigned_count > 0:
            found_assigned_class = any(c.get('assignedInstructorId') == 'firebase-test-user' for c in assigned_classes)
            if found_assigned_class:
                print("   ✅ Instructor correctly sees studio-assigned class")
            else:
                print("   ❌ Instructor doesn't see studio-assigned class")
    else:
        print(f"   ❌ Instructor cannot view assigned classes: {response.status_code}")
    
    # Step 7: Test that instructor cannot create classes
    print("7. Testing that instructor cannot create classes...")
    invalid_class_data = {
        "title": "Unauthorized Class",
        "description": "This should fail",
        "type": "Yoga",
        "location": "Studio A",
        "date": "2025-02-15",
        "time": "18:00"
    }
    
    response = requests.post(f"{SERVER_API_URL}/studio/classes", headers=AUTH_HEADERS, json=invalid_class_data, timeout=10)
    if response.status_code == 403:
        print("   ✅ Instructor correctly blocked from creating classes")
    else:
        print(f"   ❌ Instructor should not be able to create classes: {response.status_code}")
    
    print("\n🎉 WORKFLOW TESTING COMPLETED!")
    print("=" * 60)

def test_authentication_and_validation():
    """Test authentication and validation scenarios"""
    print("\n🔒 TESTING AUTHENTICATION & VALIDATION")
    print("=" * 60)
    
    # Test unauthenticated requests
    endpoints = [
        ("POST", "/studio/classes"),
        ("GET", "/studio/classes"),
        ("GET", "/studio/instructors"),
        ("GET", "/instructor/classes")
    ]
    
    auth_tests_passed = 0
    for method, endpoint in endpoints:
        if method == "POST":
            response = requests.post(f"{SERVER_API_URL}{endpoint}", json={"test": "data"}, timeout=10)
        else:
            response = requests.get(f"{SERVER_API_URL}{endpoint}", timeout=10)
        
        if response.status_code == 401:
            auth_tests_passed += 1
    
    print(f"Authentication protection: {auth_tests_passed}/{len(endpoints)} endpoints properly protected")
    
    # Test validation
    set_user_role('merchant')
    invalid_data = {"title": "Incomplete Class"}  # Missing required fields
    response = requests.post(f"{SERVER_API_URL}/studio/classes", headers=AUTH_HEADERS, json=invalid_data, timeout=10)
    
    if response.status_code == 400:
        print("✅ Validation working correctly - missing fields rejected")
    else:
        print(f"❌ Validation issue - expected 400, got {response.status_code}")

if __name__ == "__main__":
    test_complete_workflow()
    test_authentication_and_validation()