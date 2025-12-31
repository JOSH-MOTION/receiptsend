// app/admin/page.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { isSuperAdmin } from '@/lib/super-admin';
import SuperAdminDashboard from '@/components/super-admin-dashboard';

export default async function AdminPage() {
  const session = await getServerSession();
  
  // Check if user is logged in
  if (!session) {
    redirect('/auth/signin?callbackUrl=/admin');
  }

  // Check if user is super admin
  const isAdmin = await isSuperAdmin();
  
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center max-w-md p-8 border rounded-lg shadow-lg">
          <div className="mb-6">
            <svg
              className="mx-auto h-16 w-16 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-red-600 mb-4">
            Access Denied
          </h1>
          
          <p className="text-muted-foreground mb-2">
            You don't have permission to access the Super Admin Dashboard.
          </p>
          
          <div className="mt-4 p-3 bg-muted rounded text-sm">
            <p className="text-muted-foreground">
              <span className="font-medium">Logged in as:</span>
              <br />
              {session.user?.email}
            </p>
          </div>
          
          <p className="text-xs text-muted-foreground mt-4">
            Contact your system administrator if you believe this is an error.
          </p>
          
          <div className="mt-6">
            <a
              href="/dashboard"
              className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  // User is super admin - show the dashboard
  return <SuperAdminDashboard />;
}