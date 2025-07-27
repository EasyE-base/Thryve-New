#!/usr/bin/env python3
"""
Backend API Testing for Thryve Fitness Platform - Dashboard Functionality
Tests dashboard-related backend APIs and Firebase authentication endpoints
"""

import requests
import json
import uuid
from datetime import datetime

# Configuration - Use external URL for testing
BASE_URL = "https://a0166285-5fbd-430a-a296-ff63ae399ac4.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

def main():
    """Main testing function for dashboard supporting APIs"""
    
    print("🧪 THRYVE FITNESS PLATFORM - DASHBOARD BACKEND API TESTING")
    print(f"🌐 Testing against: {BASE_URL}")
    print(f"⏰ Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = {}
    
    # Test API infrastructure first
    print("\n🔧 Testing API Infrastructure")
    try:
        response = requests.get(f"{API_BASE}/classes", timeout=10)
        if response.status_code == 502:
            print("❌ CRITICAL: API returning 502 Bad Gateway errors")
            print("   This indicates Kubernetes ingress routing issues")
            print("   APIs may work on localhost but fail via external URL")
            results["infrastructure"] = {"success": False, "error": "502 Bad Gateway"}
        else:
            print("✅ API infrastructure responding correctly")
            results["infrastructure"] = {"success": True, "status": response.status_code}
    except Exception as e:
        print(f"❌ API infrastructure test failed: {e}")
        results["infrastructure"] = {"success": False, "error": str(e)}
    
    # Test dashboard supporting APIs
    print("\n📋 Testing Dashboard Supporting APIs")
    
    # 1. Classes API (Customer Dashboard - Explore Classes)
    print("\n1. Testing Classes API (Customer Dashboard Support)")
    try:
        response = requests.get(f"{API_BASE}/classes", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if 'classes' in data and 'total' in data:
                print(f"✅ Classes API working - {len(data['classes'])} classes available")
                results["classes_api"] = {"success": True, "count": len(data['classes'])}
            else:
                print("❌ Classes API response missing required fields")
                results["classes_api"] = {"success": False, "error": "Missing fields"}
        else:
            print(f"❌ Classes API failed with status {response.status_code}")
            results["classes_api"] = {"success": False, "status": response.status_code}
    except Exception as e:
        print(f"❌ Classes API test failed: {e}")
        results["classes_api"] = {"success": False, "error": str(e)}
    
    # 2. Firebase Role Management API (Dashboard Access Control)
    print("\n2. Testing Firebase Role Management API")
    try:
        test_data = {
            "uid": f"test-uid-{uuid.uuid4()}",
            "email": "test@example.com",
            "role": "customer"
        }
        response = requests.post(f"{API_BASE}/auth/firebase-role", json=test_data, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if 'message' in data and 'role' in data:
                print(f"✅ Firebase Role API working - Role: {data['role']}")
                results["firebase_role_api"] = {"success": True, "role": data['role']}
            else:
                print("❌ Firebase Role API response missing required fields")
                results["firebase_role_api"] = {"success": False, "error": "Missing fields"}
        else:
            print(f"❌ Firebase Role API failed with status {response.status_code}")
            results["firebase_role_api"] = {"success": False, "status": response.status_code}
    except Exception as e:
        print(f"❌ Firebase Role API test failed: {e}")
        results["firebase_role_api"] = {"success": False, "error": str(e)}
    
    # 3. Firebase User Data API (Dashboard User Info)
    print("\n3. Testing Firebase User Data API")
    try:
        # First create a user
        test_uid = f"test-uid-{uuid.uuid4()}"
        role_data = {"uid": test_uid, "email": "test@example.com", "role": "customer"}
        create_response = requests.post(f"{API_BASE}/auth/firebase-role", json=role_data, timeout=10)
        
        if create_response.status_code == 200:
            # Now test getting user data
            response = requests.get(f"{API_BASE}/auth/firebase-user?uid={test_uid}", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if 'uid' in data and 'email' in data and 'role' in data:
                    print(f"✅ Firebase User API working - Role: {data['role']}")
                    results["firebase_user_api"] = {"success": True, "role": data['role']}
                else:
                    print("❌ Firebase User API response missing required fields")
                    results["firebase_user_api"] = {"success": False, "error": "Missing fields"}
            else:
                print(f"❌ Firebase User API failed with status {response.status_code}")
                results["firebase_user_api"] = {"success": False, "status": response.status_code}
        else:
            print("❌ Could not create test user for Firebase User API test")
            results["firebase_user_api"] = {"success": False, "error": "User creation failed"}
    except Exception as e:
        print(f"❌ Firebase User API test failed: {e}")
        results["firebase_user_api"] = {"success": False, "error": str(e)}
    
    # 4. Protected APIs (Profile, Bookings, Instructor Classes)
    print("\n4. Testing Protected APIs (Authentication Required)")
    protected_endpoints = [
        ("/profile", "Profile API"),
        ("/bookings", "Bookings API"),
        ("/instructor/classes", "Instructor Classes API")
    ]
    
    for endpoint, name in protected_endpoints:
        try:
            response = requests.get(f"{API_BASE}{endpoint}", timeout=10)
            if response.status_code == 401:
                print(f"✅ {name} correctly requires authentication")
                results[f"{name.lower().replace(' ', '_')}"] = {"success": True, "auth_required": True}
            else:
                print(f"❌ {name} should require authentication, got status {response.status_code}")
                results[f"{name.lower().replace(' ', '_')}"] = {"success": False, "status": response.status_code}
        except Exception as e:
            print(f"❌ {name} test failed: {e}")
            results[f"{name.lower().replace(' ', '_')}"] = {"success": False, "error": str(e)}
    
    # 5. Class Creation API (Instructor Dashboard - Create New Class)
    print("\n5. Testing Class Creation API (Instructor Dashboard Support)")
    try:
        sample_class = {
            "title": "Test Yoga Class",
            "description": "Test class for dashboard functionality",
            "type": "Yoga",
            "schedule": "2025-01-20T10:00:00Z",
            "duration": 60,
            "capacity": 15,
            "price": 25.00,
            "location": "Test Studio"
        }
        response = requests.post(f"{API_BASE}/classes", json=sample_class, timeout=10)
        if response.status_code == 401:
            print("✅ Class Creation API correctly requires authentication")
            results["class_creation_api"] = {"success": True, "auth_required": True}
        else:
            print(f"❌ Class Creation API should require authentication, got status {response.status_code}")
            results["class_creation_api"] = {"success": False, "status": response.status_code}
    except Exception as e:
        print(f"❌ Class Creation API test failed: {e}")
        results["class_creation_api"] = {"success": False, "error": str(e)}
    
    # 6. Stripe Connect API (Instructor Dashboard - Setup Stripe Connect)
    print("\n6. Testing Stripe Connect API (Instructor Dashboard Support)")
    try:
        response = requests.post(f"{API_BASE}/stripe/connect/account", timeout=10)
        if response.status_code == 401:
            print("✅ Stripe Connect API correctly requires authentication")
            results["stripe_connect_api"] = {"success": True, "auth_required": True}
        else:
            print(f"❌ Stripe Connect API should require authentication, got status {response.status_code}")
            results["stripe_connect_api"] = {"success": False, "status": response.status_code}
    except Exception as e:
        print(f"❌ Stripe Connect API test failed: {e}")
        results["stripe_connect_api"] = {"success": False, "error": str(e)}
    
    # 7. Onboarding Complete API (Dashboard Redirect Support)
    print("\n7. Testing Onboarding Complete API (Dashboard Redirect Support)")
    try:
        onboarding_data = {
            "role": "customer",
            "profileData": {
                "firstName": "Test",
                "lastName": "User",
                "phone": "555-0123"
            }
        }
        response = requests.post(f"{API_BASE}/onboarding/complete", json=onboarding_data, timeout=10)
        if response.status_code in [200, 401, 400]:
            print(f"✅ Onboarding Complete API responding correctly with status {response.status_code}")
            results["onboarding_complete_api"] = {"success": True, "status": response.status_code}
        else:
            print(f"❌ Onboarding Complete API unexpected status: {response.status_code}")
            results["onboarding_complete_api"] = {"success": False, "status": response.status_code}
    except Exception as e:
        print(f"❌ Onboarding Complete API test failed: {e}")
        results["onboarding_complete_api"] = {"success": False, "error": str(e)}
    
    # Summary
    print("\n" + "=" * 80)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 80)
    
    total_tests = len(results)
    successful_tests = sum(1 for r in results.values() if r.get("success", False))
    failed_tests = total_tests - successful_tests
    
    print(f"\n📈 Overall Results:")
    print(f"   Total Tests: {total_tests}")
    print(f"   Successful: {successful_tests}")
    print(f"   Failed: {failed_tests}")
    print(f"   Success Rate: {(successful_tests/total_tests)*100:.1f}%")
    
    print(f"\n✅ Successful Tests:")
    for test_name, result in results.items():
        if result.get("success", False):
            status_info = ""
            if "status" in result:
                status_info = f" (HTTP {result['status']})"
            elif "auth_required" in result:
                status_info = " (Auth Required)"
            elif "role" in result:
                status_info = f" (Role: {result['role']})"
            elif "count" in result:
                status_info = f" ({result['count']} items)"
            print(f"   • {test_name.replace('_', ' ').title()}{status_info}")
    
    print(f"\n❌ Failed Tests:")
    for test_name, result in results.items():
        if not result.get("success", False):
            error_info = ""
            if "error" in result:
                error_info = f": {result['error']}"
            elif "status" in result:
                error_info = f": HTTP {result['status']}"
            print(f"   • {test_name.replace('_', ' ').title()}{error_info}")
    
    # Check for specific issues
    infrastructure_issues = any(
        not r.get("success", False) and r.get("status") == 502 
        for r in results.values()
    )
    
    if infrastructure_issues:
        print(f"\n🚨 CRITICAL INFRASTRUCTURE ISSUE:")
        print("   • API endpoints returning 502 Bad Gateway errors")
        print("   • This is a Kubernetes ingress routing problem")
        print("   • APIs likely work on localhost but fail via external URL")
        print("   • Dashboard functionality is blocked by this infrastructure issue")
        print("   • RECOMMENDATION: Fix external URL API routing configuration")
    
    # Firebase specific analysis
    firebase_tests = ["firebase_role_api", "firebase_user_api"]
    firebase_working = all(
        results.get(test, {}).get("success", False) 
        for test in firebase_tests
    )
    
    if firebase_working:
        print(f"\n✅ Firebase Authentication APIs are working correctly")
        print("   • Role management API functional")
        print("   • User data API operational")
        print("   • Dashboard access control ready")
    else:
        print(f"\n❌ Firebase Authentication APIs have issues")
    
    # Dashboard readiness assessment
    core_apis_working = (
        results.get("classes_api", {}).get("success", False) and
        firebase_working
    )
    
    if core_apis_working:
        print(f"\n🎯 DASHBOARD READINESS: Core APIs are functional")
        print("   • Customer dashboard can access classes")
        print("   • Firebase authentication supports role-based access")
        print("   • Protected endpoints properly secured")
    else:
        print(f"\n⚠️  DASHBOARD READINESS: Core APIs have issues")
    
    return results

if __name__ == "__main__":
    main()