import { useState } from 'react';
import { User } from '@/types/user';

export const useDashboard = () => {
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<User | null>(null);

  // Mock current user
  const currentUser: User = {
    id: 'current-user',
    firstName: 'Chidi',
    lastName: 'Eze',
    name: 'Chidi Eze',
    email: 'chidi@example.com',
    verified: true,
    avatar: 'https://api.builder.io/api/v1/image/assets/TEMP/1189bfd2589a9ef75b27e5edcde10ea384a4341f?width=96',
    onlineStatus: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    twoFactorEnabled: false,
    xp: 2500,
    level: 3
  };

  // Mock friends list
  const friends: User[] = [
    {
      id: '1',
      firstName: 'Shawn',
      lastName: 'Garcia',
      name: 'Shawn Garcia',
      email: 'shawn@example.com',
      verified: true,
      avatar: 'https://api.builder.io/api/v1/image/assets/TEMP/012a741d72935091faea1bd54673733c5840515c?width=64',
      onlineStatus: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      twoFactorEnabled: false,
      xp: 1500,
      level: 2
    },
    {
      id: '2',
      firstName: 'Daniel',
      lastName: 'Gallego',
      name: 'Daniel Gallego',
      email: 'daniel@example.com',
      verified: true,
      avatar: 'https://api.builder.io/api/v1/image/assets/TEMP/61ef6e76c8823310bf4c0b58863cec24a216fb9f?width=64',
      onlineStatus: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      twoFactorEnabled: true,
      xp: 3200,
      level: 4
    }
  ];

  const handleMessageFriend = (userId: string) => {
    const friend = friends.find(f => f.id === userId);
    if (friend) {
      setSelectedFriend(friend);
      setChatModalOpen(true);
    }
  };

  const handleSendMessage = async (receiverId: string, content: string) => {
    // Mock send message function
    console.log('Sending message to:', receiverId, 'Content:', content);
    // Here you would integrate with your backend API
  };

  const handleCloseChatModal = () => {
    setChatModalOpen(false);
    setSelectedFriend(null);
  };

  return {
    chatModalOpen,
    selectedFriend,
    currentUser,
    friends,
    handleMessageFriend,
    handleSendMessage,
    handleCloseChatModal
  };
};