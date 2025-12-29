"use client";

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UseAuthProps {
  required?: boolean;
}

export function useAuth({ required = true }: UseAuthProps = {}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isUserLoading = status === 'loading';

  useEffect(() => {
    if (isUserLoading) {
      return;
    }

    if (required && !session) {
      router.push('/login');
    }

    if (!required && session) {
      router.push('/dashboard');
    }
  }, [session, isUserLoading, required, router]);

  return { 
    user: session?.user || null, 
    isUserLoading,
    session 
  };
}

export function useUser() {
  const { data: session, status } = useSession();
  
  return {
    user: session?.user || null,
    isUserLoading: status === 'loading',
  };
}