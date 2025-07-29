import openai from './openai.js'

/**
 * AI-powered migration data parser with rule-based parsing and OpenAI fallback
 * Handles Mindbody, Acuity, and custom CSV/JSON exports
 */

export class AIMigrationParser {
  constructor() {
    this.supportedFormats = ['csv', 'json', 'xlsx']
    this.knownPlatforms = {
      mindbody: {
        identifiers: ['ClientID', 'AppointmentID', 'LocationID', 'StaffID'],
        classFields: ['ClassName', 'ClassDescription', 'Duration', 'Capacity'],
        clientFields: ['FirstName', 'LastName', 'Email', 'Phone', 'MembershipType'],
        staffFields: ['FirstName', 'LastName', 'Email', 'Bio', 'Specialties']
      },
      acuity: {
        identifiers: ['id', 'appointmentTypeID', 'calendarID'],
        classFields: ['type', 'duration', 'price', 'description'],
        clientFields: ['firstName', 'lastName', 'email', 'phone'],
        staffFields: ['name', 'email', 'bio']
      }
    }
  }

  /**
   * Main parsing entry point - attempts rule-based parsing first, then OpenAI fallback
   */
  async parseFileData(fileData, fileName, mimeType) {
    console.log(`🚀 Starting AI migration parsing for: ${fileName}`)
    
    try {
      // Step 1: Detect platform and format
      const platformInfo = this.detectPlatform(fileData, fileName)
      console.log(`📊 Platform detected:`, platformInfo)

      // Step 2: Attempt rule-based parsing
      const ruleBasedResult = await this.attemptRuleBasedParsing(fileData, platformInfo)
      
      if (ruleBasedResult.success && ruleBasedResult.confidence > 0.8) {
        console.log(`✅ Rule-based parsing successful (confidence: ${ruleBasedResult.confidence})`)
        return {
          success: true,
          method: 'rule-based',
          confidence: ruleBasedResult.confidence,
          data: ruleBasedResult.data,
          warnings: ruleBasedResult.warnings || []
        }
      }

      // Step 3: OpenAI fallback for complex cases
      console.log(`🤖 Falling back to OpenAI parsing (rule-based confidence: ${ruleBasedResult.confidence || 0})`)
      const aiResult = await this.parseWithOpenAI(fileData, fileName, platformInfo)
      
      return {
        success: true,
        method: 'ai-assisted',
        confidence: aiResult.confidence,
        data: aiResult.data,
        warnings: aiResult.warnings || [],
        aiInsights: aiResult.insights
      }

    } catch (error) {
      console.error('❌ Migration parsing failed:', error)
      return {
        success: false,
        error: error.message,
        suggestions: this.generateErrorSuggestions(error, fileName)
      }
    }
  }

  /**
   * Detect the source platform and data structure
   */
  detectPlatform(fileData, fileName) {
    const lowerFileName = fileName.toLowerCase()
    let detectedPlatform = 'unknown'
    let confidence = 0

    // Check filename patterns
    if (lowerFileName.includes('mindbody') || lowerFileName.includes('mb_')) {
      detectedPlatform = 'mindbody'
      confidence = 0.7
    } else if (lowerFileName.includes('acuity')) {
      detectedPlatform = 'acuity'
      confidence = 0.7
    }

    // Check data structure for platform identifiers
    const dataString = typeof fileData === 'string' ? fileData : JSON.stringify(fileData)
    
    for (const [platform, config] of Object.entries(this.knownPlatforms)) {
      const matchingFields = config.identifiers.filter(field => 
        dataString.includes(field)
      ).length
      
      const platformConfidence = matchingFields / config.identifiers.length
      if (platformConfidence > confidence) {
        detectedPlatform = platform
        confidence = platformConfidence
      }
    }

    return {
      platform: detectedPlatform,
      confidence,
      fileType: this.detectFileType(fileName),
      estimatedRecords: this.estimateRecordCount(dataString)
    }
  }

  /**
   * Rule-based parsing for known platforms
   */
  async attemptRuleBasedParsing(fileData, platformInfo) {
    try {
      let parsedData
      
      // Parse based on file type
      if (platformInfo.fileType === 'csv') {
        parsedData = this.parseCSV(fileData)
      } else if (platformInfo.fileType === 'json') {
        parsedData = typeof fileData === 'string' ? JSON.parse(fileData) : fileData
      } else {
        throw new Error(`Unsupported file type: ${platformInfo.fileType}`)
      }

      // Extract structured data based on platform
      const extractedData = this.extractStructuredData(parsedData, platformInfo.platform)
      
      // Validate extracted data
      const validation = this.validateExtractedData(extractedData)
      
      return {
        success: validation.isValid,
        confidence: validation.confidence,
        data: extractedData,
        warnings: validation.warnings
      }

    } catch (error) {
      return {
        success: false,
        confidence: 0,
        error: error.message
      }
    }
  }

  /**
   * OpenAI-powered parsing for complex or unknown formats
   */
  async parseWithOpenAI(fileData, fileName, platformInfo) {
    try {
      // Prepare data sample for OpenAI (limit size for token efficiency)
      const dataSample = this.prepareDataSample(fileData)
      
      const prompt = this.buildOpenAIPrompt(dataSample, fileName, platformInfo)
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert data migration specialist for fitness studio management systems. Parse and structure fitness studio data into standardized formats. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      })

      let aiResponse
      try {
        // First try to parse the response directly
        aiResponse = JSON.parse(response.choices[0].message.content)
      } catch (parseError) {
        console.warn('Direct JSON parsing failed, attempting extraction:', parseError)
        
        // Try to extract JSON from the response
        const content = response.choices[0].message.content
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        
        if (jsonMatch) {
          try {
            aiResponse = JSON.parse(jsonMatch[0])
          } catch (extractError) {
            console.error('JSON extraction failed:', extractError)
            throw new Error(`OpenAI returned invalid JSON: ${content}`)
          }
        } else {
          throw new Error(`OpenAI response contains no valid JSON: ${content}`)
        }
      }
      
      // Process AI response and structure data
      return this.processAIResponse(aiResponse, fileData)

    } catch (error) {
      console.error('OpenAI parsing error:', error)
      
      // If OpenAI fails, return a basic structure with the error
      return {
        confidence: 0.3,
        data: { classes: [], instructors: [], clients: [], schedules: [] },
        warnings: [`AI parsing failed: ${error.message}`],
        insights: 'Fallback to manual data review recommended'
      }
    }
  }

  /**
   * Extract structured data from parsed input
   */
  extractStructuredData(parsedData, platform) {
    const data = {
      classes: [],
      instructors: [],
      clients: [],
      memberships: [],
      schedules: []
    }

    if (!Array.isArray(parsedData)) {
      parsedData = [parsedData]
    }

    for (const record of parsedData) {
      // Detect record type and extract accordingly
      if (this.isClassRecord(record, platform)) {
        data.classes.push(this.extractClassData(record, platform))
      } else if (this.isInstructorRecord(record, platform)) {
        data.instructors.push(this.extractInstructorData(record, platform))
      } else if (this.isClientRecord(record, platform)) {
        data.clients.push(this.extractClientData(record, platform))
      } else if (this.isScheduleRecord(record, platform)) {
        data.schedules.push(this.extractScheduleData(record, platform))
      }
    }

    return data
  }

  /**
   * CSV parsing utility
   */
  parseCSV(csvData) {
    const lines = csvData.split('\n').filter(line => line.trim())
    if (lines.length < 2) throw new Error('CSV must have header and at least one data row')
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const records = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      const record = {}
      headers.forEach((header, index) => {
        record[header] = values[index] || ''
      })
      records.push(record)
    }
    
    return records
  }

  /**
   * Data validation and confidence scoring
   */
  validateExtractedData(data) {
    const warnings = []
    let confidence = 1.0
    
    // Check for required fields in classes
    if (data.classes.length > 0) {
      const classesWithoutNames = data.classes.filter(c => !c.name || c.name.trim() === '')
      if (classesWithoutNames.length > 0) {
        warnings.push(`${classesWithoutNames.length} classes missing names`)
        confidence -= 0.15
      }
      
      // Bonus confidence for well-structured class data
      const classesWithDetails = data.classes.filter(c => c.description && c.duration && c.capacity)
      if (classesWithDetails.length > data.classes.length * 0.8) {
        confidence += 0.1
      }
    }
    
    // Check for duplicate instructors
    if (data.instructors.length > 0) {
      const instructorEmails = data.instructors.map(i => i.email).filter(Boolean)
      const duplicateEmails = instructorEmails.filter((email, index) => instructorEmails.indexOf(email) !== index)
      if (duplicateEmails.length > 0) {
        warnings.push(`${duplicateEmails.length} duplicate instructor emails found`)
        confidence -= 0.08
      }
      
      // Bonus confidence for instructors with complete data
      const completeInstructors = data.instructors.filter(i => i.firstName && i.lastName && i.email)
      if (completeInstructors.length > data.instructors.length * 0.9) {
        confidence += 0.15
      }
    }
    
    // Check for missing client contact info
    if (data.clients.length > 0) {
      const clientsWithoutContact = data.clients.filter(c => !c.email && !c.phone)
      if (clientsWithoutContact.length > 0) {
        warnings.push(`${clientsWithoutContact.length} clients missing contact information`)
        confidence -= 0.1
      }
      
      // Bonus confidence for clients with complete data
      const completeClients = data.clients.filter(c => c.firstName && c.lastName && c.email)
      if (completeClients.length > data.clients.length * 0.9) {
        confidence += 0.1
      }
    }
    
    // Additional confidence boosts for structured data
    const totalRecords = data.classes.length + data.instructors.length + data.clients.length
    if (totalRecords > 10) {
      confidence += 0.05 // Bonus for larger datasets
    }
    
    // Ensure confidence stays within bounds
    confidence = Math.max(0, Math.min(1, confidence))
    
    return {
      isValid: confidence > 0.4, // Lower threshold to be more accepting
      confidence,
      warnings
    }
  }

  /**
   * Record type detection helpers
   */
  isClassRecord(record, platform) {
    const classIndicators = ['ClassName', 'ClassDescription', 'type', 'class_name', 'service_name']
    return classIndicators.some(indicator => 
      Object.keys(record).some(key => key.toLowerCase().includes(indicator.toLowerCase()))
    )
  }

  isInstructorRecord(record, platform) {
    const instructorIndicators = ['StaffID', 'instructor', 'teacher', 'staff', 'provider']
    return instructorIndicators.some(indicator => 
      Object.keys(record).some(key => key.toLowerCase().includes(indicator.toLowerCase()))
    ) && (record.email || record.Email)
  }

  isClientRecord(record, platform) {
    const clientIndicators = ['ClientID', 'client', 'customer', 'member']
    return clientIndicators.some(indicator => 
      Object.keys(record).some(key => key.toLowerCase().includes(indicator.toLowerCase()))
    ) && (record.firstName || record.FirstName || record.first_name)
  }

  isScheduleRecord(record, platform) {
    const scheduleIndicators = ['StartDateTime', 'date', 'time', 'schedule', 'appointment']
    return scheduleIndicators.some(indicator => 
      Object.keys(record).some(key => key.toLowerCase().includes(indicator.toLowerCase()))
    )
  }

  /**
   * Data extraction helpers
   */
  extractClassData(record, platform) {
    return {
      id: this.generateId(),
      name: record.ClassName || record.type || record.class_name || 'Unnamed Class',
      description: record.ClassDescription || record.description || '',
      duration: this.parseDuration(record.Duration || record.duration || '60'),
      capacity: parseInt(record.Capacity || record.capacity || '20'),
      price: parseFloat(record.Price || record.price || '0'),
      category: record.Category || record.category || 'fitness',
      level: record.Level || record.level || 'all-levels',
      requirements: record.Requirements || record.requirements || '',
      originalRecord: record
    }
  }

  extractInstructorData(record, platform) {
    return {
      id: this.generateId(),
      firstName: record.FirstName || record.firstName || record.first_name || '',
      lastName: record.LastName || record.lastName || record.last_name || '',
      email: record.Email || record.email || '',
      phone: record.Phone || record.phone || '',
      bio: record.Bio || record.bio || record.description || '',
      specialties: this.parseArray(record.Specialties || record.specialties || ''),
      certifications: this.parseArray(record.Certifications || record.certifications || ''),
      experience: record.Experience || record.experience || '',
      originalRecord: record
    }
  }

  extractClientData(record, platform) {
    return {
      id: this.generateId(),
      firstName: record.FirstName || record.firstName || record.first_name || '',
      lastName: record.LastName || record.lastName || record.last_name || '',
      email: record.Email || record.email || '',
      phone: record.Phone || record.phone || '',
      membershipType: record.MembershipType || record.membership_type || 'drop-in',
      joinDate: record.JoinDate || record.join_date || new Date().toISOString(),
      notes: record.Notes || record.notes || '',
      originalRecord: record
    }
  }

  extractScheduleData(record, platform) {
    return {
      id: this.generateId(),
      classId: record.ClassID || record.class_id || '',
      instructorId: record.StaffID || record.instructor_id || '',
      startTime: record.StartDateTime || record.start_time || '',
      endTime: record.EndDateTime || record.end_time || '',
      date: record.Date || record.date || '',
      recurring: record.Recurring || record.recurring || false,
      status: record.Status || record.status || 'scheduled',
      originalRecord: record
    }
  }

  /**
   * Utility functions
   */
  detectFileType(fileName) {
    const extension = fileName.split('.').pop().toLowerCase()
    return this.supportedFormats.includes(extension) ? extension : 'unknown'
  }

  estimateRecordCount(dataString) {
    const lines = dataString.split('\n').length
    return Math.max(1, lines - 1) // Subtract header line
  }

  prepareDataSample(fileData) {
    const sample = typeof fileData === 'string' ? 
      fileData.substring(0, 2000) : 
      JSON.stringify(fileData).substring(0, 2000)
    return sample + (sample.length >= 2000 ? '...[truncated]' : '')
  }

  buildOpenAIPrompt(dataSample, fileName, platformInfo) {
    return `
Parse this fitness studio management data and extract structured information:

**File Info:**
- Name: ${fileName}
- Detected Platform: ${platformInfo.platform}
- Estimated Records: ${platformInfo.estimatedRecords}

**Data Sample:**
${dataSample}

**Required Output Format (JSON):**
{
  "confidence": 0.95,
  "insights": "Brief analysis of data structure and quality",
  "data": {
    "classes": [{"name": "Class Name", "description": "", "duration": 60, "capacity": 20, "price": 25, "category": "fitness"}],
    "instructors": [{"firstName": "", "lastName": "", "email": "", "phone": "", "bio": "", "specialties": []}],
    "clients": [{"firstName": "", "lastName": "", "email": "", "phone": "", "membershipType": ""}],
    "schedules": [{"classId": "", "instructorId": "", "startTime": "", "date": "", "recurring": false}]
  },
  "warnings": ["List any data quality issues or missing information"]
}

Extract all available information and maintain data relationships where possible.
`
  }

  processAIResponse(aiResponse, originalData) {
    return {
      confidence: aiResponse.confidence || 0.8,
      data: aiResponse.data || { classes: [], instructors: [], clients: [], schedules: [] },
      warnings: aiResponse.warnings || [],
      insights: aiResponse.insights || 'AI processing completed'
    }
  }

  generateErrorSuggestions(error, fileName) {
    const suggestions = []
    
    if (error.message.includes('JSON')) {
      suggestions.push('Check if the file is valid JSON format')
      suggestions.push('Try uploading as CSV instead')
    }
    
    if (error.message.includes('CSV')) {
      suggestions.push('Ensure CSV has proper headers')
      suggestions.push('Check for special characters in data')
    }
    
    suggestions.push(`Contact support with file: ${fileName}`)
    
    return suggestions
  }

  parseDuration(duration) {
    const durationStr = String(duration).toLowerCase()
    if (durationStr.includes('hour')) {
      return parseInt(durationStr) * 60
    } else if (durationStr.includes('min')) {
      return parseInt(durationStr)
    }
    return parseInt(duration) || 60
  }

  parseArray(arrayStr) {
    if (!arrayStr) return []
    if (Array.isArray(arrayStr)) return arrayStr
    return arrayStr.split(',').map(item => item.trim()).filter(Boolean)
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
  }
}

export default new AIMigrationParser()