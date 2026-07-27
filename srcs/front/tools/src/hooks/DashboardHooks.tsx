import { useEffect } from "react";
import { Utils } from "../Utils";
import { AuthResponse } from "../interfaces/AuthResponse";
import { useNavigate as Navigate } from "react-router-dom";
import { UserDataInter } from "../interfaces/UserInterfaces";
import { API_BASE_URL } from "../config";

export function DashboardHooks({
  user,
  setUser,
  user_data,
  setUserData,
}: {
  user: AuthResponse["user"] | null;
  setUser: (user: AuthResponse["user"] | null) => void;
  user_data: UserDataInter | null;
  setUserData: (data: UserDataInter | null) => void;
}): void {
  const navigate = Navigate();

  useEffect(() => {
    // User check
  }, [user]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authResult: AuthResponse = await Utils.checkAuthCookie();

        if (authResult.isAuthenticated && authResult.user) {
          setUser(authResult.user);
        } else {
          // If not authenticated, redirect to home
          navigate("/", { replace: true });
        }
      } catch (error) {
        Utils.LogLevel.ERROR &&
          console.error("Dashboard auth check error:", error);
        navigate("/", { replace: true });
      }
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    let response: any;
    const fetchProfile = async () => {
      try {
        response = await fetch(`${API_BASE_URL}/api/v1/user/me`, {
          method: "GET",
          credentials: "include",
        });
      } catch (error) {
        Utils.LogLevel.DEBUG &&
          console.error("Error fetching profile data:", error);
      }
      const data: any = await response.json();
      user_data = data.data as UserDataInter;
      if (user_data?.error) {
        Utils.LogLevel.DEBUG &&
          console.error("Error fetching profile data:", user_data.error);
      } else {
        setUserData(user_data);
      }
    };

    fetchProfile();
  }, [user]);
}
