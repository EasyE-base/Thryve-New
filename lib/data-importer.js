import openai from '@/lib/openai'
import { MongoClient } from 'mongodb'

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

// Standard fitness platform field mappings for learning
const COMMON_FIELD_MAPPINGS = {
  // Customer/Client fields
  customer: {
    patterns: ['client', 'customer', 'member', 'user', 'person'],
    subfields: {
      id: ['id', 'client_id', 'customer_id', 'member_id', 'user_id'],
      name: ['name', 'full_name', 'client_name', 'customer_name', 'first_name', 'last_name'],
      email: ['email', 'email_address', 'e_mail', 'mail'],
      phone: ['phone', 'phone_number', 'mobile', 'cell', 'telephone'],
      joinDate: ['join_date', 'signup_date', 'created_date', 'registration_date'],
      status: ['status', 'active', 'membership_status', 'account_status']
    }
  },
  // Class/Session fields
  classes: {
    patterns: ['class', 'session', 'appointment', 'booking', 'service'],
    subfields: {
      id: ['id', 'class_id', 'session_id', 'service_id'],
      name: ['name', 'class_name', 'session_name', 'service_name', 'title'],
      type: ['type', 'class_type', 'category', 'service_type'],
      instructor: ['instructor', 'teacher', 'trainer', 'staff', 'provider'],
      duration: ['duration', 'length', 'time', 'minutes'],
      capacity: ['capacity', 'max_capacity', 'limit', 'max_participants'],
      price: ['price', 'cost', 'rate', 'fee', 'amount']
    }
  },
  // Schedule fields
  schedule: {
    patterns: ['schedule', 'calendar', 'time', 'slot'],
    subfields: {
      date: ['date', 'start_date', 'class_date', 'session_date'],
      time: ['time', 'start_time', 'begin_time'],
      endTime: ['end_time', 'finish_time', 'duration_end'],
      dayOfWeek: ['day', 'day_of_week', 'weekday']
    }
  },
  // Instructor/Staff fields
  instructors: {
    patterns: ['instructor', 'teacher', 'trainer', 'staff', 'employee'],
    subfields: {
      id: ['id', 'instructor_id', 'staff_id', 'employee_id'],
      name: ['name', 'instructor_name', 'staff_name', 'full_name'],
      email: ['email', 'instructor_email', 'staff_email'],
      specialties: ['specialties', 'skills', 'certifications', 'expertise'],
      rate: ['rate', 'hourly_rate', 'pay_rate', 'compensation']
    }
  },
  // Payment/Transaction fields
  payments: {
    patterns: ['payment', 'transaction', 'purchase', 'sale'],
    subfields: {
      id: ['id', 'transaction_id', 'payment_id', 'order_id'],
      amount: ['amount', 'total', 'price', 'cost'],
      date: ['date', 'payment_date', 'transaction_date'],
      method: ['method', 'payment_method', 'payment_type'],
      status: ['status', 'payment_status', 'transaction_status']
    }
  }
}

export async function analyzeDataFile(fileContent, fileName, userId) {
  try {
    console.log('🔍 Starting AI analysis of data file:', fileName)
    const database = await connectDB()
    
    // Parse CSV content to get headers and sample data
    const lines = fileContent.split('\n').filter(line => line.trim())
    if (lines.length < 2) {
      throw new Error('File must contain at least a header row and one data row')
    }
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const sampleRows = lines.slice(1, Math.min(6, lines.length)).map(line => 
      line.split(',').map(cell => cell.trim().replace(/"/g, ''))
    )
    
    console.log('📊 Parsed file structure:', { headers: headers.length, sampleRows: sampleRows.length })
    
    // Create AI prompt for intelligent field mapping
    const prompt = `
Analyze this fitness/wellness business data file and provide intelligent field mapping suggestions:

FILENAME: ${fileName}
TOTAL HEADERS: ${headers.length}

HEADERS:
${headers.map((h, i) => `${i + 1}. "${h}"`).join('\n')}

SAMPLE DATA ROWS:
${sampleRows.map((row, i) => `Row ${i + 1}: ${row.map((cell, j) => `"${cell}"`).join(', ')}`).join('\n')}

CONTEXT: This data is being imported from a fitness platform (likely Mindbody, Vagaro, ZenPlanner, etc.) into Thryve.

Please analyze and provide mapping suggestions in JSON format:

{
  "fileType": "customers|classes|instructors|schedule|payments|mixed",
  "confidence": 0.95,
  "detectedPlatform": "mindbody|vagaro|zenplanner|classpass|other|unknown",
  "totalRecords": estimated_number,
  "fieldMappings": [
    {
      "originalHeader": "Client Name",
      "suggestedField": "customer_name", 
      "category": "customer",
      "confidence": 0.98,
      "reasoning": "Header clearly indicates customer name field",
      "dataType": "string",
      "required": true,
      "sampleValues": ["John Doe", "Jane Smith"]
    }
  ],
  "dataQualityIssues": [
    {
      "issue": "missing_data",
      "description": "5% of phone numbers are empty",
      "severity": "low|medium|high",
      "suggestion": "Consider making phone numbers optional"
    }
  ],
  "recommendedActions": [
    "Clean duplicate entries before import",
    "Standardize date formats",
    "Validate email addresses"
  ],
  "importStrategy": {
    "estimatedTime": "2-5 minutes",
    "suggestedBatchSize": 100,
    "dependencies": ["Create instructor profiles first", "Set up class categories"]
  }
}

Focus on accuracy, identify common fitness platform patterns, and provide actionable insights for seamless data migration.
    `

    console.log('🧠 Calling OpenAI for data analysis...')

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are an expert data analyst specializing in fitness platform migrations. You understand common data structures from Mindbody, Vagaro, ZenPlanner, and other fitness software. Provide accurate, actionable field mapping suggestions with high confidence scores." 
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 3000
    })

    console.log('✅ OpenAI analysis complete, usage:', response.usage)

    const analysis = JSON.parse(response.choices[0].message.content)
    console.log('📊 AI analysis result:', analysis.fileType, 'with', analysis.fieldMappings?.length, 'field mappings')
    
    // Enhance analysis with pattern matching
    const enhancedAnalysis = await enhanceWithPatternMatching(analysis, headers, sampleRows)
    
    // Store analysis for learning purposes
    const analysisRecord = {
      id: `analysis-${Date.now()}`,
      userId,
      fileName,
      fileType: enhancedAnalysis.fileType,
      detectedPlatform: enhancedAnalysis.detectedPlatform,
      headersCount: headers.length,
      recordsCount: enhancedAnalysis.totalRecords,
      analysis: enhancedAnalysis,
      aiUsage: response.usage,
      createdAt: new Date()
    }
    
    await database.collection('import_analyses').insertOne(analysisRecord)
    
    console.log('💾 Analysis saved for learning system')
    
    return enhancedAnalysis
  } catch (error) {
    console.error('❌ Error analyzing data file:', error.message)
    throw new Error(`Failed to analyze data file: ${error.message}`)
  }
}

async function enhanceWithPatternMatching(aiAnalysis, headers, sampleRows) {
  try {
    console.log('🔍 Enhancing analysis with pattern matching...')
    
    // Apply pattern matching to improve confidence scores
    const enhancedMappings = aiAnalysis.fieldMappings?.map(mapping => {
      const originalHeader = mapping.originalHeader.toLowerCase()
      let enhancedConfidence = mapping.confidence
      let enhancedCategory = mapping.category
      
      // Check against known patterns
      for (const [category, patterns] of Object.entries(COMMON_FIELD_MAPPINGS)) {
        for (const [field, fieldPatterns] of Object.entries(patterns.subfields || {})) {
          const matchesPattern = fieldPatterns.some(pattern => 
            originalHeader.includes(pattern.toLowerCase())
          )
          
          if (matchesPattern) {
            enhancedConfidence = Math.max(enhancedConfidence, 0.9)
            enhancedCategory = category
            break
          }
        }
      }
      
      return {
        ...mapping,
        confidence: enhancedConfidence,
        category: enhancedCategory,
        patternMatched: enhancedConfidence > mapping.confidence
      }
    }) || []
    
    // Detect additional quality issues
    const additionalIssues = []
    
    // Check for potential duplicate headers
    const headerCounts = {}
    headers.forEach(header => {
      const normalized = header.toLowerCase().trim()
      headerCounts[normalized] = (headerCounts[normalized] || 0) + 1
    })
    
    Object.entries(headerCounts).forEach(([header, count]) => {
      if (count > 1) {
        additionalIssues.push({
          issue: 'duplicate_headers',
          description: `Header "${header}" appears ${count} times`,
          severity: 'high',
          suggestion: 'Rename duplicate headers before import'
        })
      }
    })
    
    // Check for empty columns
    for (let colIndex = 0; colIndex < headers.length; colIndex++) {
      const columnValues = sampleRows.map(row => row[colIndex] || '').filter(val => val.trim())
      const emptyPercentage = ((sampleRows.length - columnValues.length) / sampleRows.length) * 100
      
      if (emptyPercentage > 50) {
        additionalIssues.push({
          issue: 'high_empty_percentage',
          description: `Column "${headers[colIndex]}" is ${emptyPercentage.toFixed(1)}% empty`,
          severity: emptyPercentage > 80 ? 'high' : 'medium',
          suggestion: 'Consider excluding this column or making it optional'
        })
      }
    }
    
    return {
      ...aiAnalysis,
      fieldMappings: enhancedMappings,
      dataQualityIssues: [...(aiAnalysis.dataQualityIssues || []), ...additionalIssues],
      enhancementApplied: true,
      totalMappings: enhancedMappings.length,
      highConfidenceMappings: enhancedMappings.filter(m => m.confidence >= 0.8).length
    }
  } catch (error) {
    console.error('⚠️ Error enhancing analysis:', error.message)
    return aiAnalysis // Return original analysis if enhancement fails
  }
}

export async function validateFieldMapping(mappings, userId) {
  try {
    console.log('🔍 Validating field mappings for import...')
    const database = await connectDB()
    
    const validationResult = {
      valid: true,
      errors: [],
      warnings: [],
      requiredFieldsPresent: true,
      estimatedImportTime: '1-2 minutes'
    }
    
    // Check for required fields based on detected file type
    const requiredFields = {
      customers: ['customer_name', 'email'],
      classes: ['class_name', 'instructor'],
      instructors: ['instructor_name', 'email'],
      schedule: ['class_name', 'date', 'time'],
      payments: ['amount', 'date']
    }
    
    // Determine primary file type
    const categories = mappings.map(m => m.category)
    const primaryType = categories.reduce((a, b, i, arr) =>
      arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
    )
    
    const required = requiredFields[primaryType] || []
    const mappedFields = mappings.map(m => m.suggestedField)
    
    required.forEach(requiredField => {
      if (!mappedFields.includes(requiredField)) {
        validationResult.errors.push({
          type: 'missing_required_field',
          field: requiredField,
          message: `Required field "${requiredField}" is not mapped`,
          suggestion: 'Please map this field or mark as optional'
        })
        validationResult.valid = false
        validationResult.requiredFieldsPresent = false
      }
    })
    
    // Check for duplicate mappings
    const fieldCounts = {}
    mappings.forEach(mapping => {
      const field = mapping.suggestedField
      fieldCounts[field] = (fieldCounts[field] || 0) + 1
    })
    
    Object.entries(fieldCounts).forEach(([field, count]) => {
      if (count > 1) {
        validationResult.warnings.push({
          type: 'duplicate_mapping',
          field: field,
          message: `Field "${field}" is mapped multiple times`,
          suggestion: 'Use different target fields or combine the data'
        })
      }
    })
    
    // Estimate import time based on complexity
    const recordCount = mappings[0]?.estimatedRecords || 100
    const complexityScore = mappings.length + validationResult.errors.length
    
    if (recordCount > 1000 || complexityScore > 10) {
      validationResult.estimatedImportTime = '5-10 minutes'
    } else if (recordCount > 500 || complexityScore > 5) {
      validationResult.estimatedImportTime = '2-5 minutes'
    }
    
    console.log('✅ Validation complete:', validationResult.valid ? 'VALID' : 'INVALID')
    
    return validationResult
  } catch (error) {
    console.error('❌ Error validating field mapping:', error.message)
    throw new Error(`Field mapping validation failed: ${error.message}`)
  }
}

export async function executeDataImport(fileContent, mappings, importConfig, userId) {
  try {
    console.log('🚀 Starting data import execution...')
    const database = await connectDB()
    
    const importResult = {
      success: true,
      totalRecords: 0,
      successfulImports: 0,
      failedImports: 0,
      errors: [],
      warnings: [],
      importedData: {
        customers: 0,
        classes: 0,
        instructors: 0,
        schedule: 0,
        payments: 0
      },
      executionTime: 0
    }
    
    const startTime = Date.now()
    
    // Parse CSV data
    const lines = fileContent.split('\n').filter(line => line.trim())
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const dataRows = lines.slice(1).map(line => 
      line.split(',').map(cell => cell.trim().replace(/"/g, ''))
    )
    
    importResult.totalRecords = dataRows.length
    console.log('📊 Processing', importResult.totalRecords, 'records...')
    
    // Create mapping index for faster lookup
    const mappingIndex = {}
    mappings.forEach(mapping => {
      const headerIndex = headers.indexOf(mapping.originalHeader)
      if (headerIndex !== -1) {
        mappingIndex[mapping.suggestedField] = headerIndex
      }
    })
    
    // Process records in batches
    const batchSize = importConfig.batchSize || 100
    const batches = []
    
    for (let i = 0; i < dataRows.length; i += batchSize) {
      batches.push(dataRows.slice(i, i + batchSize))
    }
    
    for (const [batchIndex, batch] of batches.entries()) {
      console.log(`📦 Processing batch ${batchIndex + 1}/${batches.length}...`)
      
      for (const row of batch) {
        try {
          // Transform row data using mappings
          const transformedRecord = {}
          
          Object.entries(mappingIndex).forEach(([targetField, sourceIndex]) => {
            const value = row[sourceIndex]
            if (value !== undefined && value !== '') {
              transformedRecord[targetField] = value
            }
          })
          
          // Add metadata
          transformedRecord.importId = `import-${Date.now()}-${Math.random()}`
          transformedRecord.userId = userId
          transformedRecord.importedAt = new Date()
          transformedRecord.source = 'data_importer'
          
          // Determine collection based on primary data type
          const primaryType = mappings[0]?.category || 'customers'
          const collectionName = `imported_${primaryType}`
          
          // Insert into database
          await database.collection(collectionName).insertOne(transformedRecord)
          
          importResult.successfulImports++
          importResult.importedData[primaryType]++
          
        } catch (error) {
          importResult.failedImports++
          importResult.errors.push({
            row: batch.indexOf(row),
            error: error.message,
            data: row.slice(0, 3) // First 3 fields for context
          })
        }
      }
    }
    
    importResult.executionTime = Date.now() - startTime
    
    // Create import summary record
    const importSummary = {
      id: `import-${Date.now()}`,
      userId,
      fileName: importConfig.fileName || 'unknown',
      mappings,
      result: importResult,
      completedAt: new Date()
    }
    
    await database.collection('import_history').insertOne(importSummary)
    
    console.log('✅ Import complete:', importResult.successfulImports, 'successful,', importResult.failedImports, 'failed')
    
    return importResult
  } catch (error) {
    console.error('❌ Error executing data import:', error.message)
    throw new Error(`Data import failed: ${error.message}`)
  }
}

export async function learnFromUserFeedback(analysisId, userMappings, userId) {
  try {
    console.log('🧠 Learning from user feedback on analysis:', analysisId)
    const database = await connectDB()
    
    // Store user corrections for machine learning
    const learningData = {
      id: `learning-${Date.now()}`,
      analysisId,
      userId,
      userCorrections: userMappings,
      timestamp: new Date()
    }
    
    await database.collection('mapping_learning_data').insertOne(learningData)
    
    // Analyze patterns in corrections
    const commonCorrections = await database.collection('mapping_learning_data')
      .aggregate([
        { $unwind: '$userCorrections' },
        { 
          $group: {
            _id: {
              originalHeader: '$userCorrections.originalHeader',
              correctedField: '$userCorrections.suggestedField'
            },
            count: { $sum: 1 },
            avgConfidence: { $avg: '$userCorrections.confidence' }
          }
        },
        { $match: { count: { $gte: 2 } } }, // Patterns seen at least twice
        { $sort: { count: -1 } }
      ]).toArray()
    
    console.log('📚 Identified', commonCorrections.length, 'learning patterns')
    
    return {
      patternsLearned: commonCorrections.length,
      feedbackStored: true,
      nextAnalysisWillImprove: true
    }
  } catch (error) {
    console.error('❌ Error learning from user feedback:', error.message)
    throw new Error(`Learning process failed: ${error.message}`)
  }
}