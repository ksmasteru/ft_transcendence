import { useEffect, useState } from "react";
import { Utils } from "../Utils";
import { AuthResponse } from "../interfaces/AuthResponse";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

interface LoadingPageProps {
  children: React.ReactNode;
  pageName: string;
}

export function LoadingPage({
  children,
  pageName,
}: LoadingPageProps): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authResult: AuthResponse = await Utils.checkAuthCookie();

        if (authResult.isAuthenticated && authResult.user) {
          // Check if user came from OAuth flow
          const oauthProvider = sessionStorage.getItem("auth_provider");
          
          if (oauthProvider) {
            // User came from OAuth, check if 2FA is needed
            try {
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
                  // Keep auth_provider in sessionStorage as backup (OAuth2FA will clean it up)
                  navigate(`/oauth-2fa/?provider=${oauthProvider}`, { replace: true });
                  return;
                } else {
                  // No 2FA needed, clean up and proceed
                  sessionStorage.removeItem("auth_provider");
                }
              }
            } catch (error) {
              Utils.LogLevel.ERROR &&
                console.error("Error checking 2FA status:", error);
              // If check fails, proceed to dashboard anyway
              sessionStorage.removeItem("auth_provider");
            }
          }
          
          // remove this in case, add more seconds on loading is needed.
          setIsLoading(false); // prepare loading view for dashboard
        } else {
          navigate("/", { replace: true });
        }
      } catch (error) {
        Utils.LogLevel.ERROR &&
          console.error("LoadingPage auth check error:", error);
        navigate("/", { replace: true });
      }
    };
    checkAuth();
  }, [navigate]);

  // add 2s on loading
  // useEffect(() => {
  //   let timer: NodeJS.Timeout;

  //   if (isLoading) {
  //     timer = setTimeout(() => {
  //       setIsLoading(false);
  //     }, 2000);
  //   }
  //   return () => {
  //     clearTimeout(timer);
  //   };
  // }, [isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="animate-pulse text-gray-400 font-primary text-center text-md sm:text-lg">
            {`Loading ${pageName}...`}
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
