import { AuthLayout } from "../components/AuthLayout";
import Logo from "../assets/ping_pong_logo.png";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PrimaryButton } from "../components/Buttons";
import { useState, useEffect } from "react";
import { Utils } from "../Utils";
import { API_BASE_URL } from "../config";

export function OAuth2FAPage(): JSX.Element {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [provider, setProvider] = useState<string>("OAuth");

  const [isLoading, setIsLoading] = useState(false);
  const [creation_msg, setCreationMsg] = useState("Enter 2FA Code");
  const [msg, setMsg] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [twoFAToken, setTwoFAToken] = useState<string>("");
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    // Get provider from URL param, or fallback to sessionStorage
    const providerParam =
      searchParams.get("provider") ||
      sessionStorage.getItem("auth_provider") ||
      "";
    // Normalize provider name: google -> google, 42intra -> 42intra
    const normalizedProvider =
      providerParam === "42intra"
        ? "42intra"
        : providerParam === "google"
          ? "google"
          : "OAuth";
    setProvider(normalizedProvider);

    // Store provider in sessionStorage if we got it from URL but not in storage
    if (
      providerParam &&
      normalizedProvider !== "OAuth" &&
      !sessionStorage.getItem("auth_provider")
    ) {
      sessionStorage.setItem("auth_provider", providerParam);
    }
  }, [searchParams]);

  useEffect(() => {
    // Check if user is authenticated and get user info
    const checkAuthAnd2FA = async () => {
      try {
        const userResponse = await fetch(
          `${API_BASE_URL}/api/v1/user/me`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }
        );

        if (userResponse.status === 200) {
          const userData = await userResponse.json();
          const is2FAEnabled = userData?.data?.twoFactorEnabled === true;
          const currentUserId = userData?.data?.id;

          if (is2FAEnabled && currentUserId) {
            setUserId(currentUserId);
          } else {
            // User doesn't have 2FA enabled, redirect to dashboard
            navigate("/dashboard/");
          }
        } else {
          // Not authenticated, redirect to sign in
          navigate("/sign-in/");
        }
      } catch (error) {
        Utils.LogLevel.ERROR && console.error("Error checking auth:", error);
        navigate("/sign-in/");
      }
    };

    checkAuthAnd2FA();
  }, [navigate]);

  useEffect(() => {
    if (isVerified) {
      // Clean up sessionStorage after successful verification
      sessionStorage.removeItem("auth_provider");
      const timer = setTimeout(() => {
        navigate("/dashboard/");
      }, 2000);
      return () => clearTimeout(timer);
    }
    return;
  }, [isVerified, navigate]);

  const handle2FAVerification = async () => {
    if (!userId || !twoFAToken || !/^\d{6}$/.test(twoFAToken)) {
      setMsg("Please enter a valid 6-digit 2FA code.");
      return;
    }

    try {
      setIsLoading(true);
      setCreationMsg("Verifying 2FA Code...");

      // Verify the 2FA token
      const verifyResponse = await fetch(
        `${API_BASE_URL}/api/v1/auth/verify-login-2fa`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ userId, token: twoFAToken }),
        }
      );

      const verifyData = await verifyResponse.json();

      if (verifyResponse.status === 200 && verifyData.verified) {
        // 2FA verified successfully
        setMsg("2FA verification successful! Redirecting...");
        setCreationMsg("Redirecting to Dashboard...");
        setIsVerified(true);
        setTwoFAToken("");
      } else {
        setMsg(verifyData.error || "Invalid 2FA code. Please try again.");
        setCreationMsg("Enter 2FA Code");
        setIsLoading(false);
        setTwoFAToken("");
      }
    } catch (error) {
      Utils.LogLevel.ERROR && console.error("2FA verification error:", error);
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? (error as any).message
          : String(error);
      setMsg(`Network error: ${errorMessage}`);
      setCreationMsg("Enter 2FA Code");
      setIsLoading(false);
    }
  };

  const handle2FATokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setTwoFAToken(value);
    setMsg("");
  };

  const handleBackToSignIn = () => {
    // Clean up sessionStorage and sign out, then redirect to sign in
    sessionStorage.removeItem("auth_provider");
    fetch(`${API_BASE_URL}/api/v1/auth/sign-out`, {
      method: "POST",
      credentials: "include",
    }).finally(() => {
      navigate("/sign-in/");
    });
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await handle2FAVerification();
  };

  return (
    <AuthLayout>
      {/* Header */}
      <div className="text-center mb-6">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={Logo} alt="Logo" className="h-12 sm:h-16 md:h-20" />
        </div>
        <h1 className="text-5xl font-extrabold leading-tight text-white">
          2FA <span className="text-primary-text">Verification</span>
        </h1>
        <p className="text-base sm:text-md md:text-lg text-gray-300">
          {provider === "google"
            ? "Complete your Google sign-in with 2FA"
            : provider === "42intra"
              ? "Complete your 42 Intra sign-in with 2FA"
              : "Enter the 6-digit code from your authenticator app"}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5 font-secondary">
        <div className="relative">
          <input
            type="text"
            name="twoFAToken"
            placeholder="000000"
            value={twoFAToken}
            onChange={handle2FATokenChange}
            required
            maxLength={6}
            className="w-full rounded-lg border border-gray-700 bg-primary-bg py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-center text-2xl tracking-widest font-mono"
          />
        </div>
        <button
          type="button"
          onClick={handleBackToSignIn}
          className="w-full text-center text-sm text-gray-300 hover:text-white transition-colors underline"
        >
          Back to sign in
        </button>

        <PrimaryButton
          func={() => {}}
          props={{
            children: creation_msg,
            type: "submit",
            disabled: isLoading || twoFAToken.length !== 6,
            className: `w-full rounded-lg bg-cyan-500 hover:bg-cyan-600 active:bg-primary-btn transition-colors duration-300 text-secondary-text py-3 font-bold shadow-md ${isLoading || twoFAToken.length !== 6 ? "opacity-50 cursor-not-allowed" : ""}`,
          }}
        />

        {msg && (
          <p
            className={`text-center font-fontFamily-secondary ${msg.includes("success") || msg.includes("Redirecting") ? "bg-success/20 text-success" : "bg-error/20 text-error"} rounded-lg p-4`}
          >
            {msg}
          </p>
        )}
      </form>
    </AuthLayout>
  );
}
