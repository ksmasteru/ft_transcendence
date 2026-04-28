import React from 'react';

interface AuthButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false
}) => {
  const baseClasses = "w-full text-base font-medium cursor-pointer transition-all duration-[0.3s] ease-[ease] p-4 rounded-xl border-[none] max-sm:text-sm max-sm:p-3.5";
  
  const variantClasses = {
    primary: "text-white bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:from-[#5a6fd8] hover:to-[#6a4190]",
    secondary: "text-white border backdrop-blur-[10px] bg-[rgba(255,255,255,0.1)] border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.15)]"
  };

  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${disabledClasses}`}
    >
      {children}
    </button>
  );
};