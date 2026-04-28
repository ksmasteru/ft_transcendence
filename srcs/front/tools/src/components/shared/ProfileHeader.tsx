import React from 'react';
import { Check } from 'lucide-react';

interface ProfileHeaderProps {
  avatar?: string;
  username: string;
  joinDate: string;
  isVerified?: boolean;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
  avatar, 
  username, 
  joinDate, 
  isVerified 
}) => (
  <div className="flex flex-col items-center text-center mb-10">
    <img 
      src={avatar || 'https://cdn.intra.42.fr/users/d253bf077c4fb611910625bca09ce269/zel-khad.jpeg'} 
      alt={username} 
      className="w-32 h-32 rounded-full border-4 border-background/10 mb-4" 
    />
    <div className="flex items-center gap-3">
      <h1 className="text-lg font-bold text-white">{username}</h1>
      {isVerified && (
        <div className="bg-blue-500 rounded-full p-1" title="Verified User">
          <Check size={20} className="text-white"/>
        </div>
      )}
    </div>
    <p className="text-muted-foreground mt-1">
      Joined on {new Date(joinDate).toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      })}
    </p>
  </div>
);