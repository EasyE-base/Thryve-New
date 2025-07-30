#!/usr/bin/env python3

"""
Test the POST /instructor/process-payout endpoint specifically
"""

import requests
import json
import os

# Configuration
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://2a46661a-96e4-460d-88d6-00dbfcbebea3.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/server-api"

# Test authentication token (mock Firebase token)
AUTH_TOKEN = "Bearer firebase-test-token"
HEADERS = {
    'Content-Type': 'application/json',
    'Authorization': AUTH_TOKEN
}

def test_process_payout():
    print("🔍 Testing POST /instructor/process-payout")
    print("=" * 50)
    
    # Test 1: Without authentication
    print("\n1. Testing without authentication:")
    try:
        response = requests.post(f"{API_BASE}/instructor/process-payout", 
                               json={}, timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 2: With authentication but no data
    print("\n2. Testing with authentication but no data:")
    try:
        response = requests.post(f"{API_BASE}/instructor/process-payout", 
                               headers=HEADERS, json={}, timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 3: With proper payout data
    print("\n3. Testing with proper payout data:")
    payout_data = {
        "amount": 150.00,
        "payoutType": "scheduled",
        "description": "Weekly payout for classes taught"
    }
    try:
        response = requests.post(f"{API_BASE}/instructor/process-payout", 
                               headers=HEADERS, json=payout_data, timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_process_payout()