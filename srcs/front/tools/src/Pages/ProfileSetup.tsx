import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Utils } from "../Utils";
import { API_BASE_URL } from "../config";

// Ping-pong themed avatar options with stylish colors
const AVATAR_OPTIONS = [
  {
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=pingpong-paddle-1&backgroundColor=FF6B00&primaryColor=FFFFFF",
    color: "from-orange-500 to-orange-600",
    name: "Paddle Master"
  },
  {
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=pingpong-champion-2&backgroundColor=00CED1&primaryColor=FFD700",
    color: "from-cyan-500 to-blue-600",
    name: "Table Champion"
  },
  {
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=pingpong-spin-3&backgroundColor=FFD700&primaryColor=FF6B00",
    color: "from-yellow-400 to-amber-500",
    name: "Spin King"
  },
  {
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=pingpong-ace-4&backgroundColor=9370DB&primaryColor=00CED1",
    color: "from-purple-500 to-indigo-600",
    name: "Ace Player"
  },
];

export function ProfileSetupPage(): JSX.Element {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string>(AVATAR_OPTIONS[0].url);
  const [oauthAvatar, setOauthAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const authResult = await Utils.checkAuthCookie();
        
        if (!authResult.isAuthenticated || !authResult.user) {
          // Not authenticated, redirect to sign in
          navigate("/sign-in/", { replace: true });
          return;
        }

        // Pre-fill first name with email prefix if available
        if (authResult.user.email) {
          setFirstName(authResult.user.email.split("@")[0]);
        }

        // Check if user already has a complete profile
        const response = await fetch(`${API_BASE_URL}/api/v1/user/me`, {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          const userData = data.data;
          
          // If user already has avatar and name set, redirect to dashboard
          // This prevents users from accessing this page again after completion
          const hasValidName = userData?.name && 
                               typeof userData.name === 'string' && 
                               userData.name.trim() !== "";
          const hasAvatar = !!userData?.avatar;
          
          if (hasAvatar && hasValidName) {
            navigate("/dashboard", { replace: true });
            return;
          }
          
          // If user has an existing avatar (from OAuth), save it and use as default
          if (userData?.avatar) {
            const isOAuthAvatar = !AVATAR_OPTIONS.some(opt => opt.url === userData.avatar);
            if (isOAuthAvatar) {
              // This is an OAuth provider avatar, save it separately
              setOauthAvatar(userData.avatar);
              setSelectedAvatar(userData.avatar);
            } else {
              // User previously selected one of our avatars
              setSelectedAvatar(userData.avatar);
            }
          }
        }
      } catch (error) {
        Utils.LogLevel.ERROR && console.error("Profile setup check error:", error);
        navigate("/sign-in/", { replace: true });
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    if (!trimmedFirstName) {
      setError("First name is required");
      return;
    }

    if (!trimmedLastName) {
      setError("Last name is required");
      return;
    }

    if (trimmedFirstName.length < 2) {
      setError("First name must be at least 2 characters long");
      return;
    }

    if (trimmedLastName.length < 2) {
      setError("Last name must be at least 2 characters long");
      return;
    }

    if (trimmedFirstName.length > 50) {
      setError("First name must be less than 50 characters");
      return;
    }

    if (trimmedLastName.length > 50) {
      setError("Last name must be less than 50 characters");
      return;
    }

    // Only allow letters, spaces, hyphens, and apostrophes in names
    const namePattern = /^[a-zA-Z\s'-]+$/;
    if (!namePattern.test(trimmedFirstName)) {
      setError("First name can only contain letters, spaces, hyphens, and apostrophes");
      return;
    }

    if (!namePattern.test(trimmedLastName)) {
      setError("Last name can only contain letters, spaces, hyphens, and apostrophes");
      return;
    }

    setLoading(true);

    try {
      // Get current user ID
      const authResult = await Utils.checkAuthCookie();
      if (!authResult.isAuthenticated || !authResult.user) {
        throw new Error("Not authenticated");
      }

      // Combine first and last name
      const fullName = `${trimmedFirstName} ${trimmedLastName}`;

      // Update user profile with avatar and name
      const response = await fetch(
        `${API_BASE_URL}/api/v1/user/${authResult.user.id}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: fullName,
            avatar: selectedAvatar,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || "Failed to update profile");
      }

      // Redirect to dashboard
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      Utils.LogLevel.ERROR && console.error("Profile setup error:", err);
      setError(err.message || "Failed to setup profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-primary-btn mb-4"></div>
          <p className="text-white/60 animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-bg via-primary-bg to-primary-bg/95 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary-btn/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="w-full max-w-3xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary-btn via-cyan-400 to-purple-500 bg-clip-text text-transparent mb-3 font-primary">
            Complete Your Profile
          </h1>
          <p className="text-white/80 text-lg font-secondary">
            Choose your ping-pong avatar and enter your name to start playing!
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-gradient-to-br from-primary-elements to-primary-elements/80 border border-primary-btn/20 rounded-3xl shadow-2xl shadow-primary-btn/10 p-6 sm:p-10 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Avatar Selection */}
            <div>
              <label className="block text-white font-bold mb-6 text-xl font-secondary flex items-center gap-2">
                <span className="text-2xl">🎮</span>
                Choose Your Ping-Pong Avatar
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                {/* OAuth provider avatar if exists */}
                {oauthAvatar && (
                  <button
                    type="button"
                    onClick={() => setSelectedAvatar(oauthAvatar)}
                    className={`relative group transition-all duration-300 ${
                      selectedAvatar === oauthAvatar ? "scale-105" : "hover:scale-105"
                    }`}
                  >
                    <div
                      className={`relative p-5 rounded-2xl border-3 transition-all duration-300 ${
                        selectedAvatar === oauthAvatar
                          ? "border-primary-btn bg-gradient-to-br from-green-500 to-emerald-600 shadow-xl shadow-primary-btn/50"
                          : "border-white/20 bg-gradient-to-br from-primary-bg to-primary-bg/80 hover:border-primary-btn/60 hover:shadow-lg"
                      }`}
                    >
                      <div className="relative">
                        <img
                          src={oauthAvatar}
                          alt="Your provider avatar"
                          className={`w-full h-auto rounded-full transition-all duration-300 ${
                            selectedAvatar === oauthAvatar ? "drop-shadow-2xl ring-2 ring-white/20" : ""
                          }`}
                        />
                        {selectedAvatar === oauthAvatar && (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-t from-primary-btn/20 to-transparent rounded-full"></div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-primary-btn to-secondary-btn rounded-full flex items-center justify-center shadow-lg animate-bounce">
                              <svg
                                className="w-5 h-5 text-white"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="3"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path d="M5 13l4 4L19 7"></path>
                              </svg>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <p
                      className={`text-center mt-2 text-sm font-semibold transition-colors duration-300 ${
                        selectedAvatar === oauthAvatar
                          ? "text-primary-btn"
                          : "text-white/60 group-hover:text-white/80"
                      }`}
                    >
                      Your Photo
                    </p>
                  </button>
                )}
                
                {/* Predefined avatar options */}
                {AVATAR_OPTIONS.map((avatar, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedAvatar(avatar.url)}
                    className={`relative group transition-all duration-300 ${
                      selectedAvatar === avatar.url ? "scale-105" : "hover:scale-105"
                    }`}
                  >
                    <div
                      className={`relative p-5 rounded-2xl border-3 transition-all duration-300 ${
                        selectedAvatar === avatar.url
                          ? `border-primary-btn bg-gradient-to-br ${avatar.color} shadow-xl shadow-primary-btn/50`
                          : "border-white/20 bg-gradient-to-br from-primary-bg to-primary-bg/80 hover:border-primary-btn/60 hover:shadow-lg"
                      }`}
                    >
                      <div className="relative">
                        <img
                          src={avatar.url}
                          alt={avatar.name}
                          className={`w-full h-auto rounded-xl transition-all duration-300 ${
                            selectedAvatar === avatar.url ? "drop-shadow-2xl" : ""
                          }`}
                        />
                        {selectedAvatar === avatar.url && (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-t from-primary-btn/20 to-transparent rounded-xl"></div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-primary-btn to-secondary-btn rounded-full flex items-center justify-center shadow-lg animate-bounce">
                              <svg
                                className="w-5 h-5 text-white"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="3"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path d="M5 13l4 4L19 7"></path>
                              </svg>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <p
                      className={`text-center mt-2 text-sm font-semibold transition-colors duration-300 ${
                        selectedAvatar === avatar.url
                          ? "text-primary-btn"
                          : "text-white/60 group-hover:text-white/80"
                      }`}
                    >
                      {avatar.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Name Inputs */}
            <div>
              <label className="block text-white font-bold mb-4 text-xl font-secondary flex items-center gap-2">
                <span className="text-2xl">👤</span>
                Your Name
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    className="w-full px-5 py-4 rounded-xl border-2 border-white/10 bg-primary-bg/50 text-white placeholder:text-white/40 focus:border-primary-btn focus:bg-primary-bg focus:outline-none focus:ring-2 focus:ring-primary-btn/50 transition-all duration-200 font-medium"
                    required
                    disabled={loading}
                  />
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <span className="text-primary-btn/50">✓</span>
                  </div>
                </div>
                <div className="relative">
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    className="w-full px-5 py-4 rounded-xl border-2 border-white/10 bg-primary-bg/50 text-white placeholder:text-white/40 focus:border-primary-btn focus:bg-primary-bg focus:outline-none focus:ring-2 focus:ring-primary-btn/50 transition-all duration-200 font-medium"
                    required
                    disabled={loading}
                  />
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <span className="text-primary-btn/50">✓</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl border-2 border-rose-400/50 bg-gradient-to-br from-rose-500/20 to-rose-600/10 text-rose-200 flex items-start gap-3 shadow-lg animate-shake">
                <svg
                  className="w-6 h-6 flex-shrink-0 mt-0.5 text-rose-400"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !firstName.trim() || !lastName.trim()}
              className="relative w-full px-8 py-5 rounded-xl bg-gradient-to-r from-primary-btn via-secondary-btn to-primary-btn bg-size-200 bg-pos-0 hover:bg-pos-100 text-white font-bold text-xl transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-primary-btn/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none font-secondary group overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-6 w-6"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Setting up your profile...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Setup</span>
                    <span className="text-2xl group-hover:translate-x-1 transition-transform duration-300">🚀</span>
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </button>
          </form>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-8 space-y-3">
          <p className="text-white/70 text-base font-secondary flex items-center justify-center gap-2">
            <span className="text-lg">⚙️</span>
            You can change your avatar and name later in settings
          </p>
          <div className="flex items-center justify-center gap-4 text-white/40 text-sm">
            <span className="flex items-center gap-1">
              <span className="text-green-400">●</span> Secure
            </span>
            <span className="flex items-center gap-1">
              <span className="text-cyan-400">●</span> Fast Setup
            </span>
            <span className="flex items-center gap-1">
              <span className="text-purple-400">●</span> Customizable
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

