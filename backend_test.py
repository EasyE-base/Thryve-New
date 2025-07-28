#!/usr/bin/env python3
"""
Smart Data Importer Backend Testing Suite
Tests the AI-powered data import and analysis endpoints
"""

import requests
import json
import time
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://fc28d640-ef87-49de-b108-ffb68044b135.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/server-api"

# Test authentication token (Firebase Bearer token)
AUTH_TOKEN = "Bearer firebase-test-token"

def log_test(message, status="INFO"):
    """Log test messages with timestamp"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {status}: {message}")

def make_request(method, endpoint, data=None, headers=None):
    """Make HTTP request with proper error handling"""
    url = f"{API_BASE}{endpoint}"
    
    default_headers = {
        "Content-Type": "application/json",
        "Authorization": AUTH_TOKEN
    }
    
    if headers:
        default_headers.update(headers)
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=default_headers, timeout=30)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, headers=default_headers, timeout=30)
        elif method.upper() == "PUT":
            response = requests.put(url, json=data, headers=default_headers, timeout=30)
        elif method.upper() == "DELETE":
            response = requests.delete(url, headers=default_headers, timeout=30)
        
        return response
    except requests.exceptions.RequestException as e:
        log_test(f"Request failed: {str(e)}", "ERROR")
        return None

def test_authentication():
    """Test authentication requirements"""
    log_test("Testing authentication requirements...")
    
    # Test without authentication
    response = requests.post(f"{API_BASE}/import/analyze", 
                           json={"fileContent": "test", "fileName": "test.csv"},
                           timeout=10)
    
    if response.status_code == 401:
        log_test("✅ Authentication correctly required (401 for unauthenticated requests)", "SUCCESS")
        return True
    else:
        log_test(f"❌ Authentication not properly enforced. Got status: {response.status_code}", "ERROR")
        return False

def test_data_importer_parse_endpoint():
    """Test the specific endpoint mentioned in review request"""
    log_test("Testing POST /server-api/data-importer/parse endpoint...")
    
    sample_data = {
        "fileContent": "Name,Email,Phone\nJohn Doe,john@example.com,555-1234\nJane Smith,jane@example.com,555-5678",
        "fileName": "customers.csv"
    }
    
    response = make_request("POST", "/data-importer/parse", sample_data)
    
    if response is None:
        log_test("❌ Request failed - network error", "ERROR")
        return False
    
    if response.status_code == 404:
        log_test("❌ CRITICAL: POST /server-api/data-importer/parse endpoint NOT FOUND (404)", "ERROR")
        log_test("   This endpoint was mentioned in the review request but is not implemented", "ERROR")
        return False
    elif response.status_code == 200:
        log_test("✅ POST /server-api/data-importer/parse endpoint exists and responds", "SUCCESS")
        return True
    else:
        log_test(f"❌ Unexpected response status: {response.status_code}", "ERROR")
        return False

def test_data_importer_import_endpoint():
    """Test the specific endpoint mentioned in review request"""
    log_test("Testing POST /server-api/data-importer/import endpoint...")
    
    sample_data = {
        "fileContent": "Name,Email,Phone\nJohn Doe,john@example.com,555-1234",
        "mappings": [
            {"originalHeader": "Name", "suggestedField": "customer_name", "category": "customer"},
            {"originalHeader": "Email", "suggestedField": "email", "category": "customer"}
        ],
        "importConfig": {"batchSize": 100}
    }
    
    response = make_request("POST", "/data-importer/import", sample_data)
    
    if response is None:
        log_test("❌ Request failed - network error", "ERROR")
        return False
    
    if response.status_code == 404:
        log_test("❌ CRITICAL: POST /server-api/data-importer/import endpoint NOT FOUND (404)", "ERROR")
        log_test("   This endpoint was mentioned in the review request but is not implemented", "ERROR")
        return False
    elif response.status_code == 200:
        log_test("✅ POST /server-api/data-importer/import endpoint exists and responds", "SUCCESS")
        return True
    else:
        log_test(f"❌ Unexpected response status: {response.status_code}", "ERROR")
        return False

def test_import_analyze_endpoint():
    """Test the actual implemented analyze endpoint"""
    log_test("Testing POST /server-api/import/analyze endpoint (actual implementation)...")
    
    # Sample CSV data for fitness studio
    sample_csv = """Client Name,Email Address,Phone Number,Join Date,Membership Type
John Doe,john.doe@email.com,555-0123,2024-01-15,Premium
Jane Smith,jane.smith@email.com,555-0124,2024-01-16,Basic
Mike Johnson,mike.j@email.com,555-0125,2024-01-17,Premium
Sarah Wilson,sarah.w@email.com,555-0126,2024-01-18,Standard"""
    
    test_data = {
        "fileContent": sample_csv,
        "fileName": "studio_customers.csv"
    }
    
    response = make_request("POST", "/import/analyze", test_data)
    
    if response is None:
        log_test("❌ Request failed - network error", "ERROR")
        return False
    
    if response.status_code == 200:
        try:
            data = response.json()
            log_test("✅ Import analyze endpoint working correctly", "SUCCESS")
            
            # Validate response structure
            if "analysis" in data:
                analysis = data["analysis"]
                log_test(f"   📊 File type detected: {analysis.get('fileType', 'unknown')}", "INFO")
                log_test(f"   🎯 Confidence: {analysis.get('confidence', 0)}", "INFO")
                log_test(f"   🏢 Platform detected: {analysis.get('detectedPlatform', 'unknown')}", "INFO")
                log_test(f"   📋 Field mappings: {len(analysis.get('fieldMappings', []))}", "INFO")
                
                # Check for AI-powered analysis
                if data.get("aiPowered"):
                    log_test("   🧠 AI-powered analysis confirmed", "SUCCESS")
                
                return True
            else:
                log_test("❌ Response missing 'analysis' field", "ERROR")
                return False
                
        except json.JSONDecodeError:
            log_test("❌ Invalid JSON response", "ERROR")
            return False
    else:
        log_test(f"❌ Analyze endpoint failed with status: {response.status_code}", "ERROR")
        if response.text:
            log_test(f"   Error details: {response.text}", "ERROR")
        return False

def test_import_validate_endpoint():
    """Test field mapping validation endpoint"""
    log_test("Testing POST /server-api/import/validate endpoint...")
    
    sample_mappings = [
        {
            "originalHeader": "Client Name",
            "suggestedField": "customer_name",
            "category": "customer",
            "confidence": 0.95,
            "dataType": "string",
            "required": True
        },
        {
            "originalHeader": "Email Address", 
            "suggestedField": "email",
            "category": "customer",
            "confidence": 0.98,
            "dataType": "string",
            "required": True
        }
    ]
    
    test_data = {"mappings": sample_mappings}
    
    response = make_request("POST", "/import/validate", test_data)
    
    if response is None:
        log_test("❌ Request failed - network error", "ERROR")
        return False
    
    if response.status_code == 200:
        try:
            data = response.json()
            validation = data.get("validation", {})
            
            log_test("✅ Import validate endpoint working correctly", "SUCCESS")
            log_test(f"   ✓ Validation result: {'VALID' if validation.get('valid') else 'INVALID'}", "INFO")
            log_test(f"   ⏱️ Estimated time: {validation.get('estimatedImportTime', 'unknown')}", "INFO")
            log_test(f"   📊 Mappings count: {data.get('mappingsCount', 0)}", "INFO")
            
            return True
        except json.JSONDecodeError:
            log_test("❌ Invalid JSON response", "ERROR")
            return False
    else:
        log_test(f"❌ Validate endpoint failed with status: {response.status_code}", "ERROR")
        return False

def test_import_execute_endpoint():
    """Test data import execution endpoint"""
    log_test("Testing POST /server-api/import/execute endpoint...")
    
    sample_csv = "Name,Email\nTest User,test@example.com"
    sample_mappings = [
        {
            "originalHeader": "Name",
            "suggestedField": "customer_name",
            "category": "customer"
        },
        {
            "originalHeader": "Email",
            "suggestedField": "email", 
            "category": "customer"
        }
    ]
    
    test_data = {
        "fileContent": sample_csv,
        "mappings": sample_mappings,
        "importConfig": {
            "batchSize": 100,
            "fileName": "test_import.csv"
        }
    }
    
    response = make_request("POST", "/import/execute", test_data)
    
    if response is None:
        log_test("❌ Request failed - network error", "ERROR")
        return False
    
    if response.status_code == 200:
        try:
            data = response.json()
            result = data.get("result", {})
            
            log_test("✅ Import execute endpoint working correctly", "SUCCESS")
            log_test(f"   📊 Total records: {result.get('totalRecords', 0)}", "INFO")
            log_test(f"   ✅ Successful imports: {result.get('successfulImports', 0)}", "INFO")
            log_test(f"   ❌ Failed imports: {result.get('failedImports', 0)}", "INFO")
            log_test(f"   ⏱️ Execution time: {result.get('executionTime', 0)}ms", "INFO")
            
            if data.get("aiPowered"):
                log_test("   🧠 AI-powered import confirmed", "SUCCESS")
            
            return True
        except json.JSONDecodeError:
            log_test("❌ Invalid JSON response", "ERROR")
            return False
    else:
        log_test(f"❌ Execute endpoint failed with status: {response.status_code}", "ERROR")
        if response.text:
            log_test(f"   Error details: {response.text}", "ERROR")
        return False

def test_openai_integration():
    """Test OpenAI API integration for intelligent analysis"""
    log_test("Testing OpenAI integration for AI-powered data analysis...")
    
    # Complex CSV with fitness studio data to test AI analysis
    complex_csv = """Client ID,Full Name,Email,Phone,Membership Start,Package Type,Classes Attended,Last Visit
C001,John Doe,john@email.com,555-1234,2024-01-15,Unlimited Monthly,12,2024-01-30
C002,Jane Smith,jane@email.com,555-5678,2024-01-20,10-Class Pack,8,2024-01-29
C003,Mike Johnson,mike@email.com,555-9012,2024-01-25,Drop-in,1,2024-01-25"""
    
    test_data = {
        "fileContent": complex_csv,
        "fileName": "complex_studio_data.csv"
    }
    
    response = make_request("POST", "/import/analyze", test_data)
    
    if response is None:
        log_test("❌ Request failed - network error", "ERROR")
        return False
    
    if response.status_code == 200:
        try:
            data = response.json()
            analysis = data.get("analysis", {})
            
            # Check for AI-specific features
            field_mappings = analysis.get("fieldMappings", [])
            quality_issues = analysis.get("dataQualityIssues", [])
            recommended_actions = analysis.get("recommendedActions", [])
            
            log_test("✅ OpenAI integration working - complex analysis completed", "SUCCESS")
            log_test(f"   🎯 Detected platform: {analysis.get('detectedPlatform', 'unknown')}", "INFO")
            log_test(f"   📋 Field mappings generated: {len(field_mappings)}", "INFO")
            log_test(f"   ⚠️ Quality issues identified: {len(quality_issues)}", "INFO")
            log_test(f"   💡 Recommended actions: {len(recommended_actions)}", "INFO")
            
            # Check confidence scores (AI should provide high confidence for clear fields)
            high_confidence_mappings = [m for m in field_mappings if m.get("confidence", 0) >= 0.8]
            log_test(f"   🎯 High confidence mappings: {len(high_confidence_mappings)}/{len(field_mappings)}", "INFO")
            
            return True
        except json.JSONDecodeError:
            log_test("❌ Invalid JSON response", "ERROR")
            return False
    else:
        log_test(f"❌ OpenAI integration test failed with status: {response.status_code}", "ERROR")
        return False

def test_error_handling():
    """Test error handling and validation"""
    log_test("Testing error handling and validation...")
    
    # Test missing required fields
    response = make_request("POST", "/import/analyze", {})
    if response and response.status_code == 400:
        log_test("✅ Proper validation for missing required fields", "SUCCESS")
    else:
        log_test("❌ Missing field validation not working properly", "ERROR")
        return False
    
    # Test invalid file content
    response = make_request("POST", "/import/analyze", {
        "fileContent": "",
        "fileName": "empty.csv"
    })
    if response and response.status_code in [400, 500]:
        log_test("✅ Proper handling of invalid file content", "SUCCESS")
    else:
        log_test("❌ Invalid file content handling not working", "ERROR")
        return False
    
    # Test invalid mappings
    response = make_request("POST", "/import/validate", {
        "mappings": "invalid"
    })
    if response and response.status_code == 400:
        log_test("✅ Proper validation for invalid mappings format", "SUCCESS")
    else:
        log_test("❌ Invalid mappings validation not working", "ERROR")
        return False
    
    return True

def test_file_upload_functionality():
    """Test file upload capabilities with different file types"""
    log_test("Testing file upload functionality with different formats...")
    
    # Test CSV format
    csv_data = "Name,Email,Phone\nJohn Doe,john@example.com,555-1234"
    response = make_request("POST", "/import/analyze", {
        "fileContent": csv_data,
        "fileName": "test.csv"
    })
    
    if response and response.status_code == 200:
        log_test("✅ CSV file format supported", "SUCCESS")
    else:
        log_test("❌ CSV file format not properly supported", "ERROR")
        return False
    
    # Test Excel-like format (CSV with different structure)
    excel_like_data = "Client Name;Email Address;Phone Number\nJohn Doe;john@example.com;555-1234"
    response = make_request("POST", "/import/analyze", {
        "fileContent": excel_like_data,
        "fileName": "test.xlsx"
    })
    
    if response and response.status_code in [200, 400]:  # 400 is acceptable for unsupported format
        log_test("✅ Excel file format handling implemented", "SUCCESS")
    else:
        log_test("❌ Excel file format handling not working", "ERROR")
        return False
    
    return True

def run_comprehensive_tests():
    """Run all Smart Data Importer tests"""
    log_test("🚀 Starting Smart Data Importer Backend Testing Suite", "INFO")
    log_test("=" * 60, "INFO")
    
    test_results = []
    
    # Test authentication
    test_results.append(("Authentication", test_authentication()))
    
    # Test specific endpoints mentioned in review request
    test_results.append(("Data Importer Parse Endpoint", test_data_importer_parse_endpoint()))
    test_results.append(("Data Importer Import Endpoint", test_data_importer_import_endpoint()))
    
    # Test actual implemented endpoints
    test_results.append(("Import Analyze Endpoint", test_import_analyze_endpoint()))
    test_results.append(("Import Validate Endpoint", test_import_validate_endpoint()))
    test_results.append(("Import Execute Endpoint", test_import_execute_endpoint()))
    
    # Test AI integration
    test_results.append(("OpenAI Integration", test_openai_integration()))
    
    # Test error handling
    test_results.append(("Error Handling", test_error_handling()))
    
    # Test file upload functionality
    test_results.append(("File Upload Functionality", test_file_upload_functionality()))
    
    # Summary
    log_test("=" * 60, "INFO")
    log_test("📊 TEST RESULTS SUMMARY", "INFO")
    log_test("=" * 60, "INFO")
    
    passed = 0
    failed = 0
    
    for test_name, result in test_results:
        status = "✅ PASS" if result else "❌ FAIL"
        log_test(f"{test_name}: {status}", "INFO")
        if result:
            passed += 1
        else:
            failed += 1
    
    log_test("=" * 60, "INFO")
    log_test(f"Total Tests: {len(test_results)}", "INFO")
    log_test(f"Passed: {passed}", "SUCCESS" if passed > 0 else "INFO")
    log_test(f"Failed: {failed}", "ERROR" if failed > 0 else "INFO")
    
    if failed > 0:
        log_test("❌ CRITICAL ISSUES FOUND - See details above", "ERROR")
        return False
    else:
        log_test("✅ ALL TESTS PASSED - Smart Data Importer is working correctly", "SUCCESS")
        return True

if __name__ == "__main__":
    success = run_comprehensive_tests()
    sys.exit(0 if success else 1)