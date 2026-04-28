import React from 'react';
import { User } from '@/types/user';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import UserProfile from './UserProfile';

interface UserCardProps {
  user: User;
  onMessage?: (userId: string) => void;
  onViewProfile?: (userId: string) => void;
  showActions?: boolean;
}

const UserCard: React.FC<UserCardProps> = ({ 
  user, 
  onMessage, 
  onViewProfile, 
  showActions = true 
}) => {
  return (
    <Card className="bg-card border-border hover:bg-muted/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <UserProfile user={user} size="md" />
          
          {showActions && (
            <div className="flex gap-2">
              {onMessage && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onMessage(user.id)}
                  className="text-primary hover:text-primary/80"
                >
                  Message
                </Button>
              )}
              
              {onViewProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewProfile(user.id)}
                >
                  View Profile
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserCard;