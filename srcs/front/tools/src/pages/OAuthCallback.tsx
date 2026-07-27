import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Utils } from "../Utils";
import { API_BASE_URL } from "../config";

export function OAuthCallbackPage(): JSX.Element {
  const navigate = useNavigate();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Check if user is authenticated and get user info
        const userResponse = await fetch(
          `${API_BASE_URL}/api/v1/user/me`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          },
        );

        if (userResponse.status === 200) {
          const userData = await userResponse.json();
          const is2FAEnabled = userData?.data?.twoFactorEnabled === true;

          if (is2FAEnabled) {
            // User has 2FA enabled, redirect to 2FA verification
            // Get provider from sessionStorage (set by AuthProvidersButtons)
            const provider = sessionStorage.getItem("auth_provider") || "";
            sessionStorage.removeItem("auth_provider"); // Clean up
            navigate(`/oauth-2fa/?provider=${provider}`);
          } else {
            // User doesn't have 2FA enabled, redirect to dashboard
            sessionStorage.removeItem("auth_provider"); // Clean up
            navigate("/dashboard/");
          }
        } else {
          // Not authenticated, redirect to sign in
          sessionStorage.removeItem("auth_provider"); // Clean up
          navigate("/sign-in/");
        }
      } catch (error) {
        Utils.LogLevel.ERROR && console.error("Error handling OAuth callback:", error);
        sessionStorage.removeItem("auth_provider"); // Clean up
        navigate("/sign-in/");
      }
    };

    handleOAuthCallback();
  }, [navigate]);

  // Show loading state while checking
  return (
    <div className="min-h-screen bg-primary-bg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
        <p className="text-white text-lg">Completing sign-in...</p>
      </div>
    </div>
  );
}

