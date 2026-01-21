"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser as useFirebaseUser, useFirebase } from '@/firebase';

interface UseAuthProps {
  required?: boolean;
}

export function useAuth({ required = true }: UseAuthProps = {}) {
  const { user, isUserLoading } = useFirebaseUser();
  const { auth } = useFirebase();
  const router = useRouter();

  useEffect(() => {
    if (isUserLoading) {
      return; // Wait until user status is determined
    }

    if (required && !user) {
      // If auth is required and user is not logged in, redirect to login
      router.push('/login');
    }

    if (!required && user) {
        // If auth is not required and user is logged in, redirect to dashboard
        router.push('/dashboard');
    }

  }, [user, isUserLoading, required, router]);

  return { user, isUserLoading, auth };
}
