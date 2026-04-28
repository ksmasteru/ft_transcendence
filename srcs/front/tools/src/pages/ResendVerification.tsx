import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthButton } from '@/components/auth/AuthButton';

const ResendVerification = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('http://172.20.10.5:3000/api/v1/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setMessage('Verification email sent successfully! Please check your inbox.');
      } else {
        const error = await response.json();
        setMessage(error.message || 'Failed to send verification email');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Resend Verification" 
      subtitle="Enter your email to receive a new verification link"
    >
      <div className="w-full max-w-[400px] flex flex-col gap-5 max-sm:max-w-full">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <AuthInput
            type="email"
            placeholder="Email Address"
            icon="ti-mail"
            value={email}
            onChange={setEmail}
            required
            autoComplete="email"
          />
          
          <AuthButton type="submit" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Verification Email'}
          </AuthButton>
        </form>
        
        {message && (
          <div className={`text-center p-3 rounded-lg ${
            message.includes('successfully') 
              ? 'bg-green-500/20 text-green-300' 
              : 'bg-red-500/20 text-red-300'
          }`}>
            {message}
          </div>
        )}
        
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

export default ResendVerification;