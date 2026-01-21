// The admin dashboard has been temporarily removed during the migration to Firestore.
// A new dashboard needs to be built with Firestore-specific security and data access patterns.
export default function AdminPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Admin Dashboard Removed</h1>
      <p className="text-muted-foreground mt-2">
        This feature is temporarily unavailable while we complete our migration to Firebase.
      </p>
    </div>
  );
}
