import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Utils } from "../Utils";
import { AuthResponse } from "../interfaces/AuthResponse";

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function AuthGuard({
  children,
  redirectTo = "/dashboard",
}: AuthGuardProps): JSX.Element | null {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authResult: AuthResponse = await Utils.checkAuthCookie();

        if (authResult.isAuthenticated) {
          setIsAuthenticated(true);
          // Redirect to dashboard if user is already authenticated
          navigate(redirectTo, { replace: true });
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        Utils.LogLevel.ERROR && console.error("AuthGuard error:", error);
        setIsAuthenticated(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [navigate, redirectTo]);

  // Show loading state while checking authentication
  if (isChecking) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If authenticated, don't render children (user will be redirected)
  if (isAuthenticated) {
    return null;
  }

  // If not authenticated, render the children (auth pages)
  return <>{children}</>;
}
