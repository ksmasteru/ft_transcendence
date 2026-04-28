import React, { lazy, Suspense, useState, useEffect, useContext, createContext } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Outlet, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';
import { Logo }from './components/shared/Logo';
import DashboardPage from "./pages/DashboardPage";
import NotFound from "./pages/NotFound";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import EmailVerification from "./pages/EmailVerification";
import ResendVerification from "./pages/ResendVerification";
import ForgotPassword from "./pages/ForgotPassword";
import Setup2FA from "./pages/Setup2FA";
import Verify2FA from "./pages/Verify2FA";
import Disable2FA from "./pages/Disable2FA";
import Reset2FA from "./pages/Reset2FA";
import ChangePassword from "./pages/ChangePassword";
import ChatPage from "./pages/chat";
import LeaderboardPage from "./pages/leaderboard";
import FriendsPage from "./pages/FriendesPage";
import Security from "./pages/Security";
import UserProfilePage from "./pages/homePage";
import SearchPage from "./pages/search";
import NotificationsPage from "./pages/notifications";


const animations = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};
const AnimatedPage = ({ children }) => (
  <motion.div variants={animations} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
    {children}
  </motion.div>
);

const LoadingPage = () => (
    <div className="bg-[#1e2124] text-white font-sans h-screen w-screen flex flex-col items-center justify-center">
        < Logo />
        <p className="mt-6 text-lg text-gray-400">Loading...</p>
    </div>
);

const AuthContext = createContext({ user: null, isLoading: true });
export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/v1/auth/checkAuthCookie', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    verifyUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};


const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingPage />;
  if (!user) return <Navigate to="/sign-in" replace />;
  return <Outlet />;
};

const PublicRoute = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingPage />;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
};

const queryClient = new QueryClient();

const AppRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route element={<PublicRoute />}>
            <Route path="/sign-in" element={<AnimatedPage><SignIn /></AnimatedPage>} />
            <Route path="/sign-up" element={<AnimatedPage><SignUp /></AnimatedPage>} />
            <Route path="/verify/:userId/:uniqueString" element={<AnimatedPage><EmailVerification /></AnimatedPage>} />
            <Route path="/resend-verification" element={<AnimatedPage><ResendVerification /></AnimatedPage>} />
            <Route path="/forgot-password" element={<AnimatedPage><ForgotPassword /></AnimatedPage>} />
            <Route path="/verify-2fa" element={<AnimatedPage><Verify2FA /></AnimatedPage>} />
        </Route>
        
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<AnimatedPage><DashboardPage /></AnimatedPage>} />
          <Route path="/profile" element={<AnimatedPage><UserProfilePage /></AnimatedPage>} />
          <Route path="/chat" element={<AnimatedPage><ChatPage /></AnimatedPage>} />
          <Route path="/leaderboard" element={<AnimatedPage><LeaderboardPage /></AnimatedPage>} />
          <Route path="/friends" element={<AnimatedPage><FriendsPage /></AnimatedPage>} />
          <Route path="/security" element={<AnimatedPage><Security /></AnimatedPage>} />
          <Route path="/setup-2fa" element={<AnimatedPage><Setup2FA /></AnimatedPage>} />
          <Route path="/disable-2fa" element={<AnimatedPage><Disable2FA /></AnimatedPage>} />
          <Route path="/reset-2fa" element={<AnimatedPage><Reset2FA /></AnimatedPage>} />
          <Route path="/change-password" element={<AnimatedPage><ChangePassword /></AnimatedPage>} />
          <Route path="/search" element={<AnimatedPage><SearchPage /></AnimatedPage>} />
          <Route path="/notifications" element={<AnimatedPage><NotificationsPage /></AnimatedPage>} />  
        </Route>
        
        <Route path="*" element={<AnimatedPage><NotFound /></AnimatedPage>} />
      </Routes>
    </AnimatePresence>
  );
};


const App = () => {
    const { isLoading } = useAuth();
    if(isLoading) {
        return <LoadingPage />;
    }
    return (
        <BrowserRouter>
            <Suspense fallback={<LoadingPage />}>
                <AppRoutes />
            </Suspense>
        </BrowserRouter>
    );
};

const AppWrapper = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <div className="bg-[#1e2124] text-white font-sans min-h-screen">
          <App />
        </div>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default AppWrapper;




