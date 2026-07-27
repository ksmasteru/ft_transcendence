import { useEffect, useState } from "react";
import { LazyLoadingImage } from "../LazyLoadingImage";
import { MdOutlineVerified } from "react-icons/md";
import { useDashboardContext } from "../../Pages/Dashboard";
import { UserDataInter, Achievement, RecentActivity } from "../../interfaces/UserInterfaces";

interface ProfileSectionProps {
  user_data?: UserDataInter | null;
}

// Helper function to get tier color
const getTierColor = (tier: string) => {
  switch (tier?.toUpperCase()) {
    case "GOLD":
      return "from-amber-400 to-yellow-600 border-amber-400/40";
    case "SILVER":
      return "from-gray-300 to-gray-500 border-gray-400/40";
    case "BRONZE":
      return "from-orange-400 to-amber-700 border-orange-400/40";
    default:
      return "from-primary-btn to-secondary-btn border-primary-btn/40";
  }
};

// Helper function to get tier emoji
const getTierEmoji = (tier: string) => {
  switch (tier?.toUpperCase()) {
    case "GOLD":
      return "🥇";
    case "SILVER":
      return "🥈";
    case "BRONZE":
      return "🥉";
    default:
      return "🏆";
  }
};

export function ProfileSection({ user_data: propUserData }: ProfileSectionProps = {}): JSX.Element {
  // Try to get context, but don't fail if not in Dashboard
  let contextUserData: UserDataInter | null = null;
  try {
    const context = useDashboardContext();
    contextUserData = context.user_data;
  } catch {
    // Not within Dashboard context, use props only
  }
  const user_data = propUserData ?? contextUserData;
  const [loaded, setLoaded] = useState(false);
  const [xpProgress, setXpProgress] = useState<number>(0);

  // Calculate XP for next level (100 XP per level)
  // Level 1: 0-99 XP, Level 2: 100-199 XP, etc.
  const currentLevel = user_data?.level || 1;
  const currentXP = user_data?.xp || 0;
  const currentLevelXP = currentLevel * 100; // XP needed to reach this level
  const previousLevelXP = (currentLevel - 1) * 100; // XP at start of current level
  const xpForCurrentLevel = Math.max(0, currentXP - previousLevelXP); // XP progress in current level
  const xpNeededForLevel = 100; // Always 100 XP needed for next level
  const nextLevelXP = currentLevelXP; // Total XP needed for next level

  // Parse achievements - handle both old (string[]) and new (Achievement[]) formats
  const achievements: Achievement[] = user_data?.achievements
    ? user_data.achievements.map((ach) => {
        if (typeof ach === "string") {
          return { id: "", name: ach, description: "", tier: "" };
        }
        return ach as Achievement;
      })
    : [];

  // Parse recent activities - handle both formats
  const recentActivities: RecentActivity[] = user_data?.recentActivities
    ? user_data.recentActivities.map((act) => {
        if (typeof act === "string") {
          return { id: "", type: "", text: act, createdAt: "" };
        }
        return act as RecentActivity;
      })
    : [];

  // Calculate game statistics
  const totalWins = user_data?.Games?.length || 0;
  const totalAchievements = user_data?.totalAchievements || achievements.length;

  // Calculate tier-based achievement counts once (avoid redundant filtering)
  const goldAchievements = achievements.filter(a => a.tier?.toUpperCase() === "GOLD");
  const silverAchievements = achievements.filter(a => a.tier?.toUpperCase() === "SILVER");
  const bronzeAchievements = achievements.filter(a => a.tier?.toUpperCase() === "BRONZE");
  const goldCount = goldAchievements.length;
  const silverCount = silverAchievements.length;
  const bronzeCount = bronzeAchievements.length;

  // need user_data to be fetch first so this useEffect can run
  useEffect(() => {
    if (!user_data) return;
    
    const progress = Math.min(100, Math.round((xpForCurrentLevel / xpNeededForLevel) * 100));
    const t = setTimeout(() => setXpProgress(progress), 100);
    return () => clearTimeout(t);
  }, [user_data, xpForCurrentLevel, xpNeededForLevel]);

  if (!user_data) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center w-full text-center">
        <h1 className="text-primary-text text-2xl font-bold animate-pulse">
          Failed to load profile...
        </h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-bg flex flex-col items-center justify-start w-full text-white font-primary px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary-btn/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-secondary-btn/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative w-full max-w-5xl space-y-4 sm:space-y-6">
        {/* Profile Header Card */}
        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 md:gap-8 bg-gradient-to-br from-primary-elements/90 to-primary-elements/70 backdrop-blur-xl p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border-2 border-white/10 shadow-2xl overflow-hidden group">
          {/* Decorative Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-btn/10 to-secondary-btn/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          
          {/* Avatar Section */}
          <div className="relative shrink-0 z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-btn to-secondary-btn rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative">
              <LazyLoadingImage
                dimension={{
                  width: "w-32 sm:w-40 md:w-48",
                  height: "h-32 sm:h-40 md:h-48",
                }}
                loading={loaded}
              >
                <img
                  src={user_data.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=pingpong-paddle-1&backgroundColor=FF6B00"}
                  alt="profile image"
                  className={`w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full transition-all duration-500 border-4 border-primary-btn/50 ring-4 ring-primary-btn/20 shadow-2xl ${loaded ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
                  loading="lazy"
                  onLoad={() => setLoaded(true)}
                />
              </LazyLoadingImage>
              {!loaded && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-btn/40 via-secondary-btn/40 to-primary-btn/40 opacity-90 blur-lg animate-pulse"></div>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="flex flex-col items-center sm:items-start justify-center flex-1 z-10 text-center sm:text-left w-full">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-secondary bg-gradient-to-r from-cyan-400 via-white to-orange-400 bg-clip-text text-transparent break-words w-full">
              {user_data.name}
            </h1>
            
            {user_data.verified && (
              <div className="flex items-center gap-2 mt-2 sm:mt-3 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-gradient-to-r from-primary-btn/20 to-secondary-btn/20 border border-primary-btn/30">
                <MdOutlineVerified className="text-primary-btn" size={18} />
                <span className="text-xs sm:text-sm font-semibold text-white/90">Verified Player</span>
              </div>
            )}
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 mt-3 sm:mt-4 w-full">
              <span className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-primary-btn/40 bg-gradient-to-br from-primary-btn/10 to-primary-btn/5 text-white/80 text-xs sm:text-sm font-medium backdrop-blur-sm transition-all duration-300 hover:scale-105 active:scale-95">
                <span className="text-sm sm:text-base">📅</span>
                <span className="whitespace-nowrap">Joined {user_data.createdAt.substring(0, user_data.createdAt.indexOf("T"))}</span>
              </span>
              <span className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-amber-400/60 bg-gradient-to-br from-amber-500/20 to-amber-500/10 text-amber-300 text-xs sm:text-sm font-bold backdrop-blur-sm transition-all duration-300 hover:scale-105 active:scale-95">
                <span className="text-sm sm:text-base">⚡</span>
                Level {user_data.level ?? 1}
              </span>
              {totalWins > 0 && (
                <span className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-green-400/60 bg-gradient-to-br from-green-500/20 to-green-500/10 text-green-300 text-xs sm:text-sm font-bold backdrop-blur-sm transition-all duration-300 hover:scale-105 active:scale-95">
                  <span className="text-sm sm:text-base">🎮</span>
                  {totalWins} {totalWins === 1 ? "Win" : "Wins"}
                </span>
              )}
            </div>
          </div>
        </div>
        {/* Stats Cards - XP and Achievements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {/* XP Progress Card */}
          <div className="relative bg-gradient-to-br from-primary-elements/90 to-primary-elements/70 backdrop-blur-xl p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border-2 border-white/10 shadow-xl overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-secondary-btn/10 to-primary-btn/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary-btn to-primary-btn flex items-center justify-center text-2xl shadow-lg">
                  ⚡
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold font-secondary text-white">
                    XP Progress
                  </h2>
                  <p className="text-xs text-white/60">Experience Points</p>
                </div>
              </div>
              
              <div className="relative h-3 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-secondary-btn to-primary-btn transition-[width] duration-700 ease-out shadow-lg"
                  style={{ width: `${xpProgress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse"></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-3">
                <span className="text-2xl font-bold text-white">
                  {user_data.xp ?? 0}
                </span>
                <span className="text-sm text-white/50">
                  / <span className="text-primary-btn font-semibold">{nextLevelXP}</span> XP
                </span>
              </div>
              
              <div className="mt-2 text-xs text-white/60">
                {xpForCurrentLevel} / {xpNeededForLevel} XP to Level {(user_data.level ?? 1) + 1}
              </div>
            </div>
          </div>

          {/* Achievements Card */}
          <div className="relative bg-gradient-to-br from-primary-elements/90 to-primary-elements/70 backdrop-blur-xl p-6 rounded-2xl border-2 border-white/10 shadow-xl overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-2xl shadow-lg">
                  🏆
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold font-secondary text-white">
                    Achievements
                  </h2>
                  <p className="text-xs text-white/60">Unlocked Badges</p>
                </div>
              </div>
              
              <div className="relative h-3 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-600 transition-[width] duration-700 ease-out shadow-lg"
                  style={{
                    width: `${totalAchievements > 0 ? Math.min(100, (achievements.length / totalAchievements) * 100) : 0}%`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse"></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-3">
                <span className="text-2xl font-bold text-white">
                  {achievements.length}
                </span>
                <span className="text-sm text-white/50">
                  {totalAchievements > 0 && (
                    <>
                      / <span className="text-amber-400 font-semibold">{totalAchievements}</span> Unlocked
                    </>
                  )}
                </span>
              </div>
              
              <div className="mt-2 text-xs text-white/60">
                {totalAchievements > 0
                  ? `${achievements.length} / ${totalAchievements} Achievements`
                  : "Start playing to unlock achievements!"}
              </div>
            </div>
          </div>
        </div>

        {/* Medals Info Section */}
        <div className="relative bg-gradient-to-br from-primary-elements/90 to-primary-elements/70 backdrop-blur-xl p-6 rounded-2xl border-2 border-white/10 shadow-xl overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-2xl shadow-lg shrink-0">
              💡
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold font-secondary text-white mb-2">
                How Medals Are Earned
              </h2>
              <p className="text-sm text-white/80 leading-relaxed mb-3">
                Medals are automatically awarded when you unlock achievements in the game. Each achievement has a tier (Gold, Silver, or Bronze), and unlocking an achievement of that tier grants you a medal of the same tier.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">🥇 Gold Medals:</span>
                  <span className="text-white/70">Earned by unlocking <strong className="text-amber-300">GOLD tier achievements</strong>. These are the most prestigious achievements, like "Perfect Game" (winning 11-0) or "100 Wins".</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-300 font-bold">🥈 Silver Medals:</span>
                  <span className="text-white/70">Earned by unlocking <strong className="text-gray-200">SILVER tier achievements</strong>. These represent significant milestones, such as "50 Wins".</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-orange-400 font-bold">🥉 Bronze Medals:</span>
                  <span className="text-white/70">Earned by unlocking <strong className="text-orange-300">BRONZE tier achievements</strong>. These are your first steps, like "First Win" or "10 Wins".</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-white/5 rounded-lg border border-primary-btn/20">
                <p className="text-xs text-white/60">
                  <strong className="text-white/80">Tip:</strong> Win games to unlock achievements and earn medals! Each achievement you unlock contributes to your medal count based on its tier.
                </p>
              </div>
            </div>
          </div>
        </div>

          {/* Medals Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Gold Medal Card */}
          <div className="relative bg-gradient-to-br from-primary-elements/90 to-primary-elements/70 backdrop-blur-xl p-6 rounded-2xl border-2 border-amber-400/30 shadow-xl overflow-hidden group transition-all duration-300 hover:scale-[1.02] hover:border-amber-400/50">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-3xl shadow-2xl shadow-amber-500/30 group-hover:scale-110 transition-transform duration-300">
                🥇
              </div>
              <h3 className="text-lg font-bold text-amber-400 mb-1">
                Gold Medals
              </h3>
              <p className="text-3xl font-bold font-secondary text-white">
                {user_data.medals.gold}
              </p>
              <p className="text-xs text-white/50 mt-1 mb-2">From Gold Achievements</p>
              <div className="mt-3 pt-3 border-t border-amber-400/20">
                <p className="text-xs text-white/60 leading-relaxed">
                  Earned by unlocking <strong className="text-amber-300">GOLD tier</strong> achievements like "Perfect Game" or "100 Wins"
                </p>
                {goldCount > 0 && (
                  <p className="text-xs text-amber-300 mt-2 font-semibold">
                    {goldCount} Gold Achievement{goldCount !== 1 ? "s" : ""} Unlocked
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Silver Medal Card */}
          <div className="relative bg-gradient-to-br from-primary-elements/90 to-primary-elements/70 backdrop-blur-xl p-6 rounded-2xl border-2 border-gray-400/30 shadow-xl overflow-hidden group transition-all duration-300 hover:scale-[1.02] hover:border-gray-400/50">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-400/10 to-gray-300/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center text-3xl shadow-2xl shadow-gray-400/30 group-hover:scale-110 transition-transform duration-300">
                🥈
              </div>
              <h3 className="text-lg font-bold text-gray-400 mb-1">
                Silver Medals
              </h3>
              <p className="text-3xl font-bold font-secondary text-white">
                {user_data.medals.silver}
              </p>
              <p className="text-xs text-white/50 mt-1 mb-2">From Silver Achievements</p>
              <div className="mt-3 pt-3 border-t border-gray-400/20">
                <p className="text-xs text-white/60 leading-relaxed">
                  Earned by unlocking <strong className="text-gray-200">SILVER tier</strong> achievements like "50 Wins"
                </p>
                {silverCount > 0 && (
                  <p className="text-xs text-gray-300 mt-2 font-semibold">
                    {silverCount} Silver Achievement{silverCount !== 1 ? "s" : ""} Unlocked
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Bronze Medal Card */}
          <div className="relative bg-gradient-to-br from-primary-elements/90 to-primary-elements/70 backdrop-blur-xl p-6 rounded-2xl border-2 border-orange-400/30 shadow-xl overflow-hidden group transition-all duration-300 hover:scale-[1.02] hover:border-orange-400/50">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-400 to-amber-700 flex items-center justify-center text-3xl shadow-2xl shadow-orange-500/30 group-hover:scale-110 transition-transform duration-300">
                🥉
              </div>
              <h3 className="text-lg font-bold text-orange-400 mb-1">
                Bronze Medals
              </h3>
              <p className="text-3xl font-bold font-secondary text-white">
                {user_data.medals.bronze}
              </p>
              <p className="text-xs text-white/50 mt-1 mb-2">From Bronze Achievements</p>
              <div className="mt-3 pt-3 border-t border-orange-400/20">
                <p className="text-xs text-white/60 leading-relaxed">
                  Earned by unlocking <strong className="text-orange-300">BRONZE tier</strong> achievements like "First Win" or "10 Wins"
                </p>
                {bronzeCount > 0 && (
                  <p className="text-xs text-orange-300 mt-2 font-semibold">
                    {bronzeCount} Bronze Achievement{bronzeCount !== 1 ? "s" : ""} Unlocked
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Game Statistics Section */}
        {totalWins > 0 && (
          <div className="relative bg-gradient-to-br from-primary-elements/90 to-primary-elements/70 backdrop-blur-xl p-6 rounded-2xl border-2 border-white/10 shadow-xl overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-2xl shadow-lg">
                  🎮
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold font-secondary text-white">
                    Game Statistics
                  </h2>
                  <p className="text-xs text-white/60">Your Pong Performance</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <div className="bg-white/5 rounded-xl p-4 border border-green-400/20">
                  <div className="text-3xl font-bold text-green-400">{totalWins}</div>
                  <div className="text-sm text-white/70 mt-1">Total Wins</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-primary-btn/20">
                  <div className="text-3xl font-bold text-primary-btn">{user_data.xp ?? 0}</div>
                  <div className="text-sm text-white/70 mt-1">Total XP</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-amber-400/20">
                  <div className="text-3xl font-bold text-amber-400">{user_data.level ?? 1}</div>
                  <div className="text-sm text-white/70 mt-1">Current Level</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Achievements List Section */}
        {achievements.length > 0 && (
          <div className="relative bg-gradient-to-br from-primary-elements/90 to-primary-elements/70 backdrop-blur-xl p-6 rounded-2xl border-2 border-white/10 shadow-xl overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-2xl shadow-lg">
                🏆
              </div>
              <div>
                <h2 className="text-xl font-bold font-secondary text-white">
                  Unlocked Achievements
                </h2>
                <p className="text-xs text-white/60">Your gaming milestones</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {achievements.map((achievement, index) => {
                const tier = achievement.tier || "";
                const tierColor = getTierColor(tier);
                const tierEmoji = getTierEmoji(tier);
                
                return (
                  <div
                    key={achievement.id || index}
                    className={`relative bg-gradient-to-br ${tierColor} backdrop-blur-sm p-4 rounded-xl border-2 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl overflow-hidden group`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10">
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">{tierEmoji}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white text-sm truncate">
                            {achievement.name || "Achievement"}
                          </h3>
                          {achievement.description && (
                            <p className="text-xs text-white/70 mt-1 line-clamp-2">
                              {achievement.description}
                            </p>
                          )}
                          {achievement.count && achievement.count > 1 && (
                            <div className="mt-2 text-xs text-white/60">
                              Count: {achievement.count}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Activities Section */}
        {recentActivities.length > 0 && (
          <div className="relative bg-gradient-to-br from-primary-elements/90 to-primary-elements/70 backdrop-blur-xl p-6 rounded-2xl border-2 border-white/10 shadow-xl overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-btn to-secondary-btn flex items-center justify-center text-2xl shadow-lg">
                📜
              </div>
              <div>
                <h2 className="text-xl font-bold font-secondary text-white">
                  Recent Activities
                </h2>
                <p className="text-xs text-white/60">Your latest achievements and milestones</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {recentActivities.slice(0, 5).map((activity, index) => (
                <div
                  key={activity.id || index}
                  className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-primary-btn/40 transition-all duration-300 hover:bg-white/10"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-xl">
                      {activity.type === "ACHIEVEMENT" ? "🏆" : "📝"}
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm">{activity.text}</p>
                      {activity.createdAt && (
                        <p className="text-xs text-white/50 mt-1">
                          {new Date(activity.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

