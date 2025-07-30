#!/usr/bin/env python3

"""
Test the POST /instructor/process-payout endpoint with correct data
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
    print("🔍 Testing POST /instructor/process-payout with correct data")
    print("=" * 60)
    
    # Test with proper payout data including instructorId
    print("\nTesting with proper payout data:")
    payout_data = {
        "instructorId": "test-instructor-user",  # This was missing!
        "amount": 150.00,
        "payoutType": "scheduled",
        "description": "Weekly payout for classes taught"
    }
    try:
        response = requests.post(f"{API_BASE}/instructor/process-payout", 
                               headers=HEADERS, json=payout_data, timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            print("\nSuccess! Response structure:")
            print(json.dumps(data, indent=2, default=str))
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_process_payout()