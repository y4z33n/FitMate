import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import clientPromise from '@/lib/mongodb-adapter';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const client = await clientPromise;
    const database = client.db('fitmate');
    const userProfile = await database.collection('userProfiles').findOne({ userId: session.user.id });

    if (!userProfile) {
      return new NextResponse(null, { status: 404 });
    }

    return NextResponse.json(userProfile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const profile = await request.json();
    const client = await clientPromise;
    const database = client.db('fitmate');

    // Validate required fields
    const requiredFields = ['name', 'age', 'weight', 'height', 'fitnessGoals', 'fitnessLevel'];
    for (const field of requiredFields) {
      if (!profile[field]) {
        return new NextResponse(`Missing required field: ${field}`, { status: 400 });
      }
    }

    // Add userId and timestamps
    const userProfile = {
      ...profile,
      userId: session.user.id,
      updatedAt: new Date(),
    };

    // Update or insert the profile
    await database.collection('userProfiles').updateOne(
      { userId: session.user.id },
      { $set: userProfile },
      { upsert: true }
    );

    return NextResponse.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 