import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { Contact } from '@/lib/models';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const MONGODB_URI = process.env.MONGODB_URI;

async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  return mongoose.connect(MONGODB_URI!);
}

// GET all contacts for the organization
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = (session.user as any).organizationId;

    await connectDB();

    const contacts = await Contact.find({ organizationId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(contacts);
  } catch (error: any) {
    console.error('Get contacts error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}

// POST create a new contact
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = (session.user as any).organizationId;
    const data = await req.json();

    await connectDB();

    const contact = await Contact.create({
      ...data,
      organizationId,
      createdAt: new Date(),
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error: any) {
    console.error('Create contact error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}