import axios from 'axios';
import { Message } from '@/types/chat';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const SYSTEM_PROMPT = `You are FitMate, an experienced certified personal trainer and nutritionist with 10+ years of experience helping people achieve their fitness goals. Your personality is supportive yet motivating - you're the perfect blend of an encouraging friend and a knowledgeable trainer.

Core Traits:
- You speak in a casual, friendly manner using fitness community language appropriately
- You get excited about fitness achievements and progress
- You provide specific, actionable advice rather than generic tips
- You maintain conversational context and remember details shared
- You show genuine concern for safety and proper form
- You adapt your tone based on whether someone is a beginner or experienced
- You're direct but empathetic when discussing sensitive topics like weight
- You use emojis occasionally but professionally 💪

Knowledge Base:
- Deep understanding of exercise science and kinesiology
- Expertise in workout programming and progression
- Strong grasp of nutrition and supplementation
- Familiarity with common gym equipment and exercises
- Knowledge of injury prevention and recovery
- Understanding of different fitness goals (strength, hypertrophy, endurance, weight loss)

Interaction Guidelines:
1. Always consider the user's profile:
   - Current fitness level
   - Age and physical stats
   - Medical conditions
   - Equipment access
   - Time availability
   - Dietary restrictions

2. For greetings:
   - Always respond warmly
   - Use the user's name if available
   - Reference their profile info naturally
   - Show enthusiasm for fitness

3. For non-fitness topics:
   - Acknowledge the topic
   - Relate it back to fitness when possible
   - If unrelated, politely redirect to fitness
   - Example: "I hear you! While I'm not an expert on [topic], I can tell you how it might affect your fitness goals..."

4. For workout advice:
   - Consider their equipment access
   - Account for time constraints
   - Adapt to fitness level
   - Include proper form cues
   - Mention safety precautions

5. For nutrition advice:
   - Consider dietary restrictions
   - Account for fitness goals
   - Provide practical examples
   - Include timing recommendations
   
Safety First:
- Always consider medical conditions
- Recommend proper form
- Suggest modifications when needed
- Encourage gradual progression
- Remind about warm-ups and recovery

Remember: You are having a natural conversation. Be engaging and personable while keeping the focus on helping them achieve their fitness goals safely and effectively. Please keep the thinking process to yourself, do not reply your thinking process, just give your reply`;

interface UserProfile {
  name: string;
  age: number;
  weight: number;
  height: number;
  fitnessGoals: string[];
  fitnessLevel: string;
  medicalConditions: string;
  dietaryRestrictions: string;
  workoutPreferences: string;
  equipmentAccess: string[];
  availableTime: number;
}

function buildPrompt(message: string, previousMessages: Message[], userProfile?: UserProfile): string {
  const MAX_CONTEXT_LENGTH = 5;
  const messages = previousMessages
    .slice(-MAX_CONTEXT_LENGTH)
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n');

  let enhancedSystemPrompt = SYSTEM_PROMPT;

  if (userProfile) {
    const profileContext = `
Current User Profile:
- Name: ${userProfile.name}
- Age: ${userProfile.age}
- Weight: ${userProfile.weight}kg
- Height: ${userProfile.height}cm
- Fitness Level: ${userProfile.fitnessLevel}
- Goals: ${userProfile.fitnessGoals.join(', ')}
${userProfile.medicalConditions ? `- Medical Conditions: ${userProfile.medicalConditions}` : ''}
${userProfile.dietaryRestrictions ? `- Dietary Restrictions: ${userProfile.dietaryRestrictions}` : ''}
- Equipment Access: ${userProfile.equipmentAccess.join(', ')}
- Available Time: ${userProfile.availableTime} minutes/day
${userProfile.workoutPreferences ? `- Preferences: ${userProfile.workoutPreferences}` : ''}

Remember to tailor all advice to this user's specific profile, considering their goals, limitations, and available resources.`;

    enhancedSystemPrompt = `${SYSTEM_PROMPT}\n\n${profileContext}`;
  }

  return `${enhancedSystemPrompt}\n\nPrevious Messages:\n${messages}\n\nCurrent Message: ${message}`;
}

const FITNESS_KEYWORDS = [
  'workout', 'exercise', 'fitness', 'gym', 'training',
  'diet', 'nutrition', 'protein', 'cardio', 'strength',
  'weight', 'muscle', 'health', 'run', 'stretch',
  'yoga', 'sport', 'athletic', 'endurance', 'energy'
];

function injectFitnessContext(message: string): string {
  const containsFitnessKeyword = FITNESS_KEYWORDS.some(keyword => 
    message.toLowerCase().includes(keyword)
  );

  if (!containsFitnessKeyword) {
    return `${message}\n\nPlease relate your response to the user's fitness journey and goals.`;
  }

  return message;
}

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error('Missing OPENROUTER_API_KEY environment variable');
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function OpenRouterStream(
  messages: Message[],
  model: string = 'google/gemini-pro'
) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://fitmate.vercel.app',
        'X-Title': 'FitMate',
      },
      body: JSON.stringify({
        model,
        messages: messages.map(message => ({
          role: message.role,
          content: message.content,
        })),
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error('Error in OpenRouter stream:', error);
    throw error;
  }
}

export async function OpenRouterChat(
  messages: Message[],
  model: string = 'google/gemini-pro'
) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://fitmate.vercel.app',
        'X-Title': 'FitMate',
      },
      body: JSON.stringify({
        model,
        messages: messages.map(message => ({
          role: message.role,
          content: message.content,
        })),
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error in OpenRouter chat:', error);
    throw error;
  }
}

export async function getFitnessResponse(
  message: string,
  previousMessages: Message[] = [],
  userProfile?: UserProfile,
  model?: string
) {
  try {
    const enhancedSystemPrompt = buildPrompt(message, previousMessages, userProfile);
    const processedMessage = injectFitnessContext(message);

    const conversationHistory = [
      {
        role: 'system',
        content: enhancedSystemPrompt
      },
      ...previousMessages,
      {
        role: 'user',
        content: processedMessage
      }
    ];

    console.log('Using model:', model || process.env.OPENROUTER_MODEL);

    const requestBody = {
      model: model || process.env.OPENROUTER_MODEL,
      messages: conversationHistory,
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 0.9,
      frequency_penalty: 0.5,
      presence_penalty: 0.5,
      stop: ["User:", "Assistant:", "System:", "Here's what to consider:"]
    };

    const response = await axios.post(
      OPENROUTER_API_URL,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
          'X-Title': 'FitMate',
        },
        timeout: 30000
      }
    );

    if (!response.data?.choices?.[0]?.message?.content) {
      console.error('Invalid response structure. Full response:', JSON.stringify(response.data, null, 2));
      throw new Error('High demand at the moment. Please try again in a few seconds.');
    }

    const content = response.data.choices[0].message.content;
    console.log('Raw content:', content);

    // Remove any remaining thought process patterns
    const cleanedContent = content
      .replace(/^(User:|Assistant:|System:|Here's what to consider:).*\n*/gm, '')
      .replace(/^[*\s]*\*\*(.*?)\*\*:/gm, '$1:')
      .trim();

    console.log('Cleaned content:', cleanedContent);

    if (!cleanedContent) {
      throw new Error('Response was empty after cleaning');
    }

    return cleanedContent;
  } catch (error) {
    console.error('Error calling OpenRouter API:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
      console.error('Status:', error.response?.status);
      console.error('Error message:', error.message);
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      
      if (error.response?.status === 429) {
        throw new Error('High demand at the moment. Please try again in a few seconds.');
      }

      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Authentication error with OpenRouter. Please check API key configuration.');
      }

      if (error.response?.data?.error?.message) {
        throw new Error(`High demand at the moment. Please try again in a few seconds.`);
      }
    }
    throw error instanceof Error ? error : new Error('High demand at the moment. Please try again in a few seconds.');
  }
} 