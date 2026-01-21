import { NextResponse } from 'next/server';

// This route is intentionally left blank to resolve a build conflict
// after migrating away from next-auth.
// It is not used by the application.

export async function GET() {
  return new NextResponse(null, { status: 404 });
}

export async function POST() {
    return new NextResponse(null, { status: 404 });
}
