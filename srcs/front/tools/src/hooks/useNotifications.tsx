import { useState, useEffect, useCallback } from "react";
import { AuthResponse } from "../interfaces/AuthResponse";
import { API_BASE_URL } from "../config";

export interface FriendRequest {
  requestId: string;
  from: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  createdAt: string;
}

const STORAGE_KEY = "read_notifications";
const POLLING_INTERVAL = 5000; // 5 seconds

export function useNotifications(
  user: AuthResponse["user"] | null,
  currentSection: string
) {
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(
    new Set()
  );

  // Load read notifications from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const ids = JSON.parse(stored) as string[];
        setReadNotificationIds(new Set(ids));
      }
    } catch (error) {
      console.error("Error loading read notifications from storage:", error);
    }
  }, []);

  // Save read notifications to localStorage whenever they change
  useEffect(() => {
    try {
      const idsArray = Array.from(readNotificationIds);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(idsArray));
    } catch (error) {
      console.error("Error saving read notifications to storage:", error);
    }
  }, [readNotificationIds]);

  // Fetch friend requests
  const fetchFriendRequests = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/friends/requests`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch friend requests");
      }

      const data = await response.json();
      if (data.data && data.data.incoming) {
        setFriendRequests(data.data.incoming);
      }
    } catch (err: any) {
      console.error("Error fetching friend requests:", err);
    }
  }, [user]);

  // Initial fetch and periodic polling
  useEffect(() => {
    if (user) {
      fetchFriendRequests();
      // Poll for new notifications
      const interval = setInterval(() => {
        fetchFriendRequests();
      }, POLLING_INTERVAL);

      return () => clearInterval(interval);
    }
    return undefined;
  }, [user, fetchFriendRequests]);

  // Mark notifications as read when user views the notifications section
  useEffect(() => {
    if (currentSection === "notifications" && friendRequests.length > 0) {
      // Mark all current notifications as read after a short delay
      const timer = setTimeout(() => {
        setReadNotificationIds((prev) => {
          const next = new Set(prev);
          friendRequests.forEach((req) => {
            next.add(req.requestId);
          });
          return next;
        });
      }, 500);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [currentSection, friendRequests]);

  // Calculate unread count
  const unreadCount = friendRequests.filter(
    (req) => !readNotificationIds.has(req.requestId)
  ).length;

  // Mark notification as read (for when user accepts/declines)
  const markNotificationAsRead = useCallback((requestId: string) => {
    setReadNotificationIds((prev) => {
      const next = new Set(prev);
      next.add(requestId);
      return next;
    });
  }, []);

  return {
    friendRequests,
    unreadCount,
    hasUnreadNotifications: unreadCount > 0,
    markNotificationAsRead,
    fetchFriendRequests,
  };
}

