import React from 'react';

interface InputFieldProps {
  type: 'email' | 'password';
  placeholder: string;
  icon: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({
  type,
  placeholder,
  icon,
  value,
  onChange,
  required = false
}) => {
  return (
    <div className="w-full">
      <div className="relative flex items-center backdrop-blur-[10px] border bg-[rgba(255,255,255,0.1)] px-5 py-4 rounded-xl border-solid border-[rgba(255,255,255,0.2)] max-sm:px-4 max-sm:py-3.5">
        <i className={`ti ${icon} text-[rgba(255,255,255,0.6)] text-xl mr-3`} />
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="text-white text-base flex-1 border-[none] bg-transparent outline-none placeholder:text-[rgba(255,255,255,0.6)] max-sm:text-sm"
        />
      </div>
    </div>
  );
};
