import { Routes, Route } from "react-router-dom";
import { SignUpPage } from "./Pages/SignUp";
import { SignInPage } from "./Pages/SignIn";
import { AuthGuard } from "./components/AuthGuard";
import { Dashboard } from "./Pages/Dashboard";
import { LandingPage } from "./Pages/LandingPage";
import {
  ResetPasswordEmailPage,
  ResetPasswordPage,
} from "./Pages/ResetPassword";
import { NotFoundPage } from "./Pages/NotFound";
import { LoadingPage } from "./Pages/LoadingPage";
import { OAuth2FAPage } from "./Pages/OAuth2FA";
import { ProfileSetupPage } from "./Pages/ProfileSetup";
import { DashSection } from "./components/dashboard-sections/DashSection";
import { ProfileSection } from "./components/dashboard-sections/ProfileSection";
import { SettingsSection } from "./components/dashboard-sections/SettingsSection";
import { GameSection } from "./components/dashboard-sections/GameSection";
import { FriendsSection } from "./components/dashboard-sections/FriendsSection";
import { MessagesSection } from "./components/dashboard-sections/MessagesSection";
import { NotificationsSection } from "./components/dashboard-sections/NotificationsSection";

// Pages
export function Views(): JSX.Element {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <AuthGuard>
            <LandingPage />
          </AuthGuard>
        }
      />
      <Route
        path="/public/"
        element={
          <AuthGuard>
            <LandingPage />
          </AuthGuard>
        }
      />
      <Route
        path="/sign-up/"
        element={
          <AuthGuard>
            <SignUpPage />
          </AuthGuard>
        }
      />
      <Route
        path="/sign-in/"
        element={
          <AuthGuard>
            <SignInPage />
          </AuthGuard>
        }
      />
      <Route
        path="/reset-password-email/"
        element={<ResetPasswordEmailPage />}
      />
      <Route path="/reset-password/:userId/" element={<ResetPasswordPage />} />
      
      {/* Profile Setup for first-time users */}
      <Route path="/profile-setup/" element={<ProfileSetupPage />} />
      
      {/* Dashboard with nested routes */}
      <Route
        path="/dashboard/*"
        element={
          <LoadingPage pageName="Dashboard">
            <Dashboard />
          </LoadingPage>
        }
      >
        {/* Default dashboard route */}
        <Route index element={<DashSection />} />
        <Route path="profile" element={<ProfileSection />} />
        <Route path="settings" element={<SettingsSection />} />
        <Route path="game" element={<GameSection />} />
        <Route path="friends" element={<FriendsSection />} />
        <Route path="messages" element={<MessagesSection />} />
        <Route path="notifications" element={<NotificationsSection />} />
      </Route>

      {/* OAuth 2FA route */}
      <Route path="/oauth-2fa/" element={<OAuth2FAPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
