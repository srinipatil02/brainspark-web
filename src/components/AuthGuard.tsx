'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * AuthGuard component that ensures user is authenticated.
 * Automatically signs in as guest if not authenticated.
 */
export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user, loading, signInAsGuest, isAuthenticated } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If not loading and not authenticated, auto sign in as guest
    if (!loading && !isAuthenticated && !isSigningIn) {
      setIsSigningIn(true);
      signInAsGuest()
        .catch((err) => {
          console.error('Failed to sign in as guest:', err);
          setError('Failed to connect. Please refresh the page.');
        })
        .finally(() => {
          setIsSigningIn(false);
        });
    }
  }, [loading, isAuthenticated, isSigningIn, signInAsGuest]);

  // Show loading state
  if (loading || isSigningIn) {
    return fallback || (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Connecting...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
}
