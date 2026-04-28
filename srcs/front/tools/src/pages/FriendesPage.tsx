import React, { useState, useEffect } from "react";
import { Search, UserPlus, MessageCircle, MoreHorizontal, UserCheck, UserX } from 'lucide-react';
import { Header } from '../components/shared/Header';
import { Sidebar } from '../components/shared/Sidebar';
import { useUserData } from '../hooks/useUserData';
import { Player, PlayerCard } from "./PlayerCard";
import { useNavigate } from 'react-router-dom';


interface FriendCardProps {
  id: string;
  username: string;
  avatar: string;
  online: boolean;
  onMessage?: (id: string) => void;
}

interface RequestRowProps {
  id: string;
  username: string;
  avatar: string;
}

interface TabButtonProps {
  id: string;
  label: string;
  count: number;
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const Input = ({ className, ...props }) => (
  <input
    className={`w-full px-4 py-2 bg-[#2C3138] border border-[#474B52] rounded-lg text-white placeholder-[#B0B3B8] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
    {...props}
  />
);


const FriendCard: React.FC<FriendCardProps> = ({ id, username, avatar, online, onMessage }) => (
  <div className="bg-[#2C3138] p-4 rounded-lg text-center relative group">
    <div className="absolute top-3 right-3 text-[#B0B3B8] hover:text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
      <MoreHorizontal size={20} />
    </div>
    <img
      src={avatar}
      alt={username}
      className="w-20 h-20 rounded-full mx-auto mb-3 border-2 border-[#474B52]"
    />
    <p className="font-extrabold text-white truncate">
      {username}
    </p>
    <p className={`text-sm font-semibold ${online ? 'text-green-500' : 'text-red-500'}`}>
      {online ? 'Online' : 'Offline'}
    </p>
    <button
      className="mt-3 w-full bg-[#474B52] text-white py-2 rounded-lg text-sm font-semibold hover:bg-[#5C616A] flex items-center justify-center gap-2"
      onClick={() => onMessage?.(id)}
    >
      <MessageCircle size={16} /> Message
    </button>
  </div>
);

const RequestRow: React.FC<RequestRowProps> = ({ id, username, avatar }) => {
  const accept = async () => {
    await fetch(`http://localhost:3000/api/v1/friends/${id}/accept`, { method: 'PUT', credentials: 'include' });
    window.dispatchEvent(new Event('friends:refresh'));
  };
  const decline = async () => {
    await fetch(`http://localhost:3000/api/v1/friends/${id}/decline`, { method: 'PUT', credentials: 'include' });
    window.dispatchEvent(new Event('friends:refresh'));
  };
  return (
    <div className="flex items-center justify-between p-3 bg-[#2C3138] rounded-lg">
      <div className="flex items-center gap-3">
        <img src={avatar} alt={username} className="w-12 h-12 rounded-full" />
        <p className="font-extrabold text-white">{username}</p>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={accept} className="p-2 bg-green-500/20 text-green-300 rounded-full hover:bg-green-500/40" title="Accept">
          <UserCheck size={20} />
        </button>
        <button onClick={decline} className="p-2 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/40" title="Decline">
          <UserX size={20} />
        </button>
      </div>
    </div>
  );
};

const BlockedUserRow: React.FC<RequestRowProps> = ({ id, username, avatar }) => {
  const unblock = async () => {
    await fetch(`http://localhost:3000/api/v1/friends/block/${id}`, { method: 'DELETE', credentials: 'include' });
    window.dispatchEvent(new Event('friends:refresh'));
  };
  return (
    <div className="flex items-center justify-between p-3 bg-[#2C3138] rounded-lg">
      <div className="flex items-center gap-3">
        <img src={avatar} alt={username} className="w-12 h-12 rounded-full" />
        <p className="font-extrabold text-white">{username}</p>
      </div>
      <button onClick={unblock} className="bg-orange-500/20 text-orange-300 py-2 px-4 rounded-lg text-sm font-semibold hover:bg-orange-500/40">
        Unblock
      </button>
    </div>
  );
};

const TabButton: React.FC<TabButtonProps> = ({ id, label, count, activeTab, setActiveTab }) => (
  <button
    onClick={() => setActiveTab(id)}
    className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors flex-shrink-0 ${
      activeTab === id
        ? 'bg-[#3A3F47] text-white'
        : 'text-[#B0B3B8] hover:bg-[#3A3F47]/50 hover:text-white'
    }`}
  >
    {label}{' '}
    {count > 0 && (
      <span className="bg-[#474B52] text-white text-xs rounded-full px-2 py-0.5 ml-1">
        {count}
      </span>
    )}
  </button>
);

const AddFriendView: React.FC = () => {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);

  const sendFriendRequest = async (playerId: string) => {
    try {
      const res = await fetch(`http://localhost:3000/api/v1/friends/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: playerId }),
        credentials: 'include'
      });

      if (res.ok) {
        window.dispatchEvent(new Event('friends:refresh'));
      } else {
        const t = await res.text();
        console.error('Send request failed', t);
      }
    } catch (err) {
      console.error("Error sending request:", err);
    }
  };

  const fetchSearchResults = async (searchQuery: string) => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:3000/api/v1/user/search?name=${encodeURIComponent(searchQuery)}`,
        { credentials: 'include' }
      );
      const json = await res.json();

      if (json.data) {
        const mapped: Player[] = json.data.map((u: any, index: number) => ({
          id: u.id,
          name: u.name,
          avatar: u.avatar || `https://i.pravatar.cc/150?u=${u.id}`,
          level: u.level || 1,
          rank: index + 1,
          winRate: Math.floor(Math.random() * 100),
          status: u.onlineStatus ? "online" : "offline",
          location: "Unknown",
          lastPlayed: "Recently",
          skillLevel: u.level > 10 ? "Pro" : "Beginner",
          coins: u.xp || 0,
          achievements: Math.floor((u.xp || 0) / 500),
        }));
        setSearchResults(mapped);
      }
    } catch (err) {
      console.error("Error fetching search results:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      if (query.trim()) {
        fetchSearchResults(query);
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [query]);

  return (
    <div className="max-w-7xl">
      <h2 className="text-2xl font-bold mb-4 text-white">Add a New Friend</h2>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B0B3B8]" size={18} />
        <Input
          type="text"
          placeholder="Search by username..."
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading && <p className="text-[#B0B3B8]">Loading...</p>}

      {searchResults.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {searchResults.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onSendRequest={sendFriendRequest}
            />
          ))}
        </div>
      ) : (
        !loading && query && <p className="text-[#B0B3B8]">No results found.</p>
      )}
    </div>
  );
};



export default function FriendsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');

  const [friends, setFriends] = useState<FriendCardProps[]>([]);
  const [incoming, setIncoming] = useState<RequestRowProps[]>([]);
  const [outgoing, setOutgoing] = useState<RequestRowProps[]>([]);
  const [blocked, setBlocked] = useState<RequestRowProps[]>([]);

  const { userData, loading, error } = useUserData();

  const startChatWith = async (userId: string) => {
    try {
      const res = await fetch('http://localhost:3000/api/v1/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId }),
      });
      const json = await res.json();
      const chatId = json?.data?.id;
      if (chatId) navigate(`/chat?chatId=${encodeURIComponent(chatId)}`);
    } catch (e) {
      console.error('Failed to start chat', e);
    }
  };

  const refresh = async () => {
    try {
      // list friends
      const fr = await fetch('http://localhost:3000/api/v1/friends', { credentials: 'include' });
      const frJson = await fr.json();
      const mappedFriends = (frJson.data || []).map((f: any) => ({
        id: f.user.id,
        username: f.user.name,
        avatar: f.user.avatar || `https://i.pravatar.cc/150?u=${f.user.id}`,
        online: !!f.user.onlineStatus,
      }));
      setFriends(mappedFriends);

      // pending
      const pr = await fetch('http://localhost:3000/api/v1/friends/requests', { credentials: 'include' });
      const prJson = await pr.json();
      const inc = (prJson.data?.incoming || []).map((r: any) => ({
        id: r.requestId,
        username: r.from?.name || 'Unknown',
        avatar: r.from?.avatar || `https://i.pravatar.cc/150?u=${r.from?.id || r.requestId}`,
      }));
      const out = (prJson.data?.outgoing || []).map((r: any) => ({
        id: r.requestId,
        username: r.to?.name || 'Pending user',
        avatar: r.to?.avatar || `https://i.pravatar.cc/150?u=${r.to?.id || r.requestId}`,
      }));
      setIncoming(inc);
      setOutgoing(out);

      // blocked: not directly exposed by API; infer by requesting outgoing/incoming with status blocked in future
      setBlocked([]);
    } catch (e) {
      console.error('Failed to refresh friends data', e);
    }
  };

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener('friends:refresh', handler);
    return () => window.removeEventListener('friends:refresh', handler);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'pending':
        return (
          <div className="space-y-3 max-w-2xl">
            {incoming.concat(outgoing).map((req) => (
              <RequestRow key={req.id} {...req} />
            ))}
          </div>
        );
      case 'blocked':
        return (
          <div className="space-y-3 max-w-2xl">
            {blocked.map((user) => (
              <BlockedUserRow key={user.id} {...user} />
            ))}
          </div>
        );
      case 'add':
        return <AddFriendView />;
      case 'all':
      default:
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {friends.map((friend) => (
              <FriendCard key={friend.id} {...friend} onMessage={startChatWith} />
            ))}
          </div>
        );
    }
  };

  return (
    <div className="bg-[#1A2126] bg-[radial-gradient(ellipse_at_top_right,_rgba(0,100,255,0.3)_0%,_transparent_70%)] text-white font-sans min-h-screen">
      <div className="flex h-screen">
        <Sidebar avatar={userData?.avatar} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header currentUser={userData || undefined} />
          <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                <h1 className="text-4xl font-bold text-white drop-shadow-md">
                  Friends
                </h1>
                <div className="flex items-center gap-2 p-1 bg-[#2C3138] rounded-lg flex-wrap">
                  <TabButton 
                    id="all" 
                    label="All Friends" 
                    count={friends.length} 
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                  />
                  <TabButton
                    id="pending"
                    label="Pending"
                    count={incoming.length + outgoing.length}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                  />
                  <TabButton
                    id="blocked"
                    label="Blocked"
                    count={blocked.length}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                  />
                  <button
                    onClick={() => setActiveTab('add')}
                    className="px-3 py-2 rounded-md text-sm font-semibold bg-green-500 text-white hover:bg-green-600 flex items-center gap-2"
                  >
                    <UserPlus size={16} /> Add Friend
                  </button>
                </div>
              </div>
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}