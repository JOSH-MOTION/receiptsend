import { NextRequest, NextResponse } from 'next/server';
import { Organization } from '@/lib/models';
import connectDB from '@/lib/mongodb';

// GET organization details
export async function GET(req: NextRequest) {
  try {
    const organizationId = req.headers.get('X-User-UID');
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Unauthorized: Missing user ID' }, { status: 401 });
    }

    await connectDB();

    const organization = await Organization.findById(organizationId).lean();

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json(organization);
  } catch (error: any) {
    console.error('Get organization error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}

// PUT update organization details
export async function PUT(req: NextRequest) {
  try {
    const organizationId = req.headers.get('X-User-UID');
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Unauthorized: Missing user ID' }, { status: 401 });
    }
    
    const data = await req.json();

    await connectDB();

    const organization = await Organization.findByIdAndUpdate(
      organizationId,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json(organization);
  } catch (error: any) {
    console.error('Update organization error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}
