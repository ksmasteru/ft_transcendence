import { useState, useEffect, useRef } from "react";
import { MdSearch, MdPersonAdd } from "react-icons/md";
import { UserDataInter } from "../interfaces/UserInterfaces";
import { ProfileSection } from "./dashboard-sections/ProfileSection";
import { LazyLoadingImage } from "./LazyLoadingImage";
import { API_BASE_URL } from "../config";

interface SearchedUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  onlineStatus: boolean;
}

export function SearchBarFriends({
  currentUserId,
}: {
  currentUserId: string;
}): JSX.Element {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserDataInter | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedAvatars, setLoadedAvatars] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const delaySearch = setTimeout(async () => {
      if (searchTerm.trim()) {
        setLoading(true);
        setError(null);

        try {
          const response = await fetch(
            `${API_BASE_URL}/api/v1/user/search?name=${encodeURIComponent(searchTerm)}`,
            {
              method: "GET",
              credentials: "include",
            }
          );

          if (!response.ok) {
            throw new Error("Failed to search users");
          }

          const data = await response.json();
          if (data.data) {
            setSearchResults(
              data.data.filter(
                (user: SearchedUser) => user.id !== currentUserId
              )
            );
          }
        } catch (err: any) {
          setError(err.message || "Search failed");
          setSearchResults([]);
        } finally {
          setLoading(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchTerm, currentUserId]);

  const handleViewProfile = async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/user/${userId}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }

      const data = await response.json();
      const user = data.data;

      // The backend now returns full profile data matching UserDataInter format
      // Just ensure all required fields are present with defaults
      const userProfile: UserDataInter = {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || "",
        onlineStatus: user.onlineStatus || false,
        verified: user.verified || false,
        level: user.level || 1,
        xp: user.xp || 0,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        twoFactorEnabled: user.twoFactorEnabled || false,
        achievements: user.achievements || [],
        recentActivities: user.recentActivities || [],
        medals: user.medals || { gold: 0, silver: 0, bronze: 0 },
        totalAchievements: user.totalAchievements || 0,
        Games: user.Games || [],
        bio: user.bio,
      };

      setSelectedUser(userProfile);
    } catch (err: any) {
      setError(err.message || "Failed to load profile");
      setSelectedUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/friends/request`,
        {
          method: "POST",
          credentials: "include",
          body: JSON.stringify({ userId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error + ` for id: (${userId})` ||
            "Failed to send friend request"
        );
      }

      alert("Friend request sent successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to send friend request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full text-white font-primary p-4 sm:p-6">
      <div className="w-full">
        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="relative">
            <MdSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50 text-2xl" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border-2 border-secondary-btn bg-primary-elements pl-14 pr-4 py-4 text-white placeholder:text-white/40 focus:border-secondary-btn focus:outline-none focus:ring-2 focus:ring-secondary-btn/50"
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl border border-rose-400/40 bg-rose-500/10 text-rose-200">
            {error}
          </div>
        )}

        {/* Search Results */}
        {!selectedUser && searchResults.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xl font-semibold mb-4">Search Results</h3>
            {searchResults.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-primary-elements hover:border-primary-btn transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <LazyLoadingImage
                      dimension={{
                        width: "w-12",
                        height: "h-12",
                      }}
                      loading={loadedAvatars.has(user.id)}
                      color="bg-primary-btn/30"
                    >
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className={`w-12 h-12 rounded-full object-cover transition-opacity duration-300 ${loadedAvatars.has(user.id) ? "opacity-100" : "opacity-0"}`}
                        loading="lazy"
                        onLoad={() =>
                          setLoadedAvatars((prev) => new Set(prev).add(user.id))
                        }
                        onError={() =>
                          setLoadedAvatars((prev) => new Set(prev).add(user.id))
                        }
                      />
                    </LazyLoadingImage>
                    {!loadedAvatars.has(user.id) && (
                      <div className="absolute inset-0 rounded-full bg-gradient-radial from-cyan-400/40 to-blue-900/60 opacity-90 blur-md shadow-2xl shadow-cyan-500/30 animate-pulse"></div>
                    )}
                    {user.onlineStatus && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-primary-elements"></div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-white/60">{user.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewProfile(user.id)}
                    className="px-4 py-2 rounded-lg border border-primary-btn bg-primary-btn/10 text-primary-btn hover:bg-primary-btn/20 transition-colors"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={() => handleSendFriendRequest(user.id)}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-secondary-btn text-secondary-text hover:bg-secondary-btn/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <MdPersonAdd size={20} />
                    Add Friend
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selected User Profile */}
        {selectedUser && (
          <div className="space-y-4">
            <button
              onClick={() => setSelectedUser(null)}
              className="mb-4 px-4 py-2 rounded-lg border border-primary-btn/40 bg-primary-btn/10 text-primary-btn hover:bg-primary-btn/20 hover:border-primary-btn/60 transition-all duration-200 flex items-center gap-2 font-semibold"
            >
              ← Back to Search
            </button>
            <div className="bg-primary-bg rounded-2xl overflow-hidden">
              <ProfileSection
                user_data={selectedUser}
              />
            </div>
          </div>
        )}

        {!selectedUser &&
          !loading &&
          searchResults.length === 0 &&
          searchTerm && (
            <div className="text-center py-12">
              <p className="text-white/60">No users found</p>
            </div>
          )}
      </div>
    </div>
  );
}
