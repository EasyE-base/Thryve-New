import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables explicitly
dotenv.config();

// Debug environment variable loading
console.log('🔧 OpenAI Client Initialization:');
console.log('- OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
console.log('- OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length || 0);
console.log('- OPENAI_API_KEY starts with sk-:', process.env.OPENAI_API_KEY?.startsWith('sk-') || false);

let openai = null;

try {
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY environment variable is not set');
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  console.log('✅ OpenAI client created successfully');
} catch (error) {
  console.error('❌ Failed to create OpenAI client:', error.message);
  
  // Create a mock client that returns error responses
  openai = {
    chat: {
      completions: {
        create: async () => {
          throw new Error(`OpenAI client not available: ${error.message}`);
        }
      }
    }
  };
}

export default openai;