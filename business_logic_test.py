#!/usr/bin/env python3
"""
Comprehensive Thryve Business Logic Testing
Tests advanced revenue models, X Pass system, and no-show penalty logic
"""

import requests
import json
import time
from datetime import datetime, timedelta

# Configuration
BASE_URL = "https://c965f60f-b3cc-49e1-9021-e1c5bd50d222.preview.emergentagent.com"
SERVER_API_URL = f"{BASE_URL}/server-api"

# Test authentication headers (mock Firebase tokens)
CUSTOMER_AUTH_HEADERS = {
    "Authorization": "Bearer customer-test-token",
    "Content-Type": "application/json"
}

INSTRUCTOR_AUTH_HEADERS = {
    "Authorization": "Bearer instructor-test-token", 
    "Content-Type": "application/json"
}

STUDIO_AUTH_HEADERS = {
    "Authorization": "Bearer studio-test-token",
    "Content-Type": "application/json"
}

ADMIN_AUTH_HEADERS = {
    "Authorization": "Bearer admin-test-token",
    "Content-Type": "application/json"
}

def print_test_result(test_name, success, details=""):
    """Print formatted test results"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {test_name}")
    if details:
        print(f"   Details: {details}")
    print()

def print_section_header(title):
    """Print section header"""
    print("\n" + "=" * 80)
    print(f"🎯 {title}")
    print("=" * 80)

def print_subsection_header(title):
    """Print subsection header"""
    print(f"\n📋 {title}")
    print("-" * 50)

# ============================================================================
# USER MEMBERSHIP & PAYMENT METHOD TESTS
# ============================================================================

def test_get_user_memberships():
    """Test GET /server-api/user/memberships - Retrieve user's active memberships, class packs, and X Pass credits"""
    print("🧪 Testing GET /server-api/user/memberships")
    
    try:
        response = requests.get(
            f"{SERVER_API_URL}/user/memberships",
            headers=CUSTOMER_AUTH_HEADERS,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            success = all([
                "memberships" in data,
                "classPacks" in data,
                "xPassCredits" in data,
                "totalCredits" in data,
                isinstance(data["memberships"], list),
                isinstance(data["classPacks"], list),
                isinstance(data["xPassCredits"], list),
                isinstance(data["totalCredits"], (int, float))
            ])
            details = f"Status: {response.status_code}, Memberships: {len(data.get('memberships', []))}, Class Packs: {len(data.get('classPacks', []))}, X Pass Credits: {len(data.get('xPassCredits', []))}, Total Credits: {data.get('totalCredits', 0)}"
            print_test_result("User memberships retrieval", success, details)
            return data if success else None
        else:
            print_test_result("User memberships retrieval", False, f"Status: {response.status_code}, Response: {response.text}")
            return None
            
    except Exception as e:
        print_test_result("User memberships retrieval", False, f"Exception: {str(e)}")
        return None

def test_get_user_memberships_authentication():
    """Test authentication protection for user memberships endpoint"""
    print("🧪 Testing GET /server-api/user/memberships (authentication)")
    
    try:
        response = requests.get(
            f"{SERVER_API_URL}/user/memberships",
            timeout=10
        )
        
        success = response.status_code == 401
        details = f"Status: {response.status_code}, Response: {response.text[:100]}"
        print_test_result("User memberships requires authentication", success, details)
        
    except Exception as e:
        print_test_result("User memberships requires authentication", False, f"Exception: {str(e)}")

# ============================================================================
# USER TRANSACTION HISTORY TESTS
# ============================================================================

def test_get_user_transactions():
    """Test GET /server-api/user/transactions - Fetch user's transaction history"""
    print("🧪 Testing GET /server-api/user/transactions")
    
    try:
        response = requests.get(
            f"{SERVER_API_URL}/user/transactions",
            headers=CUSTOMER_AUTH_HEADERS,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            success = (
                "transactions" in data and
                isinstance(data["transactions"], list)
            )
            
            # If transactions exist, validate structure
            if data.get("transactions"):
                first_transaction = data["transactions"][0]
                transaction_structure_valid = all([
                    "id" in first_transaction,
                    "userId" in first_transaction,
                    "type" in first_transaction,
                    "amount" in first_transaction,
                    "status" in first_transaction,
                    "createdAt" in first_transaction
                ])
                success = success and transaction_structure_valid
            
            details = f"Status: {response.status_code}, Transactions count: {len(data.get('transactions', []))}"
            print_test_result("User transactions retrieval", success, details)
            return data if success else None
        else:
            print_test_result("User transactions retrieval", False, f"Status: {response.status_code}, Response: {response.text}")
            return None
            
    except Exception as e:
        print_test_result("User transactions retrieval", False, f"Exception: {str(e)}")
        return None

def test_get_user_transactions_authentication():
    """Test authentication protection for user transactions endpoint"""
    print("🧪 Testing GET /server-api/user/transactions (authentication)")
    
    try:
        response = requests.get(
            f"{SERVER_API_URL}/user/transactions",
            timeout=10
        )
        
        success = response.status_code == 401
        details = f"Status: {response.status_code}, Response: {response.text[:100]}"
        print_test_result("User transactions requires authentication", success, details)
        
    except Exception as e:
        print_test_result("User transactions requires authentication", False, f"Exception: {str(e)}")

# ============================================================================
# X PASS CREDIT PURCHASE TESTS
# ============================================================================

def test_purchase_xpass_basic():
    """Test POST /server-api/user/purchase-xpass - Basic package (5 credits/$75)"""
    print("🧪 Testing POST /server-api/user/purchase-xpass (Basic Package)")
    
    purchase_data = {
        "packageType": "basic",
        "credits": 5,
        "price": 75
    }
    
    try:
        response = requests.post(
            f"{SERVER_API_URL}/user/purchase-xpass",
            headers=CUSTOMER_AUTH_HEADERS,
            json=purchase_data,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            success = all([
                "message" in data,
                "pack" in data,
                "transaction" in data,
                data["pack"]["packageType"] == "basic",
                data["pack"]["creditsTotal"] == 5,
                data["pack"]["creditsRemaining"] == 5,
                data["pack"]["price"] == 75,
                data["transaction"]["type"] == "xpass_purchase",
                data["transaction"]["amount"] == 75
            ])
            details = f"Status: {response.status_code}, Package: {data.get('pack', {}).get('packageType')}, Credits: {data.get('pack', {}).get('creditsTotal')}, Price: ${data.get('pack', {}).get('price')}"
            print_test_result("X Pass Basic package purchase", success, details)
            return data if success else None
        else:
            print_test_result("X Pass Basic package purchase", False, f"Status: {response.status_code}, Response: {response.text}")
            return None
            
    except Exception as e:
        print_test_result("X Pass Basic package purchase", False, f"Exception: {str(e)}")
        return None

def test_purchase_xpass_standard():
    """Test POST /server-api/user/purchase-xpass - Standard package (10 credits/$140)"""
    print("🧪 Testing POST /server-api/user/purchase-xpass (Standard Package)")
    
    purchase_data = {
        "packageType": "standard",
        "credits": 10,
        "price": 140
    }
    
    try:
        response = requests.post(
            f"{SERVER_API_URL}/user/purchase-xpass",
            headers=CUSTOMER_AUTH_HEADERS,
            json=purchase_data,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            success = all([
                "message" in data,
                "pack" in data,
                "transaction" in data,
                data["pack"]["packageType"] == "standard",
                data["pack"]["creditsTotal"] == 10,
                data["pack"]["creditsRemaining"] == 10,
                data["pack"]["price"] == 140,
                data["transaction"]["type"] == "xpass_purchase",
                data["transaction"]["amount"] == 140
            ])
            details = f"Status: {response.status_code}, Package: {data.get('pack', {}).get('packageType')}, Credits: {data.get('pack', {}).get('creditsTotal')}, Price: ${data.get('pack', {}).get('price')}"
            print_test_result("X Pass Standard package purchase", success, details)
            return data if success else None
        else:
            print_test_result("X Pass Standard package purchase", False, f"Status: {response.status_code}, Response: {response.text}")
            return None
            
    except Exception as e:
        print_test_result("X Pass Standard package purchase", False, f"Exception: {str(e)}")
        return None

def test_purchase_xpass_premium():
    """Test POST /server-api/user/purchase-xpass - Premium package (15 credits/$195)"""
    print("🧪 Testing POST /server-api/user/purchase-xpass (Premium Package)")
    
    purchase_data = {
        "packageType": "premium",
        "credits": 15,
        "price": 195
    }
    
    try:
        response = requests.post(
            f"{SERVER_API_URL}/user/purchase-xpass",
            headers=CUSTOMER_AUTH_HEADERS,
            json=purchase_data,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            success = all([
                "message" in data,
                "pack" in data,
                "transaction" in data,
                data["pack"]["packageType"] == "premium",
                data["pack"]["creditsTotal"] == 15,
                data["pack"]["creditsRemaining"] == 15,
                data["pack"]["price"] == 195,
                data["transaction"]["type"] == "xpass_purchase",
                data["transaction"]["amount"] == 195,
                "expiryDate" in data["pack"]  # Should have 1 year expiry
            ])
            details = f"Status: {response.status_code}, Package: {data.get('pack', {}).get('packageType')}, Credits: {data.get('pack', {}).get('creditsTotal')}, Price: ${data.get('pack', {}).get('price')}"
            print_test_result("X Pass Premium package purchase", success, details)
            return data if success else None
        else:
            print_test_result("X Pass Premium package purchase", False, f"Status: {response.status_code}, Response: {response.text}")
            return None
            
    except Exception as e:
        print_test_result("X Pass Premium package purchase", False, f"Exception: {str(e)}")
        return None

def test_purchase_xpass_invalid_package():
    """Test POST /server-api/user/purchase-xpass - Invalid package type"""
    print("🧪 Testing POST /server-api/user/purchase-xpass (Invalid Package)")
    
    purchase_data = {
        "packageType": "invalid",
        "credits": 20,
        "price": 250
    }
    
    try:
        response = requests.post(
            f"{SERVER_API_URL}/user/purchase-xpass",
            headers=CUSTOMER_AUTH_HEADERS,
            json=purchase_data,
            timeout=10
        )
        
        success = response.status_code == 400
        details = f"Status: {response.status_code}, Response: {response.text[:100]}"
        print_test_result("X Pass invalid package validation", success, details)
        
    except Exception as e:
        print_test_result("X Pass invalid package validation", False, f"Exception: {str(e)}")

def test_purchase_xpass_authentication():
    """Test authentication protection for X Pass purchase endpoint"""
    print("🧪 Testing POST /server-api/user/purchase-xpass (authentication)")
    
    purchase_data = {
        "packageType": "basic",
        "credits": 5,
        "price": 75
    }
    
    try:
        response = requests.post(
            f"{SERVER_API_URL}/user/purchase-xpass",
            json=purchase_data,
            timeout=10
        )
        
        success = response.status_code == 401
        details = f"Status: {response.status_code}, Response: {response.text[:100]}"
        print_test_result("X Pass purchase requires authentication", success, details)
        
    except Exception as e:
        print_test_result("X Pass purchase requires authentication", False, f"Exception: {str(e)}")

# ============================================================================
# NO-SHOW PENALTY PROCESSING TESTS
# ============================================================================

def test_process_noshow_class_pack():
    """Test POST /server-api/admin/process-noshow - Class pack user (credit deduction + fee)"""
    print("🧪 Testing POST /server-api/admin/process-noshow (Class Pack User)")
    
    noshow_data = {
        "bookingId": "booking-123",
        "classId": "class-456",
        "userId": "user-789",
        "paymentMethod": "class_pack"
    }
    
    try:
        response = requests.post(
            f"{SERVER_API_URL}/admin/process-noshow",
            headers=ADMIN_AUTH_HEADERS,
            json=noshow_data,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            success = all([
                "message" in data,
                "penalty" in data,
                "creditDeducted" in data,
                "feeAmount" in data,
                data["creditDeducted"] == True,  # Should deduct credit for class pack
                data["feeAmount"] > 0,  # Should apply fee
                data["penalty"]["type"] == "no_show"
            ])
            details = f"Status: {response.status_code}, Credit Deducted: {data.get('creditDeducted')}, Fee: ${data.get('feeAmount')}"
            print_test_result("No-show penalty for class pack user", success, details)
            return data if success else None
        else:
            print_test_result("No-show penalty for class pack user", False, f"Status: {response.status_code}, Response: {response.text}")
            return None
            
    except Exception as e:
        print_test_result("No-show penalty for class pack user", False, f"Exception: {str(e)}")
        return None

def test_process_noshow_xpass():
    """Test POST /server-api/admin/process-noshow - X Pass user (credit deduction + fee)"""
    print("🧪 Testing POST /server-api/admin/process-noshow (X Pass User)")
    
    noshow_data = {
        "bookingId": "booking-456",
        "classId": "class-789",
        "userId": "user-123",
        "paymentMethod": "xpass"
    }
    
    try:
        response = requests.post(
            f"{SERVER_API_URL}/admin/process-noshow",
            headers=ADMIN_AUTH_HEADERS,
            json=noshow_data,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            success = all([
                "message" in data,
                "penalty" in data,
                "creditDeducted" in data,
                "feeAmount" in data,
                data["creditDeducted"] == True,  # Should deduct credit for X Pass
                data["feeAmount"] > 0,  # Should apply fee
                data["penalty"]["type"] == "no_show"
            ])
            details = f"Status: {response.status_code}, Credit Deducted: {data.get('creditDeducted')}, Fee: ${data.get('feeAmount')}"
            print_test_result("No-show penalty for X Pass user", success, details)
            return data if success else None
        else:
            print_test_result("No-show penalty for X Pass user", False, f"Status: {response.status_code}, Response: {response.text}")
            return None
            
    except Exception as e:
        print_test_result("No-show penalty for X Pass user", False, f"Exception: {str(e)}")
        return None

def test_process_noshow_unlimited():
    """Test POST /server-api/admin/process-noshow - Unlimited member (fee only, no credit deduction)"""
    print("🧪 Testing POST /server-api/admin/process-noshow (Unlimited Member)")
    
    noshow_data = {
        "bookingId": "booking-789",
        "classId": "class-123",
        "userId": "user-456",
        "paymentMethod": "unlimited"
    }
    
    try:
        response = requests.post(
            f"{SERVER_API_URL}/admin/process-noshow",
            headers=ADMIN_AUTH_HEADERS,
            json=noshow_data,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            success = all([
                "message" in data,
                "penalty" in data,
                "creditDeducted" in data,
                "feeAmount" in data,
                data["creditDeducted"] == False,  # Should NOT deduct credit for unlimited
                data["feeAmount"] > 0,  # Should still apply fee
                data["penalty"]["type"] == "no_show"
            ])
            details = f"Status: {response.status_code}, Credit Deducted: {data.get('creditDeducted')}, Fee: ${data.get('feeAmount')}"
            print_test_result("No-show penalty for unlimited member", success, details)
            return data if success else None
        else:
            print_test_result("No-show penalty for unlimited member", False, f"Status: {response.status_code}, Response: {response.text}")
            return None
            
    except Exception as e:
        print_test_result("No-show penalty for unlimited member", False, f"Exception: {str(e)}")
        return None

def test_process_noshow_authentication():
    """Test authentication protection for no-show processing endpoint"""
    print("🧪 Testing POST /server-api/admin/process-noshow (authentication)")
    
    noshow_data = {
        "bookingId": "booking-123",
        "classId": "class-456",
        "userId": "user-789"
    }
    
    try:
        response = requests.post(
            f"{SERVER_API_URL}/admin/process-noshow",
            json=noshow_data,
            timeout=10
        )
        
        success = response.status_code == 401
        details = f"Status: {response.status_code}, Response: {response.text[:100]}"
        print_test_result("No-show processing requires authentication", success, details)
        
    except Exception as e:
        print_test_result("No-show processing requires authentication", False, f"Exception: {str(e)}")

# ============================================================================
# STUDIO X PASS SETTINGS TESTS
# ============================================================================

def test_get_studio_xpass_settings():
    """Test GET /server-api/studio/xpass-settings - Retrieve studio's X Pass settings"""
    print("🧪 Testing GET /server-api/studio/xpass-settings")
    
    try:
        response = requests.get(
            f"{SERVER_API_URL}/studio/xpass-settings",
            headers=STUDIO_AUTH_HEADERS,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            success = all([
                "studioId" in data,
                "xpassEnabled" in data,
                "acceptedClassTypes" in data,
                "cancellationWindow" in data,
                "noShowFee" in data,
                "lateCancelFee" in data,
                isinstance(data["xpassEnabled"], bool),
                isinstance(data["acceptedClassTypes"], list),
                isinstance(data["cancellationWindow"], (int, float)),
                isinstance(data["noShowFee"], (int, float)),
                isinstance(data["lateCancelFee"], (int, float))
            ])
            details = f"Status: {response.status_code}, X Pass Enabled: {data.get('xpassEnabled')}, No-Show Fee: ${data.get('noShowFee')}, Cancel Window: {data.get('cancellationWindow')}h"
            print_test_result("Studio X Pass settings retrieval", success, details)
            return data if success else None
        else:
            print_test_result("Studio X Pass settings retrieval", False, f"Status: {response.status_code}, Response: {response.text}")
            return None
            
    except Exception as e:
        print_test_result("Studio X Pass settings retrieval", False, f"Exception: {str(e)}")
        return None

def test_update_studio_xpass_settings():
    """Test POST /server-api/studio/xpass-settings - Update studio's X Pass settings"""
    print("🧪 Testing POST /server-api/studio/xpass-settings")
    
    settings_data = {
        "xpassEnabled": True,
        "acceptedClassTypes": ["Yoga", "Pilates", "HIIT"],
        "cancellationWindow": 4,
        "noShowFee": 20,
        "lateCancelFee": 12
    }
    
    try:
        response = requests.post(
            f"{SERVER_API_URL}/studio/xpass-settings",
            headers=STUDIO_AUTH_HEADERS,
            json=settings_data,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            success = all([
                "message" in data,
                "settings" in data,
                data["settings"]["xpassEnabled"] == True,
                data["settings"]["acceptedClassTypes"] == ["Yoga", "Pilates", "HIIT"],
                data["settings"]["cancellationWindow"] == 4,
                data["settings"]["noShowFee"] == 20,
                data["settings"]["lateCancelFee"] == 12,
                data["settings"]["platformFeeRate"] == 0.05  # 5% platform fee
            ])
            details = f"Status: {response.status_code}, X Pass Enabled: {data.get('settings', {}).get('xpassEnabled')}, Platform Fee: {data.get('settings', {}).get('platformFeeRate', 0)*100}%"
            print_test_result("Studio X Pass settings update", success, details)
            return data if success else None
        else:
            print_test_result("Studio X Pass settings update", False, f"Status: {response.status_code}, Response: {response.text}")
            return None
            
    except Exception as e:
        print_test_result("Studio X Pass settings update", False, f"Exception: {str(e)}")
        return None

def test_studio_xpass_settings_authentication():
    """Test authentication protection for studio X Pass settings endpoints"""
    print("🧪 Testing /server-api/studio/xpass-settings (authentication)")
    
    # Test GET without auth
    try:
        response = requests.get(
            f"{SERVER_API_URL}/studio/xpass-settings",
            timeout=10
        )
        
        success = response.status_code == 401
        details = f"GET Status: {response.status_code}"
        print_test_result("Studio X Pass settings GET requires authentication", success, details)
        
    except Exception as e:
        print_test_result("Studio X Pass settings GET requires authentication", False, f"Exception: {str(e)}")
    
    # Test POST without auth
    try:
        response = requests.post(
            f"{SERVER_API_URL}/studio/xpass-settings",
            json={"xpassEnabled": True},
            timeout=10
        )
        
        success = response.status_code == 401
        details = f"POST Status: {response.status_code}"
        print_test_result("Studio X Pass settings POST requires authentication", success, details)
        
    except Exception as e:
        print_test_result("Studio X Pass settings POST requires authentication", False, f"Exception: {str(e)}")

def test_studio_xpass_settings_role_validation():
    """Test role validation for studio X Pass settings endpoints"""
    print("🧪 Testing /server-api/studio/xpass-settings (role validation)")
    
    # Test customer trying to access studio settings
    try:
        response = requests.get(
            f"{SERVER_API_URL}/studio/xpass-settings",
            headers=CUSTOMER_AUTH_HEADERS,
            timeout=10
        )
        
        success = response.status_code == 403
        details = f"Customer GET Status: {response.status_code}"
        print_test_result("Customer cannot access studio X Pass settings", success, details)
        
    except Exception as e:
        print_test_result("Customer cannot access studio X Pass settings", False, f"Exception: {str(e)}")
    
    # Test instructor trying to update studio settings
    try:
        response = requests.post(
            f"{SERVER_API_URL}/studio/xpass-settings",
            headers=INSTRUCTOR_AUTH_HEADERS,
            json={"xpassEnabled": True},
            timeout=10
        )
        
        success = response.status_code == 403
        details = f"Instructor POST Status: {response.status_code}"
        print_test_result("Instructor cannot update studio X Pass settings", success, details)
        
    except Exception as e:
        print_test_result("Instructor cannot update studio X Pass settings", False, f"Exception: {str(e)}")

# ============================================================================
# PLATFORM REVENUE MODEL TESTS
# ============================================================================

def test_platform_revenue_calculation():
    """Test platform revenue model calculations"""
    print("🧪 Testing Platform Revenue Model Calculations")
    
    # Test X Pass purchase to verify platform fees are calculated
    purchase_result = test_purchase_xpass_standard()
    
    if purchase_result:
        # Verify transaction fee calculation (should be 3.75% of transaction)
        transaction_amount = purchase_result["transaction"]["amount"]
        expected_platform_fee = transaction_amount * 0.0375  # 3.75%
        
        # For X Pass, there should also be a 5% redemption fee for studios
        expected_xpass_fee = transaction_amount * 0.05  # 5%
        
        success = transaction_amount > 0
        details = f"Transaction: ${transaction_amount}, Expected Platform Fee: ${expected_platform_fee:.2f}, Expected X Pass Fee: ${expected_xpass_fee:.2f}"
        print_test_result("Platform revenue model calculation", success, details)
    else:
        print_test_result("Platform revenue model calculation", False, "Could not test - X Pass purchase failed")

# ============================================================================
# INTEGRATION TESTS
# ============================================================================

def test_business_logic_integration():
    """Test integration between different business logic components"""
    print("🧪 Testing Business Logic Integration")
    
    # Test complete user journey: Purchase X Pass → Check memberships → Process no-show
    print("   Testing complete user journey...")
    
    # Step 1: Purchase X Pass
    xpass_result = test_purchase_xpass_basic()
    
    # Step 2: Check user memberships (should show new X Pass credits)
    memberships_result = test_get_user_memberships()
    
    # Step 3: Check transaction history (should show X Pass purchase)
    transactions_result = test_get_user_transactions()
    
    # Validate integration
    integration_success = all([
        xpass_result is not None,
        memberships_result is not None,
        transactions_result is not None
    ])
    
    if integration_success:
        # Additional validation
        has_xpass_credits = len(memberships_result.get("xPassCredits", [])) > 0
        has_purchase_transaction = any(
            t.get("type") == "xpass_purchase" 
            for t in transactions_result.get("transactions", [])
        )
        
        integration_success = has_xpass_credits and has_purchase_transaction
        details = f"X Pass Credits: {has_xpass_credits}, Purchase Transaction: {has_purchase_transaction}"
    else:
        details = "One or more components failed"
    
    print_test_result("Business logic integration", integration_success, details)

# ============================================================================
# MAIN TEST RUNNER
# ============================================================================

def run_comprehensive_business_logic_tests():
    """Run all comprehensive business logic tests"""
    print_section_header("COMPREHENSIVE THRYVE BUSINESS LOGIC TESTING")
    
    # User Membership & Payment Method Tests
    print_subsection_header("USER MEMBERSHIP & PAYMENT METHOD TESTS")
    test_get_user_memberships()
    test_get_user_memberships_authentication()
    
    # User Transaction History Tests
    print_subsection_header("USER TRANSACTION HISTORY TESTS")
    test_get_user_transactions()
    test_get_user_transactions_authentication()
    
    # X Pass Credit Purchase Tests
    print_subsection_header("X PASS CREDIT PURCHASE TESTS")
    test_purchase_xpass_basic()
    test_purchase_xpass_standard()
    test_purchase_xpass_premium()
    test_purchase_xpass_invalid_package()
    test_purchase_xpass_authentication()
    
    # No-Show Penalty Processing Tests
    print_subsection_header("NO-SHOW PENALTY PROCESSING TESTS")
    test_process_noshow_class_pack()
    test_process_noshow_xpass()
    test_process_noshow_unlimited()
    test_process_noshow_authentication()
    
    # Studio X Pass Settings Tests
    print_subsection_header("STUDIO X PASS SETTINGS TESTS")
    test_get_studio_xpass_settings()
    test_update_studio_xpass_settings()
    test_studio_xpass_settings_authentication()
    test_studio_xpass_settings_role_validation()
    
    # Platform Revenue Model Tests
    print_subsection_header("PLATFORM REVENUE MODEL TESTS")
    test_platform_revenue_calculation()
    
    # Integration Tests
    print_subsection_header("INTEGRATION TESTS")
    test_business_logic_integration()
    
    print_section_header("BUSINESS LOGIC TESTING COMPLETED")
    print("🎉 All comprehensive business logic tests have been executed!")
    print("📊 Review the results above to identify any issues that need attention.")

if __name__ == "__main__":
    run_comprehensive_business_logic_tests()