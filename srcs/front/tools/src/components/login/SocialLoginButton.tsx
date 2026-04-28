import React from 'react';

interface SocialLoginButtonProps {
  provider: 'google' | '42intra';
  onClick: () => void;
}

export const SocialLoginButton: React.FC<SocialLoginButtonProps> = ({ provider, onClick }) => {
  const isGoogle = provider === 'google';
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full border text-white text-sm font-normal cursor-pointer flex items-center justify-center gap-2.5 backdrop-blur-[10px] transition-all duration-[0.3s] ease-[ease] px-5 py-3.5 rounded-xl border-solid border-[rgba(255,255,255,0.2)] max-sm:text-[13px] max-sm:px-4 max-sm:py-3 hover:bg-[rgba(255,255,255,0.15)] ${
        isGoogle 
          ? 'bg-[rgba(255,255,255,0.1)]' 
          : 'bg-[rgba(66,165,245,0.2)] border-[rgba(66,165,245,0.3)]'
      }`}
    >
      {isGoogle && <i className="ti ti-brand-google text-lg" />}
      <span>
        {isGoogle ? 'Sign in with google' : 'Sign In with 42 intra'}
      </span>
    </button>
  );
};
