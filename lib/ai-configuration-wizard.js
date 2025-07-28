import OpenAI from 'openai';
import { MongoClient } from 'mongodb';

// Database connection
let client;
let db;

async function connectDB() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL);
    await client.connect();
    db = client.db(process.env.DB_NAME);
  }
  return db;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Extract JSON from OpenAI response that might be wrapped in markdown code blocks
 * @param {string} content - Raw content from OpenAI response
 * @returns {Object} Parsed JSON object
 */
function extractJsonFromResponse(content) {
  try {
    // First try direct JSON parsing
    return JSON.parse(content);
  } catch (error) {
    // If direct parsing fails, try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (parseError) {
        console.error('Failed to parse extracted JSON:', parseError);
        throw parseError;
      }
    }
    
    // Try to find JSON-like content without code blocks
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      try {
        const jsonContent = content.substring(jsonStart, jsonEnd + 1);
        return JSON.parse(jsonContent);
      } catch (parseError) {
        console.error('Failed to parse extracted JSON content:', parseError);
        throw parseError;
      }
    }
    
    // If all else fails, throw the original error
    throw error;
  }
}

/**
 * AI Configuration Wizard Service
 * Provides intelligent studio configuration recommendations using OpenAI
 */
class AIConfigurationWizard {
  
  /**
   * Analyze studio requirements and generate initial recommendations
   * @param {Object} studioData - Basic studio information
   * @returns {Object} Analysis results with recommendations
   */
  async analyzeStudioRequirements(studioData) {
    try {
      const {
        studioName,
        studioType,
        location,
        targetAudience,
        experience,
        specialties,
        goals,
        budget,
        spaceSize,
        equipment
      } = studioData;

      const prompt = `
        As an AI fitness studio consultant, analyze this studio's requirements and provide comprehensive setup recommendations:

        Studio Information:
        - Name: ${studioName}
        - Type: ${studioType}
        - Location: ${location}
        - Target Audience: ${targetAudience}
        - Experience Level: ${experience}
        - Specialties: ${specialties.join(', ')}
        - Goals: ${goals}
        - Budget: ${budget}
        - Space Size: ${spaceSize}
        - Equipment: ${equipment.join(', ')}

        Provide detailed recommendations for:
        1. Optimal class types and descriptions
        2. Suggested pricing strategy
        3. Recommended schedule structure
        4. Cancellation and booking policies
        5. Staff requirements and roles
        6. Marketing and growth strategies
        7. Revenue optimization suggestions
        8. Success metrics to track

        Format your response as a comprehensive JSON object with specific, actionable recommendations.
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert fitness studio consultant with 20+ years of experience helping studios succeed. Provide specific, actionable recommendations based on industry best practices.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000
      });

      const analysis = extractJsonFromResponse(response.choices[0].message.content);
      
      return {
        success: true,
        analysis: {
          studioProfile: {
            name: studioName,
            type: studioType,
            location,
            targetAudience,
            experience,
            specialties,
            goals,
            budget,
            spaceSize,
            equipment
          },
          recommendations: analysis,
          confidence: 0.85,
          generatedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Error analyzing studio requirements:', error);
      return {
        success: false,
        error: 'Failed to analyze studio requirements',
        details: error.message
      };
    }
  }

  /**
   * Generate complete studio configuration based on analysis
   * @param {Object} analysisResults - Results from studio analysis
   * @param {Object} preferences - User preferences and customizations
   * @returns {Object} Complete studio configuration
   */
  async generateStudioConfiguration(analysisResults, preferences = {}) {
    try {
      const { recommendations, studioProfile } = analysisResults;

      const prompt = `
        Based on the studio analysis and user preferences, generate a complete, implementable studio configuration:

        Studio Profile: ${JSON.stringify(studioProfile)}
        AI Recommendations: ${JSON.stringify(recommendations)}
        User Preferences: ${JSON.stringify(preferences)}

        Generate a complete configuration including:
        1. Class Schedule - Specific times, days, and instructors needed
        2. Pricing Structure - Detailed pricing for all services
        3. Policies - Cancellation, no-show, refund policies
        4. Staff Requirements - Roles, hours, compensation
        5. Marketing Strategy - Launch plan and ongoing marketing
        6. Operational Procedures - Daily, weekly, monthly tasks
        7. Financial Projections - Revenue estimates and break-even analysis
        8. Technology Setup - Required software and integrations
        9. Customer Journey - Onboarding and retention strategies
        10. Growth Milestones - 3, 6, 12 month goals

        Provide specific, actionable items that can be implemented immediately.
        Format as a comprehensive JSON object with all configuration details.
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are creating a complete, implementable studio configuration. Be specific with times, prices, policies, and actionable steps.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.6,
        max_tokens: 4000
      });

      const configuration = extractJsonFromResponse(response.choices[0].message.content);

      return {
        success: true,
        configuration: {
          studioId: studioProfile.name.toLowerCase().replace(/\s+/g, '-'),
          ...configuration,
          implementationPlan: await this.generateImplementationPlan(configuration),
          generatedAt: new Date().toISOString(),
          version: '1.0'
        }
      };

    } catch (error) {
      console.error('Error generating studio configuration:', error);
      return {
        success: false,
        error: 'Failed to generate studio configuration',
        details: error.message
      };
    }
  }

  /**
   * Generate implementation plan with timeline
   * @param {Object} configuration - Complete studio configuration
   * @returns {Object} Implementation plan with phases and timelines
   */
  async generateImplementationPlan(configuration) {
    try {
      const prompt = `
        Create a detailed implementation plan for this studio configuration:
        ${JSON.stringify(configuration, null, 2)}

        Generate a phased implementation plan with:
        1. Phase 1 (Week 1-2): Essential setup items
        2. Phase 2 (Week 3-4): Core operations
        3. Phase 3 (Month 2): Growth and optimization
        4. Phase 4 (Month 3+): Expansion and scaling

        For each phase, provide:
        - Specific tasks and deadlines
        - Required resources and costs
        - Dependencies and prerequisites
        - Success metrics and checkpoints
        - Risk mitigation strategies

        Format as a JSON object with timeline and actionable steps.
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are creating a practical implementation timeline. Be specific with dates, tasks, and dependencies.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 2000
      });

      return extractJsonFromResponse(response.choices[0].message.content);

    } catch (error) {
      console.error('Error generating implementation plan:', error);
      return {
        phases: [],
        error: 'Failed to generate implementation plan'
      };
    }
  }

  /**
   * Apply generated configuration to studio's database
   * @param {String} studioId - Studio identifier
   * @param {Object} configuration - Complete studio configuration
   * @returns {Object} Application results
   */
  async applyConfiguration(studioId, configuration) {
    try {
      const db = await connectDB();
      const timestamp = new Date();

      // Update studio profile
      await db.collection('profiles').updateOne(
        { userId: studioId, role: 'merchant' },
        {
          $set: {
            studioConfiguration: configuration,
            configurationAppliedAt: timestamp,
            aiConfigured: true,
            updatedAt: timestamp
          }
        },
        { upsert: true }
      );

      // Create classes based on configuration
      if (configuration.classSchedule) {
        const classPromises = configuration.classSchedule.map(async (classData) => {
          return db.collection('studio_classes').insertOne({
            ...classData,
            studioId,
            createdAt: timestamp,
            status: 'scheduled',
            enrolled: 0,
            enrolledStudents: []
          });
        });
        await Promise.all(classPromises);
      }

      // Update studio settings
      if (configuration.policies) {
        await db.collection('studio_xpass_settings').updateOne(
          { studioId },
          {
            $set: {
              ...configuration.policies,
              updatedAt: timestamp
            }
          },
          { upsert: true }
        );
      }

      // Save implementation plan
      await db.collection('implementation_plans').insertOne({
        studioId,
        plan: configuration.implementationPlan,
        status: 'active',
        progress: 0,
        createdAt: timestamp
      });

      return {
        success: true,
        message: 'Configuration applied successfully',
        appliedComponents: {
          profile: true,
          classes: configuration.classSchedule?.length || 0,
          policies: !!configuration.policies,
          implementationPlan: true
        }
      };

    } catch (error) {
      console.error('Error applying configuration:', error);
      return {
        success: false,
        error: 'Failed to apply configuration',
        details: error.message
      };
    }
  }

  /**
   * Get ongoing recommendations for studio optimization
   * @param {String} studioId - Studio identifier
   * @returns {Object} Personalized recommendations
   */
  async getOngoingRecommendations(studioId) {
    try {
      const db = await connectDB();
      
      // Get studio data
      const studioData = await db.collection('profiles').findOne({
        userId: studioId,
        role: 'merchant'
      });

      if (!studioData) {
        return {
          success: false,
          error: 'Studio not found'
        };
      }

      // Get recent analytics
      const analytics = await db.collection('analytics_events').find({
        studioId,
        timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }).toArray();

      // Get class performance
      const classes = await db.collection('studio_classes').find({
        studioId,
        status: 'scheduled'
      }).toArray();

      const prompt = `
        Analyze this studio's performance and provide specific optimization recommendations:

        Studio Profile: ${JSON.stringify(studioData.studioConfiguration)}
        Recent Analytics: ${JSON.stringify(analytics.slice(0, 50))}
        Current Classes: ${JSON.stringify(classes)}

        Provide specific recommendations for:
        1. Class optimization (timing, pricing, capacity)
        2. Revenue enhancement opportunities
        3. Customer retention strategies
        4. Operational efficiency improvements
        5. Marketing optimization
        6. Staff utilization
        7. Upcoming trends to capitalize on
        8. Risk mitigation strategies

        Format as JSON with actionable recommendations and priority levels.
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are providing ongoing optimization recommendations. Be specific and actionable with clear priorities.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const recommendations = extractJsonFromResponse(response.choices[0].message.content);

      return {
        success: true,
        recommendations: {
          ...recommendations,
          generatedAt: new Date().toISOString(),
          studioId,
          type: 'ongoing_optimization'
        }
      };

    } catch (error) {
      console.error('Error getting ongoing recommendations:', error);
      return {
        success: false,
        error: 'Failed to get recommendations',
        details: error.message
      };
    }
  }

  /**
   * Generate configuration comparison and alternatives
   * @param {Object} currentConfig - Current configuration
   * @param {Object} preferences - Updated preferences
   * @returns {Object} Configuration alternatives
   */
  async generateConfigurationAlternatives(currentConfig, preferences) {
    try {
      const prompt = `
        Generate alternative configurations based on updated preferences:

        Current Configuration: ${JSON.stringify(currentConfig)}
        Updated Preferences: ${JSON.stringify(preferences)}

        Generate 3 alternative configurations with:
        1. Conservative approach (lower risk, steady growth)
        2. Aggressive approach (higher risk, rapid growth)
        3. Balanced approach (moderate risk, sustainable growth)

        For each alternative, provide:
        - Key differences from current config
        - Pros and cons
        - Expected outcomes
        - Risk assessment
        - Implementation requirements

        Format as JSON with detailed comparison.
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are providing configuration alternatives. Be specific about differences and expected outcomes.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.6,
        max_tokens: 2500
      });

      const alternatives = extractJsonFromResponse(response.choices[0].message.content);

      return {
        success: true,
        alternatives: {
          ...alternatives,
          generatedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Error generating configuration alternatives:', error);
      return {
        success: false,
        error: 'Failed to generate alternatives',
        details: error.message
      };
    }
  }
}

export default new AIConfigurationWizard();