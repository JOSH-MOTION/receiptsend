// lib/super-admin.ts
import { User } from '@/lib/models';
import connectDB from '@/lib/mongodb';

/**
 * Check if the user is a super admin based on their UID.
 * This function is designed for server-side use in API routes.
 * @param uid The Firebase UID of the user to check. Can be null.
 */
export async function isSuperAdmin(uid: string | null): Promise<boolean> {
  if (!uid) {
    return false;
  }
  
  // Find the user in your MongoDB database by their Firebase UID.
  try {
    await connectDB();
    const user = await User.findOne({ uid: uid });

    if (!user || !user.email) {
      console.log('❌ Super admin check failed: User not found in DB for UID:', uid);
      return false;
    }
    
    const userEmail = user.email;

    // Method 1: Check environment variable (primary method).
    const superAdminEmails = process.env.SUPER_ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
    if (superAdminEmails.includes(userEmail.toLowerCase())) {
      console.log('✅ Super admin access granted (via environment variable):', userEmail);
      return true;
    }

    // Method 2: Check 'role' field in the database (secondary method).
    if (user.role === 'superadmin') {
      console.log('✅ Super admin access granted (via database role):', userEmail);
      return true;
    }
  } catch (error) {
     console.error('❌ Error during super admin check in database:', error);
     return false;
  }

  // If neither check passes, deny access.
  console.log('❌ Super admin access denied for:', uid);
  return false;
}

/**
 * Get super admin emails from environment
 */
export function getSuperAdminEmails(): string[] {
  return process.env.SUPER_ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
}
