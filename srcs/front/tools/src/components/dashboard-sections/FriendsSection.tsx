import { useState, useEffect, useCallback, useMemo } from "react";
import { SearchBarFriends } from "../searchBarFriends";
import { MdDelete, MdPerson, MdGroup, MdPersonAdd, MdCheckCircle, MdSearch, MdClose, MdBlock } from "react-icons/md";
import { LazyLoadingImage } from "../LazyLoadingImage";
import { useDashboardContext } from "../../Pages/Dashboard";
import { API_BASE_URL } from "../../config";

interface Friend {
  id: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  onlineStatus: boolean;
}

interface BlockedUser {
  requestId: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    avatar: string | null;
  };
  createdAt: string;
}

export function FriendsSection(): JSX.Element {
  const { user } = useDashboardContext();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingFriendId, setDeletingFriendId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    friendId: string | null;
    friendName: string | null;
  }>({ isOpen: false, friendId: null, friendName: null });
  const [loadedAvatars, setLoadedAvatars] = useState<Set<string>>(new Set());
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [showKeyboardHint, setShowKeyboardHint] = useState(true);
  const [blockingFriendId, setBlockingFriendId] = useState<string | null>(null);
  const [blockModal, setBlockModal] = useState<{
    isOpen: boolean;
    friendId: string | null;
    friendName: string | null;
  }>({ isOpen: false, friendId: null, friendName: null });
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [unblockingUserId, setUnblockingUserId] = useState<string | null>(null);
  const [showBlockedSection, setShowBlockedSection] = useState(false);

  const fetchFriends = useCallback(async (abortSignal?: AbortSignal, skipLoadingState: boolean = false) => {
    if (!skipLoadingState) {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/friends`, {
        method: "GET",
        credentials: "include",
        signal: abortSignal,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch friends");
      }

      const data = await response.json();
      if (data.data && !abortSignal?.aborted) {
        // API returns friends in format: { friendshipId, friendSince, user: {...} }
        // Extract the user object from each friendship
        const validatedFriends = data.data
          .filter((f: any) => f && f.user && f.user.id)
          .map((f: any) => ({
            id: f.user.id,
            name: f.user.name || null,
            email: f.user.email || null,
            avatar: f.user.avatar || null,
            onlineStatus: f.user.onlineStatus || false,
          }));
        
        // Only update state if there are actual changes to prevent unnecessary re-renders
        setFriends((prevFriends) => {
          // Compare if anything changed
          if (prevFriends.length !== validatedFriends.length) return validatedFriends;
          
          const hasChanges = prevFriends.some((prevFriend, index) => {
            const newFriend = validatedFriends[index];
            return (
              prevFriend.id !== newFriend.id ||
              prevFriend.onlineStatus !== newFriend.onlineStatus ||
              prevFriend.name !== newFriend.name ||
              prevFriend.avatar !== newFriend.avatar
            );
          });
          
          return hasChanges ? validatedFriends : prevFriends;
        });
      }
    } catch (err: any) {
      if (err.name !== "AbortError" && !abortSignal?.aborted) {
        setError(err.message || "Failed to load friends");
      }
    } finally {
      if (!abortSignal?.aborted && !skipLoadingState) {
        setLoading(false);
      }
    }
  }, []);

  const fetchBlockedUsers = useCallback(async (abortSignal?: AbortSignal) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/friends/block`, {
        method: "GET",
        credentials: "include",
        signal: abortSignal,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch blocked users");
      }

      const data = await response.json();
      if (data.data && data.data.outgoing && !abortSignal?.aborted) {
        // Map outgoing blocked users to our format
        const blocked = data.data.outgoing.map((b: any) => ({
          requestId: b.requestId,
          user: b.to,
          createdAt: b.createdAt,
        }));
        setBlockedUsers(blocked);
      }
    } catch (err: any) {
      if (err.name !== "AbortError" && !abortSignal?.aborted) {
        console.error("Failed to load blocked users:", err);
      }
    }
  }, []);

  const handleDeleteFriend = (friendId: string, friendName: string | null) => {
    setConfirmModal({
      isOpen: true,
      friendId,
      friendName,
    });
  };

  const confirmDeleteFriend = async () => {
    const friendId = confirmModal.friendId;
    if (!friendId) return;

    setConfirmModal({ isOpen: false, friendId: null, friendName: null });
    setDeletingFriendId(friendId);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/friends/${friendId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to remove friend");
      }

      // Remove friend from local state
      setFriends((prev) => prev.filter((friend) => friend.id !== friendId));
    } catch (err: any) {
      setError(err.message || "Failed to remove friend");
    } finally {
      setDeletingFriendId(null);
    }
  };

  const cancelDeleteFriend = () => {
    setConfirmModal({ isOpen: false, friendId: null, friendName: null });
  };

  const handleBlockFriend = (friendId: string, friendName: string | null) => {
    setBlockModal({
      isOpen: true,
      friendId,
      friendName,
    });
  };

  const confirmBlockFriend = async () => {
    const friendId = blockModal.friendId;
    if (!friendId) return;

    setBlockModal({ isOpen: false, friendId: null, friendName: null });
    setBlockingFriendId(friendId);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/friends/block`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: friendId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to block friend");
      }

      // Remove friend from local state after blocking
      setFriends((prev) => prev.filter((friend) => friend.id !== friendId));
      // Refresh blocked users list
      fetchBlockedUsers();
    } catch (err: any) {
      setError(err.message || "Failed to block friend");
    } finally {
      setBlockingFriendId(null);
    }
  };

  const handleUnblockUser = async (userId: string) => {
    setUnblockingUserId(userId);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/friends/block/${userId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to unblock user");
      }

      // Remove user from blocked list
      setBlockedUsers((prev) => prev.filter((blocked) => blocked.user.id !== userId));
    } catch (err: any) {
      setError(err.message || "Failed to unblock user");
    } finally {
      setUnblockingUserId(null);
    }
  };

  const cancelBlockFriend = () => {
    setBlockModal({ isOpen: false, friendId: null, friendName: null });
  };

  const getInitials = (name?: string | null): string => {
    if (!name || name.trim().length === 0) {
      return "?";
    }
    return name.charAt(0).toUpperCase();
  };

  // Memoized stats for performance
  const friendsStats = useMemo(() => {
    return {
      total: friends.length,
      online: friends.filter(f => f.onlineStatus).length,
      offline: friends.filter(f => !f.onlineStatus).length,
    };
  }, [friends]);

  // Separate online and offline friends
  const { onlineFriends, offlineFriends } = useMemo(() => {
    return {
      onlineFriends: friends.filter(f => f.onlineStatus),
      offlineFriends: friends.filter(f => !f.onlineStatus),
    };
  }, [friends]);

  useEffect(() => {
    if (!user) return;

    const controller = new AbortController();
    fetchFriends(controller.signal);
    fetchBlockedUsers(controller.signal);

    // Set up polling to keep friends' online status updated
    const pollingInterval = setInterval(() => {
      if (!controller.signal.aborted) {
        fetchFriends(controller.signal, true); // Skip loading state for polling
      }
    }, 1500); // Poll every 1.5 seconds to match MessagesSection

    return () => {
      controller.abort();
      clearInterval(pollingInterval);
    };
  }, [user, fetchFriends, fetchBlockedUsers]);

  // Keyboard shortcuts for search modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        confirmModal.isOpen ||
        blockModal.isOpen
      ) {
        // Allow Esc to close modal even when in input
        if (e.key === 'Escape' && isSearchModalOpen) {
          e.preventDefault();
          setIsSearchModalOpen(false);
        }
        return;
      }

      // Press 'f' to open search modal
      if (e.key.toLowerCase() === 'f' && !isSearchModalOpen) {
        e.preventDefault();
        setIsSearchModalOpen(true);
        setShowKeyboardHint(false); // Hide hint after first use
      }

      // Press 'Esc' to close search modal
      if (e.key === 'Escape' && isSearchModalOpen) {
        e.preventDefault();
        setIsSearchModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchModalOpen, confirmModal.isOpen, blockModal.isOpen]);

  if (!user) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center w-full text-center">
        <h1 className="text-white text-2xl font-bold animate-pulse">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="bg-primary-bg min-h-screen w-full text-white font-primary overflow-y-auto">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-white to-[#FF6B00] bg-clip-text text-transparent">
            My Friends
          </h2>
          <p className="text-white/70 text-sm sm:text-base">
            Manage your friends list and connect with others
          </p>
        </div>

        {/* Stats Cards */}
        {!loading && friends.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 sm:mb-8">
            {/* Total Friends */}
            <div className="bg-primary-elements p-4 sm:p-6 rounded-xl border border-white/10 hover:border-[#FF6B00]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#FF6B00]/20 group">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-3 rounded-lg bg-[#FF6B00]/10 text-[#FF6B00] group-hover:bg-[#FF6B00]/20 transition-colors">
                  <MdGroup size={24} />
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold">{friendsStats.total}</p>
                  <p className="text-xs sm:text-sm text-white/60">Total Friends</p>
                </div>
              </div>
            </div>

            {/* Online Friends */}
            <div className="bg-primary-elements p-4 sm:p-6 rounded-xl border border-white/10 hover:border-green-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20 group">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-3 rounded-lg bg-green-500/10 text-green-400 group-hover:bg-green-500/20 transition-colors">
                  <MdCheckCircle size={24} />
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-green-400">{friendsStats.online}</p>
                  <p className="text-xs sm:text-sm text-white/60">Online Now</p>
                </div>
              </div>
            </div>

            {/* Offline Friends */}
            <div className="bg-primary-elements p-4 sm:p-6 rounded-xl border border-white/10 hover:border-white/30 transition-all duration-300 hover:shadow-lg hover:shadow-white/10 group">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-3 rounded-lg bg-white/5 text-white/60 group-hover:bg-white/10 transition-colors">
                  <MdPerson size={24} />
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-white/60">{friendsStats.offline}</p>
                  <p className="text-xs sm:text-sm text-white/60">Offline</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-xl border border-rose-400/40 bg-rose-500/10 text-rose-200 flex items-start gap-3">
            <div className="text-rose-400 mt-0.5">⚠️</div>
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* Blocked Users Section */}
        {blockedUsers.length > 0 && (
          <div className="bg-primary-elements rounded-xl border border-white/10 overflow-hidden mb-6 sm:mb-8">
            <button
              onClick={() => setShowBlockedSection(!showBlockedSection)}
              className="w-full p-4 sm:p-6 border-b border-white/10 hover:bg-primary-bg/30 transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                  <MdBlock size={24} />
                </div>
                <div className="text-left">
                  <h3 className="text-xl sm:text-2xl font-bold">Blocked Users</h3>
                  <p className="text-sm text-white/60">
                    {blockedUsers.length} {blockedUsers.length === 1 ? 'user' : 'users'} blocked
                  </p>
                </div>
              </div>
              <div className="text-white/60 group-hover:text-white transition-colors">
                {showBlockedSection ? '▼' : '▶'}
              </div>
            </button>

            {showBlockedSection && (
              <div className="p-4 sm:p-6">
                <div className="space-y-3">
                  {blockedUsers.map((blocked) => (
                    <div
                      key={blocked.user.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-amber-400/20 bg-amber-500/5 hover:border-amber-400/40 transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="relative shrink-0">
                          {blocked.user.avatar ? (
                            <>
                              <LazyLoadingImage
                                dimension={{
                                  width: "w-12 sm:w-14",
                                  height: "h-12 sm:h-14",
                                }}
                                loading={loadedAvatars.has(blocked.user.id)}
                                color="bg-primary-btn/30"
                              >
                                <img
                                  src={blocked.user.avatar}
                                  alt={blocked.user.name || "Blocked user"}
                                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover opacity-50 transition-opacity duration-300 ${loadedAvatars.has(blocked.user.id) ? "opacity-50" : "opacity-0"}`}
                                  loading="lazy"
                                  onLoad={() =>
                                    setLoadedAvatars((prev) =>
                                      new Set(prev).add(blocked.user.id)
                                    )
                                  }
                                />
                              </LazyLoadingImage>
                              {!loadedAvatars.has(blocked.user.id) && (
                                <div className="absolute inset-0 rounded-full bg-gradient-radial from-cyan-400/40 to-blue-900/60 opacity-90 blur-md animate-pulse"></div>
                              )}
                            </>
                          ) : (
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center text-lg font-semibold opacity-50">
                              {getInitials(blocked.user.name)}
                            </div>
                          )}
                          <div className="absolute bottom-0 right-0 w-4 h-4 bg-amber-500 rounded-full border-2 border-primary-elements flex items-center justify-center">
                            <MdBlock size={10} className="text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white/80 truncate">
                            {blocked.user.name || "Unknown User"}
                          </p>
                          <p className="text-sm text-white/50 truncate">
                            {blocked.user.email || "No email"}
                          </p>
                          <p className="text-xs text-amber-400/70 mt-0.5">
                            Blocked {new Date(blocked.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnblockUser(blocked.user.id)}
                        disabled={unblockingUserId === blocked.user.id}
                        className="ml-2 px-4 py-2 rounded-lg border-2 border-green-400/40 bg-green-500/10 text-green-200 hover:bg-green-500/20 hover:border-green-400/60 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-500/50 shrink-0"
                        title="Unblock user"
                      >
                        <MdCheckCircle size={18} />
                        <span className="hidden sm:inline text-sm font-medium">
                          {unblockingUserId === blocked.user.id ? "Unblocking..." : "Unblock"}
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Friends List Section */}
        <div className="bg-primary-elements rounded-xl border border-white/10 overflow-hidden mb-6 sm:mb-8">
          <div className="p-4 sm:p-6 border-b border-white/10">
            <h3 className="text-xl sm:text-2xl font-bold">Friends List</h3>
          </div>

          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-[#FF6B00] mb-4"></div>
                <p className="text-white/60 animate-pulse">Loading friends...</p>
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="inline-block p-6 rounded-full bg-white/5 mb-4">
                  <MdPerson className="text-white/30" size={64} />
                </div>
                <p className="text-white/60 text-lg font-semibold mb-2">No friends yet</p>
                <p className="text-white/40 text-sm mb-6">
                  Start building your network by searching and adding friends
                </p>
                <button
                  onClick={() => {
                    setIsSearchModalOpen(true);
                    setShowKeyboardHint(false);
                  }}
                  className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-secondary-btn to-primary-btn hover:from-primary-btn hover:to-secondary-btn text-white font-semibold border-2 border-white/10 hover:border-white/30 transition-all duration-200 hover:scale-105 active:scale-95 group"
                >
                  <MdPersonAdd size={22} className="group-hover:scale-110 transition-transform" />
                  <span>Search to add friends</span>
                  <div className="flex items-center gap-1 ml-2 px-2 py-1 rounded bg-white/20 border border-white/30">
                    <span className="text-xs font-mono">Press</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-white/30 text-xs font-mono font-bold">
                      F
                    </kbd>
                  </div>
                </button>
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-white/50">
                  <span>💡Quick tip:</span>
                  <span>Press</span>
                  <kbd className="px-2 py-0.5 rounded bg-white/10 border border-white/20 text-white/70 font-mono">
                    F
                  </kbd>
                  <span>anytime to quickly find friends</span>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Online Friends */}
                {onlineFriends.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3 px-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <h4 className="text-sm font-bold text-green-400 uppercase tracking-wide">
                        Online ({onlineFriends.length})
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {onlineFriends.map((friend) => (
                        <div
                          key={friend.id}
                          className="flex items-center justify-between p-4 rounded-xl border border-green-500/20 bg-green-500/5 hover:border-green-500/40 hover:bg-green-500/10 transition-all duration-300 group hover:scale-[1.02] hover:shadow-lg hover:shadow-green-500/20"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="relative shrink-0">
                              {friend.avatar ? (
                                <>
                                  <LazyLoadingImage
                                    dimension={{
                                      width: "w-12 sm:w-14",
                                      height: "h-12 sm:h-14",
                                    }}
                                    loading={loadedAvatars.has(friend.id)}
                                    color="bg-primary-btn/30"
                                  >
                                    <img
                                      src={friend.avatar}
                                      alt={friend.name || "Friend"}
                                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-green-500/30 transition-opacity duration-300 ${loadedAvatars.has(friend.id) ? "opacity-100" : "opacity-0"}`}
                                      loading="lazy"
                                      onLoad={() =>
                                        setLoadedAvatars((prev) =>
                                          new Set(prev).add(friend.id)
                                        )
                                      }
                                      onError={() =>
                                        setLoadedAvatars((prev) =>
                                          new Set(prev).add(friend.id)
                                        )
                                      }
                                    />
                                  </LazyLoadingImage>
                                  {!loadedAvatars.has(friend.id) && (
                                    <div className="absolute inset-0 rounded-full bg-gradient-radial from-cyan-400/40 to-blue-900/60 opacity-90 blur-md shadow-2xl shadow-cyan-500/30 animate-pulse"></div>
                                  )}
                                </>
                              ) : (
                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#FF8C33] flex items-center justify-center text-lg font-semibold border-2 border-green-500/30">
                                  {getInitials(friend.name)}
                                </div>
                              )}
                              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-primary-elements">
                                <div className="w-full h-full bg-green-400 rounded-full animate-ping opacity-75"></div>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white truncate">
                                {friend.name || "Unknown User"}
                              </p>
                              <p className="text-sm text-white/60 truncate">
                                {friend.email || "No email"}
                              </p>
                              <p className="text-xs text-green-400 mt-0.5 flex items-center gap-1 font-medium">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                                Active now
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                            <button
                              onClick={() => handleBlockFriend(friend.id, friend.name)}
                              disabled={blockingFriendId === friend.id}
                              className="px-3 py-2 rounded-lg border border-amber-400/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20 hover:border-amber-400/60 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                              title="Block friend"
                            >
                              <MdBlock size={18} />
                              <span className="hidden lg:inline text-sm">
                                {blockingFriendId === friend.id ? "Blocking..." : "Block"}
                              </span>
                            </button>
                          <button
                            onClick={() => handleDeleteFriend(friend.id, friend.name)}
                            disabled={deletingFriendId === friend.id}
                              className="px-3 py-2 rounded-lg border border-rose-400/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20 hover:border-rose-400/60 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                            title="Remove friend"
                          >
                            <MdDelete size={18} />
                              <span className="hidden lg:inline text-sm">
                              {deletingFriendId === friend.id ? "Removing..." : "Remove"}
                            </span>
                          </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Offline Friends */}
                {offlineFriends.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3 px-2">
                      <div className="w-2 h-2 bg-white/40 rounded-full"></div>
                      <h4 className="text-sm font-bold text-white/60 uppercase tracking-wide">
                        Offline ({offlineFriends.length})
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {offlineFriends.map((friend) => (
                        <div
                          key={friend.id}
                          className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-primary-bg/50 hover:border-[#FF6B00]/50 hover:bg-primary-bg transition-all duration-300 group hover:scale-[1.02] hover:shadow-lg hover:shadow-[#FF6B00]/10"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="relative shrink-0">
                              {friend.avatar ? (
                                <>
                                  <LazyLoadingImage
                                    dimension={{
                                      width: "w-12 sm:w-14",
                                      height: "h-12 sm:h-14",
                                    }}
                                    loading={loadedAvatars.has(friend.id)}
                                    color="bg-primary-btn/30"
                                  >
                                    <img
                                      src={friend.avatar}
                                      alt={friend.name || "Friend"}
                                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover transition-opacity duration-300 ${loadedAvatars.has(friend.id) ? "opacity-80 group-hover:opacity-100" : "opacity-0"}`}
                                      loading="lazy"
                                      onLoad={() =>
                                        setLoadedAvatars((prev) =>
                                          new Set(prev).add(friend.id)
                                        )
                                      }
                                      onError={() =>
                                        setLoadedAvatars((prev) =>
                                          new Set(prev).add(friend.id)
                                        )
                                      }
                                    />
                                  </LazyLoadingImage>
                                  {!loadedAvatars.has(friend.id) && (
                                    <div className="absolute inset-0 rounded-full bg-gradient-radial from-cyan-400/40 to-blue-900/60 opacity-90 blur-md shadow-2xl shadow-cyan-500/30 animate-pulse"></div>
                                  )}
                                </>
                              ) : (
                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center text-lg font-semibold opacity-80 group-hover:opacity-100 transition-opacity">
                                  {getInitials(friend.name)}
                                </div>
                              )}
                              <div className="absolute bottom-0 right-0 w-4 h-4 bg-white/30 rounded-full border-2 border-primary-elements"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white/90 truncate">
                                {friend.name || "Unknown User"}
                              </p>
                              <p className="text-sm text-white/50 truncate">
                                {friend.email || "No email"}
                              </p>
                              <p className="text-xs text-white/40 mt-0.5">
                                Offline
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                            <button
                              onClick={() => handleBlockFriend(friend.id, friend.name)}
                              disabled={blockingFriendId === friend.id}
                              className="px-3 py-2 rounded-lg border border-amber-400/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20 hover:border-amber-400/60 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                              title="Block friend"
                            >
                              <MdBlock size={18} />
                              <span className="hidden lg:inline text-sm">
                                {blockingFriendId === friend.id ? "Blocking..." : "Block"}
                              </span>
                            </button>
                          <button
                            onClick={() => handleDeleteFriend(friend.id, friend.name)}
                            disabled={deletingFriendId === friend.id}
                              className="px-3 py-2 rounded-lg border border-rose-400/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20 hover:border-rose-400/60 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                            title="Remove friend"
                          >
                            <MdDelete size={18} />
                              <span className="hidden lg:inline text-sm">
                              {deletingFriendId === friend.id ? "Removing..." : "Remove"}
                            </span>
                          </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Floating Keyboard Hint */}
      {showKeyboardHint && friends.length > 0 && (
        <div className="fixed bottom-8 right-8 z-40 animate-in slide-in-from-bottom-4 fade-in duration-500">
          <div className="bg-gradient-to-r from-primary-btn to-secondary-btn p-4 rounded-2xl border-2 border-white/20 max-w-sm relative group hover:scale-105 transition-transform">
            <button
              onClick={() => setShowKeyboardHint(false)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-primary-bg font-bold text-sm transition-colors"
            >
              ×
            </button>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white/20 shrink-0">
                <MdSearch size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-sm mb-1">Quick Tip! 💡</p>
                <p className="text-white/90 text-xs mb-2">
                  Press <kbd className="px-2 py-1 rounded bg-white/30 border border-white/40 font-mono font-bold mx-1">F</kbd> anytime to quickly search and add friends
                </p>
                <button
                  onClick={() => setShowKeyboardHint(false)}
                  className="text-white/80 hover:text-white text-xs underline"
                >
                  Got it, don't show again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Modal */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 p-4 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => setIsSearchModalOpen(false)}
          ></div>

          {/* Search Modal Container */}
          <div className="relative w-full max-w-5xl animate-in slide-in-from-top-4 duration-300">
            {/* Modal Card */}
            <div className="bg-primary-elements border-2 border-primary-btn/40 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-primary-btn/10 to-secondary-btn/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary-btn/20 text-primary-btn">
                      <MdPersonAdd size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Find & Add Friends</h3>
                      <p className="text-xs text-white/60">Search for users and connect with friends</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2 text-xs text-white/50">
                      <kbd className="px-2 py-1 rounded bg-white/10 border border-white/20 text-white/80 font-mono">
                        F
                      </kbd>
                      <span>to open</span>
                      <kbd className="px-2 py-1 rounded bg-white/10 border border-white/20 text-white/80 font-mono">
                        ESC
                      </kbd>
                      <span>to close</span>
                    </div>
                    <button
                      onClick={() => setIsSearchModalOpen(false)}
                      className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-all"
                    >
                      <MdClose size={24} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Search Component */}
              <div className="max-h-[70vh] overflow-y-auto">
            <SearchBarFriends currentUserId={user.id} />
          </div>
        </div>
      </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={cancelDeleteFriend}
          ></div>

          {/* Modal */}
          <div className="relative bg-primary-elements border border-white/20 rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-in zoom-in-95 duration-200">
            {/* Warning Icon */}
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-rose-500/20 border-2 border-rose-400/40">
                <MdDelete className="text-rose-400" size={40} />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-center mb-2 text-white">
              Remove Friend?
            </h3>

            {/* Message */}
            <p className="text-center text-white/70 mb-6">
              Are you sure you want to remove{" "}
              <span className="font-semibold text-[#FF6B00]">
                {confirmModal.friendName || "this user"}
              </span>{" "}
              from your friends list? This action cannot be undone.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={cancelDeleteFriend}
                className="flex-1 px-6 py-3 rounded-xl border border-white/20 bg-white/5 text-white font-semibold hover:bg-white/10 hover:border-white/30 transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteFriend}
                className="flex-1 px-6 py-3 rounded-xl border border-rose-400/40 bg-rose-500/20 text-rose-200 font-semibold hover:bg-rose-500/30 hover:border-rose-400/60 transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-rose-500/50 flex items-center justify-center gap-2"
              >
                <MdDelete size={20} />
                Remove Friend
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Confirmation Modal */}
      {blockModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={cancelBlockFriend}
          ></div>

          {/* Modal */}
          <div className="relative bg-primary-elements border border-white/20 rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-in zoom-in-95 duration-200">
            {/* Warning Icon */}
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-amber-500/20 border-2 border-amber-400/40">
                <MdBlock className="text-amber-400" size={40} />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-center mb-2 text-white">
              Block Friend?
            </h3>

            {/* Message */}
            <p className="text-center text-white/70 mb-6">
              Are you sure you want to block{" "}
              <span className="font-semibold text-[#FF6B00]">
                {blockModal.friendName || "this user"}
              </span>
              ? They won't be able to send you messages or friend requests.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={cancelBlockFriend}
                className="flex-1 px-6 py-3 rounded-xl border border-white/20 bg-white/5 text-white font-semibold hover:bg-white/10 hover:border-white/30 transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                Cancel
              </button>
              <button
                onClick={confirmBlockFriend}
                className="flex-1 px-6 py-3 rounded-xl border border-amber-400/40 bg-amber-500/20 text-amber-200 font-semibold hover:bg-amber-500/30 hover:border-amber-400/60 transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-amber-500/50 flex items-center justify-center gap-2"
              >
                <MdBlock size={20} />
                Block Friend
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
