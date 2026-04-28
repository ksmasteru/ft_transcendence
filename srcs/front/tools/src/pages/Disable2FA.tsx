import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthButton } from '@/components/auth/AuthButton';

const Disable2FA = () => {
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/disable-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          password,
          token: verificationCode 
        }),
      });

      if (response.ok) {
        setMessage('2FA has been disabled successfully');
      } else {
        const error = await response.json();
        setMessage(error.message || 'Failed to disable 2FA');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Disable 2FA" 
      subtitle="Enter your password and current 2FA code to disable two-factor authentication"
    >
      <div className="w-full max-w-[400px] flex flex-col gap-5 max-sm:max-w-full">
        <div className="bg-yellow-500/20 border border-yellow-500/30 p-4 rounded-lg mb-4">
          <p className="text-yellow-300 text-sm text-center">
            ⚠️ Disabling 2FA will make your account less secure
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <AuthInput
            type="password"
            placeholder="Current Password"
            icon="ti-lock"
            value={password}
            onChange={setPassword}
            required
            autoComplete="current-password"
          />
          
          <AuthInput
            type="text"
            placeholder="Enter 6-digit 2FA code"
            icon="ti-key"
            value={verificationCode}
            onChange={setVerificationCode}
            required
          />
          
          <AuthButton type="submit" disabled={isLoading}>
            {isLoading ? 'Disabling...' : 'Disable 2FA'}
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
            to="/dashboard"
            className="text-sm text-[#667eea] font-medium hover:text-[#5a6fd8] transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Disable2FA;