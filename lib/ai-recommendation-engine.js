/**
 * AI-Powered Recommendation Engine for Thryve Platform
 * Provides personalized class and studio recommendations based on user behavior,
 * preferences, and advanced machine learning algorithms
 */

export class AIRecommendationEngine {
  constructor() {
    this.RECOMMENDATION_TYPES = {
      PERSONALIZED: 'personalized',
      TRENDING: 'trending',
      SIMILAR_USERS: 'similar_users',
      TIME_BASED: 'time_based',
      GOAL_BASED: 'goal_based',
      LOCATION_BASED: 'location_based'
    }

    this.PREFERENCE_WEIGHTS = {
      fitnessGoals: 0.25,
      preferredTimes: 0.20,
      classTypes: 0.25,
      intensityLevel: 0.15,
      location: 0.10,
      priceRange: 0.05
    }

    this.BEHAVIOR_WEIGHTS = {
      recentBookings: 0.30,
      completedClasses: 0.25,
      cancelledClasses: -0.10,
      ratings: 0.20,
      searchHistory: 0.15
    }
  }

  /**
   * Generate personalized recommendations for a user
   */
  async generatePersonalizedRecommendations(userId, userProfile, options = {}) {
    try {
      console.log(`🤖 Generating personalized recommendations for user: ${userId}`)
      
      const {
        limit = 10,
        includeBooked = false,
        timeRange = '7days',
        recommendationType = this.RECOMMENDATION_TYPES.PERSONALIZED
      } = options

      // Get user preferences from onboarding data
      const preferences = await this.extractUserPreferences(userProfile)
      
      // Get user behavior data
      const behaviorData = await this.getUserBehaviorData(userId)
      
      // Get available classes
      const availableClasses = await this.getAvailableClasses(userId, {
        includeBooked,
        timeRange
      })

      // Calculate recommendation scores
      const scoredRecommendations = await this.calculateRecommendationScores(
        availableClasses,
        preferences,
        behaviorData,
        recommendationType
      )

      // Sort and limit results
      const recommendations = scoredRecommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(rec => ({
          ...rec,
          recommendationReason: this.generateRecommendationReason(rec),
          confidence: Math.min(rec.score, 1.0)
        }))

      return {
        recommendations,
        meta: {
          userId,
          recommendationType,
          generatedAt: new Date(),
          totalScored: scoredRecommendations.length,
          userPreferences: preferences,
          behaviorInsights: this.generateBehaviorInsights(behaviorData)
        }
      }

    } catch (error) {
      console.error('Recommendation generation error:', error)
      throw new Error(`Failed to generate recommendations: ${error.message}`)
    }
  }

  /**
   * Extract user preferences from onboarding and profile data
   */
  async extractUserPreferences(userProfile) {
    const preferences = {
      fitnessGoals: [],
      preferredTimes: [],
      classTypes: [],
      intensityLevel: 'moderate',
      location: null,
      priceRange: { min: 0, max: 100 },
      healthRestrictions: [],
      experienceLevel: 'beginner'
    }

    // Extract from onboarding data
    if (userProfile.onboardingData) {
      const onboarding = userProfile.onboardingData
      
      preferences.fitnessGoals = onboarding.fitnessGoals || []
      preferences.preferredTimes = onboarding.preferredTimes || []
      preferences.classTypes = onboarding.classTypes || []
      preferences.intensityLevel = onboarding.intensityLevel || 'moderate'
      preferences.healthRestrictions = onboarding.healthRestrictions || []
      preferences.experienceLevel = onboarding.experienceLevel || 'beginner'
    }

    // Extract from profile preferences
    if (userProfile.preferences) {
      Object.assign(preferences, userProfile.preferences)
    }

    // Set default preferences if none exist
    if (preferences.fitnessGoals.length === 0) {
      preferences.fitnessGoals = ['general-fitness', 'stress-relief']
    }

    if (preferences.classTypes.length === 0) {
      preferences.classTypes = ['yoga', 'fitness', 'cardio']
    }

    return preferences
  }

  /**
   * Get user behavior data for recommendations
   */
  async getUserBehaviorData(userId) {
    // This would typically come from database queries
    // For now, we'll structure the expected data format
    
    return {
      recentBookings: [], // Last 30 days bookings
      completedClasses: [], // Successfully attended classes
      cancelledClasses: [], // Cancelled bookings
      ratings: [], // User's class ratings
      searchHistory: [], // Recent search queries
      favoriteInstructors: [], // Highly rated instructors
      preferredStudios: [], // Frequently booked studios
      timePatterns: {}, // When user typically books classes
      categoryPreferences: {}, // Which categories user books most
      lastActivity: new Date()
    }
  }

  /**
   * Get available classes for recommendation
   */
  async getAvailableClasses(userId, options = {}) {
    const { includeBooked = false, timeRange = '7days' } = options
    
    // Calculate date range
    const startDate = new Date()
    const endDate = new Date()
    
    switch (timeRange) {
      case '1day':
        endDate.setDate(endDate.getDate() + 1)
        break
      case '3days':
        endDate.setDate(endDate.getDate() + 3)
        break
      case '7days':
        endDate.setDate(endDate.getDate() + 7)
        break
      case '30days':
        endDate.setDate(endDate.getDate() + 30)
        break
    }

    // This would be a database query in real implementation
    // For now, return structure that would come from class schedules
    return [
      // Example class structure - would come from database
      // {
      //   id: 'class_id',
      //   name: 'Morning Yoga Flow',
      //   category: 'yoga',
      //   level: 'beginner',
      //   duration: 60,
      //   price: 25,
      //   instructorId: 'instructor_id',
      //   instructorName: 'Sarah Johnson',
      //   studioId: 'studio_id',
      //   studioName: 'Harmony Studio',
      //   startTime: '2025-01-30T09:00:00Z',
      //   availableSpots: 5,
      //   totalCapacity: 20,
      //   tags: ['morning', 'flow', 'mindful'],
      //   rating: 4.8,
      //   reviewCount: 45
      // }
    ]
  }

  /**
   * Calculate recommendation scores for classes
   */
  async calculateRecommendationScores(classes, preferences, behaviorData, recommendationType) {
    const scoredClasses = []

    for (const classItem of classes) {
      let score = 0
      const scoreComponents = {}

      // Preference-based scoring
      scoreComponents.preferences = this.calculatePreferenceScore(classItem, preferences)
      score += scoreComponents.preferences * 0.4

      // Behavior-based scoring
      scoreComponents.behavior = this.calculateBehaviorScore(classItem, behaviorData)
      score += scoreComponents.behavior * 0.3

      // Popularity and quality scoring
      scoreComponents.quality = this.calculateQualityScore(classItem)
      score += scoreComponents.quality * 0.2

      // Time and availability scoring
      scoreComponents.availability = this.calculateAvailabilityScore(classItem)
      score += scoreComponents.availability * 0.1

      // Type-specific adjustments
      switch (recommendationType) {
        case this.RECOMMENDATION_TYPES.TRENDING:
          score += this.calculateTrendingBonus(classItem)
          break
        case this.RECOMMENDATION_TYPES.TIME_BASED:
          score += this.calculateTimeRelevanceBonus(classItem, preferences)
          break
        case this.RECOMMENDATION_TYPES.GOAL_BASED:
          score += this.calculateGoalAlignmentBonus(classItem, preferences)
          break
      }

      scoredClasses.push({
        ...classItem,
        score: Math.max(0, Math.min(1, score)), // Normalize between 0-1
        scoreComponents
      })
    }

    return scoredClasses
  }

  /**
   * Calculate preference-based score
   */
  calculatePreferenceScore(classItem, preferences) {
    let score = 0

    // Fitness goals alignment
    if (preferences.fitnessGoals.length > 0) {
      const goalAlignment = this.calculateGoalAlignment(classItem, preferences.fitnessGoals)
      score += goalAlignment * this.PREFERENCE_WEIGHTS.fitnessGoals
    }

    // Class type preference
    if (preferences.classTypes.includes(classItem.category)) {
      score += this.PREFERENCE_WEIGHTS.classTypes
    }

    // Time preference
    const timeScore = this.calculateTimePreferenceScore(classItem, preferences.preferredTimes)
    score += timeScore * this.PREFERENCE_WEIGHTS.preferredTimes

    // Intensity level match
    const intensityScore = this.calculateIntensityScore(classItem, preferences.intensityLevel)
    score += intensityScore * this.PREFERENCE_WEIGHTS.intensityLevel

    // Price preference
    const priceScore = this.calculatePriceScore(classItem.price, preferences.priceRange)
    score += priceScore * this.PREFERENCE_WEIGHTS.priceRange

    return score
  }

  /**
   * Calculate behavior-based score
   */
  calculateBehaviorScore(classItem, behaviorData) {
    let score = 0

    // Instructor preference based on history
    if (behaviorData.favoriteInstructors.includes(classItem.instructorId)) {
      score += 0.3
    }

    // Studio preference
    if (behaviorData.preferredStudios.includes(classItem.studioId)) {
      score += 0.2
    }

    // Category preference from booking history
    const categoryScore = behaviorData.categoryPreferences[classItem.category] || 0
    score += categoryScore * 0.3

    // Time pattern alignment
    const timePatternScore = this.calculateTimePatternScore(classItem, behaviorData.timePatterns)
    score += timePatternScore * 0.2

    return score
  }

  /**
   * Calculate quality and popularity score
   */
  calculateQualityScore(classItem) {
    let score = 0

    // Class rating
    if (classItem.rating) {
      score += (classItem.rating / 5.0) * 0.5
    }

    // Review count (social proof)
    if (classItem.reviewCount) {
      const reviewScore = Math.min(classItem.reviewCount / 100, 1.0) * 0.3
      score += reviewScore
    }

    // Instructor rating
    if (classItem.instructorRating) {
      score += (classItem.instructorRating / 5.0) * 0.2
    }

    return score
  }

  /**
   * Calculate availability and timing score
   */
  calculateAvailabilityScore(classItem) {
    let score = 0

    // Availability ratio
    if (classItem.availableSpots && classItem.totalCapacity) {
      const availabilityRatio = classItem.availableSpots / classItem.totalCapacity
      score += availabilityRatio * 0.5
    }

    // Time until class (prefer sooner but not too soon)
    const now = new Date()
    const classTime = new Date(classItem.startTime)
    const hoursUntilClass = (classTime - now) / (1000 * 60 * 60)

    if (hoursUntilClass >= 2 && hoursUntilClass <= 48) {
      score += 0.5
    } else if (hoursUntilClass > 48 && hoursUntilClass <= 168) {
      score += 0.3
    }

    return score
  }

  /**
   * Helper methods for specific calculations
   */
  calculateGoalAlignment(classItem, fitnessGoals) {
    const goalMappings = {
      'weight-loss': ['hiit', 'cardio', 'strength'],
      'muscle-gain': ['strength', 'pilates', 'functional'],
      'flexibility': ['yoga', 'pilates', 'stretching'],
      'stress-relief': ['yoga', 'meditation', 'restorative'],
      'endurance': ['cardio', 'cycling', 'running'],
      'general-fitness': ['fitness', 'hiit', 'functional']
    }

    let alignment = 0
    fitnessGoals.forEach(goal => {
      const relevantCategories = goalMappings[goal] || []
      if (relevantCategories.includes(classItem.category)) {
        alignment += 1 / fitnessGoals.length
      }
    })

    return alignment
  }

  calculateTimePreferenceScore(classItem, preferredTimes) {
    if (!preferredTimes || preferredTimes.length === 0) return 0.5

    const classTime = new Date(classItem.startTime)
    const hour = classTime.getHours()

    const timeSlotMapping = {
      'morning': [6, 7, 8, 9, 10, 11],
      'afternoon': [12, 13, 14, 15, 16, 17],
      'evening': [18, 19, 20, 21],
      'night': [22, 23, 0, 1, 2, 3, 4, 5]
    }

    for (const preferredTime of preferredTimes) {
      const timeSlots = timeSlotMapping[preferredTime] || []
      if (timeSlots.includes(hour)) {
        return 1.0
      }
    }

    return 0.2 // Some score for non-preferred times
  }

  calculateIntensityScore(classItem, preferredIntensity) {
    const intensityMapping = {
      'low': ['restorative', 'gentle', 'beginner'],
      'moderate': ['intermediate', 'all-levels', 'moderate'],
      'high': ['advanced', 'intense', 'challenging']
    }

    const classIntensityCategories = intensityMapping[classItem.level] || []
    const preferredCategories = intensityMapping[preferredIntensity] || []

    return classIntensityCategories.some(cat => preferredCategories.includes(cat)) ? 1.0 : 0.3
  }

  calculatePriceScore(classPrice, priceRange) {
    if (!priceRange || !classPrice) return 0.5

    if (classPrice >= priceRange.min && classPrice <= priceRange.max) {
      return 1.0
    } else if (classPrice < priceRange.min) {
      return 0.8 // Cheaper is still good
    } else {
      // Price is above range, decrease score based on how much over
      const overAmount = classPrice - priceRange.max
      const overPercentage = overAmount / priceRange.max
      return Math.max(0.1, 1.0 - overPercentage)
    }
  }

  calculateTimePatternScore(classItem, timePatterns) {
    if (!timePatterns || Object.keys(timePatterns).length === 0) return 0.5

    const classTime = new Date(classItem.startTime)
    const dayOfWeek = classTime.getDay()
    const hour = classTime.getHours()

    const dayScore = timePatterns[dayOfWeek] || 0
    const hourScore = timePatterns[`hour_${hour}`] || 0

    return (dayScore + hourScore) / 2
  }

  /**
   * Generate human-readable recommendation reason
   */
  generateRecommendationReason(recommendation) {
    const reasons = []
    const { scoreComponents } = recommendation

    if (scoreComponents.preferences > 0.7) {
      reasons.push("Matches your fitness preferences")
    }

    if (scoreComponents.behavior > 0.6) {
      reasons.push("Similar to classes you've enjoyed")
    }

    if (scoreComponents.quality > 0.8) {
      reasons.push("Highly rated by other members")
    }

    if (recommendation.availableSpots <= 3) {
      reasons.push("Filling up fast - only a few spots left")
    }

    if (reasons.length === 0) {
      reasons.push("Popular choice for your fitness level")
    }

    return reasons.join(" • ")
  }

  /**
   * Generate behavior insights for user
   */
  generateBehaviorInsights(behaviorData) {
    const insights = []

    if (behaviorData.favoriteInstructors.length > 0) {
      insights.push(`You prefer classes with ${behaviorData.favoriteInstructors.length} specific instructors`)
    }

    if (behaviorData.preferredStudios.length > 0) {
      insights.push(`You frequently book at ${behaviorData.preferredStudios.length} studios`)
    }

    const topCategory = Object.keys(behaviorData.categoryPreferences)
      .sort((a, b) => behaviorData.categoryPreferences[b] - behaviorData.categoryPreferences[a])[0]
    
    if (topCategory) {
      insights.push(`Your most booked category is ${topCategory}`)
    }

    return insights
  }

  /**
   * Calculate bonus scores for different recommendation types
   */
  calculateTrendingBonus(classItem) {
    // This would be based on recent booking trends
    const bookingTrend = classItem.recentBookingTrend || 0
    return Math.min(bookingTrend / 100, 0.2)
  }

  calculateTimeRelevanceBonus(classItem, preferences) {
    // Boost classes happening at user's preferred times
    const timeScore = this.calculateTimePreferenceScore(classItem, preferences.preferredTimes)
    return timeScore * 0.1
  }

  calculateGoalAlignmentBonus(classItem, preferences) {
    // Boost classes that strongly align with user's fitness goals
    const goalScore = this.calculateGoalAlignment(classItem, preferences.fitnessGoals)
    return goalScore * 0.15
  }

  /**
   * Generate similar user recommendations
   */
  async generateSimilarUserRecommendations(userId, userProfile, options = {}) {
    // This would implement collaborative filtering
    // Find users with similar preferences and booking patterns
    // Recommend classes they've enjoyed that the current user hasn't tried
    
    return this.generatePersonalizedRecommendations(userId, userProfile, {
      ...options,
      recommendationType: this.RECOMMENDATION_TYPES.SIMILAR_USERS
    })
  }

  /**
   * Generate trending recommendations
   */
  async generateTrendingRecommendations(options = {}) {
    const { limit = 10, timeRange = '7days', category = null } = options

    // This would query for classes with highest booking rates, ratings, and growth
    return {
      recommendations: [],
      meta: {
        recommendationType: this.RECOMMENDATION_TYPES.TRENDING,
        generatedAt: new Date(),
        timeRange,
        category
      }
    }
  }
}

export default new AIRecommendationEngine()