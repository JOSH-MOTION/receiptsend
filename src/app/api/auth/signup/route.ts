import { NextRequest, NextResponse } from 'next/server';
import { User, Organization } from '@/lib/models';
import connectDB from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    const { email, organizationName, uid } = await req.json();

    if (!email || !organizationName || !uid) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Create organization with Firebase UID as the ID
    const organization = await Organization.create({
      _id: uid, // Use Firebase UID as the primary key
      companyName: organizationName,
      email: email,
      createdAt: new Date(),
    });

    // Create user, linking to the organization via the UID
    const user = await User.create({
      uid: uid,
      email,
      organizationId: organization._id.toString(),
      createdAt: new Date(),
    });

    return NextResponse.json(
      {
        message: 'User and Organization created successfully in MongoDB',
        user: {
          id: user._id.toString(),
          email: user.email,
          organizationId: user.organizationId,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Signup error:', error);
    // Handle potential duplicate key error for organization
    if (error.code === 11000) {
        return NextResponse.json(
            { error: 'An organization with this ID already exists.' },
            { status: 409 }
        );
    }
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}
