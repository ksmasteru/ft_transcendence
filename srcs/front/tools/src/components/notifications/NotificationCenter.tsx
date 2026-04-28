import React, { useEffect, useState } from 'react';
import { Bell, Users, Trophy, MessageSquare, Calendar, Check, X, UserPlus, Gamepad2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface Notification {
  id: string;
  type: 'friend_request' | 'game_invite' | 'achievement' | 'message' | 'tournament' | 'system';
  title: string;
  message: string;
  createdAt?: string;
  timestamp?: Date;
  read: boolean;
  avatar?: string;
  actionable?: boolean;
  metadata?: {
    fromUserId?: string;
    gameId?: string;
    achievementId?: string;
  };
}

const NotificationIcon: React.FC<{ type: string }> = ({ type }) => {
  const iconMap = {
    friend_request: <UserPlus className="w-5 h-5 text-primary" />,
    game_invite: <Gamepad2 className="w-5 h-5 text-accent" />,
    achievement: <Trophy className="w-5 h-5 text-gaming-accent" />,
    message: <MessageSquare className="w-5 h-5 text-secondary" />,
    tournament: <Calendar className="w-5 h-5 text-primary" />,
    system: <Bell className="w-5 h-5 text-muted-foreground" />
  };
  
  return iconMap[type as keyof typeof iconMap] || <Bell className="w-5 h-5" />;
};

const NotificationCard: React.FC<{ 
  notification: Notification; 
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  onMarkRead?: (id: string) => void;
}> = ({ notification, onAccept, onDecline, onMarkRead }) => {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <Card className={`card-gaming transition-all duration-300 ${
      !notification.read ? 'ring-1 ring-primary/50 bg-primary/5' : ''
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon or Avatar */}
          <div className="relative flex-shrink-0">
            {notification.avatar ? (
              <img 
                src={notification.avatar} 
                alt="User"
                className="w-10 h-10 rounded-full border-2 border-primary/50"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <NotificationIcon type={notification.type} />
              </div>
            )}
            {!notification.read && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full border-2 border-background"></div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4 className="font-semibold text-sm gaming-text-glow">
                  {notification.title}
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatTime(notification.timestamp ? new Date(notification.timestamp) : new Date(notification.createdAt || Date.now()))}
                </p>
              </div>
              
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onMarkRead?.(notification.id)}
                  className="text-muted-foreground hover:text-foreground p-1"
                >
                  <Check className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Action Buttons */}
            {notification.actionable && !notification.read && (
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={() => onAccept?.(notification.id)}
                  className="btn-gaming text-xs px-3 py-1"
                >
                  Accept
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDecline?.(notification.id)}
                  className="text-xs px-3 py-1"
                >
                  Decline
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3000/api/v1/notifications', { credentials: 'include' });
      const json = await res.json();
      const items: Notification[] = (json.data || []).map((n: any) => ({
        id: n.id,
        type: n.type || 'system',
        title: n.title || 'Notification',
        message: n.message || '',
        createdAt: n.createdAt,
        read: !!n.read,
        avatar: n.avatar || undefined,
        actionable: !!n.actionable,
        metadata: n.metadata || undefined,
      }));
      setNotifications(items);
    } catch (e) {
      console.error('Failed to load notifications', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const friendRequests = notifications.filter(n => n.type === 'friend_request');
  const gameInvites = notifications.filter(n => n.type === 'game_invite');
  const achievements = notifications.filter(n => n.type === 'achievement');
  const others = notifications.filter(n => !['friend_request', 'game_invite', 'achievement'].includes(n.type));

  const handleAccept = async (id: string) => {
    try {
      await fetch('http://localhost:3000/api/v1/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id }),
      });
      await load();
    } catch (e) {
      console.error('Failed to accept/mark read', e);
    }
  };

  const handleDecline = async (id: string) => {
    // For now just mark read
    return handleAccept(id);
  };

  const handleMarkRead = async (id: string) => handleAccept(id);

  const handleMarkAllRead = async () => {
    try {
      await fetch('http://localhost:3000/api/v1/notifications/mark-all-read', {
        method: 'POST',
        credentials: 'include',
      });
      await load();
    } catch (e) {
      console.error('Failed to mark all read', e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="w-6 h-6 text-primary" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-2 -right-2 min-w-[20px] h-5 text-xs flex items-center justify-center bg-accent text-white">
                {unreadCount}
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gaming-primary">
            Notifications
          </h1>
        </div>
        
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            className="btn-gaming"
          >
            Mark All Read
          </Button>
        )}
      </div>

      {/* Notification Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="text-xs">
            All ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="friends" className="text-xs">
            Friends ({friendRequests.length})
          </TabsTrigger>
          <TabsTrigger value="games" className="text-xs">
            Games ({gameInvites.length})
          </TabsTrigger>
          <TabsTrigger value="achievements" className="text-xs">
            Achievements ({achievements.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3">
          {notifications.length > 0 ? (
            notifications.map(notification => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onAccept={handleAccept}
                onDecline={handleDecline}
                onMarkRead={handleMarkRead}
              />
            ))
          ) : (
            <Card className="card-gaming">
              <CardContent className="p-12 text-center">
                <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">No notifications</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="friends" className="space-y-3">
          {friendRequests.map(notification => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onAccept={handleAccept}
              onDecline={handleDecline}
              onMarkRead={handleMarkRead}
            />
          ))}
        </TabsContent>

        <TabsContent value="games" className="space-y-3">
          {gameInvites.map(notification => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onAccept={handleAccept}
              onDecline={handleDecline}
              onMarkRead={handleMarkRead}
            />
          ))}
        </TabsContent>

        <TabsContent value="achievements" className="space-y-3">
          {achievements.map(notification => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onAccept={handleAccept}
              onDecline={handleDecline}
              onMarkRead={handleMarkRead}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};