import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthButton } from '@/components/auth/AuthButton';

const Reset2FA = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/reset-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setMessage('2FA reset instructions sent to your email. Please check your inbox.');
      } else {
        const error = await response.json();
        setMessage(error.message || 'Failed to reset 2FA');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Reset 2FA" 
      subtitle="Lost access to your authenticator? We'll help you reset your 2FA"
    >
      <div className="w-full max-w-[400px] flex flex-col gap-5 max-sm:max-w-full">
        <div className="bg-blue-500/20 border border-blue-500/30 p-4 rounded-lg mb-4">
          <p className="text-blue-300 text-sm text-center">
            📱 If you've lost access to your authenticator app, enter your email to receive reset instructions
          </p>
        </div>
        
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
            {isLoading ? 'Sending...' : 'Send Reset Instructions'}
          </AuthButton>
        </form>
        
        {message && (
          <div className={`text-center p-3 rounded-lg ${
            message.includes('sent') 
              ? 'bg-green-500/20 text-green-300' 
              : 'bg-red-500/20 text-red-300'
          }`}>
            {message}
          </div>
        )}
        
        <div className="text-center">
          <p className="text-xs text-[rgba(255,255,255,0.6)] mb-4">
            For security reasons, 2FA reset may require additional verification steps and may take 24-48 hours to process.
          </p>
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

export default Reset2FA;