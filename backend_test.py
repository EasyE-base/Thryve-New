#!/usr/bin/env python3
"""
Backend API Testing for Class Detail Pages Enhancement
Testing the newly implemented comprehensive class data and booking flow features.
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://a0166285-5fbd-430a-a296-ff63ae399ac4.preview.emergentagent.com/api"
TIMEOUT = 30

def print_test_header(test_name):
    print(f"\n{'='*60}")
    print(f"TESTING: {test_name}")
    print(f"{'='*60}")

def print_result(success, message, details=None):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {message}")
    if details:
        print(f"Details: {details}")

def test_get_classes_enhanced():
    """Test GET /api/classes with enhanced comprehensive data"""
    print_test_header("GET /api/classes - Enhanced Class Data")
    
    try:
        response = requests.get(f"{BASE_URL}/classes", timeout=TIMEOUT)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Check basic structure
            if 'classes' not in data or 'total' not in data:
                print_result(False, "Missing 'classes' or 'total' in response")
                return False
            
            classes = data['classes']
            total = data['total']
            
            print(f"Total classes: {total}")
            print(f"Classes returned: {len(classes)}")
            
            if len(classes) == 0:
                print_result(False, "No classes returned")
                return False
            
            # Test enhanced data structure on first class
            first_class = classes[0]
            required_fields = ['id', 'title', 'description', 'type', 'price', 'instructor', 'schedule']
            enhanced_fields = ['heroImage', 'gallery', 'sessions', 'amenities', 'requirements', 'highlights', 'tags']
            
            # Check required fields
            missing_required = [field for field in required_fields if field not in first_class]
            if missing_required:
                print_result(False, f"Missing required fields: {missing_required}")
                return False
            
            # Check enhanced fields
            missing_enhanced = [field for field in enhanced_fields if field not in first_class]
            if missing_enhanced:
                print_result(False, f"Missing enhanced fields: {missing_enhanced}")
                return False
            
            # Validate instructor data structure
            instructor = first_class.get('instructor', {})
            instructor_fields = ['id', 'name', 'bio', 'specialties', 'rating', 'experience']
            missing_instructor = [field for field in instructor_fields if field not in instructor]
            if missing_instructor:
                print_result(False, f"Missing instructor fields: {missing_instructor}")
                return False
            
            # Validate sessions data
            sessions = first_class.get('sessions', [])
            if not sessions:
                print_result(False, "No sessions found in class data")
                return False
            
            session = sessions[0]
            session_fields = ['id', 'date', 'startTime', 'endTime', 'spotsTotal', 'spotsBooked']
            missing_session = [field for field in session_fields if field not in session]
            if missing_session:
                print_result(False, f"Missing session fields: {missing_session}")
                return False
            
            # Check amenities and requirements are arrays
            if not isinstance(first_class.get('amenities', []), list):
                print_result(False, "Amenities should be an array")
                return False
            
            if not isinstance(first_class.get('requirements', []), list):
                print_result(False, "Requirements should be an array")
                return False
            
            print_result(True, "Enhanced class data structure validated successfully")
            print(f"Sample class: {first_class['title']} by {instructor['name']}")
            print(f"Amenities count: {len(first_class.get('amenities', []))}")
            print(f"Sessions count: {len(sessions)}")
            return True
            
        else:
            print_result(False, f"HTTP {response.status_code}: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print_result(False, f"Request failed: {str(e)}")
        return False
    except Exception as e:
        print_result(False, f"Unexpected error: {str(e)}")
        return False

def test_get_class_by_id():
    """Test GET /api/classes/{id} for individual class details"""
    print_test_header("GET /api/classes/{id} - Individual Class Details")
    
    # Test with known class IDs from sample data
    test_class_ids = [
        'morning-vinyasa-flow',
        'hiit-cardio-blast', 
        'strength-training-basics'
    ]
    
    success_count = 0
    
    for class_id in test_class_ids:
        print(f"\n--- Testing class ID: {class_id} ---")
        
        try:
            response = requests.get(f"{BASE_URL}/classes/{class_id}", timeout=TIMEOUT)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                
                if 'class' not in data:
                    print_result(False, f"Missing 'class' in response for {class_id}")
                    continue
                
                class_data = data['class']
                
                # Check basic fields
                if class_data.get('id') != class_id:
                    print_result(False, f"Class ID mismatch: expected {class_id}, got {class_data.get('id')}")
                    continue
                
                # Check enhanced fields that should be auto-populated
                enhanced_fields = ['reviews', 'benefits', 'faqs']
                missing_enhanced = [field for field in enhanced_fields if field not in class_data]
                if missing_enhanced:
                    print_result(False, f"Missing auto-populated fields: {missing_enhanced}")
                    continue
                
                # Validate reviews structure
                reviews = class_data.get('reviews', [])
                if reviews and len(reviews) > 0:
                    review = reviews[0]
                    review_fields = ['id', 'userId', 'userName', 'rating', 'date', 'comment', 'verified']
                    missing_review = [field for field in review_fields if field not in review]
                    if missing_review:
                        print_result(False, f"Missing review fields: {missing_review}")
                        continue
                
                # Validate benefits and FAQs
                benefits = class_data.get('benefits', [])
                if not isinstance(benefits, list) or len(benefits) == 0:
                    print_result(False, f"Benefits should be a non-empty array")
                    continue
                
                faqs = class_data.get('faqs', [])
                if faqs and len(faqs) > 0:
                    faq = faqs[0]
                    if 'question' not in faq or 'answer' not in faq:
                        print_result(False, f"FAQ missing question or answer fields")
                        continue
                
                print_result(True, f"Class {class_id} details validated successfully")
                print(f"Title: {class_data.get('title', 'N/A')}")
                print(f"Reviews count: {len(reviews)}")
                print(f"Benefits count: {len(benefits)}")
                print(f"FAQs count: {len(faqs)}")
                success_count += 1
                
            elif response.status_code == 404:
                print_result(False, f"Class {class_id} not found (404)")
            else:
                print_result(False, f"HTTP {response.status_code}: {response.text}")
                
        except requests.exceptions.RequestException as e:
            print_result(False, f"Request failed for {class_id}: {str(e)}")
        except Exception as e:
            print_result(False, f"Unexpected error for {class_id}: {str(e)}")
    
    # Test non-existent class ID
    print(f"\n--- Testing non-existent class ID ---")
    try:
        response = requests.get(f"{BASE_URL}/classes/non-existent-id", timeout=TIMEOUT)
        if response.status_code == 404:
            print_result(True, "Non-existent class correctly returns 404")
            success_count += 1
        else:
            print_result(False, f"Expected 404 for non-existent class, got {response.status_code}")
    except Exception as e:
        print_result(False, f"Error testing non-existent class: {str(e)}")
    
    total_tests = len(test_class_ids) + 1  # +1 for non-existent test
    print(f"\nClass ID Tests Summary: {success_count}/{total_tests} passed")
    return success_count == total_tests

def test_firebase_user_lookup():
    """Test GET /api/auth/firebase-user endpoint"""
    print_test_header("GET /api/auth/firebase-user - Firebase User Lookup")
    
    # Test missing UID parameter
    print("--- Testing missing UID parameter ---")
    try:
        response = requests.get(f"{BASE_URL}/auth/firebase-user", timeout=TIMEOUT)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 400:
            print_result(True, "Missing UID correctly returns 400")
        else:
            print_result(False, f"Expected 400 for missing UID, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Error testing missing UID: {str(e)}")
        return False
    
    # Test with test UID
    print("\n--- Testing with test UID ---")
    test_uid = "test-uid"
    try:
        response = requests.get(f"{BASE_URL}/auth/firebase-user?uid={test_uid}", timeout=TIMEOUT)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 404:
            print_result(True, "Non-existent user correctly returns 404")
        elif response.status_code == 200:
            data = response.json()
            required_fields = ['uid', 'email', 'role', 'onboarding_complete', 'profile']
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                print_result(False, f"Missing response fields: {missing_fields}")
                return False
            print_result(True, "User lookup response structure validated")
        else:
            print_result(False, f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Error testing user lookup: {str(e)}")
        return False
    
    return True

def test_api_error_handling():
    """Test API error handling and CORS"""
    print_test_header("API Error Handling & CORS")
    
    # Test invalid endpoint
    print("--- Testing invalid endpoint ---")
    try:
        response = requests.get(f"{BASE_URL}/invalid-endpoint", timeout=TIMEOUT)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 404:
            print_result(True, "Invalid endpoint correctly returns 404")
        else:
            print_result(False, f"Expected 404 for invalid endpoint, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Error testing invalid endpoint: {str(e)}")
        return False
    
    # Test CORS headers
    print("\n--- Testing CORS headers ---")
    try:
        response = requests.get(f"{BASE_URL}/classes", timeout=TIMEOUT)
        headers = response.headers
        
        cors_headers = [
            'Access-Control-Allow-Origin',
            'Access-Control-Allow-Methods', 
            'Access-Control-Allow-Headers'
        ]
        
        missing_cors = [header for header in cors_headers if header not in headers]
        if missing_cors:
            print_result(False, f"Missing CORS headers: {missing_cors}")
            return False
        
        print_result(True, "CORS headers present")
        print(f"Allow-Origin: {headers.get('Access-Control-Allow-Origin')}")
        print(f"Allow-Methods: {headers.get('Access-Control-Allow-Methods')}")
        
    except Exception as e:
        print_result(False, f"Error testing CORS: {str(e)}")
        return False
    
    return True

def run_all_tests():
    """Run all backend tests"""
    print("🚀 Starting Backend API Testing for Class Detail Pages Enhancement")
    print(f"Base URL: {BASE_URL}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    tests = [
        ("Enhanced Classes API", test_get_classes_enhanced),
        ("Class by ID API", test_get_class_by_id),
        ("Firebase User Lookup API", test_firebase_user_lookup),
        ("Error Handling & CORS", test_api_error_handling)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print_result(False, f"Test {test_name} crashed: {str(e)}")
            results.append((test_name, False))
    
    # Summary
    print(f"\n{'='*60}")
    print("BACKEND TESTING SUMMARY")
    print(f"{'='*60}")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\nOverall Result: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All backend tests PASSED! Class Detail Pages backend is working correctly.")
        return True
    else:
        print("⚠️  Some backend tests FAILED. Review the issues above.")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)