import React, { useState, useEffect, useRef } from 'react';
import { Search, PenSquare, X, Camera, Zap, Coffee, Gamepad2, Sparkles, Clock, Swords, Ban, Trophy, Users, MessageSquare, ArrowLeft, Trash2, UserPlus, Pencil, Check, CheckCheck } from 'lucide-react';
import { Header } from '../components/shared/Header';
import { Sidebar } from '../components/shared/Sidebar';
import { useUserData } from '../hooks/useUserData';
import { useSearchParams } from 'react-router-dom';

// Enhanced API helpers for chat functionality
const api = {
  getConversations: async () => {
    const res = await fetch('http://localhost:3000/api/v1/chats', { credentials: 'include' });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  },
  
  getMessages: async (chatId: string, page = 1, limit = 50) => {
    const res = await fetch(`http://localhost:3000/api/v1/chats/${chatId}/messages?page=${page}&limit=${limit}`, { 
      credentials: 'include' 
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  },
  
  sendMessage: async (chatId: string, content: string, type: 'text' | 'image' | 'file' = 'text') => {
    const res = await fetch(`http://localhost:3000/api/v1/chats/${chatId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ content, type }),
    });
    return res.json();
  },
  
  createDirectChat: async (userId: string) => {
    const res = await fetch('http://localhost:3000/api/v1/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ userId }),
    });
    return res.json();
  },
  
  createGroupChat: async (name: string, participantIds: string[]) => {
    const res = await fetch('http://localhost:3000/api/v1/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ isGroup: true, name, participantIds }),
    });
    return res.json();
  },
  
  updateChat: async (chatId: string, updates: { name?: string; avatar?: string }) => {
    const res = await fetch(`http://localhost:3000/api/v1/chats/${chatId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    return res.json();
  },
  
  deleteChat: async (chatId: string) => {
    const res = await fetch(`http://localhost:3000/api/v1/chats/${chatId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return res.json();
  },
  
  addParticipants: async (chatId: string, userIds: string[]) => {
    const res = await fetch(`http://localhost:3000/api/v1/chats/${chatId}/participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ userIds }),
    });
    return res.json();
  },
  
  removeParticipant: async (chatId: string, userId: string) => {
    const res = await fetch(`http://localhost:3000/api/v1/chats/${chatId}/participants/${userId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return res.json();
  },
  
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await fetch('http://localhost:3000/api/v1/upload', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    
    if (!res.ok) throw new Error('File upload failed');
    return res.json();
  },
  
  getUsers: async (searchTerm = '') => {
    const url = searchTerm ? 
      `http://localhost:3000/api/v1/user/search?name=${encodeURIComponent(searchTerm)}` :
      'http://localhost:3000/api/v1/user';
    
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  }
};


type UserStatus = 'online' | 'offline' | 'in-game';
type MatchType = 'Ranked 1v1 🏆' | 'Casual 1v1 ☕' | 'Doubles 2v2 👥';
type InviteStatus = 'pending' | 'accepted' | 'declined';
type LobbyStatus = 'open' | 'full' | 'in-progress';

interface Friend { id: string; name: string; avatar: string; status: UserStatus; isBlocked?: boolean; }
interface Message { 
  id: string; 
  senderId: string; 
  content: string; 
  timestamp: Date; 
  type: 'text' | 'image' | 'file' | 'system' | 'invite' | 'group-invite'; 
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  inviteStatus?: InviteStatus; 
  matchType?: MatchType; 
  lobby?: Friend[]; 
  lobbyStatus?: LobbyStatus; 
  maxPlayers?: number; 
}
interface ChatConversation { 
  id: string; 
  user: { id: string; name: string; avatar: string; status?: UserStatus; }; 
  lastMessage: string; 
  timestamp: Date; 
  messages: Message[]; 
  isGroup?: boolean; 
  participants?: Friend[]; 
  typingUsers?: string[]; 
}


// Remove hardcoded currentUser - we'll use the real user data from the hook
const initialFriends: Friend[] = [ { id: 'erin-steed-id', name: 'Erin Steed', avatar: 'https://i.pravatar.cc/150?u=erin-steed', status: 'online' }, { id: 'daisy-tinsley-id', name: 'Daisy Tinsley', avatar: 'https://i.pravatar.cc/150?u=daisy-tinsley', status: 'in-game' }, { id: 'zach-friedman-id', name: 'Zach Friedman', avatar: 'https://i.pravatar.cc/150?u=zach-friedman', status: 'offline' }, { id: 'dee-mcrobie-id', name: 'Dee McRobie', avatar: 'https://i.pravatar.cc/150?u=dee-mcrobie', status: 'online', isBlocked: true }, ];
// Initial conversations will be empty - we load from backend
const initialConversations: ChatConversation[] = [];


const formatTimestamp = (date: Date) => { return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); };


const useChat = (currentUser: any) => {
  const [conversations, setConversations] = useState<ChatConversation[]>(initialConversations);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load conversations and friends from backend
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load conversations
        const list = await api.getConversations();
        if (Array.isArray(list) && list.length) {
          const mapped: ChatConversation[] = list.map((c: any) => ({
            id: c.id,
            user: c.isGroup
              ? { id: c.id, name: c.name || 'Group', avatar: c.avatar || 'https://i.pravatar.cc/150?u=' + c.id }
              : (() => {
                  // Find the other user (not the current user)
                  const other = (c.participants || []).find((u:any) => u.isSelf === false) || 
                               (c.participants || []).find((u:any) => !u.isSelf && u.id !== currentUser?.id) ||
                               (c.participants || [])[0] || 
                               { id: c.id, name: 'Chat', avatar: '' };
                  return { 
                    id: other.id, 
                    name: other.name, 
                    avatar: other.avatar || `https://i.pravatar.cc/150?u=${other.id}`, 
                    status: other.onlineStatus ? 'online' : 'offline' as UserStatus 
                  };
                })(),
            lastMessage: c.lastMessage?.content || '',
            timestamp: new Date(c.lastMessageAt || Date.now()),
            isGroup: !!c.isGroup,
            participants: (c.participants || []).map((u: any) => ({ 
              id: u.id, 
              name: u.name, 
              avatar: u.avatar || `https://i.pravatar.cc/150?u=${u.id}`, 
              status: u.onlineStatus ? 'online' : 'offline' as UserStatus 
            })),
            messages: [],
          }));
          setConversations(mapped);
        }

        // Load friends/users list
        const users = await api.getUsers();
        if (Array.isArray(users)) {
          const friendsList = users
            .filter((u: any) => u.id !== currentUser?.id)
            .map((u: any) => ({
              id: u.id,
              name: u.name,
              avatar: u.avatar || `https://i.pravatar.cc/150?u=${u.id}`,
              status: u.onlineStatus ? 'online' : 'offline' as UserStatus
            }));
          setFriends(friendsList);
        }
      } catch (e) { 
        console.error('Load data failed', e); 
      } finally { 
        setLoaded(true); 
      }
    };

    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const ensureConversation = (chatId: string) => {
    setConversations(prev => {
      if (prev.some(c => c.id === chatId)) return prev;
      const placeholder: ChatConversation = {
        id: chatId,
        user: { id: chatId, name: 'Chat', avatar: `https://ui-avatars.com/api/?name=Chat` },
        lastMessage: '',
        timestamp: new Date(),
        messages: [],
      };
      return [placeholder, ...prev];
    });
  };

  const loadMessages = async (chatId: string) => {
    try {
      const msgs = await api.getMessages(chatId);
      setConversations(prev => prev.map(c => c.id === chatId ? { 
        ...c, 
        messages: msgs.map((m: any) => ({ 
          id: m.id, 
          senderId: m.senderId, 
          content: m.content, 
          timestamp: new Date(m.createdAt), 
          type: (m.type || 'text'),
          fileUrl: m.fileUrl,
          fileName: m.fileName,
          fileSize: m.fileSize
        })) 
      } : c));
    } catch (e) { console.error('Load messages failed', e); }
  };

  const sendMessage = async (chatId: string, content: string, type: 'text' | 'image' | 'file' = 'text') => {
    try {
      const response = await api.sendMessage(chatId, content, type);
      if (response.data) {
        // Optimistically update UI
        const newMessage: Message = {
          id: response.data.id,
          senderId: currentUser?.id || '',
          content: content,
          timestamp: new Date(response.data.createdAt),
          type: type,
        };
        setConversations(prev => prev.map(c => 
          c.id === chatId 
            ? { ...c, messages: [...c.messages, newMessage], lastMessage: content, timestamp: newMessage.timestamp }
            : c
        ));
      }
    } catch (e) { 
      console.error('Send message failed', e); 
    }
  };

  const sendFileMessage = async (chatId: string, file: File) => {
    try {
      // Upload file first
      const uploadResponse = await api.uploadFile(file);
      if (uploadResponse.url) {
        // Send file message
        const fileType = file.type.startsWith('image/') ? 'image' : 'file';
        await sendMessage(chatId, uploadResponse.url, fileType);
      }
    } catch (e) {
      console.error('Send file failed', e);
    }
  };

  const toggleBlockUser = (friendId: string) => {
    let friendName = '';
    setFriends(prevFriends => prevFriends.map(f => { if (f.id === friendId) { friendName = f.name; return { ...f, isBlocked: !f.isBlocked }; } return f; }));
    setConversations(prevConvos => prevConvos.map(c => {
      if (!c.isGroup && c.participants?.some(p => p.id === friendId)) {
        const target = c.participants.find(p => p.id === friendId);
        const isNowBlocked = !target?.isBlocked;
        const systemMessageContent = isNowBlocked ? `You blocked ${friendName}.` : `You unblocked ${friendName}.`;
        const systemMessage: Message = { id: `msg-sys-${Date.now()}`, senderId: 'system', content: systemMessageContent, timestamp: new Date(), type: 'system' };
        return { ...c, participants: c.participants.map(p => p.id === friendId ? { ...p, isBlocked: isNowBlocked } : p), messages: [...c.messages, systemMessage] };
      }
      return c;
    }));
  };
  const sendGameInvite = (chatId: string, friend: Friend, matchType: MatchType) => { 
    if (!currentUser) return;
    const inviteContent = `You challenged ${friend.name}!`;
    sendMessage(chatId, inviteContent, 'text');
  };
  const handleInviteResponse = (chatId: string, messageId: string, response: InviteStatus) => {
    setConversations(prev => prev.map(c => {
      if (c.id === chatId) {
        const updatedMessages = c.messages.map(m => m.id === messageId ? { ...m, inviteStatus: response } : m);
        const confirmationText = response === 'accepted' ? 'Challenge accepted!' : 'Challenge declined.';
        const confirmationMessage: Message = { id: `msg-sys-${Date.now()}`, senderId: 'system', content: confirmationText, timestamp: new Date(), type: 'system' };
        return { ...c, messages: [...updatedMessages, confirmationMessage] };
      }
      return c;
    }));
  };
  const createGroup = async (groupName: string, participantIds: string[], groupAvatar: string | null) => { 
    if (!currentUser) return;
    try {
      const response = await api.createGroupChat(groupName, participantIds);
      if (response.data) {
        // Refresh conversations
        const list = await api.getConversations();
        if (Array.isArray(list)) {
          const mapped: ChatConversation[] = list.map((c: any) => ({
            id: c.id,
            user: c.isGroup
              ? { id: c.id, name: c.name || 'Group', avatar: c.avatar || 'https://i.pravatar.cc/150?u=' + c.id }
              : (() => {
                  const other = (c.participants || []).find((u:any) => u.isSelf === false) || (c.participants || [])[0] || { id: c.id, name: 'Chat', avatar: '' };
                  return { 
                    id: other.id, 
                    name: other.name, 
                    avatar: other.avatar || `https://i.pravatar.cc/150?u=${other.id}`, 
                    status: other.onlineStatus ? 'online' : 'offline' as UserStatus 
                  };
                })(),
            lastMessage: c.lastMessage?.content || '',
            timestamp: new Date(c.lastMessageAt || Date.now()),
            isGroup: !!c.isGroup,
            participants: (c.participants || []).map((u: any) => ({ 
              id: u.id, 
              name: u.name, 
              avatar: u.avatar || `https://i.pravatar.cc/150?u=${u.id}`, 
              status: u.onlineStatus ? 'online' : 'offline' as UserStatus 
            })),
            messages: [],
          }));
          setConversations(mapped);
        }
      }
    } catch (e) {
      console.error('Create group failed', e);
    }
  };
  const sendGroupGameInvite = (groupId: string, matchType: MatchType) => {
    if (!currentUser) return;
    const lobbyContent = `Lobby for ${matchType} created!`;
    sendMessage(groupId, lobbyContent, 'text');
  };
  const joinGroupLobby = (groupId: string, messageId: string) => {
    if (!currentUser) return;
    setConversations(prev => prev.map(c => {
      if (c.id === groupId) {
        return { ...c, messages: c.messages.map(m => {
            if (m.id === messageId && m.lobbyStatus === 'open' && !m.lobby?.some(p=>p.id === currentUser.id)) {
              const newLobby = [...(m.lobby || []), currentUser];
              const newStatus = newLobby.length >= (m.maxPlayers || 2) ? 'full' : 'open';
              return { ...m, lobby: newLobby, lobbyStatus: newStatus };
            }
            return m;
          }),
        };
      }
      return c;
    }));
  };
  const handleTyping = (chatId: string, isTyping: boolean) => {
    if (!currentUser) return;
    const otherUserName = conversations.find(c => c.id === chatId)?.participants?.find(p => p.id !== currentUser.id)?.name || 'Someone';
    if (isTyping) {
      setConversations(prev => prev.map(c => c.id === chatId ? {...c, typingUsers: [otherUserName]} : c));
    } else {
      setTimeout(() => {
        setConversations(prev => prev.map(c => c.id === chatId ? {...c, typingUsers: []} : c));
      }, 2000);
    }
  };

  const updateGroup = async (groupId: string, updates: { name?: string; avatar?: string }) => {
    try {
      await api.updateChat(groupId, updates);
      setConversations(prev => prev.map(c => 
        c.id === groupId ? { ...c, user: { ...c.user, ...updates } } : c
      ));
    } catch (e) {
      console.error('Update group failed', e);
    }
  };

  const removeGroupMember = async (groupId: string, memberId: string) => {
    try {
      await api.removeParticipant(groupId, memberId);
      setConversations(prev => prev.map(c => 
        c.id === groupId ? { ...c, participants: c.participants?.filter(p => p.id !== memberId) } : c
      ));
    } catch (e) {
      console.error('Remove member failed', e);
    }
  };

  const addGroupMembers = async (groupId: string, memberIds: string[]) => {
    try {
      await api.addParticipants(groupId, memberIds);
      const newMembers = friends.filter(f => memberIds.includes(f.id));
      setConversations(prev => prev.map(c => 
        c.id === groupId ? { ...c, participants: [...(c.participants || []), ...newMembers] } : c
      ));
    } catch (e) {
      console.error('Add members failed', e);
    }
  };

  return { 
    conversations, 
    friends, 
    sendMessage, 
    sendFileMessage, 
    createGroup, 
    toggleBlockUser, 
    sendGameInvite, 
    handleInviteResponse, 
    updateGroup, 
    removeGroupMember, 
    addGroupMembers, 
    sendGroupGameInvite, 
    joinGroupLobby, 
    handleTyping, 
    loadMessages, 
    ensureConversation, 
    loaded 
  };
};

// --- Reusable UI Components ---
const Modal: React.FC<{ isOpen: boolean, onClose: () => void; title: string; children: React.ReactNode; }> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return ( <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm"><div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-3xl shadow-2xl w-full max-w-md border border-purple-400/30 relative flex flex-col max-h-[90vh]"><div className="p-6 border-b border-purple-400/20 shrink-0"><h3 className="text-white text-xl font-bold flex items-center gap-2"><Sparkles className="text-yellow-400" size={20} />{title}</h3><button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-all hover:rotate-90"><X size={20} /></button></div><div className="p-6 overflow-y-auto">{children}</div></div></div> );
};

const InviteModal: React.FC<{ friend: {name: string}; isOpen: boolean; onClose: () => void; onSendInvite: (matchType: MatchType) => void; }> = ({ friend, isOpen, onClose, onSendInvite }) => {
    const [selectedType, setSelectedType] = useState<MatchType>('Casual 1v1 ☕');
    const matchTypes: MatchType[] = ['Ranked 1v1 🏆', 'Casual 1v1 ☕', 'Doubles 2v2 👥'];
    const handleSend = () => { onSendInvite(selectedType); onClose(); };
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${friend.name === 'Group' ? 'Create a Lobby' : `Challenge ${friend.name}`}`}>
            <div className="space-y-6">
                <div><h4 className="text-purple-200 text-sm mb-3">Select match type:</h4><div className="space-y-2">{matchTypes.map(type => ( <button key={type} onClick={() => setSelectedType(type)} className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedType === type ? 'bg-purple-600/50 border-purple-400' : 'bg-purple-800/30 border-transparent hover:border-purple-500'}`}>{type}</button>))}</div></div>
                <button onClick={handleSend} className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2"><Swords size={20} /> {friend.name === 'Group' ? 'Create Lobby' : 'Send Challenge'}</button>
            </div>
        </Modal>
    );
};

const FriendProfileModal: React.FC<{ friend: Friend; isOpen: boolean; onClose: () => void; onBlockToggle: (friendId: string) => void; onOpenInviteModal: () => void; }> = ({ friend, isOpen, onClose, onBlockToggle, onOpenInviteModal }) => {
  const statusInfo = { online: { text: "Ready to Play!", color: "text-green-400", icon: <Zap size={16} /> }, 'in-game': { text: "In an Epic Match!", color: "text-cyan-400", icon: <Swords size={16} /> }, offline: { text: "AFK", color: "text-gray-400", icon: <Coffee size={16} /> } };
  const currentStatus = statusInfo[friend.status];
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Player Profile">
        <div className="text-center mb-6"><img src={friend.avatar} alt={friend.name} className="w-24 h-24 rounded-full mx-auto mb-3 object-cover ring-4 ring-purple-400/30 shadow-2xl"/><h3 className="text-white text-2xl font-bold">{friend.name}</h3><div className={`flex items-center justify-center gap-2 mt-2 font-semibold ${currentStatus.color}`}>{currentStatus.icon}<p>{currentStatus.text}</p></div></div>
        <div className="space-y-4">
          <button onClick={onOpenInviteModal} disabled={friend.isBlocked} className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"><Swords size={20} /> Challenge to Match 🏓</button>
          <button onClick={() => onBlockToggle(friend.id)} className={`w-full font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all transform hover:scale-105 ${friend.isBlocked ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-red-600 to-pink-600'} text-white`}>{friend.isBlocked ? <Users size={20} /> : <Ban size={20} />}{friend.isBlocked ? 'Unblock Player' : 'Block Player'}</button>
        </div>
    </Modal>
  );
};

const CreateGroupModal: React.FC<{ friends: Friend[]; isOpen: boolean; onClose: () => void; onCreateGroup: (groupName: string, pIds: string[], avatar: string | null) => void; }> = ({ friends, isOpen, onClose, onCreateGroup }) => {
  const [groupName, setGroupName] = useState(''); const [selectedFriends, setSelectedFriends] = useState<string[]>([]); const [groupImage, setGroupImage] = useState<string | null>(null); const fileInputRef = useRef<HTMLInputElement>(null);
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) { const reader = new FileReader(); reader.onloadend = () => setGroupImage(reader.result as string); reader.readAsDataURL(e.target.files[0]); } };
  const handleToggleFriend = (id: string) => setSelectedFriends(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);
  const handleCreate = () => { if (groupName.trim() && selectedFriends.length > 0) { onCreateGroup(groupName.trim(), selectedFriends, groupImage); onClose(); setGroupName(''); setSelectedFriends([]); setGroupImage(null); } };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Group">
        <div className="flex items-center gap-4 mb-6"><input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" /><div onClick={() => fileInputRef.current?.click()} className="w-20 h-20 bg-purple-600/50 rounded-full flex items-center justify-center cursor-pointer shrink-0 border-2 border-purple-400/30 hover:scale-110 transition-transform">{groupImage ? <img src={groupImage} alt="Preview" className="w-full h-full object-cover rounded-full" /> : <Camera size={24} />}</div><input type="text" placeholder="Group Name..." value={groupName} onChange={e => setGroupName(e.target.value)} className="flex-1 w-full bg-purple-800/30 text-white rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-pink-400" /></div>
        <div className="mb-6"><h4 className="text-purple-200 font-semibold mb-3">Add Members</h4><div className="max-h-48 overflow-y-auto space-y-2 p-2 bg-purple-900/30 rounded-2xl">{friends.map(friend => (<label key={friend.id} className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer ${selectedFriends.includes(friend.id) ? 'bg-pink-500/20' : 'hover:bg-purple-800/30'}`}><input type="checkbox" checked={selectedFriends.includes(friend.id)} onChange={() => handleToggleFriend(friend.id)} className="w-4 h-4 accent-pink-500" /><img src={friend.avatar} alt={friend.name} className="w-10 h-10 rounded-full" /><span>{friend.name}</span></label>))}</div></div>
        <button onClick={handleCreate} disabled={!groupName.trim() || selectedFriends.length === 0} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-4 rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2"><Zap size={20} /> Create Group</button>
    </Modal>
  );
};

const GroupProfileModal: React.FC<{ group: ChatConversation; allFriends: Friend[]; currentUser: any; isOpen: boolean; onClose: () => void; onUpdateGroup: (groupId: string, updates: { name?: string; avatar?: string }) => void; onRemoveMember: (groupId: string, memberId: string) => void; onAddMembers: (groupId: string, memberIds: string[]) => void; }> = ({ group, allFriends, currentUser, isOpen, onClose, onUpdateGroup, onRemoveMember, onAddMembers }) => {
  const [isEditing, setIsEditing] = useState(false); const [isAdding, setIsAdding] = useState(false); const [selectedFriends, setSelectedFriends] = useState<string[]>([]); const [newName, setNewName] = useState(group.user.name); const [newAvatar, setNewAvatar] = useState<string | null>(null); const editFileRef = useRef<HTMLInputElement>(null);
  const availableFriends = allFriends.filter(f => !group.participants?.some(p => p.id === f.id));
  const handleSave = () => { onUpdateGroup(group.id, { name: newName, avatar: newAvatar || undefined }); setIsEditing(false); setNewAvatar(null); };
  const handleAddClick = () => { if (selectedFriends.length > 0) { onAddMembers(group.id, selectedFriends); setSelectedFriends([]); setIsAdding(false); } };
  const handleEditAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) { const reader = new FileReader(); reader.onloadend = () => setNewAvatar(reader.result as string); reader.readAsDataURL(e.target.files[0]); } };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Group Info' : 'Group Settings'}>
      <div className="text-center mb-6 relative"><div className="relative inline-block group/avatar"><img src={newAvatar || group.user.avatar} alt={group.user.name} className="w-24 h-24 rounded-full mx-auto mb-3 object-cover ring-4 ring-purple-400/30 shadow-2xl"/>{isEditing && ( <> <input type="file" accept="image/*" ref={editFileRef} onChange={handleEditAvatarChange} className="hidden"/> <button onClick={() => editFileRef.current?.click()} className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity"><Camera size={24} className="text-white" /></button> </> )}</div>{isEditing ? <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-purple-800/50 text-center text-2xl font-bold p-2 rounded-xl border border-purple-400/30 text-white"/> : <h3 className="text-white text-2xl font-bold">{group.user.name}</h3> } {!isEditing && <button onClick={() => setIsEditing(true)} className="absolute top-0 right-0 p-2 text-purple-300 hover:text-white"><Pencil size={18} /></button> }</div>
      {isEditing ? (<div className="flex gap-3"><button onClick={() => setIsEditing(false)} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-xl">Cancel</button><button onClick={handleSave} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"><Check size={18} /> Save</button></div>) : ( <> <div className="mb-6"><h4 className="text-purple-300 font-bold mb-4 flex items-center gap-2"><Users size={18} /> Members ({group.participants?.length})</h4><div className="space-y-3">{group.participants?.map(p => (<div key={p.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-purple-800/30"><div className="flex items-center gap-3"><img src={p.avatar} alt={p.name} className="w-10 h-10 rounded-full"/><span className="text-white font-medium">{p.name}{p.id === currentUser.id && " (You)"}</span></div>{p.id !== currentUser.id && <button onClick={() => onRemoveMember(group.id, p.id)} className="text-red-400 hover:text-red-300"><Trash2 size={16} /></button>}</div>))}</div></div>
          {isAdding ? (<div className="space-y-4"><h4 className="text-purple-300 font-bold">Add New Members</h4><div className="max-h-32 overflow-y-auto space-y-2 border border-purple-400/20 p-2 rounded-xl">{availableFriends.length > 0 ? availableFriends.map(f => (<label key={f.id} className="flex items-center gap-3 p-2 cursor-pointer rounded-xl hover:bg-purple-800/30"><input type="checkbox" onChange={() => setSelectedFriends(p => p.includes(f.id) ? p.filter(id => id !== f.id) : [...p, f.id])} className="w-4 h-4 accent-purple-500"/><img src={f.avatar} alt={f.name} className="w-8 h-8 rounded-full"/><span>{f.name}</span></label>)) : <p className="text-center text-purple-300 p-4">Everyone is already here!</p>}</div><div className="flex gap-3"><button onClick={() => setIsAdding(false)} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-xl">Cancel</button><button onClick={handleAddClick} disabled={selectedFriends.length === 0} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl disabled:opacity-50">Add Selected</button></div></div>) : (<button onClick={() => setIsAdding(true)} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"><UserPlus size={18} /> Add Members</button>)}</> )}
    </Modal>
  );
};

// --- Missing Chat Components Implementation ---
const ConversationListSidebar: React.FC<{
  conversations: ChatConversation[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onShowCreateGroup: () => void;
}> = ({ conversations, selectedChatId, onSelectChat, onShowCreateGroup }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = conversations.filter(conv =>
    conv.user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status?: UserStatus) => {
    switch (status) {
      case 'online': return 'bg-green-400';
      case 'in-game': return 'bg-cyan-400';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-purple-400';
    }
  };

  return (
    <div className="bg-gradient-to-b from-purple-900/50 to-indigo-900/50 h-full flex flex-col border-r border-purple-400/20">
      <div className="p-4 border-b border-purple-400/20">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-white text-xl font-bold flex-1">Messages</h2>
          <button
            onClick={onShowCreateGroup}
            className="p-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-white transition-colors"
          >
            <PenSquare size={20} />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300" size={20} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-purple-800/30 text-white pl-10 pr-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filteredConversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() => onSelectChat(conv.id)}
            className={`p-4 rounded-2xl cursor-pointer transition-all hover:bg-purple-700/30 ${
              selectedChatId === conv.id ? 'bg-purple-600/50 border border-purple-400' : 'border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={conv.user.avatar}
                  alt={conv.user.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                {!conv.isGroup && conv.user.status && (
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-purple-900 ${getStatusColor(conv.user.status)}`} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold truncate">{conv.user.name}</h3>
                <p className="text-purple-300 text-sm truncate">{conv.lastMessage}</p>
              </div>
              <div className="text-right">
                <p className="text-purple-400 text-xs">{formatTimestamp(conv.timestamp)}</p>
                {conv.isGroup && (
                  <div className="flex items-center gap-1 mt-1">
                    <Users size={12} className="text-purple-400" />
                    <span className="text-purple-400 text-xs">{conv.participants?.length}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const InviteMessage: React.FC<{
  message: Message;
  isMyMessage: boolean;
  onInviteResponse: (messageId: string, response: InviteStatus) => void;
  chat: ChatConversation;
}> = ({ message, isMyMessage, onInviteResponse, chat }) => {
  const getMatchTypeIcon = (matchType?: MatchType) => {
    switch (matchType) {
      case 'Ranked 1v1 🏆': return <Trophy className="text-yellow-400" size={16} />;
      case 'Casual 1v1 ☕': return <Coffee className="text-orange-400" size={16} />;
      case 'Doubles 2v2 👥': return <Users className="text-blue-400" size={16} />;
      default: return <Gamepad2 className="text-purple-400" size={16} />;
    }
  };

  const getInviteStatusColor = (status?: InviteStatus) => {
    switch (status) {
      case 'accepted': return 'border-green-500 bg-green-500/20';
      case 'declined': return 'border-red-500 bg-red-500/20';
      default: return 'border-purple-400 bg-purple-600/30';
    }
  };

  const senderName = chat.participants?.find(p => p.id === message.senderId)?.name || 'Unknown';

  return (
    <div className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-sm p-4 rounded-2xl border-2 ${getInviteStatusColor(message.inviteStatus)} backdrop-blur-sm`}>
        <div className="flex items-center gap-2 mb-2">
          {getMatchTypeIcon(message.matchType)}
          <span className="text-white font-bold text-sm">{message.matchType}</span>
        </div>
        
        <p className="text-white mb-3">
          {isMyMessage ? message.content : `${senderName} challenged you!`}
        </p>

        {message.inviteStatus === 'pending' && !isMyMessage && (
          <div className="flex gap-2">
            <button
              onClick={() => onInviteResponse(message.id, 'accepted')}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-xl font-bold flex items-center justify-center gap-1"
            >
              <Check size={16} />
              Accept
            </button>
            <button
              onClick={() => onInviteResponse(message.id, 'declined')}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-xl font-bold flex items-center justify-center gap-1"
            >
              <X size={16} />
              Decline
            </button>
          </div>
        )}

        {message.inviteStatus === 'accepted' && (
          <div className="flex items-center justify-center gap-2 text-green-400 font-bold">
            <CheckCheck size={16} />
            Challenge Accepted!
          </div>
        )}

        {message.inviteStatus === 'declined' && (
          <div className="flex items-center justify-center gap-2 text-red-400 font-bold">
            <X size={16} />
            Challenge Declined
          </div>
        )}

        <p className="text-purple-300 text-xs mt-2 text-right">
          {formatTimestamp(message.timestamp)}
        </p>
      </div>
    </div>
  );
};

const GroupInviteMessage: React.FC<{
  message: Message;
  isMyMessage: boolean;
  onJoinLobby: (messageId: string) => void;
  chat: ChatConversation;
  currentUser: any;
}> = ({ message, isMyMessage, onJoinLobby, chat, currentUser }) => {
  const getMatchTypeIcon = (matchType?: MatchType) => {
    switch (matchType) {
      case 'Ranked 1v1 🏆': return <Trophy className="text-yellow-400" size={16} />;
      case 'Casual 1v1 ☕': return <Coffee className="text-orange-400" size={16} />;
      case 'Doubles 2v2 👥': return <Users className="text-blue-400" size={16} />;
      default: return <Gamepad2 className="text-purple-400" size={16} />;
    }
  };

  const getLobbyStatusColor = (status?: LobbyStatus) => {
    switch (status) {
      case 'open': return 'border-green-400 bg-green-500/20';
      case 'full': return 'border-blue-400 bg-blue-500/20';
      case 'in-progress': return 'border-orange-400 bg-orange-500/20';
      default: return 'border-purple-400 bg-purple-600/30';
    }
  };

  const canJoin = message.lobbyStatus === 'open' && !message.lobby?.some(p => p.id === currentUser.id);
  const isInLobby = message.lobby?.some(p => p.id === currentUser.id);

  return (
    <div className="flex justify-center">
      <div className={`max-w-md p-4 rounded-2xl border-2 ${getLobbyStatusColor(message.lobbyStatus)} backdrop-blur-sm`}>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            {getMatchTypeIcon(message.matchType)}
            <span className="text-white font-bold">{message.matchType} Lobby</span>
          </div>

          <div className="mb-4">
            <div className="flex justify-center gap-2 mb-2">
              {message.lobby?.map((player, index) => (
                <img
                  key={player.id}
                  src={player.avatar}
                  alt={player.name}
                  className="w-8 h-8 rounded-full ring-2 ring-purple-400"
                  title={player.name}
                />
              ))}
              {Array.from({ length: (message.maxPlayers || 2) - (message.lobby?.length || 0) }).map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="w-8 h-8 rounded-full bg-gray-600 border-2 border-dashed border-gray-400 flex items-center justify-center"
                >
                  <span className="text-gray-400 text-xs">?</span>
                </div>
              ))}
            </div>
            <p className="text-purple-300 text-sm">
              {message.lobby?.length || 0}/{message.maxPlayers || 2} players
            </p>
          </div>

          {message.lobbyStatus === 'open' && (
            <>
              {canJoin && (
                <button
                  onClick={() => onJoinLobby(message.id)}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 mb-2"
                >
                  <Zap size={16} />
                  Join Lobby
                </button>
              )}
              {isInLobby && (
                <div className="flex items-center justify-center gap-2 text-green-400 font-bold mb-2">
                  <Check size={16} />
                  You're in the lobby!
                </div>
              )}
            </>
          )}

          {message.lobbyStatus === 'full' && (
            <div className="flex items-center justify-center gap-2 text-blue-400 font-bold">
              <Users size={16} />
              Lobby Full - Starting Soon!
            </div>
          )}

          {message.lobbyStatus === 'in-progress' && (
            <div className="flex items-center justify-center gap-2 text-orange-400 font-bold">
              <Swords size={16} />
              Match In Progress
            </div>
          )}

          <p className="text-purple-300 text-xs mt-3">
            {formatTimestamp(message.timestamp)}
          </p>
        </div>
      </div>
    </div>
  );
};

const MessageBubble: React.FC<{
  message: Message;
  isMyMessage: boolean;
  onInviteResponse: (messageId: string, response: InviteStatus) => void;
  onJoinLobby: (messageId: string) => void;
  chat: ChatConversation;
  isLastMessage: boolean;
  currentUser: any;
}> = ({ message, isMyMessage, onInviteResponse, onJoinLobby, chat, isLastMessage, currentUser }) => {
  if (message.type === 'invite') {
    return (
      <InviteMessage
        message={message}
        isMyMessage={isMyMessage}
        onInviteResponse={onInviteResponse}
        chat={chat}
      />
    );
  }

  if (message.type === 'group-invite') {
    return (
      <GroupInviteMessage
        message={message}
        isMyMessage={isMyMessage}
        onJoinLobby={onJoinLobby}
        chat={chat}
        currentUser={currentUser}
      />
    );
  }

  if (message.type === 'system') {
    return (
      <div className="flex justify-center">
        <div className="bg-purple-800/50 text-purple-200 px-4 py-2 rounded-full text-sm max-w-md text-center">
          {message.content}
          <span className="block text-xs text-purple-400 mt-1">
            {formatTimestamp(message.timestamp)}
          </span>
        </div>
      </div>
    );
  }

  const senderName = chat.participants?.find(p => p.id === message.senderId)?.name || 'Unknown';
  const senderAvatar = chat.participants?.find(p => p.id === message.senderId)?.avatar;

  return (
    <div className={`flex gap-3 ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isMyMessage && chat.isGroup && (
        <img
          src={senderAvatar}
          alt={senderName}
          className="w-8 h-8 rounded-full object-cover mt-1 flex-shrink-0"
        />
      )}
      
      <div className={`max-w-xs lg:max-w-md ${isMyMessage ? 'items-end' : 'items-start'} flex flex-col`}>
        {!isMyMessage && chat.isGroup && (
          <p className="text-purple-300 text-xs mb-1 px-2">{senderName}</p>
        )}
        
        <div
          className={`p-4 rounded-2xl ${
            isMyMessage
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
              : 'bg-purple-800/50 text-white border border-purple-400/20'
          } backdrop-blur-sm`}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
          <p className={`text-xs mt-2 ${isMyMessage ? 'text-purple-200' : 'text-purple-400'}`}>
            {formatTimestamp(message.timestamp)}
          </p>
        </div>
      </div>
    </div>
  );
};

const ChatContent: React.FC<{ 
  selectedChat: ChatConversation | null; 
  currentUser: any; 
  onSendMessage: (chatId: string, content: string, type?: 'text' | 'image' | 'file') => Promise<void>; 
  onSendFile: (chatId: string, file: File) => Promise<void>;
  onInviteResponse: (chatId: string, messageId: string, response: InviteStatus) => void; 
  onJoinLobby: (chatId: string, messageId: string) => void; 
  onBack: () => void; 
  onShowProfile: () => void; 
  onShowGroupInvite: () => void; 
  onTyping: (chatId: string, isTyping: boolean) => void; 
}> = ({ selectedChat, currentUser, onSendMessage, onSendFile, onInviteResponse, onJoinLobby, onBack, onShowProfile, onShowGroupInvite, onTyping }) => {
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change or when typing users change
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end',
          inline: 'nearest'
        });
      }
      // Alternative fallback using container scroll
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    };
    
    // Small delay to ensure DOM is updated
    setTimeout(scrollToBottom, 100);
  }, [selectedChat?.messages, selectedChat?.typingUsers]);

  // Scroll to bottom when chat changes (immediate scroll)
  useEffect(() => {
    if (selectedChat) {
      const scrollToBottomImmediate = () => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
        }
      };
      
      setTimeout(scrollToBottomImmediate, 50);
    }
  }, [selectedChat?.id]);

  if (!selectedChat) return ( <div className="hidden md:flex flex-1 flex-col items-center justify-center text-purple-200"><div className="text-8xl mb-6">🏓</div><h3 className="text-2xl font-bold">Select a conversation</h3></div>);
  
  const handleSend = async () => { 
    if (messageInput.trim() && currentUser) { 
      await onSendMessage(selectedChat.id, messageInput.trim(), 'text'); 
      setMessageInput(''); 
      onTyping(selectedChat.id, false);
      
      // Force scroll to bottom after sending with multiple approaches
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    } 
  };

  const handleFileUpload = async (file: File) => {
    if (currentUser && onSendFile) {
      await onSendFile(selectedChat.id, file);
      
      // Force scroll to bottom after file upload
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    }
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { setMessageInput(e.target.value); if(!selectedChat.isGroup){ onTyping(selectedChat.id, e.target.value.length > 0);} };
  const lastMessageId = selectedChat.messages[selectedChat.messages.length - 1]?.id;

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-indigo-900/20 to-purple-900/20 h-full max-h-full overflow-hidden">
      {/* Fixed Header */}
      <div onClick={onShowProfile} className={`p-4 border-b border-purple-400/20 flex items-center gap-4 backdrop-blur-sm flex-shrink-0 cursor-pointer hover:bg-purple-700/20 transition-colors`}>
        <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="md:hidden text-purple-300 hover:text-white"><ArrowLeft size={24} /></button>
        <img src={selectedChat.user.avatar} alt={selectedChat.user.name} className="w-12 h-12 rounded-full object-cover"/>
        <div className="flex-1"><h2 className="text-xl font-bold text-white">{selectedChat.user.name}</h2><p className="text-purple-300 text-sm">{selectedChat.isGroup ? `${selectedChat.participants?.length} members` : selectedChat.user.status}</p></div>
        {selectedChat.isGroup && <button onClick={(e) => { e.stopPropagation(); onShowGroupInvite(); }} className="text-purple-300 hover:text-white p-2 rounded-full hover:bg-purple-500/20"><Gamepad2 size={24} /></button>}
      </div>
      
      {/* Scrollable Messages Area - Only this part scrolls */}
      <div 
        ref={messagesContainerRef}
        className="messages-scroll flex-1 p-4 md:p-6 overflow-y-scroll min-h-0"
        style={{ 
          scrollBehavior: 'smooth',
          scrollbarWidth: 'thin',
          scrollbarColor: '#9333ea #1e1b4b'
        }}
      >
          <div className="space-y-4 min-h-full flex flex-col justify-end">
            {selectedChat.messages.map(msg => (
              <MessageBubble 
                key={msg.id} 
                message={msg} 
                isMyMessage={currentUser ? msg.senderId === currentUser.id : false} 
                currentUser={currentUser} 
                onInviteResponse={onInviteResponse.bind(null, selectedChat.id)} 
                onJoinLobby={onJoinLobby.bind(null, selectedChat.id)} 
                chat={selectedChat} 
                isLastMessage={msg.id === lastMessageId} 
              />
            ))}
            {selectedChat.typingUsers && selectedChat.typingUsers.length > 0 && (
              <div className="text-sm text-gray-400 italic px-4">
                {selectedChat.typingUsers.join(', ')} is typing...
              </div>
            )}
            <div ref={messagesEndRef} style={{ height: '1px', width: '100%' }} />
          </div>
      </div>
      
      {/* Fixed Input Area */}
      <div className="p-4 border-t border-purple-400/20 backdrop-blur-sm flex-shrink-0">
         <div className="flex items-center gap-3 bg-purple-900/50 rounded-2xl p-2">
           {/* File upload button */}
           <label className="p-2 hover:bg-purple-600/50 rounded-xl cursor-pointer transition-colors">
             <Camera size={20} className="text-purple-300" />
             <input 
               type="file" 
               className="hidden" 
               accept="image/*,video/*,.pdf,.doc,.docx,.txt"
               onChange={(e) => {
                 const file = e.target.files?.[0];
                 if (file) {
                   handleFileUpload(file);
                   e.target.value = ''; // Reset input
                 }
               }}
             />
           </label>
           
           <input 
             type="text" 
             placeholder="Type a message..." 
             value={messageInput} 
             onChange={handleInputChange} 
             onKeyPress={e => e.key === 'Enter' && handleSend()} 
             className="flex-1 bg-transparent text-white focus:outline-none px-2"
           />
           
           <button 
             onClick={handleSend} 
             disabled={!messageInput.trim()} 
             className="p-3 bg-purple-600 rounded-xl text-white hover:bg-purple-500 transition-colors disabled:opacity-50"
           >
             <MessageSquare size={20} />
           </button>
         </div>
      </div>
    </div>
  );
};

export default function ChatPage() {
  const { userData, loading, error } = useUserData();
  const { conversations, friends, sendMessage, sendFileMessage, createGroup, toggleBlockUser, sendGameInvite, handleInviteResponse, updateGroup, removeGroupMember, addGroupMembers, sendGroupGameInvite, joinGroupLobby, handleTyping, loadMessages, ensureConversation, loaded } = useChat(userData);
  
  // Create currentUser object from userData for compatibility
  const currentUser = userData ? {
    id: userData.id,
    name: userData.name,
    avatar: userData.avatar || `https://i.pravatar.cc/150?u=${userData.id}`,
    status: 'online' as UserStatus
  } : null;
  const [searchParams] = useSearchParams();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{ type: 'group' | 'friend' | 'invite' | 'group-invite-config'| 'create-group'; data?: any } | null>(null);
  const [isMobileChatVisible, setMobileChatVisible] = useState(false);

  const selectedChat = conversations.find(c => c.id === selectedChatId);

  // Pick up chatId from URL and select it (after conversations loaded)
  useEffect(() => {
    const qid = searchParams.get('chatId');
    if (!qid) return;
    if (!loaded) return;
    ensureConversation(qid);
    setSelectedChatId(qid);
    loadMessages(qid);
  }, [searchParams, loaded]);

  // Load messages when user selects a chat manually
  const handleSelectChat = (chatId: string) => { setSelectedChatId(chatId); setMobileChatVisible(true); loadMessages(chatId); };

  // Load messages when selection changes
  useEffect(() => {
    if (selectedChatId) loadMessages(selectedChatId);
  }, [selectedChatId]);

  const handleShowProfile = () => {
    if (!selectedChat) return;
    if (selectedChat.isGroup) { setModalState({ type: 'group', data: selectedChat }); } 
    else { const friendData = friends.find(f => f.id === selectedChat.user.id); if (friendData) setModalState({ type: 'friend', data: friendData }); }
  };
  const handleSendGroupInvite = (matchType: MatchType) => { if (selectedChatId) sendGroupGameInvite(selectedChatId, matchType); };

  return (
    <>
      {/* Custom scrollbar styles for messages area */}
      <style>{`
        .messages-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .messages-scroll::-webkit-scrollbar-track {
          background: rgba(30, 27, 75, 0.3);
          border-radius: 4px;
        }
        .messages-scroll::-webkit-scrollbar-thumb {
          background: rgba(147, 51, 234, 0.6);
          border-radius: 4px;
        }
        .messages-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(147, 51, 234, 0.8);
        }
      `}</style>
    
      <div className="ping-pong-bg min-h-screen">
        <div className="bg-[radial-gradient(ellipse_at_top_right,_rgba(0,100,255,0.2)_0%,_transparent_70%)] h-full w-full">
          <div className="flex h-full">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <Header currentUser={userData || undefined} />
             
              <main className="flex-1 flex overflow-hidden">
                <div className={`w-full md:w-80 lg:w-96 flex-shrink-0 h-full ${isMobileChatVisible && selectedChatId ? 'hidden md:block' : 'block'}`}>
                    <ConversationListSidebar conversations={conversations} selectedChatId={selectedChatId} onSelectChat={handleSelectChat} onShowCreateGroup={() => setModalState({type: 'create-group'})} />
                </div>
                <div className={`flex-1 w-full h-full ${isMobileChatVisible && selectedChatId ? 'flex' : 'hidden md:flex'}`}>
                    <ChatContent selectedChat={selectedChat || null} currentUser={currentUser} onSendMessage={sendMessage} onSendFile={sendFileMessage} onInviteResponse={handleInviteResponse} onJoinLobby={joinGroupLobby} onBack={() => setMobileChatVisible(false)} onShowProfile={handleShowProfile} onShowGroupInvite={() => setModalState({ type: 'group-invite-config', data: selectedChat })} onTyping={handleTyping} />
                </div>
              </main>
            </div>
          </div>

          {/* --- All Modals --- */}
          {modalState?.type === 'create-group' && <CreateGroupModal friends={friends.filter(f => currentUser ? f.id !== currentUser.id : true)} isOpen={true} onClose={() => setModalState(null)} onCreateGroup={createGroup}/>}
          {modalState?.type === 'group' && <GroupProfileModal group={modalState.data} allFriends={friends} currentUser={currentUser} isOpen={!!modalState} onClose={() => setModalState(null)} onUpdateGroup={updateGroup} onRemoveMember={removeGroupMember} onAddMembers={addGroupMembers} />}
          {modalState?.type === 'group-invite-config' && <InviteModal friend={{name: 'Group'}} isOpen={!!modalState} onClose={() => setModalState(null)} onSendInvite={handleSendGroupInvite} />}
          {modalState?.type === 'friend' && <FriendProfileModal isOpen={!!modalState} onClose={() => setModalState(null)} friend={modalState.data} onBlockToggle={toggleBlockUser} onOpenInviteModal={() => setModalState({ type: 'invite', data: modalState.data })}/>}
          {modalState?.type === 'invite' && <InviteModal isOpen={!!modalState} onClose={() => setModalState(null)} friend={modalState.data} onSendInvite={(matchType) => sendGameInvite(selectedChatId!, modalState.data, matchType)}/>}
        </div>
      </div>
    </>
  );
}