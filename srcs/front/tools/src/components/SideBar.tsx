import { RxHamburgerMenu } from "react-icons/rx";
import { RiGamepadLine } from "react-icons/ri";
import { LuLayoutDashboard } from "react-icons/lu";
import { CgProfile } from "react-icons/cg";
import { IoSettingsOutline } from "react-icons/io5";
import { LiaUserFriendsSolid } from "react-icons/lia";
import { IoChatbubblesOutline } from "react-icons/io5";
import { TbLogout2 } from "react-icons/tb";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { UserDataInter, UserInter } from "../interfaces/UserInterfaces";
import { LazyLoadingImage } from "./LazyLoadingImage";
import { IoIosNotificationsOutline } from "react-icons/io";
import { API_BASE_URL } from "../config";

export function SideBar({
  active_user,
  user_data,
  hasUnreadNotifications,
  hasUnreadMessages,
}: {
  active_user: UserInter;
  user_data: UserDataInter | null;
  hasUnreadNotifications?: boolean;
  hasUnreadMessages?: boolean;
}): JSX.Element {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading_avatar, setLoadingAvatar] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Get current section from URL path
  const getCurrentSection = () => {
    const path = location.pathname;
    if (path === "/dashboard" || path === "/dashboard/") return "dashboard";
    if (path.includes("/dashboard/profile")) return "profile";
    if (path.includes("/dashboard/settings")) return "settings";
    if (path.includes("/dashboard/game")) return "game";
    if (path.includes("/dashboard/friends")) return "friends";
    if (path.includes("/dashboard/messages")) return "messages";
    if (path.includes("/dashboard/notifications")) return "notifications";
    return "dashboard";
  };

  const section = getCurrentSection();

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/auth/sign-out`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to logout");
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      navigate("/");
    }
  };

  // Close mobile menu when navigating
  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-primary-elements/90 backdrop-blur-sm border border-white/10 text-white hover:bg-primary-elements transition-all duration-300 shadow-lg"
        aria-label="Toggle menu"
      >
        <RxHamburgerMenu className="w-6 h-6" />
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        id="side-bar"
        className={`flex flex-col h-screen fixed md:sticky top-0 border-r-2 border-white/10 bg-gradient-to-b from-primary-bg via-primary-bg to-primary-elements text-center text-white py-4 transition-all duration-300 ease-in-out overflow-hidden z-40 ${
          isSidebarExpanded ? "w-64" : "w-24"
        } ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
      {/* Top Section - Avatar, Name, Hamburger */}
      <div className="flex-shrink-0 space-y-3">
        {/* User Avatar at Top */}
        <div className="flex justify-center">
          <div className="relative">
            <LazyLoadingImage
              dimension={{
                width: "w-14",
                height: "h-14",
              }}
              loading={!loading_avatar}
              color="bg-primary-btn/30"
            >
              <div className="relative inline-block">
                <img
                  src={user_data?.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=pingpong-paddle-1&backgroundColor=FF6B00"}
                  alt="avatar image"
                  className={`w-14 h-14 rounded-full transition-opacity duration-300 border-2 border-primary-btn ring-2 ring-primary-btn/30 ${!loading_avatar ? "opacity-100" : "opacity-0"}`}
                  loading="lazy"
                  onLoad={() => setLoadingAvatar(false)}
                />
                {/* Discord-style status dot at bottom-right */}
                {user_data?.onlineStatus === true && (
                  <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-[3px] border-primary-bg shadow-lg"></span>
                )}
              </div>
              {loading_avatar && (
                <div className="absolute inset-0 rounded-full bg-gradient-radial from-cyan-400/40 to-blue-900/60 opacity-90 blur-md animate-pulse"></div>
              )}
            </LazyLoadingImage>
          </div>
        </div>

        {/* User Name - Only show when expanded */}
        {isSidebarExpanded && (
          <div className="px-4 text-center">
            <p className="font-secondary font-semibold text-sm text-white truncate">
              {active_user?.name}
            </p>
            <p className="text-xs text-white/60 truncate">
              @{user_data?.email?.split("@")[0] || "user"}
            </p>
          </div>
        )}

        {/* Hamburger Menu - Desktop Only */}
        <div className="px-3 hidden md:block">
          <button
            onClick={() => {
              setIsSidebarExpanded(!isSidebarExpanded);
            }}
            className="w-full bg-gradient-to-r from-secondary-btn to-primary-btn hover:from-primary-btn hover:to-secondary-btn text-white px-4 py-2 rounded-xl border-2 border-white/10 transition-all duration-300 flex items-center justify-center hover:scale-105 hover:border-white/30 active:scale-95"
          >
            <RxHamburgerMenu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Middle Section - Navigation (Flexible) */}
      <div className="flex-1 flex flex-col justify-center py-2">
        <div className="flex flex-col space-y-1.5 font-secondary font-medium px-3">
        <div
          id="nav-bar-section"
          className={`flex flex-row items-center transition-all duration-300 rounded-xl cursor-pointer ${
            section === "dashboard" 
              ? "bg-gradient-to-r from-primary-btn to-secondary-btn border-2 border-primary-btn/40" 
              : "border-2 border-transparent hover:border-white/20 hover:bg-primary-elements/50"
          } ${isSidebarExpanded ? "gap-3 px-3 py-2" : "justify-center px-3 py-2"}`}
          onClick={() => handleNavigation("/dashboard")}
        >
          <div className={`flex items-center justify-center transition-all duration-300 ${
            section === "dashboard"
              ? "text-white"
              : "text-white/70 hover:text-white"
          }`}>
            <LuLayoutDashboard className="w-5 h-5" />
          </div>
          {isSidebarExpanded && (
            <span className={`flex-1 text-left transition-all duration-300 ${
              section === "dashboard" ? "text-white font-semibold" : "text-white/70 hover:text-white"
            }`}>
              Dashboard
            </span>
          )}
        </div>
        <div
          id="nav-bar-section"
          className={`flex flex-row items-center transition-all duration-300 rounded-xl cursor-pointer ${
            section === "game" 
              ? "bg-gradient-to-r from-primary-btn to-secondary-btn border-2 border-primary-btn/40" 
              : "border-2 border-transparent hover:border-white/20 hover:bg-primary-elements/50"
          } ${isSidebarExpanded ? "gap-3 px-3 py-2" : "justify-center px-3 py-2"}`}
          onClick={() => handleNavigation("/dashboard/game")}
        >
          <div className={`flex items-center justify-center transition-all duration-300 ${
            section === "game"
              ? "text-white"
              : "text-white/70 hover:text-white"
          }`}>
            <RiGamepadLine className="w-5 h-5" />
          </div>
          {isSidebarExpanded && (
            <span className={`flex-1 text-left transition-all duration-300 ${
              section === "game" ? "text-white font-semibold" : "text-white/70 hover:text-white"
            }`}>
              Game
            </span>
          )}
        </div>
        <div
          id="nav-bar-section"
          className={`flex flex-row items-center transition-all duration-300 rounded-xl cursor-pointer ${
            section === "profile" 
              ? "bg-gradient-to-r from-primary-btn to-secondary-btn border-2 border-primary-btn/40" 
              : "border-2 border-transparent hover:border-white/20 hover:bg-primary-elements/50"
          } ${isSidebarExpanded ? "gap-3 px-3 py-2" : "justify-center px-3 py-2"}`}
          onClick={() => handleNavigation("/dashboard/profile")}
        >
          <div className={`flex items-center justify-center transition-all duration-300 ${
            section === "profile"
              ? "text-white"
              : "text-white/70 hover:text-white"
          }`}>
            <CgProfile className="w-5 h-5" />
          </div>
          {isSidebarExpanded && (
            <span className={`flex-1 text-left transition-all duration-300 ${
              section === "profile" ? "text-white font-semibold" : "text-white/70 hover:text-white"
            }`}>
              Profile
            </span>
          )}
        </div>
        <div
          id="nav-bar-section"
          className={`flex flex-row items-center transition-all duration-300 rounded-xl cursor-pointer ${
            section === "settings" 
              ? "bg-gradient-to-r from-primary-btn to-secondary-btn border-2 border-primary-btn/40" 
              : "border-2 border-transparent hover:border-white/20 hover:bg-primary-elements/50"
          } ${isSidebarExpanded ? "gap-3 px-3 py-2" : "justify-center px-3 py-2"}`}
          onClick={() => handleNavigation("/dashboard/settings")}
        >
          <div className={`flex items-center justify-center transition-all duration-300 ${
            section === "settings"
              ? "text-white"
              : "text-white/70 hover:text-white"
          }`}>
            <IoSettingsOutline className="w-5 h-5" />
          </div>
          {isSidebarExpanded && (
            <span className={`flex-1 text-left transition-all duration-300 ${
              section === "settings" ? "text-white font-semibold" : "text-white/70 hover:text-white"
            }`}>
              Settings
            </span>
          )}
        </div>
        <div
          id="nav-bar-section"
          className={`flex flex-row items-center transition-all duration-300 rounded-xl cursor-pointer ${
            section === "friends" 
              ? "bg-gradient-to-r from-primary-btn to-secondary-btn border-2 border-primary-btn/40" 
              : "border-2 border-transparent hover:border-white/20 hover:bg-primary-elements/50"
          } ${isSidebarExpanded ? "gap-3 px-3 py-2" : "justify-center px-3 py-2"}`}
          onClick={() => handleNavigation("/dashboard/friends")}
        >
          <div className={`flex items-center justify-center transition-all duration-300 ${
            section === "friends"
              ? "text-white"
              : "text-white/70 hover:text-white"
          }`}>
            <LiaUserFriendsSolid className="w-5 h-5" />
          </div>
          {isSidebarExpanded && (
            <span className={`flex-1 text-left transition-all duration-300 ${
              section === "friends" ? "text-white font-semibold" : "text-white/70 hover:text-white"
            }`}>
              Friends
            </span>
          )}
        </div>
        <div
          id="nav-bar-section"
          className={`flex flex-row items-center transition-all duration-300 rounded-xl cursor-pointer ${
            section === "messages" 
              ? "bg-gradient-to-r from-primary-btn to-secondary-btn border-2 border-primary-btn/40" 
              : "border-2 border-transparent hover:border-white/20 hover:bg-primary-elements/50"
          } ${isSidebarExpanded ? "gap-3 px-3 py-2" : "justify-center px-3 py-2"}`}
          onClick={() => handleNavigation("/dashboard/messages")}
        >
          <div className={`relative flex items-center justify-center transition-all duration-300 ${
            section === "messages"
              ? "text-white"
              : "text-white/70 hover:text-white"
          }`}>
            <IoChatbubblesOutline className="w-5 h-5" />
            {hasUnreadMessages && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full border border-primary-bg animate-pulse"></span>
            )}
          </div>
          {isSidebarExpanded && (
            <span className={`flex-1 text-left transition-all duration-300 ${
              section === "messages" ? "text-white font-semibold" : "text-white/70 hover:text-white"
            }`}>
              Messages
            </span>
          )}
        </div>
        <div
          id="nav-bar-section"
          className={`flex flex-row items-center transition-all duration-300 rounded-xl cursor-pointer ${
            section === "notifications" 
              ? "bg-gradient-to-r from-primary-btn to-secondary-btn border-2 border-primary-btn/40" 
              : "border-2 border-transparent hover:border-white/20 hover:bg-primary-elements/50"
          } ${isSidebarExpanded ? "gap-3 px-3 py-2" : "justify-center px-3 py-2"}`}
          onClick={() => handleNavigation("/dashboard/notifications")}
        >
          <div className={`relative flex items-center justify-center transition-all duration-300 ${
            section === "notifications"
              ? "text-white"
              : "text-white/70 hover:text-white"
          }`}>
            <IoIosNotificationsOutline className="w-5 h-5" />
            {hasUnreadNotifications && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-secondary-btn rounded-full border border-primary-bg animate-pulse"></span>
            )}
          </div>
          {isSidebarExpanded && (
            <span className={`flex-1 text-left transition-all duration-300 ${
              section === "notifications" ? "text-white font-semibold" : "text-white/70 hover:text-white"
            }`}>
              Notifications
            </span>
          )}
        </div>
        </div>
      </div>

      {/* Bottom Section - Logout (Fixed) */}
      <div className="flex-shrink-0 px-3 pt-2 border-t border-white/10 mt-2">
        <div
          id="nav-bar-section"
          className={`flex flex-row items-center transition-all duration-300 rounded-xl cursor-pointer border-2 border-transparent hover:border-rose-400/40 hover:bg-rose-500/10 group ${
            isSidebarExpanded ? "gap-3 px-3 py-2" : "justify-center px-3 py-2"
          }`}
          onClick={handleLogout}
        >
          <div className="flex items-center justify-center transition-all duration-300 text-white/70 group-hover:text-rose-300">
            <TbLogout2 className="w-5 h-5" />
          </div>
          {isSidebarExpanded && (
            <span className="flex-1 text-left transition-all duration-300 text-white/70 group-hover:text-rose-300">
              {isLoggingOut ? "Logging out..." : "Logout"}
            </span>
          )}
        </div>
      </div>
      </div>
    </>
  );
}
