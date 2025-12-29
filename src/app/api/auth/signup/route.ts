import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import mongoose from 'mongoose';
import { User, Organization } from '@/lib/models';

const MONGODB_URI = process.env.MONGODB_URI;

async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  return mongoose.connect(MONGODB_URI!);
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, organizationName } = await req.json();

    if (!email || !password || !organizationName) {
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

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create organization first
    const organization = await Organization.create({
      companyName: organizationName,
      email: email,
      createdAt: new Date(),
    });

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      organizationId: organization._id.toString(),
      createdAt: new Date(),
    });

    return NextResponse.json(
      {
        message: 'User created successfully',
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
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}