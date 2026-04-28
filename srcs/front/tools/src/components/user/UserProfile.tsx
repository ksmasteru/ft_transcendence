import React from 'react';
import { User } from '@/types/user';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserProfileProps {
  user: User;
  showStatus?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const UserProfile: React.FC<UserProfileProps> = ({ 
  user, 
  showStatus = true, 
  size = 'md' 
}) => {
  const avatarSizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <Avatar className={avatarSizes[size]}>
          <AvatarImage src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
          <AvatarFallback className="bg-muted text-foreground">
            {getInitials(user.firstName, user.lastName)}
          </AvatarFallback>
        </Avatar>
        
        {showStatus && (
          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
            user.onlineStatus ? 'bg-green-500' : 'bg-gray-400'
          }`} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className={`font-medium text-foreground ${textSizes[size]} truncate`}>
          {user.name}
        </div>
        
        {size !== 'sm' && (
          <div className="flex items-center gap-2 mt-1">
            {showStatus && (
              <Badge 
                variant={user.onlineStatus ? 'default' : 'secondary'} 
                className="text-xs"
              >
                {user.onlineStatus ? 'Online' : 'Offline'}
              </Badge>
            )}
            
            {user.verified && (
              <Badge variant="outline" className="text-xs">
                Verified
              </Badge>
            )}
          </div>
        )}
        
        {size === 'lg' && (
          <p className="text-sm text-muted-foreground mt-1">
            {user.email}
          </p>
        )}
      </div>
    </div>
  );
};

export default UserProfile;