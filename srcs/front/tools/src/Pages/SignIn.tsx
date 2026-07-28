import { AuthLayout } from "../components/AuthLayout";
import Logo from "../assets/ping_pong_logo.png";
import { Link, useNavigate } from "react-router-dom";
import { AuthInputForms } from "../components/AuthInputForms";
import { AuthProvidersButtons, PrimaryButton } from "../components/Buttons";
import { useState } from "react";
import { Utils } from "../Utils";
import { useEffect } from "react";
import { API_BASE_URL } from "../config";

export function SignInPage(): JSX.Element {
  let response = null;

  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [creation_msg, setCreationMsg] = useState("Sign In");
  const [msg, setMsg] = useState("");
  const [isSignedIn, setIsSignedIn] = useState(false);
  
  // 2FA states
  const [show2FA, setShow2FA] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [twoFAToken, setTwoFAToken] = useState<string>("");

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSignedIn && !show2FA) {
      timer = setTimeout(async () => {
        // Check if this is a first-time user who just registered
        try {
          const response = await fetch(`${API_BASE_URL}/api/v1/user/me`, {
            method: "GET",
            credentials: "include",
          });

          if (response.ok) {
            const data = await response.json();
            const userData = data.data;
            
            // Check if account was created very recently (within last 5 minutes)
            // This indicates a first-time sign-in right after registration
            const accountCreatedAt = new Date(userData?.createdAt);
            const now = new Date();
            const minutesSinceCreation = (now.getTime() - accountCreatedAt.getTime()) / (1000 * 60);
            
            // Only redirect to profile setup if account was created in last 5 minutes
            // AND profile is incomplete (no avatar or no name)
            if (minutesSinceCreation < 5) {
              const hasValidName = userData?.name && 
                                   typeof userData.name === 'string' && 
                                   userData.name.trim() !== "";
              const hasAvatar = !!userData?.avatar;
              
              // If missing avatar OR valid name, redirect to profile setup
              if (!hasAvatar || !hasValidName) {
                navigate("/profile-setup/");
                return;
              }
            }
          } else {
            Utils.LogLevel.WARN && console.warn("Failed to fetch user profile, status:", response.status);
          }
        } catch (error) {
          Utils.LogLevel.ERROR && console.error("Error checking profile status:", error);
          // On error, still try to navigate to dashboard (fail-open for better UX)
        }
        
        // User is returning user or error occurred, go to dashboard
        navigate("/dashboard/");
      }, 2000);
    }
    return () => clearTimeout(timer);
  }, [isSignedIn, show2FA, navigate]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // If showing 2FA, verify the token instead
    if (show2FA) {
      await handle2FAVerification();
      return;
    }

    const form = e.currentTarget;
    const formEmail = form.email.value;
    const formPassword = form.password.value;

    // Store email and password for later use
    setEmail(formEmail);
    setPassword(formPassword);

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(formPassword)) {
      setMsg(
        "Password must be at least 6 characters long and include uppercase, lowercase letters, and a number.",
      );
      return;
    }

    try {
      setIsLoading(true);
      setCreationMsg("Signing In...");
      
      // First, sign in to get authentication cookie
      response = await fetch(`${API_BASE_URL}/api/v1/auth/sign-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: formEmail, password: formPassword }),
      });
    } catch (e) {
      Utils.LogLevel.ERROR && console.error("SignIn network error:", e);
      const errorMessage =
        e && typeof e === "object" && "message" in e
          ? (e as any).message
          : String(e);
      setMsg(`Network error: ${errorMessage}`);
      setCreationMsg("Sign In");
      setIsLoading(false);
      return;
    }

    const contentType: string | null = response.headers.get("content-type");
    let res: any = {};

    if (contentType && contentType.includes("application/json")) {
      res = await response.json();
    } else {
      Utils.LogLevel.WARN && console.warn("Response is not JSON");
    }

    switch (response.status) {
      case 200:
      case 201:
        // Successfully signed in, now check if 2FA is enabled
        try {
          // Get user info to check 2FA status
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
            const currentUserId = userData?.data?.id;

            if (is2FAEnabled && currentUserId) {
              // User has 2FA enabled, show 2FA input
              setUserId(currentUserId);
              setShow2FA(true);
              setCreationMsg("Enter 2FA Code");
              setIsLoading(false);
              setMsg("");
              // Clear the auth cookie since we need to verify 2FA first
              await fetch(`${API_BASE_URL}/api/v1/auth/sign-out`, {
                method: "POST",
                credentials: "include",
              });
              return;
            }
          }
        } catch (error) {
          Utils.LogLevel.ERROR &&
            console.error("Error checking 2FA status:", error);
          // If we can't check 2FA status, proceed with normal sign-in
        }

        // No 2FA or check failed, proceed with normal sign-in
        setMsg(`${res.message}`);
        setCreationMsg("Redirecting to Dashboard...");
        setIsSignedIn(true);
        break;
      case 401:
      case 404:
      case 500:
        setMsg(`${res.error}`);
        setCreationMsg("Sign In");
        setIsLoading(false);
        break;
      default:
        Utils.LogLevel.ERROR &&
          console.error("Unexpected response status:", response.status, res);
        setMsg(
          `Unexpected error occurred (${response.status}). Please try again.`,
        );
        setCreationMsg("Sign In");
        setIsLoading(false);
    }
  };

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
        },
      );

      const verifyData = await verifyResponse.json();

      if (verifyResponse.status === 200 && verifyData.verified) {
        // 2FA verified, now complete the sign-in
        const signInResponse = await fetch(
          `${API_BASE_URL}/api/v1/auth/sign-in`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email, password }),
          },
        );

        if (signInResponse.status === 200 || signInResponse.status === 201) {
          setMsg("Sign in successful!");
          setCreationMsg("Redirecting to Dashboard...");
          setIsSignedIn(true);
          setShow2FA(false);
          setTwoFAToken("");
        } else {
          const errorData = await signInResponse.json();
          setMsg(errorData.error || "Failed to complete sign-in.");
          setCreationMsg("Sign In");
          setIsLoading(false);
        }
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
    setShow2FA(false);
    setTwoFAToken("");
    setUserId(null);
    setMsg("");
    setCreationMsg("Sign In");
    setIsLoading(false);
  };

  const forgotPassword = () => {
    navigate("/reset-password-email/");
  };

  return (
    <AuthLayout>
      {/* Back to Landing Page */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-200 group"
        >
          <svg
            className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform duration-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span className="text-sm sm:text-base font-medium">Back to Home</span>
        </button>
      </div>

      {/* Header */}
      <div className="text-center mb-4 sm:mb-6">
        {/* Logo */}
        <div className="flex justify-center mb-4 sm:mb-6">
          <img src={Logo} alt="Logo" className="h-10 sm:h-12 md:h-16 lg:h-20 drop-shadow-lg" />
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-white mb-2 px-2">
          {show2FA ? (
            <>
              2FA <span className="text-primary-text">Verification</span>
            </>
          ) : (
            <>
              Welcome <span className="text-primary-text">Back</span>
            </>
          )}
        </h1>
        <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-300 px-2">
          {show2FA
            ? "Enter the 6-digit code from your authenticator app"
            : "Glad to have you back!"}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 sm:space-y-5 font-secondary w-full">
        {!show2FA ? (
          <>
            <AuthInputForms
              type="email"
              name="email"
              placeholder="Email"
              required
            />
            <AuthInputForms
              type="password"
              name="password"
              placeholder="Password"
              required
            />
          </>
        ) : (
          <>
            <div className="relative">
              <input
                type="text"
                name="twoFAToken"
                placeholder="000000"
                value={twoFAToken}
                onChange={handle2FATokenChange}
                required
                maxLength={6}
                className="w-full rounded-lg border border-gray-700 bg-primary-bg py-3 sm:py-4 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-center text-xl sm:text-2xl tracking-widest font-mono min-h-[44px]"
              />
            </div>
            <button
              type="button"
              onClick={handleBackToSignIn}
              className="w-full text-center text-sm text-gray-300 hover:text-white transition-colors underline"
            >
              Back to sign in
            </button>
          </>
        )}

        <PrimaryButton
          func={() => {}}
          props={{
            children: creation_msg,
            type: "submit",
            disabled: isLoading || (show2FA && twoFAToken.length !== 6),
            className: `w-full rounded-lg bg-cyan-500 hover:bg-cyan-600 active:bg-primary-btn transition-colors duration-300 text-secondary-text py-3 font-bold shadow-md ${isLoading || (show2FA && twoFAToken.length !== 6) ? "opacity-50 cursor-not-allowed" : ""}`,
          }}
        />

        {msg && (
          <div
            className={`text-center font-fontFamily-secondary ${msg.includes("success") ? "bg-success/20 text-success border border-success/30" : "bg-error/20 text-error border border-error/30"} rounded-lg p-4 shadow-lg backdrop-blur-sm`}
          >
            <p className="text-sm sm:text-base">{msg}</p>
          </div>
        )}
      </form>
      {!show2FA && (
        <>
          {/* Forgot password */}
          <div className="text-right font-primary mt-2 sm:mt-3">
            <button
              onClick={forgotPassword}
              className="text-xs sm:text-sm md:text-base text-gray-300 hover:text-white transition-colors duration-200 min-h-[44px] px-2"
            >
              Forgot password?{" "}
              <span className="font-semibold text-cyan-300 hover:text-cyan-200 underline transition-colors duration-200">
                Click here
              </span>
            </button>
          </div>

          {/* Sign in with other providers */}
          <div className="text-center mb-3 sm:mb-4 mt-4 sm:mt-6 text-gray-300">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-xs sm:text-sm">
                <span className="px-3 sm:px-4 bg-primary-bg/50 backdrop-blur-sm">Or continue with</span>
              </div>
            </div>
          </div>
          <AuthProvidersButtons />

          <div className="text-center mt-4 sm:mt-6 font-primary text-gray-300 px-2">
            <Link
              to="/sign-up/"
              className="text-xs sm:text-sm md:text-base hover:text-white transition-colors duration-200 inline-block min-h-[44px] flex items-center justify-center"
            >
              Don't have an account yet?{" "}
              <span className="font-semibold text-cyan-300 hover:text-cyan-200 underline transition-colors duration-200">
                Register here
              </span>
            </Link>
          </div>
        </>
      )}
    </AuthLayout>
  );
}
