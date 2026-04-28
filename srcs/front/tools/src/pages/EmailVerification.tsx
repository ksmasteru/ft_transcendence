import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthButton } from '@/components/auth/AuthButton';

const EmailVerification = () => {
  const { userId, uniqueString } = useParams<{ userId: string; uniqueString: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!userId || !uniqueString) {
        setStatus('error');
        setMessage('Invalid verification link');
        return;
      }

      try {
        const response = await fetch(`http://localhost:3000/api/v1/auth/verify/${userId}/${uniqueString}`, {
          method: 'GET',
        });

        if (response.ok) {
          setStatus('success');
          setMessage('Your email has been successfully verified!');
        } else {
          const error = await response.json();
          setStatus('error');
          setMessage(error.message || 'Verification failed');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Network error. Please try again.');
      }
    };

    verifyEmail();
  }, [userId, uniqueString]);

  return (
    <AuthLayout 
      title={status === 'loading' ? 'Verifying...' : status === 'success' ? 'Verified!' : 'Verification Failed'}
      subtitle={message}
    >
      <div className="w-full max-w-[400px] flex flex-col gap-5 max-sm:max-w-full text-center">
        {status === 'loading' && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}
        
        {status === 'success' && (
          <>
            <div className="text-6xl mb-4">✅</div>
            <Link to="/sign-in">
              <AuthButton>
                Go to Sign In
              </AuthButton>
            </Link>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="text-6xl mb-4">❌</div>
            <div className="flex flex-col gap-3">
              <Link to="/resend-verification">
                <AuthButton variant="secondary">
                  Resend Verification Email
                </AuthButton>
              </Link>
              <Link to="/sign-up">
                <AuthButton>
                  Back to Sign Up
                </AuthButton>
              </Link>
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  );
};

export default EmailVerification;