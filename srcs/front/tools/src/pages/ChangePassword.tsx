import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthButton } from '@/components/auth/AuthButton';

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setMessage('New password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          currentPassword,
          newPassword 
        }),
      });

      if (response.ok) {
        setMessage('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const error = await response.json();
        setMessage(error.message || 'Failed to change password');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Change Password" 
      subtitle="Update your account password"
    >
      <div className="w-full max-w-[400px] flex flex-col gap-5 max-sm:max-w-full">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <AuthInput
            type="password"
            placeholder="Current Password"
            icon="ti-lock"
            value={currentPassword}
            onChange={setCurrentPassword}
            required
            autoComplete="current-password"
          />
          
          <AuthInput
            type="password"
            placeholder="New Password"
            icon="ti-lock"
            value={newPassword}
            onChange={setNewPassword}
            required
            autoComplete="new-password"
          />
          
          <AuthInput
            type="password"
            placeholder="Confirm New Password"
            icon="ti-lock"
            value={confirmPassword}
            onChange={setConfirmPassword}
            required
            autoComplete="new-password"
          />
          
          <AuthButton type="submit" disabled={isLoading}>
            {isLoading ? 'Changing...' : 'Change Password'}
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
        
        <div className="bg-gray-500/20 p-3 rounded-lg">
          <p className="text-xs text-[rgba(255,255,255,0.6)] text-center">
            💡 Use a strong password with at least 8 characters, including uppercase, lowercase, numbers, and special characters.
          </p>
        </div>
        
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

export default ChangePassword;