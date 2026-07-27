import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  MdSend,
  MdArrowBack,
  MdClose,
  MdMessage,
  MdGroup,
  MdBlock,
  MdPersonAdd,
  MdDelete,
  MdSettings,
  MdLock,
  MdLockOpen,
  MdAdminPanelSettings,
  MdVolumeOff,
  MdExitToApp,
  MdCheck,
} from "react-icons/md";
import { LazyLoadingImage } from "../LazyLoadingImage";
import { useDashboardContext } from "../../Pages/Dashboard";
import { API_BASE_URL } from "../../config";

// ============== INTERFACES ==============
interface ChatParticipant {
  id: string;
  name: string | null;
  avatar: string | null;
  onlineStatus: boolean;
  isSelf: boolean;
  role?: "owner" | "admin" | "member"; // Channel roles
  isBlocked?: boolean;
  isMuted?: boolean;
  mutedUntil?: string | null;
}

interface LastMessage {
  content: string;
  createdAt: string;
  senderId: string;
}

interface Chat {
  id: string;
  isGroup: boolean;
  name: string | null;
  avatar: string | null;
  lastMessage: LastMessage | null;
  lastMessageAt: string | null;
  participants: ChatParticipant[];
  unreadCount?: number;
  isChannel?: boolean; // Distinguishes channels from groups
  isPasswordProtected?: boolean;
  ownerId?: string;
  typingUsers?: string[];
}

interface Message {
  id: string;
  content: string;
  type: "text" | "image" | "file" | "system";
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  senderId: string;
  createdAt: string;
  sender?: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
}

interface Friend {
  id: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  onlineStatus: boolean;
  isBlocked?: boolean;
}

// ============== API HELPERS ==============
const api = {
  getChats: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/chats`, {
        credentials: "include",
      });
      if (!res.ok) return [];
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Expected JSON but got:", contentType);
        return [];
      }
      const json = await res.json();
      return json.data || [];
    } catch (error) {
      console.error("Error fetching chats:", error);
      return [];
    }
  },

  getMessages: async (chatId: string, limit = 500) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/chats/${chatId}/messages?limit=${limit}`,
        { credentials: "include" }
      );
      if (!res.ok) return [];
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Expected JSON but got:", contentType);
        return [];
      }
      const json = await res.json();
      return json.data || [];
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
  },

  sendMessage: async (
    chatId: string,
    content: string,
    type: "text" | "image" | "file" = "text"
  ) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/chats/${chatId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ content, type }),
        }
      );
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Expected JSON but got:", contentType, text.substring(0, 100));
        throw new Error("Invalid response format");
      }
      return res.json();
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },

  createChat: async (userId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/chats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId }),
      });
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Expected JSON but got:", contentType, text.substring(0, 100));
        throw new Error("Invalid response format");
      }
      return res.json();
    } catch (error) {
      console.error("Error creating chat:", error);
      throw error;
    }
  },

  createGroup: async (name: string, participantIds: string[]) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/chats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isGroup: true, name, participantIds }),
      });
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Expected JSON but got:", contentType, text.substring(0, 100));
        throw new Error("Invalid response format");
      }
      return res.json();
    } catch (error) {
      console.error("Error creating group:", error);
      throw error;
    }
  },

  updateChat: async (chatId: string, updates: { name?: string; avatar?: string }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/chats/${chatId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Expected JSON but got:", contentType, text.substring(0, 100));
        throw new Error("Invalid response format");
      }
      return res.json();
    } catch (error) {
      console.error("Error updating chat:", error);
      throw error;
    }
  },

  addParticipants: async (chatId: string, userIds: string[]) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/chats/${chatId}/participants`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ userIds }),
        }
      );
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Expected JSON but got:", contentType, text.substring(0, 100));
        throw new Error("Invalid response format");
      }
      return res.json();
    } catch (error) {
      console.error("Error adding participants:", error);
      throw error;
    }
  },

  removeParticipant: async (chatId: string, userId: string) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/chats/${chatId}/participants/${userId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Expected JSON but got:", contentType, text.substring(0, 100));
        throw new Error("Invalid response format");
      }
      return res.json();
    } catch (error) {
      console.error("Error removing participant:", error);
      throw error;
    }
  },

  deleteChat: async (chatId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/chats/${chatId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Expected JSON but got:", contentType, text.substring(0, 100));
        throw new Error("Invalid response format");
      }
      return res.json();
    } catch (error) {
      console.error("Error deleting chat:", error);
      throw error;
    }
  },

  searchUsers: async (searchTerm: string) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/user/search?name=${encodeURIComponent(searchTerm)}`,
        { credentials: "include" }
      );
      if (!res.ok) return [];
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Expected JSON but got:", contentType);
        return [];
      }
      const json = await res.json();
      return json.data || [];
    } catch (error) {
      console.error("Error searching users:", error);
      return [];
    }
  },

  getFriends: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/friends`, {
        credentials: "include",
      });
      if (!res.ok) return [];
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Expected JSON but got:", contentType);
        return [];
      }
      const json = await res.json();
      return json.data || [];
    } catch (error) {
      console.error("Error fetching friends:", error);
      return [];
    }
  },

  blockUser: async (userId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/friends/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId }),
      });
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Expected JSON but got:", contentType, text.substring(0, 100));
        throw new Error("Invalid response format");
      }
      return res.json();
    } catch (error) {
      console.error("Error blocking user:", error);
      throw error;
    }
  },

  unblockUser: async (userId: string) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/friends/block/${userId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Expected JSON but got:", contentType, text.substring(0, 100));
        throw new Error("Invalid response format");
      }
      return res.json();
    } catch (error) {
      console.error("Error unblocking user:", error);
      throw error;
    }
  },

  markAsRead: async (chatId: string) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/chats/${chatId}/read`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      if (!res.ok) {
        console.error("Failed to mark chat as read");
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error marking chat as read:", error);
      return false;
    }
  },
};

// ============== MAIN COMPONENT ==============
export function MessagesSection(): JSX.Element {
  const { user } = useDashboardContext();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatsError, setChatsError] = useState<string | null>(null);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupError, setGroupError] = useState<string | null>(null);
  
  // Add members to group
  const [selectedMembersToAdd, setSelectedMembersToAdd] = useState<string[]>([]);
  const [addingMembers, setAddingMembers] = useState(false);
  const [addMembersError, setAddMembersError] = useState<string | null>(null);

  // Modals
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showGroupSettingsModal, setShowGroupSettingsModal] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<Friend | null>(
    null
  );

  // Friends
  const [friends, setFriends] = useState<Friend[]>([]);

  // Predefined stylish avatars for groups
  const groupAvatars = [
    "https://api.dicebear.com/7.x/shapes/svg?seed=group1&backgroundColor=FF6B00",
    "https://api.dicebear.com/7.x/shapes/svg?seed=team&backgroundColor=00D9FF",
    "https://api.dicebear.com/7.x/shapes/svg?seed=squad&backgroundColor=9333EA",
    "https://api.dicebear.com/7.x/shapes/svg?seed=crew&backgroundColor=10B981",
  ];

  // Group creation
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<string>(groupAvatars[0]);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const isSendingRef = useRef(false);
  const currentChatIdRef = useRef<string | null>(null);
  const isInitialLoadRef = useRef<boolean>(false);
  const [loaded, setLoaded] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chatsPollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageTimestampRef = useRef<string | null>(null);
  const lastViewedTimestampsRef = useRef<{ [chatId: string]: string }>({});

  // Typing indicator
  const [typingUsers] = useState<{ [chatId: string]: string[] }>(
    {}
  );

  // ============== FETCH FUNCTIONS ==============
  const fetchChats = useCallback(async (abortSignal?: AbortSignal, skipLoadingState: boolean = false) => {
      if (!skipLoadingState) {
        setLoading(true);
      }
      setChatsError(null);

      try {
      const data = await api.getChats();
      if (!abortSignal?.aborted && Array.isArray(data)) {
        // Only update state if there are actual changes
        setChats((prevChats) => {
          // Create maps for quick lookup
          const prevChatsMap = new Map(prevChats.map(chat => [chat.id, chat]));
          const newChatsMap = new Map(data.map(chat => [chat.id, chat]));
          
          // Check if there are new chats
          const hasNewChats = data.some(chat => !prevChatsMap.has(chat.id));
          
          // Check if any existing chat has changed (new message, unread count, etc.)
          const hasChanges = prevChats.some(prevChat => {
            const newChat = newChatsMap.get(prevChat.id);
            if (!newChat) return false;
            
            // Compare key properties that indicate changes
            return (
              prevChat.lastMessageAt !== newChat.lastMessageAt ||
              prevChat.unreadCount !== newChat.unreadCount ||
              (prevChat.lastMessage?.content !== newChat.lastMessage?.content) ||
              (prevChat.lastMessage?.createdAt !== newChat.lastMessage?.createdAt) ||
              (prevChat.lastMessage?.senderId !== newChat.lastMessage?.senderId) ||
              prevChat.participants?.length !== newChat.participants?.length
            );
          });
          
          // Only update if there are actual changes
          if (hasNewChats || hasChanges) {
            return data;
          }
          
          // No changes, return previous state to avoid re-render
          return prevChats;
        });
        return data;
        }
        return [];
      } catch (err: any) {
      if (!abortSignal?.aborted) {
          setChatsError(err.message || "Failed to load chats");
        }
        return [];
      } finally {
        if (!abortSignal?.aborted && !skipLoadingState) {
          setLoading(false);
        }
      }
  }, []);

  const fetchMessages = useCallback(
    async (chatId: string, abortSignal?: AbortSignal, silent: boolean = false) => {
      if (!silent) {
        setMessagesLoading(true);
      }
      setMessagesError(null);

      try {
        const data = await api.getMessages(chatId);

        if (currentChatIdRef.current !== chatId || abortSignal?.aborted) {
          return;
        }

        if (Array.isArray(data)) {
          const sortedMessages: Message[] = data.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          setMessages(sortedMessages);
          
          // Update last message timestamp for polling comparison
          if (sortedMessages.length > 0) {
            const latestMessage = sortedMessages[sortedMessages.length - 1];
            lastMessageTimestampRef.current = latestMessage.createdAt;
            
            // Mark chat as read when messages are loaded (user is viewing it)
            if (currentChatIdRef.current === chatId && latestMessage.createdAt) {
              lastViewedTimestampsRef.current[chatId] = latestMessage.createdAt;
              
              // Immediately update local state to remove orange dot
              if (!silent) {
                setChats((prevChats) =>
                  prevChats.map((c) =>
                    c.id === chatId ? { ...c, unreadCount: 0 } : c
                  )
                );
                // Notify backend
                api.markAsRead(chatId);
                
                // After 1.5s, refresh chats to ensure backend state is synced
                setTimeout(async () => {
                  if (currentChatIdRef.current === chatId) {
                    await fetchChats();
                  }
                }, 1500);
              }
            }
          }
        } else {
          setMessages([]);
        }
      } catch (err: any) {
        if (
          err.name !== "AbortError" &&
          currentChatIdRef.current === chatId &&
          !abortSignal?.aborted
        ) {
          if (!silent) {
            setMessagesError(err.message || "Failed to load messages");
          }
          setMessages([]);
        }
      } finally {
        if (currentChatIdRef.current === chatId && !abortSignal?.aborted) {
          if (!silent) {
            setMessagesLoading(false);
          }
        }
      }
    },
    []
  );

  // Poll for new messages and update both messages and chats list
  const pollForNewMessages = useCallback(async () => {
    if (!selectedChat || !currentChatIdRef.current) return;
    if (isSendingRef.current) return; // Don't poll while sending a message

    const chatId = selectedChat.id;
    
    // Verify this is still the current chat before proceeding
    if (currentChatIdRef.current !== chatId) {
      return;
    }
    
    try {
      const data = await api.getMessages(chatId);

      // Double-check chat hasn't changed during the async operation
      if (currentChatIdRef.current !== chatId) {
        return;
      }

      if (Array.isArray(data) && data.length > 0) {
        const sortedMessages: Message[] = data.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        const latestMessage = sortedMessages[sortedMessages.length - 1];
        
        // Check if there are new messages by comparing with current messages
        setMessages((prevMessages) => {
          // Verify chat hasn't changed
          if (currentChatIdRef.current !== chatId) {
            return prevMessages;
          }

          const existingMessageIds = new Set(prevMessages.map((m) => m.id));
          const newMessages = sortedMessages.filter(
            (m) => !existingMessageIds.has(m.id)
          );

          // If there are new messages, update the state
          if (newMessages.length > 0 || prevMessages.length !== sortedMessages.length) {
            lastMessageTimestampRef.current = latestMessage.createdAt;
            
            // Mark chat as read when new messages are loaded (user is actively viewing)
            if (currentChatIdRef.current === chatId && latestMessage.createdAt) {
              lastViewedTimestampsRef.current[chatId] = latestMessage.createdAt;
              
              // Immediately update local state to remove orange dot
              setChats((prevChats) =>
                prevChats.map((c) =>
                  c.id === chatId ? { ...c, unreadCount: 0 } : c
                )
              );
              
              // Notify backend
              api.markAsRead(chatId);
            }
            
            return sortedMessages;
          }

          return prevMessages;
        });

        // Update chats list with the latest message if messages were updated
        // We always update the chats list to ensure sidebar stays in sync
        if (currentChatIdRef.current === chatId) {
          setChats((prevChats) =>
            prevChats.map((chat) =>
              chat.id === chatId
                ? {
                    ...chat,
                    lastMessage: {
                      content: latestMessage.content,
                      createdAt: latestMessage.createdAt,
                      senderId: latestMessage.senderId,
                    },
                    lastMessageAt: latestMessage.createdAt,
                  }
                : chat
            )
          );
        }
      }
    } catch (err: any) {
      // Silently fail for polling errors to avoid disrupting the UI
      if (err.name !== "AbortError" && currentChatIdRef.current === chatId) {
        console.error("Polling error:", err);
      }
    }
  }, [selectedChat]);

  const fetchFriends = useCallback(async () => {
    try {
      const data = await api.getFriends();
      if (Array.isArray(data)) {
        const validatedFriends = data
          .filter((f: any) => f && f.user && f.user.id)
          .map((f: any) => ({
            id: f.user.id,
            name: f.user.name || null,
            email: f.user.email || null,
            avatar: f.user.avatar || null,
            onlineStatus: f.user.onlineStatus || false,
          }));
        setFriends(validatedFriends);
      }
    } catch (err: any) {
      console.error("Failed to fetch friends:", err);
    }
  }, []);


  // ============== CHAT ACTIONS ==============
  const createChat = async (friendId: string) => {
    if (!friendId) return;

    try {
      const existingChat = chats.find(
        (chat) =>
          !chat.isGroup &&
          chat.participants &&
          chat.participants.some((p) => p.id === friendId && !p.isSelf)
      );

      if (existingChat) {
        handleSelectChat(existingChat);
        setShowNewChatModal(false);
        return;
      }

      const response = await api.createChat(friendId);
      if (response.data && response.data.id) {
        await fetchChats();
        const updatedChats = await fetchChats();
        const newChat = updatedChats.find((c) => c.id === response.data.id);
        if (newChat) {
          handleSelectChat(newChat);
        }
      }
      setShowNewChatModal(false);
    } catch (err: any) {
      console.error("Failed to create chat:", err);
    }
  };

  const createGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) return;

    setCreatingGroup(true);
    setGroupError(null);

    try {
      // Validate: Check for duplicate group names (case-insensitive)
      const trimmedName = groupName.trim();
      
      if (isDuplicateGroupName(trimmedName)) {
        setGroupError(
          `A group with the name "${trimmedName}" already exists. Please choose a different name.`
        );
        setCreatingGroup(false);
        return;
      }

      // Create the group
      const response = await api.createGroup(trimmedName, selectedMembers);
      
      if (response.error) {
        setGroupError(response.error || "Failed to create group");
        setCreatingGroup(false);
        return;
      }

      if (response.data && response.data.id) {
        const groupId = response.data.id;
        
        // Update group avatar if provided
        if (selectedAvatar) {
          try {
            await api.updateChat(groupId, { avatar: selectedAvatar });
          } catch (avatarErr: any) {
            console.error("Failed to update group avatar:", avatarErr);
            // Continue even if avatar update fails
          }
        }

        // Refresh chats list to get the full group data with participants
        const updatedChats = await fetchChats();
        
        // Find the newly created group and select it
        const newGroup = updatedChats.find((chat) => chat.id === groupId);
        
        if (newGroup) {
          handleSelectChat(newGroup);
        }

        // Reset form and close modal
        setShowCreateGroupModal(false);
        setGroupName("");
        setSelectedMembers([]);
        setSelectedAvatar(groupAvatars[0]);
        setGroupError(null);
      } else {
        setGroupError("Failed to create group. Please try again.");
      }
    } catch (err: any) {
      console.error("Failed to create group:", err);
      setGroupError(
        err.message || err.error || "Failed to create group. Please try again."
      );
    } finally {
      setCreatingGroup(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !newMessage.trim() ||
      !selectedChat ||
      sendingMessage ||
      isSendingRef.current
    ) {
      return;
    }

    isSendingRef.current = true;
    const messageContent = newMessage.trim();
    setSendingMessage(true);
    setSendError(null);
    setNewMessage("");

    try {
      const response = await api.sendMessage(
        selectedChat.id,
        messageContent,
        "text"
      );
      if (response.data) {
        setMessages((prev) => {
          const messageExists = prev.some((msg) => msg.id === response.data.id);
          if (messageExists) return prev;
          return [...prev, response.data];
        });
 
        // Mark chat as read when user sends a message (user is actively viewing)
        if (response.data.createdAt) {
          lastViewedTimestampsRef.current[selectedChat.id] = response.data.createdAt;
          // Notify backend
          api.markAsRead(selectedChat.id);
        }

        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === selectedChat.id
              ? {
                  ...chat,
                  lastMessage: {
                    content: response.data.content,
                    createdAt: response.data.createdAt,
                    senderId: response.data.senderId,
                  },
                  lastMessageAt: response.data.createdAt,
                }
              : chat
          )
        );
      }
    } catch (err: any) {
      setSendError(err.message || "Failed to send message");
      setNewMessage(messageContent);
    } finally {
      setSendingMessage(false);
      isSendingRef.current = false;
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 50);
    }
  };

  const handleBlockUser = async (userId: string) => {
    try {
      await api.blockUser(userId);
      
      // Add system message to chat
      if (selectedChat && !selectedChat.isGroup) {
        const systemMessage: Message = {
          id: `sys-${Date.now()}`,
          content: "You blocked this user. Their messages will be hidden.",
          type: "system",
          senderId: "system",
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, systemMessage]);
      }

      setShowUserProfileModal(false);
    } catch (err) {
      console.error("Failed to block user:", err);
    }
  };

  const handleUnblockUser = async (userId: string) => {
    try {
      await api.unblockUser(userId);
      
      if (selectedChat && !selectedChat.isGroup) {
        const systemMessage: Message = {
          id: `sys-${Date.now()}`,
          content: "You unblocked this user.",
          type: "system",
          senderId: "system",
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, systemMessage]);
      }

      setShowUserProfileModal(false);
    } catch (err) {
      console.error("Failed to unblock user:", err);
    }
  };

  const handleSelectChat = (chat: Chat) => {
    // If the same chat is already selected, don't fetch messages again
    if (selectedChat?.id === chat.id) {
      return;
    }

    // Clear existing polling interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    currentChatIdRef.current = chat.id;
    isInitialLoadRef.current = true; // Mark as initial load for instant scroll
    lastMessageTimestampRef.current = null; // Reset timestamp for new chat
    
    // Mark chat as read by updating last viewed timestamp immediately
    if (chat.lastMessageAt) {
      lastViewedTimestampsRef.current[chat.id] = chat.lastMessageAt;
    }
    
    // Immediately update local state to remove orange dot
    setChats((prevChats) =>
      prevChats.map((c) =>
        c.id === chat.id ? { ...c, unreadCount: 0 } : c
      )
    );
    
    // Notify backend that chat is being read
    api.markAsRead(chat.id);
    
    // After 1.5s, refresh chats to ensure backend state is synced
    setTimeout(async () => {
      if (currentChatIdRef.current === chat.id) {
        await fetchChats();
      }
    }, 1500);
    
    setMessages([]);
    setMessagesError(null);
    setSendError(null);
    setSelectedChat(chat);
    fetchMessages(chat.id);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedChat) return;

    try {
      await api.removeParticipant(selectedChat.id, memberId);
      await fetchChats();
      // Update selected chat if it's still selected
      if (selectedChat.id === currentChatIdRef.current) {
        const updatedChats = await fetchChats();
        const updatedChat = updatedChats.find((chat) => chat.id === selectedChat.id);
        if (updatedChat) {
          setSelectedChat(updatedChat);
        }
      }
    } catch (err) {
      console.error("Failed to remove member:", err);
    }
  };

  const handleAddMembers = async () => {
    if (!selectedChat || selectedMembersToAdd.length === 0) return;

    setAddingMembers(true);
    setAddMembersError(null);

    try {
      const response = await api.addParticipants(selectedChat.id, selectedMembersToAdd);
      
      if (response.error) {
        setAddMembersError(response.error || "Failed to add members");
        setAddingMembers(false);
        return;
      }

      // Refresh chats to get updated participant list
      await fetchChats();
      
      // Update selected chat if it's still selected
      if (selectedChat.id === currentChatIdRef.current) {
        const updatedChats = await fetchChats();
        const updatedChat = updatedChats.find((chat) => chat.id === selectedChat.id);
        if (updatedChat) {
          setSelectedChat(updatedChat);
        }
      }

      // Reset and close modal
      setShowAddMembersModal(false);
      setSelectedMembersToAdd([]);
      setAddMembersError(null);
    } catch (err: any) {
      console.error("Failed to add members:", err);
      setAddMembersError(
        err.message || err.error || "Failed to add members. Please try again."
      );
    } finally {
      setAddingMembers(false);
    }
  };

  const handleLeaveChannel = async () => {
    if (!selectedChat || !user) return;

    try {
      await api.removeParticipant(selectedChat.id, user.id);
      setSelectedChat(null);
      await fetchChats();
      setShowGroupSettingsModal(false);
    } catch (err) {
      console.error("Failed to leave channel:", err);
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedChat || !user) return;

    try {
      await api.deleteChat(selectedChat.id);
      setSelectedChat(null);
      await fetchChats();
      setShowGroupSettingsModal(false);
    } catch (err: any) {
      console.error("Failed to delete group:", err);
      alert(err.message || "Failed to delete group. Please try again.");
    }
  };

  // ============== EFFECTS ==============
  useEffect(() => {
    if (!user) return;

    const controller = new AbortController();
    fetchChats(controller.signal);
    fetchFriends();

    // Set up continuous polling for chats list to keep sidebar updated
    chatsPollingIntervalRef.current = setInterval(() => {
      if (!controller.signal.aborted) {
        fetchChats(controller.signal, true); // Skip loading state for polling
      }
    }, 1500); // Poll every 1.5 seconds for faster notification

    return () => {
      controller.abort();
      // Clean up polling intervals on unmount
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (chatsPollingIntervalRef.current) {
        clearInterval(chatsPollingIntervalRef.current);
        chatsPollingIntervalRef.current = null;
      }
    };
  }, [user, fetchChats, fetchFriends]);

  useEffect(() => {
    if (!showNewChatModal || friends.length > 0) return;

    fetchFriends();
  }, [showNewChatModal, fetchFriends, friends.length]);

  useEffect(() => {
    if (!showAddMembersModal || friends.length > 0) return;

    fetchFriends();
  }, [showAddMembersModal, fetchFriends, friends.length]);

  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      // Scroll instantly when opening a chat, smoothly for new messages
      const scrollBehavior = isInitialLoadRef.current ? "auto" : "smooth";
      messagesEndRef.current.scrollIntoView({ behavior: scrollBehavior });
      // Reset the initial load flag after first scroll
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
      }
    }
  }, [messages]);


  useEffect(() => {
    if (selectedChat && messageInputRef.current) {
      const timer = setTimeout(() => {
        messageInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [selectedChat]);

  // Polling effect: Set up polling when a chat is selected
  useEffect(() => {
    // Clear any existing polling interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    // Only start polling if a chat is selected
    if (selectedChat && currentChatIdRef.current === selectedChat.id) {
      // Reset last message timestamp when switching chats
      lastMessageTimestampRef.current = null;

      // Start polling every 1.5 seconds for faster message updates
      pollingIntervalRef.current = setInterval(() => {
        pollForNewMessages();
      }, 1500);

      // Also poll immediately after a short delay to catch any missed messages
      const immediatePoll = setTimeout(() => {
        pollForNewMessages();
      }, 500);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        clearTimeout(immediatePoll);
      };
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [selectedChat, pollForNewMessages]);

  // ESC key to close modals
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Close modals in priority order (last opened first)
        if (showUserProfileModal) {
          setShowUserProfileModal(false);
          setSelectedUserProfile(null);
        } else if (showAddMembersModal) {
          setShowAddMembersModal(false);
          setSelectedMembersToAdd([]);
          setAddMembersError(null);
        } else if (showAddMembersModal) {
          setShowAddMembersModal(false);
          setSelectedMembersToAdd([]);
          setAddMembersError(null);
        } else if (showGroupSettingsModal) {
          setShowGroupSettingsModal(false);
        } else if (showCreateGroupModal) {
          setShowCreateGroupModal(false);
          setGroupName("");
          setSelectedMembers([]);
          setSelectedAvatar(groupAvatars[0]);
          setGroupError(null);
          setCreatingGroup(false);
        } else if (showNewChatModal) {
          setShowNewChatModal(false);
        }
      }
    };

    window.addEventListener("keydown", handleEscKey);
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [
    showNewChatModal,
    showCreateGroupModal,
    showGroupSettingsModal,
    showAddMembersModal,
    showUserProfileModal,
  ]);

  // ============== HELPER FUNCTIONS ==============
  const getChatDisplayName = useCallback((chat: Chat): string => {
    if (chat.isGroup || chat.isChannel) {
      return chat.name || "Group Chat";
    }
    if (!chat.participants || chat.participants.length === 0) {
      return "Unknown User";
    }
    const otherParticipant = chat.participants.find((p) => !p.isSelf);
    return otherParticipant?.name || "Unknown User";
  }, []);

  const getChatAvatar = useCallback((chat: Chat): string => {
    if (chat.avatar) return chat.avatar;
    if (
      !chat.isGroup &&
      !chat.isChannel &&
      chat.participants &&
      chat.participants.length > 0
    ) {
      const otherParticipant = chat.participants.find((p) => !p.isSelf);
      return otherParticipant?.avatar || "";
    }
    return "";
  }, []);

  const isOnline = useCallback((chat: Chat): boolean => {
    if (chat.isGroup || chat.isChannel) return false;
    if (!chat.participants || chat.participants.length === 0) return false;
    const otherParticipant = chat.participants.find((p) => !p.isSelf);
    return otherParticipant?.onlineStatus || false;
  }, []);

  // Calculate unread count for a chat
  const getUnreadCount = useCallback((chat: Chat): number => {
    if (!user || !chat.lastMessage || !chat.lastMessageAt) return 0;
    
    // Prioritize backend's unreadCount if available
    if (typeof chat.unreadCount === 'number') {
      return chat.unreadCount;
    }
    
    // If last message is from current user, no unread
    if (chat.lastMessage.senderId === user.id) return 0;
    
    // Get last viewed timestamp for this chat
    const lastViewed = lastViewedTimestampsRef.current[chat.id];
    if (!lastViewed) {
      // If never viewed, count as unread if there's a last message from someone else
      return 1;
    }
    
    // If last message is newer than last viewed, it's unread
    const lastMessageTime = new Date(chat.lastMessageAt).getTime();
    const lastViewedTime = new Date(lastViewed).getTime();
    
    return lastMessageTime > lastViewedTime ? 1 : 0;
  }, [user]);

  const formatTimestamp = useCallback((timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return "Unknown";

      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return "Just now";
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Unknown";
    }
  }, []);

  const chatsWithMessages = useMemo(() => {
    // Create a set of friend IDs for quick lookup
    const friendIds = new Set(friends.map((f) => f.id));
    
    return chats
      .filter((chat) => {
        // Must have a last message
        if (chat.lastMessage === null) return false;
        
        // Always include groups and channels
        if (chat.isGroup || chat.isChannel) return true;
        
        // For 1-on-1 chats, only include if the other participant is a friend
        if (!chat.participants || chat.participants.length === 0) return false;
        
        const otherParticipant = chat.participants.find((p) => !p.isSelf);
        if (!otherParticipant) return false;
        
        return friendIds.has(otherParticipant.id);
      })
      .sort((a, b) => {
        const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return dateB - dateA;
      });
  }, [chats, friends]);

  // Calculate if there are any unread messages across all chats
  const hasUnreadMessages = useMemo(() => {
    if (!user) return false;
    
    return chats.some((chat) => {
      // Prioritize backend's unreadCount if available
      if (typeof chat.unreadCount === 'number') {
        return chat.unreadCount > 0;
      }
      
      if (!chat.lastMessage || !chat.lastMessageAt) return false;
      if (chat.lastMessage.senderId === user.id) return false;
      
      const lastViewed = lastViewedTimestampsRef.current[chat.id];
      if (!lastViewed) return true;
      
      const lastMessageTime = new Date(chat.lastMessageAt).getTime();
      const lastViewedTime = new Date(lastViewed).getTime();
      return lastMessageTime > lastViewedTime;
    });
  }, [chats, user]);

  // Notify parent about unread messages via custom event
  useEffect(() => {
    const event = new CustomEvent('unreadMessagesChanged', { 
      detail: { hasUnreadMessages } 
    });
    window.dispatchEvent(event);
  }, [hasUnreadMessages]);

  const displayFriends = useMemo(() => {
    return friends;
  }, [friends]);

  // Filter friends who are not already members of the selected group
  const availableFriendsToAdd = useMemo(() => {
    if (!selectedChat || !selectedChat.isGroup) return [];
    
    const existingMemberIds = new Set(
      selectedChat.participants?.map((p) => p.id) || []
    );
    
    return friends.filter((friend) => !existingMemberIds.has(friend.id));
  }, [friends, selectedChat]);

  // Check if a group name already exists (case-insensitive)
  const isDuplicateGroupName = useCallback(
    (name: string): boolean => {
      if (!name || !name.trim()) return false;
      const trimmedName = name.trim().toLowerCase();
      return chats.some(
        (chat) =>
          chat.isGroup &&
          chat.name &&
          chat.name.trim().toLowerCase() === trimmedName
      );
    },
    [chats]
  );

  // Real-time validation for group name
  const groupNameError = useMemo(() => {
    if (!groupName.trim()) return null;
    if (isDuplicateGroupName(groupName)) {
      return `A group with the name "${groupName.trim()}" already exists. Please choose a different name.`;
    }
    return null;
  }, [groupName, isDuplicateGroupName]);

  if (!user) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center w-full text-center">
        <h1 className="text-white text-2xl font-bold">Loading...</h1>
      </div>
    );
  }

  // ============== RENDER ==============
  return (
    <div className="bg-primary-bg h-screen w-full text-white font-primary flex overflow-hidden">
      {/* Chat List Sidebar */}
      <div
        className={`${selectedChat ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 lg:w-96 border-r border-white/10 bg-primary-elements h-full overflow-hidden`}
      >
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold">Messages</h2>
            <div className="flex gap-1.5 sm:gap-2">
              <button
                onClick={() => {
                  setShowCreateGroupModal(true);
                  setGroupError(null);
                  setCreatingGroup(false);
                }}
                className="p-1.5 sm:p-2 rounded-lg bg-primary-btn/20 text-primary-btn hover:bg-primary-btn hover:text-primary-bg transition-all duration-300 hover:scale-110 active:scale-95"
                title="Create Group"
              >
                <MdGroup size={20} className="sm:w-6 sm:h-6" />
              </button>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="p-1.5 sm:p-2 rounded-lg bg-primary-btn text-primary-bg hover:bg-[#FF6B00] hover:text-white transition-all duration-300 hover:scale-110 active:scale-95"
              title="New Chat"
            >
                <MdMessage size={20} className="sm:w-6 sm:h-6" />
            </button>
            </div>
          </div>
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto">
          {chatsError && (
            <div className="m-2 p-3 rounded-lg bg-rose-500/20 border border-rose-400/50 text-rose-200 text-sm">
              {chatsError}
            </div>
          )}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-white/60 animate-pulse">Loading chats...</p>
            </div>
          ) : chatsWithMessages.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MdMessage className="mx-auto text-white/30 mb-4" size={64} />
              <p className="text-white/60 text-lg mb-2">No chats yet</p>
              <p className="text-white/40 text-sm mb-4">
                Start a conversation with your friends
              </p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="px-4 py-2 rounded-lg bg-[#FF6B00] text-white hover:bg-[#FF8C33] transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-[#FF6B00]/50"
              >
                Start New Chat
              </button>
            </div>
          ) : (
            <div className="space-y-1 p-1.5 sm:p-2">
              {chatsWithMessages.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => handleSelectChat(chat)}
                  className={`w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-all duration-200 group active:scale-[0.98] ${
                    selectedChat?.id === chat.id
                      ? "bg-primary-btn/10 border-l-4 border-l-[#FF6B00] border-r border-t border-b border-primary-btn/30 shadow-lg"
                      : "hover:bg-primary-bg/50 border border-transparent hover:border-l-2 hover:border-l-[#FF6B00]/50"
                  }`}
                >
                  <div className="relative shrink-0">
                    {getChatAvatar(chat) && (
                      <LazyLoadingImage
                        dimension={{
                          width: "w-10 sm:w-12",
                          height: "h-10 sm:h-12",
                        }}
                        loading={loaded}
                      >
                        <img
                          src={getChatAvatar(chat)}
                          alt="chat avatar"
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover ${loaded ? "opacity-100" : "opacity-0"}`}
                          loading="lazy"
                          onLoad={() => setLoaded(true)}
                        />
                        {!loaded && (
                          <div className="absolute inset-0 rounded-full bg-gradient-radial from-cyan-400/40 to-blue-900/60 opacity-90 blur-md shadow-2xl shadow-cyan-500/30 animate-pulse"></div>
                        )}
                      </LazyLoadingImage>
                    )}
                    {getUnreadCount(chat) > 0 && (
                      <div className="absolute top-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-orange-500 rounded-full border-2 border-primary-elements animate-pulse"></div>
                    )}
                    {(chat.isGroup || chat.isChannel) && (
                      <div className={`absolute bottom-0 right-0 w-5 h-5 sm:w-6 sm:h-6 bg-primary-elements rounded-full flex items-center justify-center border-2 border-primary-elements ${getUnreadCount(chat) > 0 ? 'bottom-2.5 right-2.5 sm:bottom-3 sm:right-3' : ''}`}>
                        {chat.isChannel ? (
                          <MdGroup size={12} className="sm:w-3.5 sm:h-3.5 text-secondary-btn" />
                        ) : (
                          <MdGroup size={12} className="sm:w-3.5 sm:h-3.5 text-primary-btn" />
                        )}
                      </div>
                    )}
                    {chat.isPasswordProtected && (
                      <div className="absolute top-0 right-0 w-4 h-4 sm:w-5 sm:h-5 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-primary-elements">
                        <MdLock size={10} className="sm:w-3 sm:h-3 text-primary-bg" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left overflow-hidden min-w-0">
                    <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                      <p className="font-semibold truncate flex items-center gap-1 text-sm sm:text-base">
                        {getChatDisplayName(chat)}
                        {chat.isChannel && (
                          <span className="text-[10px] sm:text-xs text-secondary-btn">(Channel)</span>
                        )}
                      </p>
                      {chat.lastMessageAt && (
                        <span className="text-[10px] sm:text-xs font-medium text-[#FF6B00]/70 flex-shrink-0">
                          {formatTimestamp(chat.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    {chat.lastMessage && (
                      <p className="text-xs sm:text-sm truncate text-white/60">
                        {user && chat.lastMessage.senderId === user.id && (
                          <span className="text-[#FF6B00] font-medium">You: </span>
                        )}
                        {chat.lastMessage.content || "(No content)"}
                      </p>
                    )}
                    {(chat.isGroup || chat.isChannel) && chat.participants && (
                      <p className="text-[10px] sm:text-xs text-white/40">
                        {chat.participants.length} members
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat View */}
      <div
        className={`${selectedChat ? "flex" : "hidden md:flex"} flex-col flex-1 h-full overflow-hidden`}
      >
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-3 sm:p-4 border-b border-white/10 bg-primary-elements flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <button
                onClick={() => setSelectedChat(null)}
                className="md:hidden p-1.5 sm:p-2 rounded-lg hover:bg-primary-bg/50 active:scale-95 transition-all"
              >
                <MdArrowBack size={20} className="sm:w-6 sm:h-6" />
              </button>
              <div
                className="relative cursor-pointer"
                onClick={() => {
                  if (!selectedChat.isGroup && !selectedChat.isChannel) {
                    const otherUser = selectedChat.participants?.find((p) => !p.isSelf);
                    if (otherUser) {
                      setSelectedUserProfile({
                        id: otherUser.id,
                        name: otherUser.name,
                        email: null,
                        avatar: otherUser.avatar,
                        onlineStatus: otherUser.onlineStatus,
                        isBlocked: otherUser.isBlocked,
                      });
                      setShowUserProfileModal(true);
                    }
                  }
                }}
              >
                {getChatAvatar(selectedChat) && (
                  <LazyLoadingImage
                    dimension={{
                      width: "w-10",
                      height: "h-10",
                    }}
                    loading={loaded}
                  >
                    <img
                      src={getChatAvatar(selectedChat)}
                      alt="chat avatar"
                      className={`w-10 h-10 rounded-full object-cover ${loaded ? "opacity-100" : "opacity-0"}`}
                      loading="lazy"
                      onLoad={() => setLoaded(true)}
                    />
                    {!loaded && (
                      <div className="absolute inset-0 rounded-full bg-gradient-radial from-cyan-400/40 to-blue-900/60 opacity-90 blur-md shadow-2xl shadow-cyan-500/30 animate-pulse"></div>
                    )}
                  </LazyLoadingImage>
                )}
                {!selectedChat.isGroup &&
                  !selectedChat.isChannel &&
                  isOnline(selectedChat) && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-primary-elements"></div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold flex items-center gap-2">
                  {getChatDisplayName(selectedChat)}
                  {selectedChat.isChannel && (
                    <span className="text-xs text-secondary-btn px-2 py-0.5 rounded bg-secondary-btn/10">
                      Channel
                    </span>
                  )}
                  {selectedChat.isPasswordProtected && (
                    <MdLock size={16} className="text-yellow-500" />
                  )}
                </h3>
                {!selectedChat.isGroup &&
                  !selectedChat.isChannel &&
                  isOnline(selectedChat) && (
                  <p className="text-xs text-[#FF6B00] font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-[#FF6B00] rounded-full animate-pulse"></span>
                    Online
                  </p>
                )}
                {!selectedChat.isGroup &&
                  !selectedChat.isChannel &&
                  !isOnline(selectedChat) && (
                  <p className="text-xs text-white/50">Offline</p>
                  )}
                {(selectedChat.isGroup || selectedChat.isChannel) && (
                  <p className="text-xs text-white/60">
                    {selectedChat.participants?.length || 0} members
                  </p>
                )}
              </div>
              {(selectedChat.isGroup || selectedChat.isChannel) && (
                <button
                  onClick={() => setShowGroupSettingsModal(true)}
                  className="p-2 rounded-lg hover:bg-primary-bg/50 transition-colors"
                  title="Group Settings"
                >
                  <MdSettings size={24} />
                </button>
              )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-primary-bg">
              {messagesError && (
                <div className="mb-4 p-3 rounded-lg bg-rose-500/20 border border-rose-400/50 text-rose-200 text-sm">
                  {messagesError}
                </div>
              )}
              {messagesLoading ? (
                <div className="text-center py-12">
                  <p className="text-white/60 animate-pulse">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-white/60">No messages yet</p>
                  <p className="text-white/40 text-sm mt-2">
                    Start the conversation!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isOwnMessage = user && message.senderId === user.id;
                    const isSystemMessage = message.type === "system";

                    if (isSystemMessage) {
                      return (
                        <div
                          key={message.id}
                          className="flex justify-center"
                        >
                          <div className="bg-white/10 text-white/70 px-4 py-2 rounded-full text-sm max-w-md text-center border border-white/10">
                            {message.content}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                            isOwnMessage
                              ? "bg-primary-btn text-primary-bg"
                              : "bg-primary-elements text-white"
                          }`}
                        >
                          {!isOwnMessage &&
                            (selectedChat.isGroup || selectedChat.isChannel) &&
                            message.sender && (
                              <p className="text-xs text-primary-btn font-semibold mb-1">
                                {message.sender.name || "Unknown"}
                              </p>
                            )}
                          {message.type === "image" && message.fileUrl && (
                            <img
                              src={message.fileUrl}
                              alt="shared"
                              className="rounded-lg mb-2 max-w-xs"
                            />
                          )}
                          {message.type === "file" && message.fileUrl && (
                            <div className="flex items-center gap-2 mb-2">
                              <MdMessage size={20} />
                              <a
                                href={message.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline"
                              >
                                {message.fileName || "Download file"}
                              </a>
                            </div>
                            )}
                          <p className="break-words">
                            {message.content || "(Empty message)"}
                          </p>
                          <p
                            className={`text-xs mt-1 ${
                              isOwnMessage ? "text-primary-bg/70" : "text-white/50"
                            }`}
                          >
                            {message.createdAt
                              ? new Date(message.createdAt).toLocaleTimeString(
                                  "en-US",
                                  {
                                    hour: "numeric",
                                    minute: "2-digit",
                                  }
                                )
                              : "Unknown time"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {/* Typing indicator */}
                  {typingUsers[selectedChat.id] &&
                    typingUsers[selectedChat.id].length > 0 && (
                      <div className="flex justify-start">
                        <div className="bg-primary-elements text-white/60 px-4 py-2 rounded-2xl text-sm italic">
                          {typingUsers[selectedChat.id].join(", ")} typing...
                        </div>
                      </div>
                    )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-2 sm:p-4 border-t border-white/10 bg-primary-elements flex-shrink-0">
              {sendError && (
                <div className="mb-2 p-2 rounded-lg bg-rose-500/20 border border-rose-400/50 text-rose-200 text-xs sm:text-sm">
                  {sendError}
                </div>
              )}
              <form onSubmit={sendMessage} className="flex gap-1.5 sm:gap-2">
                <input
                  ref={messageInputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !e.shiftKey &&
                      !e.ctrlKey &&
                      !e.metaKey
                    ) {
                      e.preventDefault();
                      sendMessage(e as any);
                    }
                  }}
                  placeholder="Type a message..."
                  disabled={sendingMessage}
                  className="flex-1 rounded-lg sm:rounded-xl border border-white/10 bg-primary-bg px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base text-white placeholder:text-white/40 focus:border-[#FF6B00] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50 disabled:opacity-50 transition-all duration-200"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sendingMessage}
                  className="px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl bg-primary-btn text-primary-bg hover:bg-[#FF6B00] hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 sm:gap-2 hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-[#FF6B00]/30 text-xs sm:text-sm"
                >
                  <MdSend size={18} className="sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">{sendingMessage ? "Sending..." : "Send"}</span>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-primary-bg h-full">
            <div className="text-center">
              <MdMessage className="mx-auto text-white/20 mb-4" size={80} />
              <h3 className="text-xl font-semibold text-white/70 mb-2">
                Select a chat to start messaging
              </h3>
              <p className="text-white/50">
                Choose a conversation from the list or start a new one
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ============== MODALS ============== */}

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-primary-elements rounded-xl sm:rounded-2xl border border-white/10 w-full max-w-md max-h-[90vh] sm:max-h-[80vh] flex flex-col my-auto">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-bold">Start New Chat</h3>
              <button
                onClick={() => {
                  setShowNewChatModal(false);
                }}
                className="p-2 rounded-lg hover:bg-primary-bg/50 transition-colors"
              >
                <MdClose size={24} />
              </button>
            </div>

            {friends.length > 0 && (
              <div className="p-4 border-b border-white/10">
                <p className="text-xs text-white/50">
                  {friends.length} friend{friends.length !== 1 ? "s" : ""} available
                </p>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4">
              {displayFriends.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-white/60">No friends yet</p>
                  <p className="text-white/40 text-sm mt-2">
                    Add friends to start chatting
                  </p>
                </div>
              ) : (
                      <div className="space-y-2">
                  {displayFriends.map((friend) => (
                          <button
                            key={friend.id}
                            onClick={() => createChat(friend.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:border-[#FF6B00] hover:bg-primary-bg/50 transition-all duration-200 hover:shadow-md hover:shadow-[#FF6B00]/20"
                          >
                            <div className="relative shrink-0">
                              {friend.avatar && (
                                  <img
                                    src={friend.avatar}
                            alt={friend.name || "User"}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                              )}
                              {friend.onlineStatus && (
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-primary-elements"></div>
                              )}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <p className="font-semibold truncate">
                                {friend.name || "Unknown"}
                              </p>
                              <p className="text-sm text-white/60 truncate">
                                {friend.email || ""}
                              </p>
                              {friend.onlineStatus && (
                          <p className="text-xs text-green-400 mt-0.5">Online</p>
                              )}
                            </div>
                          </button>
                        ))}
                            </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-primary-elements rounded-xl sm:rounded-2xl border border-white/10 w-full max-w-md max-h-[90vh] sm:max-h-[80vh] flex flex-col my-auto">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-bold">Create Group Chat</h3>
              <button
                onClick={() => {
                  setShowCreateGroupModal(false);
                  setGroupName("");
                  setSelectedMembers([]);
                  setSelectedAvatar(groupAvatars[0]);
                  setGroupError(null);
                  setCreatingGroup(false);
                }}
                className="p-2 rounded-lg hover:bg-primary-bg/50 transition-colors"
              >
                <MdClose size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {(groupError || groupNameError) && (
                <div className="p-3 rounded-lg bg-rose-500/20 border border-rose-400/50 text-rose-200 text-sm">
                  {groupError || groupNameError}
                </div>
              )}
              {/* Avatar Selection */}
              <div>
                <label className="block text-sm font-medium mb-3">
                  Choose Group Avatar
                </label>
                <div className="grid grid-cols-4 gap-4">
                  {groupAvatars.map((avatar, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedAvatar(avatar)}
                      disabled={creatingGroup}
                      className={`relative aspect-square rounded-2xl overflow-hidden transition-all duration-300 ${
                        selectedAvatar === avatar
                          ? "ring-4 ring-primary-btn shadow-lg shadow-primary-btn/50 scale-110"
                          : "ring-2 ring-white/20 hover:ring-primary-btn/60 hover:scale-105 hover:shadow-md"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <img
                        src={avatar}
                        alt={`Avatar ${index + 1}`}
                        className="w-full h-full object-cover bg-primary-bg"
                      />
                      {selectedAvatar === avatar && (
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-btn/30 to-transparent flex items-center justify-center backdrop-blur-[1px]">
                          <div className="bg-primary-btn rounded-full p-1.5 shadow-lg">
                            <MdCheck className="text-white" size={20} />
                          </div>
                        </div>
                      )}
                          </button>
                        ))}
                      </div>
                {!selectedAvatar && (
                  <p className="text-xs text-white/50 mt-2">
                    💡 Select an avatar to represent your group
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => {
                    setGroupName(e.target.value);
                    if (groupError) setGroupError(null);
                  }}
                  placeholder="Enter group name..."
                  disabled={creatingGroup}
                  className={`w-full rounded-lg border ${
                    groupNameError
                      ? "border-rose-400 focus:border-rose-400"
                      : "border-white/10 focus:border-[#FF6B00]"
                  } bg-primary-bg px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 ${
                    groupNameError
                      ? "focus:ring-rose-400/50"
                      : "focus:ring-[#FF6B00]/50"
                  } transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                />
                {groupNameError && (
                  <p className="text-xs text-rose-400 mt-1.5">{groupNameError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Select Members * (At least 1)
                </label>
                <div className="max-h-64 overflow-y-auto space-y-2 border border-white/10 rounded-lg p-2 bg-primary-bg">
                  {friends.length === 0 ? (
                    <p className="text-center text-white/60 py-4">
                      No friends available
                    </p>
                  ) : (
                    friends.map((friend) => (
                      <label
                        key={friend.id}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                          selectedMembers.includes(friend.id)
                            ? "bg-primary-btn/20 border border-primary-btn/50"
                            : "hover:bg-white/5"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(friend.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMembers([...selectedMembers, friend.id]);
                            } else {
                              setSelectedMembers(
                                selectedMembers.filter((id) => id !== friend.id)
                              );
                            }
                          }}
                          disabled={creatingGroup}
                          className="w-4 h-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <img
                          src={friend.avatar || ""}
                          alt={friend.name || "User"}
                          className="w-8 h-8 rounded-full"
                        />
                        <span>{friend.name || "Unknown"}</span>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-white/50 mt-2">
                  {selectedMembers.length} member{selectedMembers.length !== 1 ? "s" : ""}{" "}
                  selected
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-white/10">
              <button
                onClick={createGroup}
                disabled={
                  !groupName.trim() ||
                  selectedMembers.length === 0 ||
                  creatingGroup ||
                  !!groupNameError
                }
                className="w-full px-4 py-3 rounded-xl bg-primary-btn text-primary-bg hover:bg-[#FF6B00] hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-bold"
              >
                {creatingGroup ? (
                  <>
                    <div className="w-5 h-5 border-2 border-primary-bg border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <MdGroup size={20} />
                    Create Group
                  </>
                )}
              </button>
            </div>
          </div>
                        </div>
                      )}

      {/* Group Settings Modal */}
      {showGroupSettingsModal && selectedChat && (selectedChat.isGroup || selectedChat.isChannel) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-primary-elements rounded-xl sm:rounded-2xl border border-white/10 w-full max-w-md max-h-[90vh] sm:max-h-[80vh] flex flex-col my-auto">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-bold">
                {selectedChat.isChannel ? "Channel" : "Group"} Settings
              </h3>
                          <button
                onClick={() => setShowGroupSettingsModal(false)}
                className="p-2 rounded-lg hover:bg-primary-bg/50 transition-colors"
              >
                <MdClose size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Channel/Group Info */}
              <div className="text-center">
                <img
                  src={getChatAvatar(selectedChat)}
                  alt={getChatDisplayName(selectedChat)}
                  className="w-20 h-20 rounded-full mx-auto mb-3 object-cover"
                />
                <h3 className="text-xl font-bold mb-1">
                  {getChatDisplayName(selectedChat)}
                </h3>
                <p className="text-white/60 text-sm">
                  {selectedChat.participants?.length || 0} members
                </p>
              </div>

              {/* Members List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold flex items-center gap-2">
                    <MdGroup size={18} />
                    Members
                  </h4>
                  {user && 
                   selectedChat && 
                   selectedChat.isGroup && 
                   selectedChat.participants?.some((p) => p.id === user.id || p.isSelf) && (
                    <button
                      onClick={() => {
                        setShowAddMembersModal(true);
                        setSelectedMembersToAdd([]);
                        setAddMembersError(null);
                      }}
                      className="p-1.5 rounded-lg bg-primary-btn/20 text-primary-btn hover:bg-primary-btn hover:text-primary-bg transition-all"
                      title="Add members"
                    >
                      <MdPersonAdd size={18} />
                    </button>
                  )}
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedChat.participants?.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-primary-bg hover:bg-primary-bg/70 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={participant.avatar || ""}
                          alt={participant.name || "User"}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <p className="text-sm font-medium">
                            {participant.name || "Unknown"}
                          </p>
                          {participant.role && participant.role === "admin" && (
                            <p className="text-xs text-secondary-btn flex items-center gap-1">
                              <MdAdminPanelSettings size={12} />
                              Admin
                            </p>
                          )}
                            </div>
                            </div>
                      {user &&
                       selectedChat.participants?.some((p) => p.id === user.id || p.isSelf) &&
                       !participant.isSelf && (
                          <div className="flex gap-1">
                            <button
                              onClick={() =>
                                handleRemoveMember(participant.id)
                              }
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/20 transition-all"
                              title="Remove member"
                            >
                              <MdDelete size={16} />
                          </button>
                            {selectedChat.isChannel && (
                              <>
                                <button
                                  onClick={() => {
                                    alert("Mute feature coming soon!");
                                  }}
                                  className="p-1.5 rounded-lg text-yellow-500 hover:bg-yellow-500/20 transition-all"
                                  title="Mute member"
                                >
                                  <MdVolumeOff size={16} />
                                </button>
                                <button
                                  onClick={() => {
                                    alert("Ban feature coming soon!");
                                  }}
                                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/20 transition-all"
                                  title="Ban member"
                                >
                                  <MdBlock size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                    </div>
                        ))}
                      </div>
              </div>

              {/* Channel-specific actions */}
              {selectedChat.isChannel && 
               user && 
               selectedChat.participants?.some((p) => p.id === user.id || p.isSelf) && (
                <div className="space-y-2">
                  <h4 className="font-bold mb-2">Channel Settings</h4>
                  <button
                    onClick={() => {
                      alert("Password protection feature coming soon!");
                    }}
                    className="w-full p-3 rounded-lg bg-primary-bg hover:bg-primary-bg/70 transition-all flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      {selectedChat.isPasswordProtected ? (
                        <>
                          <MdLock size={18} />
                          Change Password
                        </>
                      ) : (
                        <>
                          <MdLockOpen size={18} />
                          Add Password Protection
                    </>
                  )}
                    </span>
                  </button>
                </div>
              )}

              {/* Leave/Delete actions */}
              <div className="space-y-2 pt-4 border-t border-white/10">
                {selectedChat.isGroup && (
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `Are you sure you want to delete this group? This action cannot be undone.`
                        )
                      ) {
                        handleDeleteGroup();
                      }
                    }}
                    className="w-full p-3 rounded-lg bg-rose-500/20 text-rose-500 hover:bg-rose-500/30 transition-all flex items-center justify-center gap-2 font-medium"
                  >
                    <MdDelete size={18} />
                    Delete Group
                  </button>
                )}
                <button
                  onClick={() => {
                    if (
                      confirm(
                        `Are you sure you want to leave this ${selectedChat.isChannel ? "channel" : "group"}?`
                      )
                    ) {
                      handleLeaveChannel();
                    }
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-[#00B8E6] text-white hover:bg-secondary-btn hover:text-primary-bg transition-all duration-300 flex items-center justify-center gap-2 font-bold hover:scale-[1.02] border-2 border-transparent hover:border-secondary-btn/50"
                >
                  <MdExitToApp size={20} />
                  Leave {selectedChat.isChannel ? "Channel" : "Group"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Members Modal */}
      {showAddMembersModal && selectedChat && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-primary-elements rounded-xl sm:rounded-2xl border border-white/10 w-full max-w-md max-h-[90vh] sm:max-h-[80vh] flex flex-col my-auto">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-bold">Add Members</h3>
              <button
                onClick={() => {
                  setShowAddMembersModal(false);
                  setSelectedMembersToAdd([]);
                  setAddMembersError(null);
                }}
                className="p-2 rounded-lg hover:bg-primary-bg/50 transition-colors"
              >
                <MdClose size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {addMembersError && (
                <div className="p-3 rounded-lg bg-rose-500/20 border border-rose-400/50 text-rose-200 text-sm">
                  {addMembersError}
                </div>
              )}

              <div>
                <p className="text-sm text-white/70 mb-3">
                  Select friends to add to "{getChatDisplayName(selectedChat)}"
                </p>
              </div>

              {availableFriendsToAdd.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-white/60">No friends available to add</p>
                  <p className="text-white/40 text-sm mt-2">
                    All your friends are already members of this group
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Select Friends to Add
                  </label>
                  <div className="max-h-64 overflow-y-auto space-y-2 border border-white/10 rounded-lg p-2 bg-primary-bg">
                    {availableFriendsToAdd.map((friend) => (
                      <label
                        key={friend.id}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                          selectedMembersToAdd.includes(friend.id)
                            ? "bg-primary-btn/20 border border-primary-btn/50"
                            : "hover:bg-white/5"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedMembersToAdd.includes(friend.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMembersToAdd([
                                ...selectedMembersToAdd,
                                friend.id,
                              ]);
                            } else {
                              setSelectedMembersToAdd(
                                selectedMembersToAdd.filter((id) => id !== friend.id)
                              );
                            }
                          }}
                          disabled={addingMembers}
                          className="w-4 h-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <div className="relative shrink-0">
                          {friend.avatar && (
                            <img
                              src={friend.avatar}
                              alt={friend.name || "User"}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          )}
                          {friend.onlineStatus && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-primary-bg"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {friend.name || "Unknown"}
                          </p>
                          {friend.onlineStatus && (
                            <p className="text-xs text-green-400">Online</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-white/50 mt-2">
                    {selectedMembersToAdd.length} friend
                    {selectedMembersToAdd.length !== 1 ? "s" : ""} selected
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/10">
              <button
                onClick={handleAddMembers}
                disabled={
                  selectedMembersToAdd.length === 0 ||
                  addingMembers ||
                  availableFriendsToAdd.length === 0
                }
                className="w-full px-4 py-3 rounded-xl bg-primary-btn text-primary-bg hover:bg-[#FF6B00] hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-bold"
              >
                {addingMembers ? (
                  <>
                    <div className="w-5 h-5 border-2 border-primary-bg border-t-transparent rounded-full animate-spin"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <MdPersonAdd size={20} />
                    Add {selectedMembersToAdd.length > 0 && `${selectedMembersToAdd.length} `}
                    Member{selectedMembersToAdd.length !== 1 ? "s" : ""}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {showUserProfileModal && selectedUserProfile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-primary-elements rounded-xl sm:rounded-2xl border border-white/10 w-full max-w-md my-auto">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-bold">User Profile</h3>
              <button
                onClick={() => {
                  setShowUserProfileModal(false);
                  setSelectedUserProfile(null);
                }}
                className="p-2 rounded-lg hover:bg-primary-bg/50 transition-colors"
              >
                <MdClose size={24} />
              </button>
            </div>

            <div className="p-6 text-center space-y-6">
              <div>
                <img
                  src={selectedUserProfile.avatar || ""}
                  alt={selectedUserProfile.name || "User"}
                  className="w-24 h-24 rounded-full mx-auto mb-3 object-cover"
                />
                <h3 className="text-2xl font-bold">
                  {selectedUserProfile.name || "Unknown"}
                </h3>
                <p className="text-white/60 text-sm mt-1">
                  {selectedUserProfile.email || ""}
                </p>
                {selectedUserProfile.onlineStatus ? (
                  <p className="text-green-400 text-sm mt-2 flex items-center justify-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Online
                  </p>
                ) : (
                  <p className="text-white/50 text-sm mt-2">Offline</p>
                )}
              </div>

              <div className="space-y-2">
                {selectedUserProfile.isBlocked ? (
                  <button
                    onClick={() => handleUnblockUser(selectedUserProfile.id)}
                    className="w-full p-3 rounded-xl bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30 transition-all duration-300 flex items-center justify-center gap-2 font-bold"
                  >
                    <MdBlock size={20} />
                    Unblock User
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `Are you sure you want to block ${selectedUserProfile.name}?`
                        )
                      ) {
                        handleBlockUser(selectedUserProfile.id);
                      }
                    }}
                    className="w-full p-3 rounded-xl bg-rose-500/20 text-rose-500 hover:bg-rose-500/30 transition-all duration-300 flex items-center justify-center gap-2 font-bold"
                  >
                    <MdBlock size={20} />
                    Block User
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
