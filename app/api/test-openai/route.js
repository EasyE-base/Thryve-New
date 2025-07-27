import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function GET() {
  try {
    console.log('Testing OpenAI connection...')
    console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY)
    console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length || 0)
    
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'OPENAI_API_KEY not found in environment variables'
      }, { status: 500 })
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: "Hello, this is a test. Respond with just 'OpenAI API working!'" }
      ],
      max_tokens: 10,
      temperature: 0
    })

    return NextResponse.json({
      success: true,
      message: 'OpenAI API connection successful',
      response: response.choices[0].message.content,
      model: response.model,
      usage: response.usage
    })
  } catch (error) {
    console.error('OpenAI test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      type: error.constructor.name
    }, { status: 500 })
  }
}