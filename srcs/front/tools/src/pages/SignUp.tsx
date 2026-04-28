import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthButton } from '@/components/auth/AuthButton';

const SignUp = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const validateForm = () => {
    if (!firstName.trim()) {
      setMessage('First name is required');
      return false;
    }
    if (!lastName.trim()) {
      setMessage('Last name is required');
      return false;
    }
    if (!email.trim()) {
      setMessage('Email is required');
      return false;
    }
    if (password.length < 6) {
      setMessage('Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      console.log('Sending signup request...');
      
      const response = await fetch('http://localhost:3000/api/v1/auth/sign-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      // Vérifier si la réponse contient du JSON
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.log('Non-JSON response:', text);
        data = { message: 'Server returned non-JSON response' };
      }

      if (response.ok) {
        setMessage('Account created successfully! Please check your email for verification.');
        console.log('Signup successful:', data);
        // Redirect to verification page after a delay
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        console.log('Signup failed:', data);
        setMessage(data.message || `Failed to create account (${response.status})`);
      }
    } catch (error) {
      console.error('SignUp network error:', error);
      setMessage(`Network error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Sign Up" 
      subtitle="Create your account to get started"
    >
      <div className="w-full max-w-[400px] flex flex-col gap-5 max-sm:max-w-full">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <AuthInput
            type="text"
            placeholder="First Name"
            icon="ti-user"
            value={firstName}
            onChange={setFirstName}
            required
            autoComplete="given-name"
          />
          
          <AuthInput
            type="text"
            placeholder="Last Name"
            icon="ti-user"
            value={lastName}
            onChange={setLastName}
            required
            autoComplete="family-name"
          />
          
          <AuthInput
            type="email"
            placeholder="Email Address"
            icon="ti-mail"
            value={email}
            onChange={setEmail}
            required
            autoComplete="email"
          />
          
          <AuthInput
            type="password"
            placeholder="Password"
            icon="ti-lock"
            value={password}
            onChange={setPassword}
            required
            autoComplete="new-password"
            minLength={6}
          />
          
          <AuthInput
            type="password"
            placeholder="Confirm Password"
            icon="ti-lock"
            value={confirmPassword}
            onChange={setConfirmPassword}
            required
            autoComplete="new-password"
            minLength={6}
          />
          
          <AuthButton type="submit" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
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
          <span className="text-sm text-[rgba(255,255,255,0.6)] mr-2">
            Already have an account?
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

export default SignUp;
