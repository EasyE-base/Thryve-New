#!/usr/bin/env python3

"""
Debug test to understand the actual response structure of Phase 6 endpoints
"""

import requests
import json
import os

# Configuration
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://e78daffd-6e74-489a-b028-31f9276233bb.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/server-api"

# Test authentication token (mock Firebase token)
AUTH_TOKEN = "Bearer firebase-test-token"
HEADERS = {
    'Content-Type': 'application/json',
    'Authorization': AUTH_TOKEN
}

def test_endpoint(endpoint_path, description):
    print(f"\n=== Testing {description} ===")
    print(f"URL: {API_BASE}{endpoint_path}")
    
    try:
        response = requests.get(f"{API_BASE}{endpoint_path}", headers=HEADERS, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("Response Structure:")
            print(json.dumps(data, indent=2, default=str))
        else:
            print(f"Error Response: {response.text}")
            
    except Exception as e:
        print(f"Request failed: {str(e)}")

if __name__ == "__main__":
    print("🔍 PHASE 6 INSTRUCTOR PAYOUT SYSTEM - DEBUG TESTING")
    print("=" * 80)
    
    # Test each endpoint to see actual response structure
    endpoints = [
        ("/instructor/payout-dashboard", "Instructor Payout Dashboard"),
        ("/instructor/earnings-history", "Instructor Earnings History"),
        ("/instructor/payout-transactions", "Instructor Payout Transactions"),
        ("/instructor/performance-analytics", "Instructor Performance Analytics"),
        ("/instructor/tax-documents?year=2024", "Instructor Tax Documents"),
        ("/studio/instructor-payouts", "Studio Instructor Payouts")
    ]
    
    for endpoint, description in endpoints:
        test_endpoint(endpoint, description)
        
    print("\n" + "=" * 80)
    print("Debug testing completed!")