'use client';

// This feature has been temporarily disabled during the migration to Firebase.
// Securely sending SMS requires a server-side environment (like Firebase Functions)
// to manage API keys, which is not available in the current client-only setup.
export default function BulkSmsPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Bulk SMS Feature Disabled</h1>
      <p className="text-muted-foreground mt-2">
        This feature is temporarily unavailable. Securely sending SMS requires a backend service to protect API keys.
      </p>
    </div>
  );
}
