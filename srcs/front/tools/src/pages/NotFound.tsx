import React, { useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Home, ArrowLeft, Ghost } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate(); // Use the useNavigate hook for navigation

  useEffect(() => {
    // This effect for logging is great, no changes needed here.
    console.error(
      "404 Error: User attempted to access a non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center shadow-lg transition-all duration-300 hover:shadow-primary/20">
        <CardContent className="p-8">
          {/* A more thematic animation */}
          <div className="relative mb-8 h-24">
            <div className="absolute inset-0 flex items-center justify-center text-8xl font-bold text-primary/10 select-none">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center animate-bounce">
              <Ghost className="h-16 w-16 text-primary" />
            </div>
          </div>

          {/* Updated Error Message */}
          <div className="space-y-4 mb-8">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Lost in the Ether?
            </h1>
            <p className="text-muted-foreground">
              It seems the page you're trying to reach is a ghost in the machine.
            </p>
            <div className="text-sm bg-muted/50 p-3 rounded-lg inline-block">
              <span className="font-medium text-muted-foreground">Path:</span>{" "}
              <code className="text-primary font-mono">{location.pathname}</code>
            </div>
          </div>

          {/* Action Buttons with updated "Go Back" functionality */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="btn-gaming">
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Link>
            </Button>
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>

          {/* Quick Links */}
          <div className="mt-8 pt-6 border-t border-border/50">
            <p className="text-sm text-muted-foreground mb-3">
              Here are some helpful links instead:
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Link
                to="/dashboard"
                className="text-xs bg-muted hover:bg-primary/10 px-3 py-1 rounded-full transition-colors"
              >
                Dashboard
              </Link>
              <Link
                to="/leaderboard"
                className="text-xs bg-muted hover:bg-primary/10 px-3 py-1 rounded-full transition-colors"
              >
                Leaderboard
              </Link>
              <Link
                to="/friends"
                className="text-xs bg-muted hover:bg-primary/10 px-3 py-1 rounded-full transition-colors"
              >
                Friends
              </Link>
              <Link
                to="/chat"
                className="text-xs bg-muted hover:bg-primary/10 px-3 py-1 rounded-full transition-colors"
              >
                Chat
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;