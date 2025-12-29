'use client';

import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/hooks/use-auth-new";
import { Skeleton } from "@/components/ui/skeleton";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isUserLoading } = useAuth({ required: true });

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
            </div>
        </div>
      </div>
    )
  }
  
  return <AppShell>{children}</AppShell>;
}