import { AuthLayout } from "../components/AuthLayout";
import { AuthInputForms } from "../components/AuthInputForms";
import Logo from "../assets/ping_pong_logo.png";
import { SecondaryButton } from "../components/Buttons";
import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Utils } from "../Utils";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { API_BASE_URL } from "../config";

export function ResetPasswordEmailPage(): JSX.Element {
  const [is_loading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [btn_msg, setBtnMsg] = useState("Send Reset Link");
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // esc button handle in form to unfocus the input

    setIsLoading(true);
    setBtnMsg("Sending Reset Link...");
    let response = null;
    const form = e.currentTarget;
    const email = form.email.value;

    try {
      response = await fetch(
        `${API_BASE_URL}/api/v1/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email }),
        },
      );
    } catch (e) {
      Utils.LogLevel.ERROR && console.error("ResetPassword network error:", e);
      const errorMessage =
        e && typeof e === "object" && "message" in e
          ? (e as any).message
          : String(e);
      setMsg(`Network error: ${errorMessage}`);
      setBtnMsg("Send Reset Link");
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
        setMsg(res.message);
        setBtnMsg("Please check your email for the reset link");
        break;
      case 400:
      case 500:
      case 404:
        setMsg(`${res.error}`);
        setBtnMsg("Send Reset Link");
        setIsLoading(false);
        break;
      default:
        Utils.LogLevel.ERROR &&
          console.error("Unexpected response status:", response.status, res);
        setMsg(
          `Unexpected error occurred (${response.status}). Please try again.`,
        );
        setBtnMsg("Send Reset Link");
        setIsLoading(false);
    }
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

      <div className="text-center mb-6 flex flex-col justify-between h-full">
        {/* logo */}
        <div className="flex justify-center mb-6">
          <img src={Logo} alt="Logo" className="h-12 sm:h-16 md:h-20 drop-shadow-lg" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight text-white mb-2">
          <span className="text-primary-text">Forgot</span> Password
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-gray-300 mt-2 mb-6">
          No worries! Just enter your email and we'll send you a link to reset
          your password.
        </p>
        <form onSubmit={onSubmit} className="space-y-5 font-secondary">
          <AuthInputForms
            type="email"
            name="email"
            placeholder="Email"
            required
          />
          <SecondaryButton
            func={() => {}}
            props={{
              children: btn_msg,
              type: "submit",
              disabled: is_loading,
              className: `w-full rounded-lg bg-cyan-500 hover:bg-cyan-600 active:bg-primary-btn transition-colors duration-300 text-secondary-text py-3 font-bold shadow-md ${is_loading ? "opacity-50 cursor-not-allowed" : ""}`,
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
        <div className="text-center mt-6">
          <button
            onClick={() => navigate("/sign-in/")}
            className="text-sm sm:text-md text-gray-300 hover:text-white transition-colors duration-200"
          >
            ← Back to{" "}
            <span className="font-semibold text-cyan-300 hover:text-cyan-200 underline transition-colors duration-200">
              Login
            </span>
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}

export function ResetPasswordPage(): JSX.Element {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  // Decode the token in case it was URL encoded
  const resetToken = searchParams.get("token") ? decodeURIComponent(searchParams.get("token") || "") : "";
  const [is_loading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [btn_msg, setBtnMsg] = useState("Set New Password");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [is_reset_success, setIsResetSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  // redirect on reset success
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (is_reset_success) {
      timer = setTimeout(() => {
        navigate("/sign-in/");
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [is_reset_success, navigate]);

  // Password validation rules
  const passwordRules = [
    {
      text: "At least 6 characters",
      validate: (pwd: string) => pwd.length >= 6,
    },
    {
      text: "Contains uppercase letter",
      validate: (pwd: string) => /[A-Z]/.test(pwd),
    },
    {
      text: "Contains lowercase letter",
      validate: (pwd: string) => /[a-z]/.test(pwd),
    },
    {
      text: "Contains a number",
      validate: (pwd: string) => /\d/.test(pwd),
    },
    {
      text: "Passwords match",
      validate: (pwd: string, confirm: string) =>
        pwd === confirm && pwd.length > 0,
    },
  ];

  // Check if all password rules are met
  const isPasswordValid = passwordRules.every((rule) =>
    rule.text === "Passwords match"
      ? rule.validate(password, confirmPassword)
      : rule.validate(password, ""),
  );

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate token and userId are present
    if (!resetToken || !userId) {
      setMsg("Invalid or missing reset token. Please request a new password reset link.");
      return;
    }

    // Validate password before submitting
    if (!isPasswordValid) {
      setMsg("Please ensure all password requirements are met");
      return;
    }

    if (password !== confirmPassword) {
      setMsg("Passwords do not match");
      return;
    }

    const form = e.currentTarget;
    const newPassword = form.password.value;
    let response = null;

    setIsLoading(true);
    setBtnMsg("Setting New Password...");

    try {
      response = await fetch(
        `${API_BASE_URL}/api/v1/auth/reset-password/${userId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ resetToken, newPassword }),
        },
      );
    } catch (e) {
      Utils.LogLevel.ERROR && console.error("ResetPassword network error:", e);
      const errorMessage =
        e && typeof e === "object" && "message" in e
          ? (e as any).message
          : String(e);
      setMsg(`Network error: ${errorMessage}`);
      setBtnMsg("Set New Password");
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
        setMsg(res.message);
        setBtnMsg("Set New Password");
        setIsResetSuccess(true);
        break;
      case 400:
      case 500:
      case 404:
        setMsg(`${res.error}`);
        setBtnMsg("Set New Password");
        setIsLoading(false);
        break;
      default:
        Utils.LogLevel.ERROR &&
          console.error("Unexpected response status:", response.status, res);
        setMsg(
          `Unexpected error occurred (${response.status}). Please try again.`,
        );
        setBtnMsg("Set New Password");
        setIsLoading(false);
    }
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

      <div className="text-center mb-6 flex flex-col justify-between h-full">
        {/* logo */}
        <div className="flex justify-center mb-6">
          <img src={Logo} alt="Logo" className="h-12 sm:h-16 md:h-20 drop-shadow-lg" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight text-white mb-4">
          <span className="text-primary-text">Create</span> New Password
        </h1>
        <form onSubmit={onSubmit} className="space-y-5 font-secondary">
          {/* Password Input */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="New Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-primary-bg py-3 px-4 pr-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-200"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200 focus:outline-none focus:text-cyan-400"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <AiOutlineEyeInvisible className="w-5 h-5" />
              ) : (
                <AiOutlineEye className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Confirm Password Input */}
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirm_password"
              placeholder="Confirm Password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-primary-bg py-3 px-4 pr-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-200"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200 focus:outline-none focus:text-cyan-400"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? (
                <AiOutlineEyeInvisible className="w-5 h-5" />
              ) : (
                <AiOutlineEye className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Password Requirements */}
          <div className="space-y-2 text-left">
            {passwordRules.map((rule, index) => {
              const isValid =
                rule.text === "Passwords match"
                  ? rule.validate(password, confirmPassword)
                  : rule.validate(password, "");

              return (
                <div key={index} className="flex items-center space-x-2">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors duration-200 ${
                      isValid
                        ? "bg-green-500 border-green-500"
                        : "border-gray-500"
                    }`}
                  >
                    {isValid && (
                      <svg
                        className="w-2 h-2 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span
                    className={`text-md transition-colors duration-200 ${
                      isValid ? "text-green-400" : "text-gray-400"
                    }`}
                  >
                    {rule.text}
                  </span>
                </div>
              );
            })}
          </div>

          <SecondaryButton
            func={() => {}}
            props={{
              children: btn_msg,
              type: "submit",
              disabled: is_loading || !isPasswordValid,
              className: `w-full rounded-lg bg-cyan-500 hover:bg-cyan-600 active:bg-primary-btn transition-colors duration-300 text-secondary-text py-3 font-bold shadow-md ${is_loading || !isPasswordValid ? "opacity-50 cursor-not-allowed" : ""}`,
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
      </div>
    </AuthLayout>
  );
}
