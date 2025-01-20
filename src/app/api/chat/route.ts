import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import clientPromise from '@/lib/mongodb-adapter';
import { Session } from 'next-auth';
import { getFitnessResponse } from '@/lib/openrouter';

interface CustomSession extends Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export async function POST(req: Request) {
  console.log('Chat API route called');
  
  try {
    const session = await getServerSession(authOptions) as CustomSession | null;
    console.log('Session in API route:', session);

    if (!session?.user?.id) {
      console.error('Unauthorized request - no valid session');
      console.error('Session object:', session);
      return NextResponse.json(
        { error: 'Please sign in to continue.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    console.log('Request body:', body);

    const { message, userId, previousMessages, model } = body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      console.error('Invalid message format:', message);
      return NextResponse.json({ error: 'Please enter a valid message.' }, { status: 400 });
    }

    if (userId !== session.user.id) {
      console.error('User ID mismatch:', { sessionUserId: session.user.id, requestUserId: userId });
      return NextResponse.json(
        { error: 'Invalid user ID.' },
        { status: 403 }
      );
    }

    console.log('Connecting to MongoDB...');
    const client = await clientPromise;
    const db = client.db('fitmate');
    console.log('Connected to MongoDB');

    // Get user profile
    const userProfile = await db.collection('userProfiles').findOne({ userId: session.user.id });
    if (!userProfile) {
      return NextResponse.json(
        { error: 'Please complete your profile setup first.' },
        { status: 400 }
      );
    }

    // Save user message
    console.log('Creating user message in DB...');
    const userMessage = await db.collection('messages').insertOne({
      content: message.trim(),
      role: 'user',
      userId: session.user.id,
      createdAt: new Date()
    });
    console.log('User message created:', userMessage);

    try {
      // Get response from OpenRouter with context and user profile
      console.log('Getting AI response with context and profile...');
      const assistantResponse = await getFitnessResponse(
        message,
        previousMessages || [],
        userProfile,
        model
      );
      console.log('AI response received:', assistantResponse);

      if (!assistantResponse) {
        throw new Error('No response received from AI');
      }

      // Save assistant message
      console.log('Saving assistant message to DB...');
      const assistantMessage = await db.collection('messages').insertOne({
        content: assistantResponse,
        role: 'assistant',
        userId: session.user.id,
        createdAt: new Date()
      });
      console.log('Assistant message saved:', assistantMessage);

      return NextResponse.json({
        userMessage: { ...userMessage, content: message.trim() },
        assistantMessage: { ...assistantMessage, content: assistantResponse }
      });
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred while processing your request';
      
      // Save error message
      console.log('Saving error message to DB...');
      const assistantMessage = await db.collection('messages').insertOne({
        content: 'High demand at the moment. Please try again in a few seconds.',
        role: 'assistant',
        userId: session.user.id,
        createdAt: new Date()
      });

      return NextResponse.json({
        userMessage: { ...userMessage, content: message.trim() },
        assistantMessage: { ...assistantMessage, content: 'High demand at the moment. Please try again in a few seconds.' },
        error: errorMessage
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in chat API:', error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Something went wrong. Please try again.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 