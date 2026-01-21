import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Template } from '@/lib/models';
import connectDB from '@/lib/mongodb';

// GET all templates for the organization
export async function GET(req: NextRequest) {
  try {
    const organizationId = req.headers.get('X-User-UID');
    if (!organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    
    await connectDB();

    const query: { organizationId: string; type?: string } = { organizationId };
    if (type) {
      query.type = type;
    }

    const templates = await Template.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(templates);
  } catch (error: any) {
    console.error('Get templates error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}

// POST create a new template
export async function POST(req: NextRequest) {
  try {
    const organizationId = req.headers.get('X-User-UID');
    if (!organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { name, content, type } = await req.json();

    if (!name || !content || !type) {
        return NextResponse.json({ error: 'Missing required fields: name, content, type' }, { status: 400 });
    }

    await connectDB();

    const template = await Template.create({
      organizationId,
      name,
      content,
      type,
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error: any) {
    console.error('Create template error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}
