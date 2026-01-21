// lib/super-admin.ts
import { getServerSession } from 'next-auth';
import { User } from '@/lib/models';
import connectDB from '@/lib/mongodb';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * Check if the current user is a super admin
 * Uses both environment variable and database role
 */
export async function isSuperAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user?.email) {
    return false;
  }

  const userEmail = session.user.email;

  // Method 1: Check environment variable (faster, recommended for production)
  const superAdminEmails = process.env.SUPER_ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
  if (superAdminEmails.includes(userEmail)) {
    console.log('✅ Super admin access granted (via environment variable):', userEmail);
    return true;
  }

  // Method 2: Check database role (more flexible, can be managed through UI)
  try {
    await connectDB();
    const user = await User.findOne({ email: userEmail });
    
    if (user?.role === 'superadmin') {
      console.log('✅ Super admin access granted (via database role):', userEmail);
      return true;
    }
  } catch (error) {
    console.error('❌ Error checking super admin status:', error);
  }

  console.log('❌ Super admin access denied:', userEmail);
  return false;
}

/**
 * Require super admin access - throws error if not authorized
 * Use this in API routes to protect admin endpoints
 */
export async function requireSuperAdmin(): Promise<void> {
  const isAdmin = await isSuperAdmin();
  
  if (!isAdmin) {
    throw new Error('Unauthorized: Super admin access required');
  }
}

/**
 * Get super admin emails from environment
 */
export function getSuperAdminEmails(): string[] {
  return process.env.SUPER_ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
}
