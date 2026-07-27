import { useState, createContext, useContext, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AuthResponse } from "../interfaces/AuthResponse";
import { UserInter } from "../interfaces/UserInterfaces";
import { SideBar } from "../components/SideBar";
import { DashboardHooks } from "../hooks/DashboardHooks";
import { UserDataInter } from "../interfaces/UserInterfaces";
import { useNotifications } from "../hooks/useNotifications";
import { API_BASE_URL } from "../config";

// Create a context to share dashboard data with child routes
interface DashboardContextType {
  user: AuthResponse["user"] | null;
  user_data: UserDataInter | null;
  friendRequests: any[];
  markNotificationAsRead: (requestId: string) => void;
  fetchFriendRequests: () => void;
  refreshUserData: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

// Custom hook to use dashboard context
export function useDashboardContext() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error(
      "useDashboardContext must be used within Dashboard component"
    );
  }
  return context;
}

export function Dashboard(): JSX.Element {
  const [user, setUser] = useState<AuthResponse["user"] | null>(null);
  const [user_data, setUserData] = useState<UserDataInter | null>(null);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const location = useLocation();

  // Get current section from URL path
  const currentPath = location.pathname.split("/").filter(Boolean);
  const section = currentPath[1] || "dashboard";

  DashboardHooks({
    user,
    setUser,
    user_data,
    setUserData,
  });

  // Use the notifications hook
  const {
    friendRequests,
    hasUnreadNotifications,
    markNotificationAsRead,
    fetchFriendRequests,
  } = useNotifications(user, section);

  // Listen for unread messages changes from MessagesSection
  useEffect(() => {
    const handleUnreadMessagesChange = (event: CustomEvent) => {
      setHasUnreadMessages(event.detail.hasUnreadMessages);
    };

    window.addEventListener('unreadMessagesChanged', handleUnreadMessagesChange as EventListener);
    return () => {
      window.removeEventListener('unreadMessagesChanged', handleUnreadMessagesChange as EventListener);
    };
  }, []);

  // Poll for unread messages when not in the messages section
  useEffect(() => {
    if (!user || section === 'messages') return;

    const checkUnreadMessages = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/chats`, {
          credentials: "include",
        });
        if (!res.ok) return;
        const json = await res.json();
        const chats = json.data || [];
        
        // Check if any chat has unread messages
        const hasUnread = chats.some((chat: any) => 
          chat.unreadCount && chat.unreadCount > 0
        );
        
        setHasUnreadMessages(hasUnread);
      } catch (error) {
        // Silently handle error
      }
    };

    // Initial check
    checkUnreadMessages();

    // Poll every 1.5 seconds when not in messages section for faster notification
    const interval = setInterval(checkUnreadMessages, 1500);

    return () => clearInterval(interval);
  }, [user, section]);

  // Function to refresh user data
  const refreshUserData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/user/me`, {
        method: "GET",
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        const updatedUserData = data.data as UserDataInter;
        if (updatedUserData && !updatedUserData.error) {
          setUserData(updatedUserData);
        }
      }
    } catch (error) {
      // Silently handle error
    }
  };

  // Prepare context value
  const contextValue: DashboardContextType = {
    user,
    user_data,
    friendRequests,
    markNotificationAsRead,
    fetchFriendRequests,
    refreshUserData,
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      <div className="flex flex-col md:flex-row text-white h-screen overflow-hidden">
        <SideBar
          active_user={user as UserInter}
          user_data={user_data as UserDataInter}
          hasUnreadNotifications={hasUnreadNotifications}
          hasUnreadMessages={hasUnreadMessages}
        />
        {/* Render child routes - scrollable content area */}
        <div className="flex-1 w-full h-screen pt-16 md:pt-0 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </div>
      </div>
    </DashboardContext.Provider>
  );
}
