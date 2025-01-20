import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import clientPromise from '@/lib/mongodb-adapter';
import { Session } from 'next-auth';

interface CustomSession extends Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const client = await clientPromise;
    const database = client.db('fitmate');
    const chatSessions = await database.collection('chatSessions')
      .find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(chatSessions);
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const client = await clientPromise;
    const database = client.db('fitmate');
    const result = await database.collection('chatSessions').insertOne({
      userId: session.user.id,
      createdAt: new Date(),
      messages: []
    });

    return NextResponse.json({ id: result.insertedId });
  } catch (error) {
    console.error('Error creating chat session:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions) as CustomSession | null;
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { chatId, messages } = body;

    if (!chatId || !messages) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const database = client.db('fitmate');
    const result = await database.collection('chatSessions').updateOne(
      { _id: chatId, userId: session.user.id },
      { $set: { messages } }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Chat session updated successfully' });
  } catch (error) {
    console.error('Error updating chat session:', error);
    return NextResponse.json(
      { error: 'Failed to update chat session' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions) as CustomSession | null;
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const database = client.db('fitmate');
    const result = await database.collection('chatSessions').deleteOne({
      _id: chatId,
      userId: session.user.id,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Chat session deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat session:', error);
    return NextResponse.json(
      { error: 'Failed to delete chat session' },
      { status: 500 }
    );
  }
} 