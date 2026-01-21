import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Contact } from '@/lib/models';


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
    const organizationId = req.headers.get('X-User-UID');
    if (!organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    

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
    const organizationId = req.headers.get('X-User-UID');
    if (!organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
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

// DELETE a contact
export async function DELETE(req: NextRequest) {
  try {
    const organizationId = req.headers.get('X-User-UID');
    if (!organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get('id');

    if (!contactId) {
      return NextResponse.json({ error: 'Contact ID required' }, { status: 400 });
    }

    await connectDB();

    // Find and delete the contact, ensuring it belongs to the organization
    const contact = await Contact.findOneAndDelete({
      _id: contactId,
      organizationId: organizationId,
    });

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    console.log('✅ Contact deleted:', contactId);

    return NextResponse.json({ 
      message: 'Contact deleted successfully',
      contactName: contact.name,
      contactEmail: contact.email
    });
  } catch (error: any) {
    console.error('❌ Delete contact error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete contact' },
      { status: 500 }
    );
  }
}
