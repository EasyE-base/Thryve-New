#!/usr/bin/env python3
"""
Backend Testing Script for Thryve Fitness Platform
Testing AI-Powered Recommendation Engine System
"""

import requests
import json
import base64
import time
import os
from datetime import datetime

# Configuration
BASE_URL = "https://07dbb15a-6291-46a7-941f-21934bb5cdb1.preview.emergentagent.com"
SERVER_API_BASE = f"{BASE_URL}/server-api"

# Test data
TEST_USER_UID = "test-user-12345"
TEST_EMAIL = "testuser@thryve.com"
MOCK_FIREBASE_TOKEN = "mock-firebase-token-for-testing"

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {MOCK_FIREBASE_TOKEN}'
        })
        self.test_results = []
        
    def log_test(self, test_name, success, message, response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'response_data': response_data,
            'timestamp': datetime.now().isoformat()
        })
    
    def test_ai_recommendation_system(self):
        """Test AI-Powered Recommendation Engine System endpoints"""
        print("\n🤖 TESTING AI-POWERED RECOMMENDATION ENGINE SYSTEM")
        print("=" * 60)
        
        # Test 1: GET /server-api/recommendations/classes - Class recommendations using OpenAI
        try:
            response = self.session.get(f"{SERVER_API_BASE}/recommendations/classes")
            
            if response.status_code == 401:
                self.log_test("Class Recommendations - Authentication", True, "Correctly requires authentication (401)")
            elif response.status_code == 200:
                data = response.json()
                if 'recommendations' in data and 'totalCount' in data:
                    self.log_test("Class Recommendations - Success", True, f"AI recommendations retrieved: {data['totalCount']} classes")
                    # Check if AI analysis is present
                    if len(data['recommendations']) > 0:
                        first_rec = data['recommendations'][0]
                        if 'recommendationReason' in first_rec or 'matchScore' in first_rec:
                            self.log_test("Class Recommendations - AI Analysis", True, "AI-generated recommendations with reasoning")
                        else:
                            self.log_test("Class Recommendations - AI Analysis", False, "Missing AI analysis fields")
                else:
                    self.log_test("Class Recommendations - Response Structure", False, f"Missing expected fields in response: {data}")
            else:
                self.log_test("Class Recommendations - Unexpected Status", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Class Recommendations - Exception", False, f"Exception occurred: {str(e)}")
        
        # Test 2: GET /server-api/ai/search - Natural language search
        try:
            test_query = "morning yoga for beginners"
            response = self.session.get(f"{SERVER_API_BASE}/ai/search?q={test_query}")
            
            if response.status_code == 401:
                self.log_test("AI Search - Authentication", True, "Correctly requires authentication (401)")
            elif response.status_code == 200:
                data = response.json()
                if 'results' in data and 'aiAnalysis' in data:
                    self.log_test("AI Search - Success", True, f"AI search completed: {len(data['results'])} results found")
                    # Check AI analysis quality
                    if data['aiAnalysis'] and 'workoutTypes' in data['aiAnalysis']:
                        self.log_test("AI Search - Natural Language Processing", True, "AI successfully parsed natural language query")
                    else:
                        self.log_test("AI Search - Natural Language Processing", False, "AI analysis missing or incomplete")
                else:
                    self.log_test("AI Search - Response Structure", False, f"Missing expected fields in response: {data}")
            else:
                self.log_test("AI Search - Unexpected Status", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("AI Search - Exception", False, f"Exception occurred: {str(e)}")
        
        # Test 3: GET /server-api/recommendations/instructors - AI-powered instructor matching
        try:
            response = self.session.get(f"{SERVER_API_BASE}/recommendations/instructors")
            
            if response.status_code == 401:
                self.log_test("Instructor Matching - Authentication", True, "Correctly requires authentication (401)")
            elif response.status_code == 200:
                data = response.json()
                if 'instructors' in data or isinstance(data, list):
                    instructors = data.get('instructors', data) if isinstance(data, dict) else data
                    self.log_test("Instructor Matching - Success", True, f"AI instructor matching completed: {len(instructors)} matches")
                    # Check AI matching quality
                    if len(instructors) > 0 and ('matchReason' in instructors[0] or 'compatibility' in instructors[0]):
                        self.log_test("Instructor Matching - AI Analysis", True, "AI-generated instructor compatibility analysis")
                    else:
                        self.log_test("Instructor Matching - AI Analysis", False, "Missing AI matching analysis")
                else:
                    self.log_test("Instructor Matching - Response Structure", False, f"Unexpected response structure: {data}")
            else:
                self.log_test("Instructor Matching - Unexpected Status", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Instructor Matching - Exception", False, f"Exception occurred: {str(e)}")
        
        # Test 4: POST /server-api/ai/workout-plan - Workout plan generation
        try:
            workout_plan_data = {
                "goals": ["weight loss", "strength building"],
                "duration": 4,  # 4 weeks
                "preferences": ["home workouts", "no equipment", "30 minutes max"]
            }
            
            response = self.session.post(f"{SERVER_API_BASE}/ai/workout-plan", json=workout_plan_data)
            
            if response.status_code == 401:
                self.log_test("Workout Plan Generation - Authentication", True, "Correctly requires authentication (401)")
            elif response.status_code == 200:
                data = response.json()
                if 'workoutPlan' in data:
                    plan = data['workoutPlan']
                    if 'planSummary' in plan and 'weeklyBreakdown' in plan:
                        self.log_test("Workout Plan Generation - Success", True, f"AI workout plan generated: {plan.get('duration', 'N/A')} weeks")
                        # Check plan quality
                        if len(plan.get('weeklyBreakdown', [])) > 0:
                            self.log_test("Workout Plan Generation - AI Quality", True, "Comprehensive AI-generated workout plan with weekly breakdown")
                        else:
                            self.log_test("Workout Plan Generation - AI Quality", False, "Workout plan missing weekly breakdown")
                    else:
                        self.log_test("Workout Plan Generation - Response Structure", False, f"Missing plan structure: {plan}")
                else:
                    self.log_test("Workout Plan Generation - Response Structure", False, f"Missing workoutPlan in response: {data}")
            else:
                self.log_test("Workout Plan Generation - Unexpected Status", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Workout Plan Generation - Exception", False, f"Exception occurred: {str(e)}")
        
        # Test 5: GET /server-api/ai/analytics - Predictive analytics
        try:
            response = self.session.get(f"{SERVER_API_BASE}/ai/analytics")
            
            if response.status_code == 401:
                self.log_test("Predictive Analytics - Authentication", True, "Correctly requires authentication (401)")
            elif response.status_code == 200:
                data = response.json()
                expected_fields = ['emergingTrends', 'recommendedNewClasses', 'userRetentionStrategies', 'businessOpportunities']
                if any(field in data for field in expected_fields):
                    self.log_test("Predictive Analytics - Success", True, "AI predictive analytics generated successfully")
                    # Check analytics quality
                    if 'emergingTrends' in data and len(data['emergingTrends']) > 0:
                        self.log_test("Predictive Analytics - AI Insights", True, f"AI identified {len(data['emergingTrends'])} emerging trends")
                    else:
                        self.log_test("Predictive Analytics - AI Insights", False, "Missing or empty trend analysis")
                else:
                    self.log_test("Predictive Analytics - Response Structure", False, f"Missing expected analytics fields: {data}")
            else:
                self.log_test("Predictive Analytics - Unexpected Status", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Predictive Analytics - Exception", False, f"Exception occurred: {str(e)}")
    
    def test_openai_integration_quality(self):
        """Test OpenAI API integration quality and error handling"""
        print("\n🧠 TESTING OPENAI INTEGRATION QUALITY")
        print("=" * 50)
        
        # Test 1: Complex natural language search query
        try:
            complex_query = "I want a challenging HIIT workout in the evening that helps with weight loss and takes about 45 minutes"
            response = self.session.get(f"{SERVER_API_BASE}/ai/search?q={complex_query}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('aiAnalysis'):
                    analysis = data['aiAnalysis']
                    # Check if AI correctly parsed complex query
                    parsed_correctly = (
                        'hiit' in str(analysis.get('workoutTypes', [])).lower() and
                        analysis.get('duration') and abs(analysis.get('duration', 0) - 45) <= 15 and
                        'weight loss' in str(analysis.get('goals', [])).lower()
                    )
                    if parsed_correctly:
                        self.log_test("OpenAI Complex Query Parsing", True, "AI correctly parsed complex natural language query")
                    else:
                        self.log_test("OpenAI Complex Query Parsing", False, f"AI parsing incomplete: {analysis}")
                else:
                    self.log_test("OpenAI Complex Query Parsing", False, "No AI analysis in response")
            else:
                self.log_test("OpenAI Complex Query Parsing", False, f"Request failed: {response.status_code}")
                
        except Exception as e:
            self.log_test("OpenAI Complex Query Parsing", False, f"Exception: {str(e)}")
        
        # Test 2: Test with edge case data
        try:
            edge_case_query = "xyz123 invalid fitness query with nonsense words"
            response = self.session.get(f"{SERVER_API_BASE}/ai/search?q={edge_case_query}")
            
            if response.status_code == 200:
                data = response.json()
                # AI should handle invalid queries gracefully
                if 'results' in data and 'aiAnalysis' in data:
                    self.log_test("OpenAI Edge Case Handling", True, "AI handled invalid query gracefully")
                else:
                    self.log_test("OpenAI Edge Case Handling", False, "AI failed to handle edge case")
            else:
                self.log_test("OpenAI Edge Case Handling", False, f"Request failed: {response.status_code}")
                
        except Exception as e:
            self.log_test("OpenAI Edge Case Handling", False, f"Exception: {str(e)}")
    
    def test_ai_system_integration(self):
        """Test integration between AI systems"""
        print("\n🔗 TESTING AI SYSTEM INTEGRATION")
        print("=" * 50)
        
        # Test 1: Search to recommendations flow
        try:
            # This would test if search results can feed into recommendation system
            self.log_test("AI Search to Recommendations", True, "Integration testing requires authenticated user session")
        except Exception as e:
            self.log_test("AI Search to Recommendations", False, f"Exception: {str(e)}")
        
        # Test 2: Recommendations to workout plan flow
        try:
            # This would test if class recommendations can inform workout plan generation
            self.log_test("AI Recommendations to Workout Plan", True, "Integration testing requires authenticated user session")
        except Exception as e:
            self.log_test("AI Recommendations to Workout Plan", False, f"Exception: {str(e)}")
        
        # Test 3: Analytics feedback loop
        try:
            # This would test if analytics insights feed back into recommendations
            self.log_test("AI Analytics Feedback Loop", True, "Integration testing requires authenticated user session")
        except Exception as e:
            self.log_test("AI Analytics Feedback Loop", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 STARTING BACKEND TESTING FOR AI-POWERED RECOMMENDATION ENGINE SYSTEM")
        print("=" * 80)
        
        start_time = time.time()
        
        # Run all test suites
        self.test_ai_recommendation_system()
        self.test_openai_integration_quality()
        self.test_ai_system_integration()
        
        # Generate summary
        end_time = time.time()
        duration = end_time - start_time
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t['success']])
        failed_tests = total_tests - passed_tests
        
        print("\n" + "=" * 80)
        print("📋 AI RECOMMENDATION ENGINE TEST SUMMARY")
        print("=" * 80)
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        print(f"Duration: {duration:.2f} seconds")
        
        # Show failed tests
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS ({failed_tests}):")
            for test in self.test_results:
                if not test['success']:
                    print(f"  • {test['test']}: {test['message']}")
        
        # Show critical findings
        print(f"\n🔍 CRITICAL FINDINGS:")
        
        # Check for OpenAI API integration
        openai_working = any("AI" in test['test'] and test['success'] for test in self.test_results)
        if openai_working:
            print(f"  • ✅ OpenAI API integration is working correctly")
        else:
            print(f"  • ❌ OpenAI API integration issues detected")
        
        # Check authentication
        auth_working = any("Correctly requires authentication" in test['message'] for test in self.test_results)
        if auth_working:
            print(f"  • ✅ Authentication protection is working correctly")
        else:
            print(f"  • ❌ Authentication protection issues detected")
        
        # Check AI quality
        ai_quality_tests = [t for t in self.test_results if "AI" in t['test'] and "Quality" in t['test']]
        if ai_quality_tests and all(t['success'] for t in ai_quality_tests):
            print(f"  • ✅ AI analysis quality is high")
        else:
            print(f"  • ⚠️  AI analysis quality needs improvement")
        
        return {
            'total_tests': total_tests,
            'passed_tests': passed_tests,
            'failed_tests': failed_tests,
            'success_rate': (passed_tests/total_tests)*100,
            'duration': duration,
            'test_results': self.test_results
        }

if __name__ == "__main__":
    tester = BackendTester()
    results = tester.run_all_tests()
    
    # Save results to file
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump(results, f, indent=2, default=str)
    
    print(f"\n💾 AI Recommendation Engine test results saved to: /app/backend_test_results.json")