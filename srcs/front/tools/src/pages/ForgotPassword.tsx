import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthButton } from '@/components/auth/AuthButton';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const forgotPassword = async (email) => {
    try {
      const response = await fetch('http://localhost:3000/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setMessage('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const result = await forgotPassword(email);
      setMessage('Password reset instructions sent to your email');
      console.log('Success:', result);
    } catch (error) {
      setMessage(error.message || 'Failed to send reset instructions. Please try again.');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Forgot Password" 
      subtitle="Enter your email to receive password reset instructions"
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
        
        <div className="text-center mt-2.5">
          <span className="text-sm text-[rgba(255,255,255,0.6)] mr-2">
            Remember your password?
          </span>
          <Link
            to="/sign-in"
            className="text-sm text-[#667eea] font-medium hover:text-[#5a6fd8] transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;