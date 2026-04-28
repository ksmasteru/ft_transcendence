import React from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  label: string;
  level?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ value, max, label, level }) => (
  <div>
    <div className="flex justify-between items-center mb-2 text-sm">
      <span className="text-muted-foreground font-semibold">{label}</span>
      <span className="text-foreground font-medium">
        {value?.toLocaleString() || 0}/{max?.toLocaleString() || 100}
      </span>
    </div>
    <div className="w-full bg-background/20 rounded-full h-3 relative">
      <div 
        className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full" 
        style={{ width: `${(value / max) * 100}%` }}
      />
      {level && (
        <div className="absolute -right-3 -top-2.5 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm border-4 border-background">
          {level}
        </div>
      )}
    </div>
  </div>
);