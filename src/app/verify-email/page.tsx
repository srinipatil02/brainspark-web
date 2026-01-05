'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { sendEmailVerification } from 'firebase/auth';
import { useAuth } from '@/contexts/AuthContext';

export default function VerifyEmail() {
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [message, setMessage] = useState('');

  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.emailVerified) {
      router.push('/');
    }

    // Check verification status periodically
    const interval = setInterval(async () => {
      await user.reload();
      if (user.emailVerified) {
        router.push('/');
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [user, router]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setResendDisabled(false);
    }
  }, [countdown]);

  const handleResend = async () => {
    if (!user || resendDisabled) return;

    try {
      await sendEmailVerification(user);
      setMessage('Verification email sent!');
      setResendDisabled(true);
      setCountdown(60);
    } catch {
      setMessage('Failed to send email. Please try again.');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Verify Your Email</h1>
        <p className="text-gray-500 mb-6">
          We sent a verification email to<br />
          <span className="font-medium text-gray-700">{user?.email}</span>
        </p>

        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <p className="text-gray-600 mb-4">
            Click the link in the email to verify your account. If you don&apos;t see it, check your spam folder.
          </p>

          {message && (
            <p className={`text-sm mb-4 ${message.includes('sent') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
          )}

          <button
            onClick={handleResend}
            disabled={resendDisabled}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {resendDisabled ? `Resend in ${countdown}s` : 'Resend Verification Email'}
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="text-gray-500 hover:text-gray-700"
        >
          Sign out and use a different email
        </button>
      </div>
    </div>
  );
}
