import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthButton } from '@/components/auth/AuthButton';

const Verify2FA = () => {
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/verify-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token: verificationCode,
          // You might need to include other data like email or temporary session token
        }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token); // Store the JWT token
        navigate('/dashboard');
      } else {
        const error = await response.json();
        setMessage(error.message || 'Invalid verification code');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    // If your backend supports resending 2FA codes
    setMessage('Code resent to your authenticator app');
  };

  return (
    <AuthLayout 
      title="Verify 2FA" 
      subtitle="Enter the 6-digit code from your authenticator app"
    >
      <div className="w-full max-w-[400px] flex flex-col gap-5 max-sm:max-w-full">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <AuthInput
            type="text"
            placeholder="Enter 6-digit code"
            icon="ti-key"
            value={verificationCode}
            onChange={setVerificationCode}
            required
          />
          
          <AuthButton type="submit" disabled={isLoading}>
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </AuthButton>
        </form>
        
        {message && (
          <div className={`text-center p-3 rounded-lg ${
            message.includes('resent') 
              ? 'bg-green-500/20 text-green-300' 
              : 'bg-red-500/20 text-red-300'
          }`}>
            {message}
          </div>
        )}
        
        <div className="text-center">
          <button
            type="button"
            onClick={handleResendCode}
            className="text-sm text-[rgba(255,255,255,0.7)] hover:text-white transition-colors mb-2"
          >
            Didn't receive a code? Check your authenticator app
          </button>
        </div>
        
        <div className="text-center mt-2.5">
          <Link
            to="/sign-in"
            className="text-sm text-[#667eea] font-medium hover:text-[#5a6fd8] transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Verify2FA;