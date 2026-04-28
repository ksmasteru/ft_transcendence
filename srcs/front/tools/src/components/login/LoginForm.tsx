import React, { useState } from 'react';
import { InputField } from './InputField';
import { SocialLoginButton } from './SocialLoginButton';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState({ google: false, '42intra': false });
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
  
    if (!email || !password) {
      setMessage({ type: 'error', text: 'Please fill in all fields.' });
      setLoading(false);
      return;
    }
  
    try {
      const response = await fetch('http://localhost:3000/api/v1/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
  
      const data = await response.json();
  
      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'Login successful! Redirecting...' });
  
        // Save user info in localStorage
        if (data.user || data.data) {
          const userData = data.user || data.data;
          localStorage.setItem('userData', JSON.stringify(userData));
  
          // Log the login event to your backend
          await fetch(`http://localhost:3000/api/v1/log/logs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              level: 'info',
              message: 'User logged in successfully.',
              component: 'auth-service',
              userId: userData.id
            }),
          });
        }
  
        setTimeout(() => {
          window.location.href = '/Profile';
        }, 1000);
  
      } else {
        let errorMessage = 'Login failed. Please try again.';
        if (response.status === 401) errorMessage = 'Invalid email or password.';
        else if (response.status === 403) errorMessage = 'Please verify your email before signing in.';
        else if (data.message) errorMessage = data.message;
  
        setMessage({ type: 'error', text: errorMessage });
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage({ type: 'error', text: 'Network error. Please check your connection and try again.' });
    } finally {
      setLoading(false);
    }
  };
  
  const handleForgotPassword = () => {
    window.location.href = '/forgot-password';
  };

  const handleOAuthLogin = async (provider: 'google' | '42intra') => {
    setOauthLoading({ ...oauthLoading, [provider]: true });
    setMessage({ type: '', text: '' });

    try {
      const oauthUrl = `http://localhost:3000/api/v1/auth/${provider}`;
      window.location.href = oauthUrl;
    } catch (error) {
      console.error(`${provider} OAuth error:`, error);
      setMessage({ type: 'error', text: `Failed to initialize ${provider} sign-in.` });
      setOauthLoading({ ...oauthLoading, [provider]: false });
    }
  };
  const handleGoogleLogin = () => {
    handleOAuthLogin('google');
  };

  const handle42Login = () => {
    handleOAuthLogin('42intra');
  };

  const handleCreateAccount = () => {
    window.location.href = '/sign-up';
  };

  return (
    <div className="w-full max-w-[400px] flex flex-col gap-5 max-sm:max-w-full">
      {/* Message Display */}
      {message.text && (
        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-900/20 border border-green-500/20 text-green-400' 
            : 'bg-red-900/20 border border-red-500/20 text-red-400'
        }`}>
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
            message.type === 'success' ? 'bg-green-400' : 'bg-red-400'
          }`} />
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <InputField
          type="email"
          placeholder="Email Address"
          icon="ti-mail"
          value={email}
          onChange={setEmail}
          required
        />
        
        <InputField
          type="password"
          placeholder="Password"
          icon="ti-lock"
          value={password}
          onChange={setPassword}
          required
        />
        
        <div className="text-right -mt-2.5">
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-sm text-[rgba(255,255,255,0.7)] cursor-pointer hover:text-white transition-colors"
          >
            Forgot password?
          </button>
        </div>
        
        <button
          type="submit"
          disabled={loading || oauthLoading.google || oauthLoading['42intra']}
          className="w-full text-white text-base font-medium cursor-pointer transition-all duration-[0.3s] ease-[ease] p-4 rounded-xl border-[none] bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:from-[#5a6fd8] hover:to-[#6a4190] disabled:opacity-50 disabled:cursor-not-allowed max-sm:text-sm max-sm:p-3.5"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Signing in...
            </div>
          ) : (
            'Sign In'
          )}
        </button>
      </form>
      
      <div className="text-center mx-0 my-2.5">
        <p className="text-sm text-[rgba(255,255,255,0.6)]">
          Sign In with Others
        </p>
      </div>
      
      <SocialLoginButton 
        provider="google" 
        onClick={handleGoogleLogin}
        // loading={oauthLoading.google}
      />
      <SocialLoginButton 
        provider="42intra" 
        onClick={handle42Login}
        // loading={oauthLoading.intra}
      />
      
      <div className="text-center mt-2.5">
        <span className="text-sm text-[rgba(255,255,255,0.6)] mr-2">
          Don't have an account?
        </span>
        <button
          type="button"
          onClick={handleCreateAccount}
          className="text-sm text-[#667eea] cursor-pointer font-medium hover:text-[#5a6fd8] transition-colors"
        >
          Create Account
        </button>
      </div>
    </div>
  );
};