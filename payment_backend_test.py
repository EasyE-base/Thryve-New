#!/usr/bin/env python3
"""
Payment & Subscription System Backend API Testing
Testing Phase 1 Core Payment Infrastructure & Stripe Integration endpoints
Focus on all payment-related endpoints with proper authentication and error handling
"""

import requests
import json
import time
import sys
from datetime import datetime, timedelta

# Configuration
BASE_URL = "https://2a46661a-96e4-460d-88d6-00dbfcbebea3.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/server-api"

# Test authentication token (mock Firebase token for testing)
AUTH_TOKEN = "Bearer firebase-test-user"
HEADERS = {
    "Authorization": AUTH_TOKEN,
    "Content-Type": "application/json"
}

class PaymentSystemTester:
    def __init__(self):
        self.test_results = []
        self.total_tests = 0
        self.passed_tests = 0
        self.failed_tests = 0
        
    def log_test(self, test_name, success, message, response_data=None):
        """Log test results"""
        self.total_tests += 1
        if success:
            self.passed_tests += 1
            status = "✅ PASS"
        else:
            self.failed_tests += 1
            status = "❌ FAIL"
            
        result = {
            "test": test_name,
            "status": status,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        print(f"{status}: {test_name} - {message}")
        
    def test_endpoint(self, method, endpoint, data=None, headers=None, expected_status=200, test_name=None):
        """Generic endpoint testing method"""
        if not test_name:
            test_name = f"{method} {endpoint}"
            
        try:
            start_time = time.time()
            
            if method.upper() == "GET":
                response = requests.get(f"{API_BASE}{endpoint}", headers=headers or HEADERS, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(f"{API_BASE}{endpoint}", json=data, headers=headers or HEADERS, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            response_time = round((time.time() - start_time) * 1000, 2)
            
            if response.status_code == expected_status:
                try:
                    response_data = response.json()
                    self.log_test(test_name, True, f"Success (Status: {response.status_code}, Time: {response_time}ms)", response_data)
                    return True, response_data
                except json.JSONDecodeError:
                    self.log_test(test_name, False, f"Invalid JSON response (Status: {response.status_code})")
                    return False, None
            else:
                try:
                    error_data = response.json()
                    self.log_test(test_name, False, f"Unexpected status {response.status_code}, expected {expected_status}. Error: {error_data.get('error', 'Unknown error')}")
                except:
                    self.log_test(test_name, False, f"Unexpected status {response.status_code}, expected {expected_status}. Response: {response.text[:200]}")
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(test_name, False, f"Request failed: {str(e)}")
            return False, None
        except Exception as e:
            self.log_test(test_name, False, f"Unexpected error: {str(e)}")
            return False, None

    def test_setup_intent_endpoint(self):
        """Test POST /server-api/payments/setup-intent - Create Stripe Setup Intent"""
        print("\n💳 Testing Stripe Setup Intent Creation...")
        
        # Test 1: Authenticated setup intent creation
        success, data = self.test_endpoint(
            "POST", 
            "/payments/setup-intent",
            data={},
            test_name="Create Setup Intent (Authenticated)"
        )
        
        if success and data:
            # Validate response structure
            required_fields = ['success', 'clientSecret', 'customerId']
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                self.log_test("Setup Intent Response Structure", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Setup Intent Response Structure", True, "All required fields present")
                
                # Validate client secret format
                if data.get('clientSecret', '').startswith('seti_'):
                    self.log_test("Client Secret Format", True, "Valid Stripe setup intent client secret format")
                else:
                    self.log_test("Client Secret Format", False, f"Invalid client secret format: {data.get('clientSecret', '')}")
        
        # Test 2: Unauthenticated request
        success, data = self.test_endpoint(
            "POST", 
            "/payments/setup-intent",
            data={},
            headers={"Content-Type": "application/json"},  # No auth header
            expected_status=401,
            test_name="Setup Intent Authentication Required"
        )

    def test_create_subscription_endpoint(self):
        """Test POST /server-api/payments/create-subscription - Create Recurring Subscription"""
        print("\n🔄 Testing Subscription Creation...")
        
        # Test 1: Valid subscription creation
        subscription_data = {
            "priceId": "price_test_subscription",
            "paymentMethodId": "pm_test_payment_method",
            "studioId": "studio-test-123",
            "subscriptionType": "unlimited_membership"
        }
        
        success, data = self.test_endpoint(
            "POST", 
            "/payments/create-subscription",
            data=subscription_data,
            test_name="Create Subscription (Valid Data)"
        )
        
        if success and data:
            # Validate response structure
            required_fields = ['success', 'subscription', 'subscriptionRecord']
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                self.log_test("Subscription Response Structure", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Subscription Response Structure", True, "All required fields present")
        
        # Test 2: Missing required fields
        invalid_data = {
            "studioId": "studio-test-123"
            # Missing priceId and paymentMethodId
        }
        
        success, data = self.test_endpoint(
            "POST", 
            "/payments/create-subscription",
            data=invalid_data,
            expected_status=400,
            test_name="Subscription Missing Required Fields"
        )
        
        # Test 3: Unauthenticated request
        success, data = self.test_endpoint(
            "POST", 
            "/payments/create-subscription",
            data=subscription_data,
            headers={"Content-Type": "application/json"},  # No auth header
            expected_status=401,
            test_name="Subscription Authentication Required"
        )

    def test_create_payment_intent_endpoint(self):
        """Test POST /server-api/payments/create-payment-intent - One-time Class Booking Payment"""
        print("\n💰 Testing Payment Intent Creation...")
        
        # Test 1: Valid payment intent creation
        payment_data = {
            "amount": 2500,  # $25.00 in cents
            "classId": "class-test-123",
            "studioId": "studio-test-456",
            "currency": "usd",
            "paymentType": "class_booking"
        }
        
        success, data = self.test_endpoint(
            "POST", 
            "/payments/create-payment-intent",
            data=payment_data,
            test_name="Create Payment Intent (Valid Data)"
        )
        
        if success and data:
            # Validate response structure
            required_fields = ['success', 'clientSecret', 'paymentIntentId', 'totalAmount', 'platformFee', 'netAmount']
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                self.log_test("Payment Intent Response Structure", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Payment Intent Response Structure", True, "All required fields present")
                
                # Validate platform fee calculation (3.75%)
                expected_platform_fee = round(2500 * 0.0375)
                actual_platform_fee = data.get('platformFee', 0)
                if actual_platform_fee == expected_platform_fee:
                    self.log_test("Platform Fee Calculation", True, f"Correct 3.75% fee: ${actual_platform_fee/100:.2f}")
                else:
                    self.log_test("Platform Fee Calculation", False, f"Expected ${expected_platform_fee/100:.2f}, got ${actual_platform_fee/100:.2f}")
        
        # Test 2: Missing required fields
        invalid_data = {
            "studioId": "studio-test-456"
            # Missing amount and classId
        }
        
        success, data = self.test_endpoint(
            "POST", 
            "/payments/create-payment-intent",
            data=invalid_data,
            expected_status=400,
            test_name="Payment Intent Missing Required Fields"
        )
        
        # Test 3: Unauthenticated request
        success, data = self.test_endpoint(
            "POST", 
            "/payments/create-payment-intent",
            data=payment_data,
            headers={"Content-Type": "application/json"},  # No auth header
            expected_status=401,
            test_name="Payment Intent Authentication Required"
        )

    def test_purchase_xpass_endpoint(self):
        """Test POST /server-api/payments/purchase-xpass - Purchase X Pass Credit Packs"""
        print("\n🎫 Testing X Pass Credit Pack Purchase...")
        
        # Test 1: Basic package purchase
        xpass_data = {
            "packageType": "basic",
            "amount": 7500,  # $75.00 in cents
            "creditCount": 5,
            "paymentMethodId": "pm_test_payment_method"
        }
        
        success, data = self.test_endpoint(
            "POST", 
            "/payments/purchase-xpass",
            data=xpass_data,
            test_name="Purchase X Pass Basic Package"
        )
        
        if success and data:
            # Validate response structure
            required_fields = ['success', 'paymentIntent', 'creditsAdded', 'totalAmount', 'platformFee']
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                self.log_test("X Pass Purchase Response Structure", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("X Pass Purchase Response Structure", True, "All required fields present")
        
        # Test 2: Standard package purchase
        standard_data = {
            "packageType": "standard",
            "amount": 14000,  # $140.00 in cents
            "creditCount": 10,
            "paymentMethodId": "pm_test_payment_method"
        }
        
        success, data = self.test_endpoint(
            "POST", 
            "/payments/purchase-xpass",
            data=standard_data,
            test_name="Purchase X Pass Standard Package"
        )
        
        # Test 3: Premium package purchase
        premium_data = {
            "packageType": "premium",
            "amount": 19500,  # $195.00 in cents
            "creditCount": 15,
            "paymentMethodId": "pm_test_payment_method"
        }
        
        success, data = self.test_endpoint(
            "POST", 
            "/payments/purchase-xpass",
            data=premium_data,
            test_name="Purchase X Pass Premium Package"
        )
        
        # Test 4: Missing required fields
        invalid_data = {
            "packageType": "basic"
            # Missing amount, creditCount, and paymentMethodId
        }
        
        success, data = self.test_endpoint(
            "POST", 
            "/payments/purchase-xpass",
            data=invalid_data,
            expected_status=400,
            test_name="X Pass Purchase Missing Required Fields"
        )
        
        # Test 5: Unauthenticated request
        success, data = self.test_endpoint(
            "POST", 
            "/payments/purchase-xpass",
            data=xpass_data,
            headers={"Content-Type": "application/json"},  # No auth header
            expected_status=401,
            test_name="X Pass Purchase Authentication Required"
        )

    def test_customer_portal_endpoint(self):
        """Test POST /server-api/payments/customer-portal - Create Stripe Customer Portal Session"""
        print("\n🏪 Testing Customer Portal Session Creation...")
        
        # Test 1: Valid portal session creation
        portal_data = {
            "returnUrl": f"{BASE_URL}/dashboard/customer"
        }
        
        success, data = self.test_endpoint(
            "POST", 
            "/payments/customer-portal",
            data=portal_data,
            test_name="Create Customer Portal Session"
        )
        
        if success and data:
            # Validate response structure
            required_fields = ['success', 'url']
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                self.log_test("Customer Portal Response Structure", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Customer Portal Response Structure", True, "All required fields present")
                
                # Validate portal URL format
                portal_url = data.get('url', '')
                if 'billing.stripe.com' in portal_url:
                    self.log_test("Portal URL Format", True, "Valid Stripe billing portal URL")
                else:
                    self.log_test("Portal URL Format", False, f"Invalid portal URL: {portal_url}")
        
        # Test 2: Without return URL (should use default)
        success, data = self.test_endpoint(
            "POST", 
            "/payments/customer-portal",
            data={},
            test_name="Customer Portal Default Return URL"
        )
        
        # Test 3: Unauthenticated request
        success, data = self.test_endpoint(
            "POST", 
            "/payments/customer-portal",
            data=portal_data,
            headers={"Content-Type": "application/json"},  # No auth header
            expected_status=401,
            test_name="Customer Portal Authentication Required"
        )

    def test_refund_endpoint(self):
        """Test POST /server-api/payments/refund - Process Payment Refunds"""
        print("\n💸 Testing Payment Refund Processing...")
        
        # Test 1: Full refund
        refund_data = {
            "paymentIntentId": "pi_test_payment_intent",
            "reason": "requested_by_customer",
            "bookingId": "booking-test-123"
        }
        
        success, data = self.test_endpoint(
            "POST", 
            "/payments/refund",
            data=refund_data,
            test_name="Process Full Refund"
        )
        
        if success and data:
            # Validate response structure
            required_fields = ['success', 'refund', 'refundAmount', 'status']
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                self.log_test("Refund Response Structure", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Refund Response Structure", True, "All required fields present")
        
        # Test 2: Partial refund
        partial_refund_data = {
            "paymentIntentId": "pi_test_payment_intent",
            "amount": 1000,  # $10.00 partial refund
            "reason": "duplicate",
            "bookingId": "booking-test-456"
        }
        
        success, data = self.test_endpoint(
            "POST", 
            "/payments/refund",
            data=partial_refund_data,
            test_name="Process Partial Refund"
        )
        
        # Test 3: Missing payment intent ID
        invalid_data = {
            "reason": "requested_by_customer"
            # Missing paymentIntentId
        }
        
        success, data = self.test_endpoint(
            "POST", 
            "/payments/refund",
            data=invalid_data,
            expected_status=400,
            test_name="Refund Missing Payment Intent ID"
        )
        
        # Test 4: Unauthenticated request
        success, data = self.test_endpoint(
            "POST", 
            "/payments/refund",
            data=refund_data,
            headers={"Content-Type": "application/json"},  # No auth header
            expected_status=401,
            test_name="Refund Authentication Required"
        )

    def test_payment_methods_endpoint(self):
        """Test GET /server-api/payments/methods - Retrieve User Payment Methods"""
        print("\n💳 Testing Payment Methods Retrieval...")
        
        # Test 1: Get user payment methods
        success, data = self.test_endpoint(
            "GET", 
            "/payments/methods",
            test_name="Get User Payment Methods"
        )
        
        if success and data:
            # Validate response structure
            required_fields = ['success', 'paymentMethods', 'hasStripeCustomer']
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                self.log_test("Payment Methods Response Structure", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Payment Methods Response Structure", True, "All required fields present")
                
                # Validate payment methods array
                payment_methods = data.get('paymentMethods', [])
                if isinstance(payment_methods, list):
                    self.log_test("Payment Methods Array", True, f"Found {len(payment_methods)} payment methods")
                else:
                    self.log_test("Payment Methods Array", False, "Payment methods is not an array")
        
        # Test 2: Unauthenticated request
        success, data = self.test_endpoint(
            "GET", 
            "/payments/methods",
            headers={"Content-Type": "application/json"},  # No auth header
            expected_status=401,
            test_name="Payment Methods Authentication Required"
        )

    def test_subscriptions_endpoint(self):
        """Test GET /server-api/payments/subscriptions - Get User Subscriptions"""
        print("\n🔄 Testing Subscriptions Retrieval...")
        
        # Test 1: Get user subscriptions
        success, data = self.test_endpoint(
            "GET", 
            "/payments/subscriptions",
            test_name="Get User Subscriptions"
        )
        
        if success and data:
            # Validate response structure
            required_fields = ['success', 'subscriptions', 'totalSubscriptions', 'activeSubscriptions']
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                self.log_test("Subscriptions Response Structure", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Subscriptions Response Structure", True, "All required fields present")
                
                # Validate subscriptions array
                subscriptions = data.get('subscriptions', [])
                if isinstance(subscriptions, list):
                    self.log_test("Subscriptions Array", True, f"Found {len(subscriptions)} subscriptions")
                    
                    # Check for studio information enrichment
                    if subscriptions and 'studio' in subscriptions[0]:
                        self.log_test("Studio Information Enrichment", True, "Subscriptions include studio details")
                    elif not subscriptions:
                        self.log_test("Studio Information Enrichment", True, "No subscriptions to check (expected for test user)")
                    else:
                        self.log_test("Studio Information Enrichment", False, "Missing studio information in subscriptions")
                else:
                    self.log_test("Subscriptions Array", False, "Subscriptions is not an array")
        
        # Test 2: Unauthenticated request
        success, data = self.test_endpoint(
            "GET", 
            "/payments/subscriptions",
            headers={"Content-Type": "application/json"},  # No auth header
            expected_status=401,
            test_name="Subscriptions Authentication Required"
        )

    def test_xpass_credits_endpoint(self):
        """Test GET /server-api/payments/xpass-credits - Get X Pass Credit Balance"""
        print("\n🎫 Testing X Pass Credits Retrieval...")
        
        # Test 1: Get X Pass credits
        success, data = self.test_endpoint(
            "GET", 
            "/payments/xpass-credits",
            test_name="Get X Pass Credits"
        )
        
        if success and data:
            # Validate response structure
            required_fields = ['success', 'credits', 'recentTransactions']
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                self.log_test("X Pass Credits Response Structure", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("X Pass Credits Response Structure", True, "All required fields present")
                
                # Validate credits structure
                credits = data.get('credits', {})
                expected_credit_fields = ['availableCredits', 'totalEarned', 'totalSpent']
                for field in expected_credit_fields:
                    if field in credits:
                        self.log_test(f"Credits Field: {field}", True, f"Value: {credits[field]}")
                    else:
                        self.log_test(f"Credits Field: {field}", False, f"Missing {field} in credits")
                
                # Validate recent transactions
                transactions = data.get('recentTransactions', [])
                if isinstance(transactions, list):
                    self.log_test("Recent Transactions Array", True, f"Found {len(transactions)} recent transactions")
                else:
                    self.log_test("Recent Transactions Array", False, "Recent transactions is not an array")
        
        # Test 2: Unauthenticated request
        success, data = self.test_endpoint(
            "GET", 
            "/payments/xpass-credits",
            headers={"Content-Type": "application/json"},  # No auth header
            expected_status=401,
            test_name="X Pass Credits Authentication Required"
        )

    def test_transactions_endpoint(self):
        """Test GET /server-api/payments/transactions - Get Transaction History"""
        print("\n📊 Testing Transaction History Retrieval...")
        
        # Test 1: Basic transaction history
        success, data = self.test_endpoint(
            "GET", 
            "/payments/transactions",
            test_name="Get Transaction History"
        )
        
        if success and data:
            # Validate response structure
            required_fields = ['success', 'transactions', 'pagination']
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                self.log_test("Transactions Response Structure", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Transactions Response Structure", True, "All required fields present")
                
                # Validate pagination structure
                pagination = data.get('pagination', {})
                expected_pagination_fields = ['total', 'limit', 'offset', 'hasMore']
                for field in expected_pagination_fields:
                    if field in pagination:
                        self.log_test(f"Pagination Field: {field}", True, f"Value: {pagination[field]}")
                    else:
                        self.log_test(f"Pagination Field: {field}", False, f"Missing {field} in pagination")
        
        # Test 2: Transaction history with filters
        success, data = self.test_endpoint(
            "GET", 
            "/payments/transactions?type=class_booking&limit=10&offset=0",
            test_name="Get Filtered Transaction History"
        )
        
        # Test 3: Different transaction types
        transaction_types = ['class_booking', 'subscription', 'xpass_purchase']
        for tx_type in transaction_types:
            success, data = self.test_endpoint(
                "GET", 
                f"/payments/transactions?type={tx_type}",
                test_name=f"Transaction Type Filter: {tx_type}"
            )
        
        # Test 4: Unauthenticated request
        success, data = self.test_endpoint(
            "GET", 
            "/payments/transactions",
            headers={"Content-Type": "application/json"},  # No auth header
            expected_status=401,
            test_name="Transactions Authentication Required"
        )

    def test_studio_stats_endpoint(self):
        """Test GET /server-api/payments/studio-stats - Studio Revenue Analytics"""
        print("\n📈 Testing Studio Revenue Analytics...")
        
        # Test 1: Studio stats (should fail for non-merchant user)
        success, data = self.test_endpoint(
            "GET", 
            "/payments/studio-stats",
            expected_status=403,  # Expecting access denied for non-merchant
            test_name="Studio Stats Access Control"
        )
        
        # Test 2: Unauthenticated request
        success, data = self.test_endpoint(
            "GET", 
            "/payments/studio-stats",
            headers={"Content-Type": "application/json"},  # No auth header
            expected_status=401,
            test_name="Studio Stats Authentication Required"
        )

    def test_invoice_endpoint(self):
        """Test GET /server-api/payments/invoice/[id] - Get Payment Invoice Details"""
        print("\n🧾 Testing Invoice Details Retrieval...")
        
        # Test 1: Get invoice details
        test_invoice_id = "in_test_invoice_123"
        success, data = self.test_endpoint(
            "GET", 
            f"/payments/invoice/{test_invoice_id}",
            test_name="Get Invoice Details"
        )
        
        if success and data:
            # Validate response structure
            required_fields = ['success', 'invoice']
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                self.log_test("Invoice Response Structure", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Invoice Response Structure", True, "All required fields present")
        
        # Test 2: Invalid invoice ID
        success, data = self.test_endpoint(
            "GET", 
            "/payments/invoice/invalid_invoice_id",
            expected_status=500,  # Expecting error for invalid invoice
            test_name="Invalid Invoice ID Handling"
        )
        
        # Test 3: Unauthenticated request
        success, data = self.test_endpoint(
            "GET", 
            f"/payments/invoice/{test_invoice_id}",
            headers={"Content-Type": "application/json"},  # No auth header
            expected_status=401,
            test_name="Invoice Authentication Required"
        )

    def test_webhook_endpoint(self):
        """Test POST /server-api/payments/webhook - Enhanced Stripe Webhook Handler"""
        print("\n🔗 Testing Stripe Webhook Handler...")
        
        # Note: Webhook testing is limited without actual Stripe webhook signatures
        # We can test the endpoint availability and basic structure
        
        # Test 1: Webhook endpoint availability (will fail signature verification)
        webhook_data = {
            "id": "evt_test_webhook",
            "object": "event",
            "type": "payment_intent.succeeded",
            "data": {
                "object": {
                    "id": "pi_test_payment_intent",
                    "status": "succeeded"
                }
            }
        }
        
        success, data = self.test_endpoint(
            "POST", 
            "/payments/webhook",
            data=webhook_data,
            headers={"Content-Type": "application/json", "stripe-signature": "invalid_signature"},
            expected_status=400,  # Expecting signature verification failure
            test_name="Webhook Signature Verification"
        )
        
        # The webhook endpoint should be available but reject invalid signatures
        if not success and data and 'signature' in str(data.get('error', '')).lower():
            self.log_test("Webhook Endpoint Availability", True, "Webhook endpoint is available and validates signatures")
        else:
            self.log_test("Webhook Endpoint Availability", False, "Webhook endpoint may not be properly configured")

    def run_all_tests(self):
        """Run all payment system tests"""
        print("🚀 Starting Payment & Subscription System Backend API Testing...")
        print(f"Base URL: {BASE_URL}")
        print(f"API Base: {API_BASE}")
        print("=" * 80)
        
        # Test POST endpoints
        self.test_setup_intent_endpoint()
        self.test_create_subscription_endpoint()
        self.test_create_payment_intent_endpoint()
        self.test_purchase_xpass_endpoint()
        self.test_customer_portal_endpoint()
        self.test_refund_endpoint()
        self.test_webhook_endpoint()
        
        # Test GET endpoints
        self.test_payment_methods_endpoint()
        self.test_subscriptions_endpoint()
        self.test_xpass_credits_endpoint()
        self.test_transactions_endpoint()
        self.test_studio_stats_endpoint()
        self.test_invoice_endpoint()
        
        # Print summary
        print("\n" + "=" * 80)
        print("🎯 PAYMENT SYSTEM TEST SUMMARY")
        print("=" * 80)
        print(f"Total Tests: {self.total_tests}")
        print(f"✅ Passed: {self.passed_tests}")
        print(f"❌ Failed: {self.failed_tests}")
        print(f"Success Rate: {(self.passed_tests/self.total_tests*100):.1f}%")
        
        if self.failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if "❌ FAIL" in result["status"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        print("\n💳 KEY FINDINGS:")
        
        # Analyze results by endpoint category
        endpoint_categories = {
            'POST Endpoints': ['setup-intent', 'create-subscription', 'create-payment-intent', 'purchase-xpass', 'customer-portal', 'refund', 'webhook'],
            'GET Endpoints': ['payment-methods', 'subscriptions', 'xpass-credits', 'transactions', 'studio-stats', 'invoice'],
            'Authentication': ['Authentication Required'],
            'Data Validation': ['Response Structure', 'Missing Required Fields', 'Platform Fee']
        }
        
        for category, keywords in endpoint_categories.items():
            category_tests = []
            for result in self.test_results:
                if any(keyword.lower() in result['test'].lower() for keyword in keywords):
                    category_tests.append(result)
            
            if category_tests:
                passed = sum(1 for test in category_tests if "✅ PASS" in test["status"])
                total = len(category_tests)
                rate = (passed/total*100) if total > 0 else 0
                status = "✅" if rate >= 80 else "⚠️" if rate >= 50 else "❌"
                print(f"  {status} {category}: {passed}/{total} tests passed ({rate:.1f}%)")
        
        return self.passed_tests == self.total_tests

if __name__ == "__main__":
    tester = PaymentSystemTester()
    success = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)