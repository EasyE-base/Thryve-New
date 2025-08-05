import openai from '@/lib/openai'

// Import the connectDB function from the server-api file since it's already available there
async function connectDB() {
  const { MongoClient } = await import('mongodb')
  const client = new MongoClient(process.env.MONGO_URL)
  await client.connect()
  return client.db(process.env.DB_NAME)
}

export async function getPersonalizedClassRecommendations(userId, userProfile = null) {
  try {
    console.log('🤖 Starting personalized class recommendations for user:', userId)
    const database = await connectDB()
    
    // Get user profile if not provided
    let profile = userProfile
    if (!profile) {
      profile = await database.collection('profiles').findOne({ userId })
    }
    
    if (!profile) {
      console.log('📝 No user profile found, returning general recommendations')
      // Return general recommendations for new users
      return await getGeneralRecommendations()
    }

    console.log('👤 User profile found:', profile.name || 'Unknown')

    // Get user's class history
    const classHistory = await database.collection('bookings').find({
      customerId: userId,
      status: 'completed'
    }).toArray()

    // Get available classes
    const availableClasses = await database.collection('studio_classes').find({
      startTime: { $gte: new Date() }
    }).limit(20).toArray()

    console.log('📚 Found', classHistory.length, 'completed classes and', availableClasses.length, 'available classes')

    // Create AI prompt for personalized recommendations
    const prompt = `
Based on this user profile, recommend 5 fitness classes from the available options:

USER PROFILE:
- Name: ${profile.name || 'User'}
- Role: ${profile.role || 'customer'}
- Fitness Goals: ${profile.fitnessGoals || 'General fitness'}
- Experience Level: ${profile.experienceLevel || 'Beginner'}
- Preferred Workout Types: ${profile.preferredWorkouts || 'Various'}
- Available Time Slots: ${profile.availableTimeSlots || 'Flexible'}

COMPLETED CLASSES (${classHistory.length} total):
${classHistory.slice(0, 5).map(booking => `- ${booking.className || 'Unknown Class'}`).join('\n')}

AVAILABLE CLASSES:
${availableClasses.map(cls => `- ID: ${cls.id}, Name: ${cls.className}, Type: ${cls.classType || 'fitness'}, Duration: ${cls.duration || 60}min, Level: ${cls.difficultyLevel || 'All levels'}, Time: ${new Date(cls.startTime).toLocaleString()}`).join('\n')}

Please recommend 5 classes that best match the user's profile and preferences. 
Format as JSON with a "recommendations" array containing objects with:
- classId (string)
- reason (string - detailed explanation why this class is recommended)
- matchScore (number 1-10 - how well it matches user preferences)
    `

    console.log('🧠 Calling OpenAI API...')

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are a fitness expert AI that provides personalized class recommendations based on user profiles, fitness goals, and class history. Always respond with valid JSON." 
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000
    })

    console.log('✅ OpenAI API response received, usage:', response.usage)

    const recommendations = JSON.parse(response.choices[0].message.content)
    console.log('📊 Parsed recommendations:', recommendations.recommendations?.length || 0, 'items')
    
    // Enhance recommendations with full class details
    const enhancedRecommendations = []
    for (const rec of recommendations.recommendations || []) {
      const classDetails = availableClasses.find(cls => cls.id === rec.classId)
      if (classDetails) {
        enhancedRecommendations.push({
          ...classDetails,
          recommendationReason: rec.reason,
          matchScore: rec.matchScore || 8,
          aiGenerated: true
        })
      }
    }

    console.log('🎯 Enhanced recommendations:', enhancedRecommendations.length, 'final items')
    return enhancedRecommendations.slice(0, 5)
  } catch (error) {
    console.error('❌ Error getting personalized recommendations:', error.message)
    console.error('Full error:', error)
    return await getGeneralRecommendations()
  }
}

export async function getInstructorMatches(userId, userProfile = null) {
  try {
    const database = await connectDB()
    
    // Get user profile
    let profile = userProfile
    if (!profile) {
      profile = await database.collection('profiles').findOne({ userId })
    }

    if (!profile) {
      return []
    }

    // Get all instructors
    const instructors = await database.collection('profiles').find({
      role: 'instructor'
    }).toArray()

    // Get user's class history with instructors
    const classHistory = await database.collection('bookings').find({
      customerId: userId,
      status: 'completed'
    }).toArray()

    const prompt = `
Based on this user profile, recommend 3 fitness instructors from the available options:

USER PROFILE:
- Fitness Goals: ${profile.fitnessGoals || 'General fitness'}
- Experience Level: ${profile.experienceLevel || 'Beginner'}
- Preferred Workout Types: ${profile.preferredWorkouts || 'Various'}
- Personality Preference: ${profile.instructorPreference || 'Motivating and supportive'}

PAST INSTRUCTOR EXPERIENCES:
${classHistory.map(booking => `- Instructor: ${booking.instructorName || 'Unknown'}, Class: ${booking.className || 'Unknown'}, Rating: ${booking.rating || 'N/A'}`).join('\n')}

AVAILABLE INSTRUCTORS:
${instructors.map(instructor => `- ID: ${instructor.userId}, Name: ${instructor.name}, Specialties: ${instructor.specialties || 'General fitness'}, Experience: ${instructor.yearsExperience || 'N/A'} years, Bio: ${instructor.bio || 'No bio'}`).join('\n')}

Please recommend 3 instructors that best match the user's preferences and goals.
Format as JSON array with objects containing:
- instructorId (string)
- reason (string - detailed explanation why this instructor is recommended)
- compatibility (number 1-10 - how compatible they are with the user)
    `

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are a fitness expert AI that matches users with compatible instructors based on personalities, goals, and teaching styles. Always respond with valid JSON." 
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1500
    })

    const matches = JSON.parse(response.choices[0].message.content)
    
    // Enhance matches with full instructor details
    const enhancedMatches = []
    for (const match of matches.instructors || []) {
      const instructorDetails = instructors.find(inst => inst.userId === match.instructorId)
      if (instructorDetails) {
        enhancedMatches.push({
          ...instructorDetails,
          matchReason: match.reason,
          compatibility: match.compatibility || 8,
          aiGenerated: true
        })
      }
    }

    return enhancedMatches.slice(0, 3)
  } catch (error) {
    console.error('Error getting instructor matches:', error)
    return []
  }
}

export async function naturalLanguageSearch(query, userId = null) {
  try {
    const database = await connectDB()
    
    // Store search query if user is logged in
    if (userId) {
      await database.collection('search_queries').insertOne({
        userId,
        query,
        timestamp: new Date()
      })
    }

    const prompt = `
Convert this natural language fitness search query into structured search parameters:

Query: "${query}"

Analyze the query and extract:
- workoutTypes (array of strings like "yoga", "hiit", "pilates", "strength", "cardio", etc.)
- difficultyLevel (string: "beginner", "intermediate", "advanced", or null)
- duration (number in minutes, or null if not specified)
- timeOfDay (string: "morning", "afternoon", "evening", or null)
- goals (array of strings like "weight loss", "strength building", "flexibility", "endurance")
- keywords (array of strings for general search)
- intensity (string: "low", "moderate", "high", or null)

Format as JSON object with these exact keys.
    `

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are a fitness search assistant that converts natural language queries into structured search parameters for a fitness class database. Always respond with valid JSON." 
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 800
    })

    const searchParams = JSON.parse(response.choices[0].message.content)
    
    // Build MongoDB query based on AI analysis
    const mongoQuery = {}
    
    if (searchParams.workoutTypes && searchParams.workoutTypes.length > 0) {
      mongoQuery.classType = { $in: searchParams.workoutTypes.map(type => new RegExp(type, 'i')) }
    }
    
    if (searchParams.difficultyLevel) {
      const difficultyMap = {
        "beginner": { $lte: 3 },
        "intermediate": { $gte: 4, $lte: 7 },
        "advanced": { $gte: 8 }
      }
      mongoQuery.difficultyLevel = difficultyMap[searchParams.difficultyLevel.toLowerCase()]
    }
    
    if (searchParams.duration) {
      mongoQuery.duration = { 
        $gte: searchParams.duration - 15, 
        $lte: searchParams.duration + 15 
      }
    }
    
    if (searchParams.intensity) {
      const intensityMap = {
        "low": { $lte: 4 },
        "moderate": { $gte: 5, $lte: 7 },
        "high": { $gte: 8 }
      }
      mongoQuery.intensityLevel = intensityMap[searchParams.intensity.toLowerCase()]
    }
    
    if (searchParams.keywords && searchParams.keywords.length > 0) {
      const keywordRegex = searchParams.keywords.map(keyword => new RegExp(keyword, 'i'))
      mongoQuery.$or = [
        { className: { $in: keywordRegex } },
        { description: { $in: keywordRegex } },
        { tags: { $in: searchParams.keywords } }
      ]
    }

    // Only search for future classes
    mongoQuery.startTime = { $gte: new Date() }
    
    // Execute search
    const results = await database.collection('studio_classes')
      .find(mongoQuery)
      .limit(12)
      .sort({ startTime: 1 })
      .toArray()

    // Add AI analysis metadata to results
    return {
      results,
      aiAnalysis: searchParams,
      totalFound: results.length,
      query: query
    }
  } catch (error) {
    console.error('Error in natural language search:', error)
    return { results: [], aiAnalysis: null, totalFound: 0, query }
  }
}

export async function getPredictiveAnalytics() {
  try {
    const database = await connectDB()
    
    // Get usage data
    const [classBookings, searchQueries, userProfiles] = await Promise.all([
      database.collection('bookings').aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: "$className", count: { $sum: 1 }, avgRating: { $avg: "$rating" } } },
        { $sort: { count: -1 } },
        { $limit: 15 }
      ]).toArray(),
      
      database.collection('search_queries').aggregate([
        { $match: { timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: "$query", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]).toArray(),
      
      database.collection('profiles').find({ role: 'customer' }).toArray()
    ])

    const prompt = `
Based on this fitness platform usage data, provide predictive analytics and business insights:

TOP CLASS BOOKINGS (Last 30 days):
${classBookings.map(c => `- ${c._id}: ${c.count} bookings, Avg Rating: ${c.avgRating?.toFixed(1) || 'N/A'}`).join('\n')}

TOP SEARCH QUERIES (Last 7 days):
${searchQueries.map(q => `- "${q._id}": ${q.count} searches`).join('\n')}

USER BASE:
- Total Customers: ${userProfiles.length}
- New Users (Last 30 days): ${userProfiles.filter(u => new Date(u.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}

Provide strategic insights formatted as JSON with:
- emergingTrends (array of strings - fitness trends gaining popularity)
- recommendedNewClasses (array of objects with title, description, and reasoning)
- userRetentionStrategies (array of strings - actionable retention strategies)
- peakUsagePredictions (object with predictedBusyDays and predictedBusyTimes)
- businessOpportunities (array of strings - revenue optimization suggestions)
- marketInsights (array of strings - broader fitness industry insights)
    `

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are a fitness business analytics AI that provides strategic insights, trend analysis, and predictive recommendations for fitness platforms. Always respond with valid JSON." 
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.6,
      max_tokens: 2500
    })

    const analytics = JSON.parse(response.choices[0].message.content)
    
    return {
      ...analytics,
      dataSnapshot: {
        totalBookings: classBookings.reduce((sum, c) => sum + c.count, 0),
        totalSearches: searchQueries.reduce((sum, q) => sum + q.count, 0),
        totalUsers: userProfiles.length,
        analysisDate: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error getting predictive analytics:', error)
    return {
      emergingTrends: ["AI-powered fitness recommendations", "Hybrid online-offline classes"],
      recommendedNewClasses: [
        { title: "AI Guided Workout", description: "Personalized workout sessions guided by AI", reasoning: "Growing interest in tech-enhanced fitness" }
      ],
      userRetentionStrategies: ["Personalized class recommendations", "Achievement tracking"],
      peakUsagePredictions: { predictedBusyDays: "Weekday evenings", predictedBusyTimes: "6-8 PM" },
      businessOpportunities: ["Premium AI coaching tier", "Corporate wellness packages"],
      marketInsights: ["Increasing demand for personalized fitness experiences"],
      dataSnapshot: {
        totalBookings: 0,
        totalSearches: 0,
        totalUsers: 0,
        analysisDate: new Date().toISOString()
      }
    }
  }
}

export async function generateWorkoutPlan(userId, goals, duration, preferences) {
  try {
    const database = await connectDB()
    
    // Get user profile and fitness history
    const [userProfile, classHistory] = await Promise.all([
      database.collection('profiles').findOne({ userId }),
      database.collection('bookings').find({ 
        customerId: userId, 
        status: 'completed' 
      }).sort({ createdAt: -1 }).limit(10).toArray()
    ])

    const prompt = `
Create a personalized ${duration}-week workout plan for this user:

USER PROFILE:
- Experience Level: ${userProfile?.experienceLevel || 'Beginner'}
- Current Fitness Goals: ${goals.join(', ')}
- Preferences: ${preferences.join(', ')}
- Available Equipment: ${userProfile?.availableEquipment || 'Basic home equipment'}

RECENT FITNESS HISTORY:
${classHistory.map(booking => `- ${booking.className}: ${booking.rating || 'N/A'}/5 stars`).join('\n')}

Create a progressive ${duration}-week plan with:
- Weekly structure (days, rest days, progression)
- Specific workout recommendations for each week
- Exercise modifications for different fitness levels
- Nutrition tips aligned with fitness goals
- Recovery and rest day activities

Format as JSON with:
- planSummary (string - overview of the plan)
- weeklyBreakdown (array of objects for each week with week number, focus, workouts array)
- nutritionTips (array of strings)
- recoveryTips (array of strings)
- progressMetrics (array of strings - what to track)
    `

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are a certified fitness coach AI that creates personalized workout plans based on individual goals, preferences, and fitness history. Always respond with valid JSON." 
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_tokens: 3000
    })

    const workoutPlan = JSON.parse(response.choices[0].message.content)
    
    // Save the generated plan to database
    const planDocument = {
      userId,
      planId: `plan-${Date.now()}`,
      goals,
      duration,
      preferences,
      ...workoutPlan,
      createdAt: new Date(),
      status: 'active'
    }
    
    await database.collection('workout_plans').insertOne(planDocument)
    
    return planDocument
  } catch (error) {
    console.error('Error generating workout plan:', error)
    throw new Error('Failed to generate workout plan')
  }
}

async function getGeneralRecommendations() {
  try {
    const database = await connectDB()
    
    // Get popular classes for general recommendations
    const popularClasses = await database.collection('studio_classes').find({
      startTime: { $gte: new Date() }
    }).sort({ popularity: -1 }).limit(5).toArray()

    return popularClasses.map(cls => ({
      ...cls,
      recommendationReason: "Popular class among Thryve users",
      matchScore: 7,
      aiGenerated: false
    }))
  } catch (error) {
    console.error('Error getting general recommendations:', error)
    return []
  }
}