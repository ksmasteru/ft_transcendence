import React from 'react';


export const Logo: React.FC = () => {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="relative">
        <img 
          src="/Logo.png"
          alt="Ping Pong Pro Logo" 
          className="w-auto h-16 object-contain animate-glow"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 blur-xl -z-10 animate-pulse" />
      </div>
    </div>
  );
};
