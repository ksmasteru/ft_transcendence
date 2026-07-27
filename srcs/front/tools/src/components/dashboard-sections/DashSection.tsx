import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdPlayArrow,
  MdTrendingUp,
  MdEmojiEvents,
  MdStar,
  MdHistory,
  MdPeople,
  MdSportsEsports,
  MdSpeed,
  MdWhatshot,
} from "react-icons/md";
import { useDashboardContext } from "../../Pages/Dashboard";
import { API_BASE_URL } from "../../config";

interface MatchHistory {
  id: string;
  opponentName: string;
  opponentId: string;
  playerScore: number;
  opponentScore: number;
  isWinner: boolean;
  createdAt: string;
}

export function DashSection(): JSX.Element {
  const { user, user_data } = useDashboardContext();
  const navigate = useNavigate();
  const [animatedStats, setAnimatedStats] = useState({
    wins: 0,
    xp: 0,
    level: 0,
  });
  const [recentMatches, setRecentMatches] = useState<MatchHistory[]>([]);

  // Fetch match history
  useEffect(() => {
    if (!user?.id) return;

    const fetchMatchHistory = async () => {
      try {
        // Fetch match history from user service
        const response = await fetch(
          `${API_BASE_URL}/api/v1/user/match-history?limit=5`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && Array.isArray(data.data)) {
            setRecentMatches(data.data);
          }
        }
      } catch (error) {
        console.error("Error fetching match history:", error);
      }
    };

    fetchMatchHistory();
  }, [user?.id]);

  // Animate stats on mount
  useEffect(() => {
    if (!user_data) return;

    const duration = 1500;
    const steps = 60;
    const interval = duration / steps;

    const animateValue = (
      start: number,
      end: number,
      callback: (value: number) => void
    ) => {
      let current = start;
      const increment = (end - start) / steps;
      const timer = setInterval(() => {
        current += increment;
        if (
          (increment > 0 && current >= end) ||
          (increment < 0 && current <= end)
        ) {
          current = end;
          clearInterval(timer);
        }
        callback(Math.floor(current));
      }, interval);
    };

    animateValue(0, user_data.level || 1, (val) =>
      setAnimatedStats((prev) => ({ ...prev, level: val }))
    );
    animateValue(0, user_data.xp || 0, (val) =>
      setAnimatedStats((prev) => ({ ...prev, xp: val }))
    );
    animateValue(0, user_data.Games?.length || 0, (val) =>
      setAnimatedStats((prev) => ({ ...prev, wins: val }))
    );
  }, [user_data]);

  // Prepare data for useMemo (must be before early return)
  const achievements = user_data?.achievements || [];
  const recentActivities = user_data?.recentActivities || [];
  const medals = user_data?.medals || { gold: 0, silver: 0, bronze: 0 };

  // Combine matches and activities, sort by date, and limit to 5
  // MUST be called before any conditional returns to maintain hook order
  const combinedActivities = useMemo(() => {
    const activities: Array<{
      id: string;
      type: 'match' | 'activity';
      createdAt: string;
      data: any;
    }> = [];

    // Add matches
    recentMatches.forEach((match) => {
      activities.push({
        id: match.id,
        type: 'match',
        createdAt: match.createdAt,
        data: match,
      });
    });

    // Add activities
    recentActivities.forEach((activity, index) => {
      const act = typeof activity === 'string'
        ? { id: `activity-${index}`, text: activity, type: '', createdAt: new Date().toISOString() }
        : activity;
      activities.push({
        id: 'id' in act && act.id ? act.id : `activity-${index}`,
        type: 'activity',
        createdAt: act.createdAt || new Date().toISOString(),
        data: act,
      });
    });

    // Sort by date (most recent first) and limit to 5
    return activities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [recentMatches, recentActivities]);

  // Early return after all hooks are called
  if (!user) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center w-full text-center">
        <h1 className="text-white text-2xl font-bold">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-bg w-full text-white font-primary relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary-btn/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-secondary-btn/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-primary-btn/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/4 right-1/4 w-48 h-48 bg-secondary-btn/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold font-secondary bg-gradient-to-r from-cyan-400 via-white to-orange-400 bg-clip-text text-transparent mb-2 break-words">
              Welcome back, {user.name}!
            </h1>
            <p className="text-white/70 text-sm sm:text-base md:text-lg lg:text-xl">
              Ready to dominate the table? 🏓
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <button
            onClick={() => navigate("/dashboard/game")}
            className="group relative bg-gradient-to-br from-primary-elements/90 to-primary-elements/70 backdrop-blur-xl p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border-2 border-primary-btn/30 shadow-2xl hover:border-primary-btn/60 transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden"
          >
            <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary-btn/20 via-secondary-btn/20 to-primary-btn/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl"></div>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary-btn to-secondary-btn flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                <MdPlayArrow size={24} className="sm:w-8 sm:h-8 md:w-8 md:h-8 text-primary-bg" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <h3 className="text-base sm:text-lg md:text-xl font-bold font-secondary text-white mb-1 truncate">
                  Quick Match
                </h3>
                <p className="text-xs sm:text-sm text-white/60">Start playing now</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate("/dashboard/profile")}
            className="group relative bg-gradient-to-br from-primary-elements/90 to-primary-elements/70 backdrop-blur-xl p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border-2 border-secondary-btn/30 shadow-2xl hover:border-secondary-btn/60 transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden"
          >
            <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-secondary-btn/20 via-primary-btn/20 to-secondary-btn/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl"></div>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg sm:rounded-xl bg-gradient-to-br from-secondary-btn to-primary-btn flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                <MdTrendingUp size={24} className="sm:w-8 sm:h-8 md:w-8 md:h-8 text-primary-bg" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <h3 className="text-base sm:text-lg md:text-xl font-bold font-secondary text-white mb-1 truncate">
                  View Profile
                </h3>
                <p className="text-xs sm:text-sm text-white/60">Check your stats</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate("/dashboard/messages")}
            className="group relative bg-gradient-to-br from-primary-elements/90 to-primary-elements/70 backdrop-blur-xl p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border-2 border-primary-btn/30 shadow-2xl hover:border-primary-btn/60 transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden"
          >
            <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary-btn/20 via-secondary-btn/20 to-primary-btn/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl"></div>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary-btn to-secondary-btn flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                <MdPeople size={24} className="sm:w-8 sm:h-8 md:w-8 md:h-8 text-primary-bg" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <h3 className="text-base sm:text-lg md:text-xl font-bold font-secondary text-white mb-1 truncate">
                  Messages
                </h3>
                <p className="text-xs sm:text-sm text-white/60">Chat with friends</p>
              </div>
            </div>
          </button>
        </div>

        {/* Activity Section - Moved here for better visibility */}
        <div className="mb-8">
          <div className="relative bg-gradient-to-br from-primary-elements/90 to-primary-elements/70 backdrop-blur-xl p-6 rounded-2xl border-2 border-white/10 shadow-xl overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-btn/10 to-secondary-btn/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-btn to-secondary-btn flex items-center justify-center text-2xl shadow-lg">
                  <MdHistory size={24} className="text-primary-bg" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold font-secondary text-white">
                    Activity
                  </h2>
                  <p className="text-xs text-white/60">Latest updates</p>
                </div>
              </div>

              {/* Combined Activity Section */}
              {combinedActivities.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {combinedActivities.map((item) => {
                    if (item.type === 'match') {
                      const match = item.data as MatchHistory;
                      return (
                        <div
                          key={item.id}
                          className="bg-white/5 rounded-lg p-3 border border-white/10 hover:border-primary-btn/40 transition-all duration-300 hover:bg-white/10"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">🏓</span>
                              <span className="text-white text-sm font-medium">
                                vs {match.opponentName}
                              </span>
                            </div>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                match.isWinner
                                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                  : "bg-red-500/20 text-red-400 border border-red-500/30"
                              }`}
                            >
                              {match.isWinner ? "Won" : "Lost"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-lg font-bold ${
                                  match.isWinner ? "text-green-400" : "text-white/60"
                                }`}
                              >
                                {match.playerScore}
                              </span>
                              <span className="text-white/40">-</span>
                              <span
                                className={`text-lg font-bold ${
                                  !match.isWinner ? "text-red-400" : "text-white/60"
                                }`}
                              >
                                {match.opponentScore}
                              </span>
                            </div>
                            {match.createdAt && (
                              <p className="text-xs text-white/50">
                                {new Date(match.createdAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    } else {
                      const act = item.data;
                      return (
                        <div
                          key={item.id}
                          className="bg-white/5 rounded-lg p-3 border border-white/10 hover:border-primary-btn/40 transition-all duration-300 hover:bg-white/10"
                        >
                          <div className="flex items-start gap-2">
                            <div className="text-lg">
                              {act.type === "ACHIEVEMENT" ? "🏆" : "📝"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm break-words">
                                {act.text}
                              </p>
                              {act.createdAt && (
                                <p className="text-xs text-white/50 mt-1">
                                  {new Date(act.createdAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-white/60 text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {/* Wins Card */}
          <div className="group relative bg-gradient-to-br from-primary-elements/90 to-primary-elements/70 backdrop-blur-xl p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl border-2 border-green-400/30 shadow-xl overflow-hidden hover:border-green-400/60 transition-all duration-300 hover:scale-105 active:scale-95">
            <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <MdEmojiEvents size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-white/60 truncate">Total Wins</p>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-secondary text-white truncate">
                    {animatedStats.wins}
                  </h2>
                </div>
              </div>
            </div>
          </div>

          {/* Level Card */}
          <div className="group relative bg-gradient-to-br from-primary-elements/90 to-primary-elements/70 backdrop-blur-xl p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl border-2 border-amber-400/30 shadow-xl overflow-hidden hover:border-amber-400/60 transition-all duration-300 hover:scale-105 active:scale-95">
            <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <MdStar size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-white/60 truncate">Current Level</p>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-secondary text-white truncate">
                    {animatedStats.level}
                  </h2>
                </div>
              </div>
            </div>
          </div>

          {/* XP Card */}
          <div className="group relative bg-gradient-to-br from-primary-elements/90 to-primary-elements/70 backdrop-blur-xl p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl border-2 border-primary-btn/30 shadow-xl overflow-hidden hover:border-primary-btn/60 transition-all duration-300 hover:scale-105 active:scale-95">
            <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-br from-primary-btn/10 to-secondary-btn/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary-btn to-secondary-btn flex items-center justify-center shadow-lg flex-shrink-0">
                  <MdSpeed size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary-bg" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-white/60 truncate">XP</p>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-secondary text-white truncate">
                    {animatedStats.xp}
                  </h2>
                </div>
              </div>
            </div>
          </div>

          {/* Medals Card */}
          <div className="group relative bg-gradient-to-br from-primary-elements/90 to-primary-elements/70 backdrop-blur-xl p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl border-2 border-amber-400/30 shadow-xl overflow-hidden hover:border-amber-400/60 transition-all duration-300 hover:scale-105 active:scale-95 col-span-2 sm:col-span-1">
            <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <MdWhatshot size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-white/60 truncate">Total Medals</p>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-secondary text-white truncate">
                    {medals.gold + medals.silver + medals.bronze}
                  </h2>
                </div>
              </div>
              <div className="flex gap-1.5 sm:gap-2 text-xs">
                <span className="flex-1 text-center px-1.5 sm:px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs">
                  🥇 {medals.gold}
                </span>
                <span className="flex-1 text-center px-1.5 sm:px-2 py-1 rounded bg-gray-500/20 text-gray-300 border border-gray-400/30 text-xs">
                  🥈 {medals.silver}
                </span>
                <span className="flex-1 text-center px-1.5 sm:px-2 py-1 rounded bg-orange-500/20 text-orange-300 border border-orange-400/30 text-xs">
                  🥉 {medals.bronze}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Achievements Section */}
          <div className="lg:col-span-2">
            <div className="relative bg-gradient-to-br from-primary-elements/90 to-primary-elements/70 backdrop-blur-xl p-6 rounded-2xl border-2 border-white/10 shadow-xl overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-2xl shadow-lg">
                    🏆
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold font-secondary text-white">
                      Recent Achievements
                    </h2>
                    <p className="text-xs text-white/60">Your latest milestones</p>
                  </div>
                </div>

                {achievements.length > 0 ? (
                  <div className="space-y-3">
                    {achievements.slice(0, 5).map((achievement, index) => {
                      const ach = typeof achievement === 'string' 
                        ? { name: achievement, tier: '', description: '' }
                        : achievement;
                      const tier = ach.tier?.toUpperCase() || '';
                      const tierColor = tier === 'GOLD' ? 'from-amber-400 to-yellow-600 border-amber-400/40' 
                        : tier === 'SILVER' ? 'from-gray-300 to-gray-500 border-gray-400/40'
                        : tier === 'BRONZE' ? 'from-orange-400 to-amber-700 border-orange-400/40'
                        : 'from-primary-btn to-secondary-btn border-primary-btn/40';
                      const tierEmoji = tier === 'GOLD' ? '🥇' : tier === 'SILVER' ? '🥈' : tier === 'BRONZE' ? '🥉' : '🏆';
                      
                      return (
                        <div
                          key={'id' in ach && ach.id ? ach.id : `achievement-${index}`}
                          className={`bg-gradient-to-br ${tierColor} backdrop-blur-sm p-4 rounded-xl border-2 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{tierEmoji}</div>
                            <div className="flex-1">
                              <h3 className="font-bold text-white text-sm">
                                {ach.name || "Achievement"}
                              </h3>
                              {ach.description && (
                                <p className="text-xs text-white/70 mt-1">
                                  {ach.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-white/60 mb-2">No achievements yet</p>
                    <p className="text-sm text-white/40">Start playing to unlock achievements!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA Section */}
        <div className="mt-8 relative bg-gradient-to-br from-primary-elements/90 to-primary-elements/70 backdrop-blur-xl p-8 rounded-2xl border-2 border-primary-btn/30 shadow-2xl overflow-hidden group">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-btn/10 via-secondary-btn/10 to-primary-btn/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl"></div>
          
          <div className="relative z-10 text-center">
            <div className="mb-4">
              <MdSportsEsports className="mx-auto text-primary-btn" size={64} />
            </div>
            <h2 className="text-3xl font-bold font-secondary text-white mb-3">
              Ready to Play?
            </h2>
            <p className="text-white/70 mb-6 max-w-2xl mx-auto">
              Challenge players from around the world and climb the leaderboard. Every match counts!
            </p>
            <button
              onClick={() => navigate("/dashboard/game")}
              className="px-8 py-4 rounded-xl bg-gradient-to-br from-primary-btn to-secondary-btn text-primary-bg font-bold text-lg hover:from-primary-btn/90 hover:to-secondary-btn/90 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary-btn/30 flex items-center gap-2 mx-auto"
            >
              <MdPlayArrow size={24} />
              Start Playing Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
