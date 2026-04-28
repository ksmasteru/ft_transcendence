import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthButton } from '@/components/auth/AuthButton';

const Setup2FA = () => {
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const setup2FA = async () => {
      try {
        const response = await fetch('/api/enable-2fa', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}` // Assuming you store JWT in localStorage
          },
        });

        if (response.ok) {
          const data = await response.json();
          setQrCode(data.qrCode);
          setSecret(data.secret);
        } else {
          setMessage('Failed to generate 2FA setup');
        }
      } catch (error) {
        setMessage('Network error. Please try again.');
      }
    };

    setup2FA();
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/verify-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ token: verificationCode }),
      });

      if (response.ok) {
        setMessage('2FA enabled successfully!');
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

  return (
    <AuthLayout 
      title="Setup 2FA" 
      subtitle="Secure your account with two-factor authentication"
    >
      <div className="w-full max-w-[400px] flex flex-col gap-5 max-sm:max-w-full">
        {qrCode && (
          <div className="text-center">
            <div className="bg-white p-4 rounded-lg inline-block mb-4">
              <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
            </div>
            <p className="text-sm text-[rgba(255,255,255,0.7)] mb-4">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </p>
            <div className="bg-[rgba(255,255,255,0.1)] p-3 rounded-lg mb-4">
              <p className="text-xs text-[rgba(255,255,255,0.6)] mb-1">Manual Entry Key:</p>
              <p className="text-sm text-white font-mono break-all">{secret}</p>
            </div>
          </div>
        )}
        
        <form onSubmit={handleVerify} className="flex flex-col gap-5">
          <AuthInput
            type="text"
            placeholder="Enter 6-digit code"
            icon="ti-key"
            value={verificationCode}
            onChange={setVerificationCode}
            required
          />
          
          <AuthButton type="submit" disabled={isLoading}>
            {isLoading ? 'Verifying...' : 'Verify & Enable 2FA'}
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

export default Setup2FA;