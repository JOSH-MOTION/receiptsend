// app/admin/page.tsx
import SuperAdminDashboard from '@/components/super-admin-dashboard';

export default function AdminPage() {
  // The client component SuperAdminDashboard will handle auth checks and data fetching.
  // The actual API routes that the dashboard uses are protected on the server.
  return <SuperAdminDashboard />;
}
