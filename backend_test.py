#!/usr/bin/env python3
"""
Comprehensive Backend Testing for Search & Discovery Engine
Tests the newly implemented search and discovery API endpoints
"""

import requests
import json
import time
import sys
from datetime import datetime, timedelta

# Configuration
BASE_URL = "https://c965f60f-b3cc-49e1-9021-e1c5bd50d222.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/server-api"

# Test authentication token (mock Firebase token for testing)
AUTH_TOKEN = "Bearer firebase-test-user"
HEADERS = {
    "Authorization": AUTH_TOKEN,
    "Content-Type": "application/json"
}

class SearchDiscoveryTester:
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

    def test_discover_recommendations(self):
        """Test GET /server-api/discover/recommendations - AI-Powered Personalized Recommendations"""
        print("\n🔍 Testing AI-Powered Personalized Recommendations...")
        
        # Test 1: Basic personalized recommendations
        success, data = self.test_endpoint(
            "GET", 
            "/discover/recommendations",
            test_name="Basic Personalized Recommendations"
        )
        
        if success and data:
            # Validate response structure
            required_fields = ['success', 'recommendations', 'meta', 'personalizedFor']
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                self.log_test("Response Structure Validation", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Response Structure Validation", True, "All required fields present")
                
                # Validate recommendations array
                if isinstance(data.get('recommendations'), list):
                    self.log_test("Recommendations Array", True, f"Found {len(data['recommendations'])} recommendations")
                else:
                    self.log_test("Recommendations Array", False, "Recommendations is not an array")
        
        # Test 2: Different recommendation types
        recommendation_types = ['personalized', 'trending', 'similar_users', 'time_based', 'goal_based', 'location_based']
        for rec_type in recommendation_types:
            success, data = self.test_endpoint(
                "GET", 
                f"/discover/recommendations?type={rec_type}&limit=5",
                test_name=f"Recommendation Type: {rec_type}"
            )
            
        # Test 3: Authentication required
        success, data = self.test_endpoint(
            "GET", 
            "/discover/recommendations",
            headers={"Content-Type": "application/json"},  # No auth header
            expected_status=401,
            test_name="Authentication Required Check"
        )

    def test_search_classes(self):
        """Test GET /server-api/search/classes - Advanced Class Search with Filtering"""
        print("\n🔍 Testing Advanced Class Search...")
        
        # Test 1: Basic search
        success, data = self.test_endpoint(
            "GET", 
            "/search/classes",
            test_name="Basic Class Search"
        )
        
        if success and data:
            # Validate response structure
            required_fields = ['success', 'results', 'total', 'query']
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                self.log_test("Search Response Structure", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Search Response Structure", True, "All required fields present")
        
        # Test 2: Text search
        success, data = self.test_endpoint(
            "GET", 
            "/search/classes?q=yoga",
            test_name="Text Search - Yoga"
        )
        
        # Test 3: Category filtering
        success, data = self.test_endpoint(
            "GET", 
            "/search/classes?category=fitness",
            test_name="Category Filter - Fitness"
        )
        
        # Test 4: Level filtering
        success, data = self.test_endpoint(
            "GET", 
            "/search/classes?level=beginner",
            test_name="Level Filter - Beginner"
        )
        
        # Test 5: Date range filtering
        start_date = datetime.now().strftime("%Y-%m-%d")
        end_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        success, data = self.test_endpoint(
            "GET", 
            f"/search/classes?startDate={start_date}&endDate={end_date}",
            test_name="Date Range Filter"
        )
        
        # Test 6: Time of day filtering
        success, data = self.test_endpoint(
            "GET", 
            "/search/classes?timeOfDay=morning",
            test_name="Time of Day Filter - Morning"
        )
        
        # Test 7: Available only filtering
        success, data = self.test_endpoint(
            "GET", 
            "/search/classes?availableOnly=true",
            test_name="Available Only Filter"
        )
        
        # Test 8: Sort options
        sort_options = ['date', 'popularity', 'rating', 'price']
        for sort_by in sort_options:
            success, data = self.test_endpoint(
                "GET", 
                f"/search/classes?sortBy={sort_by}",
                test_name=f"Sort By: {sort_by}"
            )
        
        # Test 9: Combined filters
        success, data = self.test_endpoint(
            "GET", 
            "/search/classes?q=pilates&category=fitness&level=intermediate&availableOnly=true&sortBy=rating&limit=10",
            test_name="Combined Filters Search"
        )

    def test_search_suggestions(self):
        """Test GET /server-api/discover/search/suggestions - Smart Autocomplete and Search Suggestions"""
        print("\n🔍 Testing Smart Search Suggestions...")
        
        # Test 1: Basic suggestions
        success, data = self.test_endpoint(
            "GET", 
            "/discover/search/suggestions?q=yo",
            test_name="Basic Search Suggestions"
        )
        
        if success and data:
            # Validate response structure
            required_fields = ['success', 'suggestions', 'query', 'totalSuggestions']
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                self.log_test("Suggestions Response Structure", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Suggestions Response Structure", True, "All required fields present")
                
                # Validate suggestions structure
                suggestions = data.get('suggestions', {})
                expected_categories = ['classes', 'instructors', 'studios', 'categories']
                for category in expected_categories:
                    if category in suggestions:
                        self.log_test(f"Suggestions Category: {category}", True, f"Found {len(suggestions[category])} {category}")
                    else:
                        self.log_test(f"Suggestions Category: {category}", False, f"Missing {category} category")
        
        # Test 2: Different search terms
        search_terms = ['yoga', 'hiit', 'pilates', 'dance', 'strength']
        for term in search_terms:
            success, data = self.test_endpoint(
                "GET", 
                f"/discover/search/suggestions?q={term}",
                test_name=f"Suggestions for: {term}"
            )
        
        # Test 3: Short query (should return empty)
        success, data = self.test_endpoint(
            "GET", 
            "/discover/search/suggestions?q=a",
            test_name="Short Query Handling"
        )
        
        # Test 4: Limit parameter
        success, data = self.test_endpoint(
            "GET", 
            "/discover/search/suggestions?q=fitness&limit=5",
            test_name="Limit Parameter"
        )
        
        # Test 5: No authentication required (public endpoint)
        success, data = self.test_endpoint(
            "GET", 
            "/discover/search/suggestions?q=yoga",
            headers={"Content-Type": "application/json"},  # No auth header
            test_name="Public Access Check"
        )

    def test_discover_trending(self):
        """Test GET /server-api/discover/trending - Trending Content Discovery"""
        print("\n🔍 Testing Trending Content Discovery...")
        
        # Test 1: Basic trending content
        success, data = self.test_endpoint(
            "GET", 
            "/discover/trending",
            test_name="Basic Trending Content"
        )
        
        if success and data:
            # Validate response structure
            required_fields = ['success', 'trending']
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                self.log_test("Trending Response Structure", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Trending Response Structure", True, "All required fields present")
                
                # Validate trending structure
                trending = data.get('trending', {})
                if 'classes' in trending and 'studios' in trending:
                    self.log_test("Trending Content Types", True, f"Found {len(trending.get('classes', []))} trending classes and {len(trending.get('studios', []))} trending studios")
                else:
                    self.log_test("Trending Content Types", False, "Missing classes or studios in trending data")
        
        # Test 2: Category filtering
        success, data = self.test_endpoint(
            "GET", 
            "/discover/trending?category=fitness",
            test_name="Trending with Category Filter"
        )
        
        # Test 3: Time range filtering
        time_ranges = ['7days', '30days']
        for time_range in time_ranges:
            success, data = self.test_endpoint(
                "GET", 
                f"/discover/trending?timeRange={time_range}",
                test_name=f"Trending Time Range: {time_range}"
            )
        
        # Test 4: Limit parameter
        success, data = self.test_endpoint(
            "GET", 
            "/discover/trending?limit=5",
            test_name="Trending with Limit"
        )
        
        # Test 5: Combined parameters
        success, data = self.test_endpoint(
            "GET", 
            "/discover/trending?category=yoga&timeRange=7days&limit=8",
            test_name="Trending with Combined Parameters"
        )
        
        # Test 6: No authentication required (public endpoint)
        success, data = self.test_endpoint(
            "GET", 
            "/discover/trending",
            headers={"Content-Type": "application/json"},  # No auth header
            test_name="Trending Public Access Check"
        )

    def test_analytics_search_event(self):
        """Test POST /server-api/analytics/search-event - Search Analytics Event Recording"""
        print("\n🔍 Testing Search Analytics Event Recording...")
        
        # Test 1: Basic search event recording (authenticated)
        search_event_data = {
            "query": "yoga classes near me",
            "searchType": "text",
            "results": {
                "total": 15,
                "categories": {"classes": 12, "instructors": 2, "studios": 1},
                "responseTime": 245
            },
            "sessionId": f"test-session-{int(time.time())}",
            "filters": {"category": "yoga", "location": "downtown"},
            "userAgent": "Mozilla/5.0 (Test Browser)",
            "referrer": "https://thryve.com/search"
        }
        
        success, data = self.test_endpoint(
            "POST", 
            "/analytics/search-event",
            data=search_event_data,
            test_name="Basic Search Event Recording (Authenticated)"
        )
        
        if success and data:
            # Validate response structure
            required_fields = ['success', 'message', 'eventId', 'sessionId']
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                self.log_test("Search Event Response Structure", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Search Event Response Structure", True, "All required fields present")
        
        # Test 2: Click-through event recording
        click_event_data = {
            "clickedResult": {
                "id": "class-123",
                "type": "class",
                "name": "Morning Yoga Flow",
                "position": 3,
                "source": "search_results"
            },
            "sessionId": f"test-session-{int(time.time())}",
            "userAgent": "Mozilla/5.0 (Test Browser)"
        }
        
        success, data = self.test_endpoint(
            "POST", 
            "/analytics/search-event",
            data=click_event_data,
            test_name="Click-through Event Recording"
        )
        
        # Test 3: Anonymous user tracking
        anonymous_event_data = {
            "query": "pilates classes",
            "searchType": "text",
            "results": {"total": 8},
            "sessionId": f"anonymous-session-{int(time.time())}"
        }
        
        success, data = self.test_endpoint(
            "POST", 
            "/analytics/search-event",
            data=anonymous_event_data,
            headers={"Content-Type": "application/json"},  # No auth header
            test_name="Anonymous User Tracking"
        )
        
        # Test 4: Different search types
        search_types = ['text', 'voice', 'filter', 'suggestion']
        for search_type in search_types:
            event_data = {
                "query": f"test query for {search_type}",
                "searchType": search_type,
                "results": {"total": 5},
                "sessionId": f"test-{search_type}-{int(time.time())}"
            }
            
            success, data = self.test_endpoint(
                "POST", 
                "/analytics/search-event",
                data=event_data,
                test_name=f"Search Type: {search_type}"
            )
        
        # Test 5: Validation - missing required data
        invalid_data = {
            "sessionId": "test-session"
            # Missing query and clickedResult
        }
        
        success, data = self.test_endpoint(
            "POST", 
            "/analytics/search-event",
            data=invalid_data,
            expected_status=400,
            test_name="Validation - Missing Required Data"
        )

    def test_discover_reviews(self):
        """Test GET /server-api/discover/reviews - Class Ratings and Reviews"""
        print("\n🔍 Testing Class Ratings and Reviews...")
        
        # Test 1: Basic reviews retrieval
        success, data = self.test_endpoint(
            "GET", 
            "/discover/reviews",
            test_name="Basic Reviews Retrieval"
        )
        
        if success and data:
            # Validate response structure
            required_fields = ['success', 'reviews', 'statistics', 'filters']
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                self.log_test("Reviews Response Structure", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Reviews Response Structure", True, "All required fields present")
                
                # Validate statistics structure
                stats = data.get('statistics', {})
                expected_stats = ['averageRating', 'totalReviews', 'ratingDistribution']
                for stat in expected_stats:
                    if stat in stats:
                        self.log_test(f"Statistics Field: {stat}", True, f"Value: {stats[stat]}")
                    else:
                        self.log_test(f"Statistics Field: {stat}", False, f"Missing {stat} in statistics")
        
        # Test 2: Filter by class ID
        success, data = self.test_endpoint(
            "GET", 
            "/discover/reviews?classId=test-class-123",
            test_name="Filter by Class ID"
        )
        
        # Test 3: Filter by instructor ID
        success, data = self.test_endpoint(
            "GET", 
            "/discover/reviews?instructorId=instructor-456",
            test_name="Filter by Instructor ID"
        )
        
        # Test 4: Filter by studio ID
        success, data = self.test_endpoint(
            "GET", 
            "/discover/reviews?studioId=studio-789",
            test_name="Filter by Studio ID"
        )
        
        # Test 5: Sort options
        sort_options = ['recent', 'rating', 'helpful']
        for sort_by in sort_options:
            success, data = self.test_endpoint(
                "GET", 
                f"/discover/reviews?sortBy={sort_by}",
                test_name=f"Sort Reviews by: {sort_by}"
            )
        
        # Test 6: Limit parameter
        success, data = self.test_endpoint(
            "GET", 
            "/discover/reviews?limit=5",
            test_name="Reviews with Limit"
        )
        
        # Test 7: Combined filters
        success, data = self.test_endpoint(
            "GET", 
            "/discover/reviews?classId=test-class&sortBy=rating&limit=10",
            test_name="Combined Review Filters"
        )
        
        # Test 8: No authentication required (public endpoint)
        success, data = self.test_endpoint(
            "GET", 
            "/discover/reviews",
            headers={"Content-Type": "application/json"},  # No auth header
            test_name="Reviews Public Access Check"
        )

    def test_database_integration(self):
        """Test database integration and data persistence"""
        print("\n🔍 Testing Database Integration...")
        
        # Test that endpoints are properly connected to MongoDB
        # This is implicitly tested through the other endpoint tests
        # but we can add specific checks here
        
        # Test 1: Health check
        success, data = self.test_endpoint(
            "GET", 
            "/health",
            headers={"Content-Type": "application/json"},  # No auth needed
            test_name="API Health Check"
        )
        
        # Test 2: Test endpoint
        success, data = self.test_endpoint(
            "GET", 
            "/test",
            headers={"Content-Type": "application/json"},  # No auth needed
            test_name="API Test Endpoint"
        )

    def run_all_tests(self):
        """Run all search and discovery tests"""
        print("🚀 Starting Search & Discovery Engine Backend API Testing...")
        print(f"Base URL: {BASE_URL}")
        print(f"API Base: {API_BASE}")
        print("=" * 80)
        
        # Run all test suites
        self.test_database_integration()
        self.test_discover_recommendations()
        self.test_search_classes()
        self.test_search_suggestions()
        self.test_discover_trending()
        self.test_analytics_search_event()
        self.test_discover_reviews()
        
        # Print summary
        print("\n" + "=" * 80)
        print("🎯 SEARCH & DISCOVERY ENGINE TEST SUMMARY")
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
        
        print("\n🔍 KEY FINDINGS:")
        
        # Analyze results by endpoint
        endpoints_tested = {
            'discover/recommendations': 0,
            'search/classes': 0,
            'discover/search/suggestions': 0,
            'discover/trending': 0,
            'analytics/search-event': 0,
            'discover/reviews': 0
        }
        
        endpoints_passed = {key: 0 for key in endpoints_tested.keys()}
        
        for result in self.test_results:
            for endpoint in endpoints_tested.keys():
                if endpoint.replace('/', '_') in result['test'].lower() or endpoint in result['test'].lower():
                    endpoints_tested[endpoint] += 1
                    if "✅ PASS" in result["status"]:
                        endpoints_passed[endpoint] += 1
        
        for endpoint, total in endpoints_tested.items():
            if total > 0:
                passed = endpoints_passed[endpoint]
                rate = (passed/total*100) if total > 0 else 0
                status = "✅" if rate >= 80 else "⚠️" if rate >= 50 else "❌"
                print(f"  {status} {endpoint}: {passed}/{total} tests passed ({rate:.1f}%)")
        
        return self.passed_tests == self.total_tests

if __name__ == "__main__":
    tester = SearchDiscoveryTester()
    success = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)