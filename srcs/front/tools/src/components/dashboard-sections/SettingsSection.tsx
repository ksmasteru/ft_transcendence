import { useState, useEffect } from "react";
import type { IconType } from "react-icons";
import { MdOutlinePerson } from "react-icons/md";
import { RiShieldKeyholeLine } from "react-icons/ri";
import {
  AiOutlineEye,
  AiOutlineEyeInvisible,
  AiOutlineDownload,
  AiOutlineCopy,
  AiOutlineClose,
  AiOutlineWarning,
} from "react-icons/ai";
import { Utils } from "../../Utils";
import { LazyLoadingImage } from "../LazyLoadingImage";
import { useDashboardContext } from "../../Pages/Dashboard";
import { API_BASE_URL } from "../../config";

// Ping-pong themed avatar options
const AVATAR_OPTIONS = [
  {
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=pingpong-paddle-1&backgroundColor=FF6B00&primaryColor=FFFFFF",
    color: "from-orange-500 to-orange-600",
    name: "Paddle Master",
  },
  {
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=pingpong-champion-2&backgroundColor=00CED1&primaryColor=FFD700",
    color: "from-cyan-500 to-blue-600",
    name: "Table Champion",
  },
  {
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=pingpong-spin-3&backgroundColor=FFD700&primaryColor=FF6B00",
    color: "from-yellow-400 to-amber-500",
    name: "Spin King",
  },
  {
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=pingpong-ace-4&backgroundColor=9370DB&primaryColor=00CED1",
    color: "from-purple-500 to-indigo-600",
    name: "Ace Player",
  },
];

const TABS = [
  {
    id: "profile",
    label: "Profile Studio",
    eyebrow: "Identity",
    heading: "Profile Studio",
    description:
      "Craft how the community sees you and keep your credentials up to date.",
    icon: MdOutlinePerson as IconType,
  },
  {
    id: "2fa",
    label: "Security Vault",
    eyebrow: "Security",
    heading: "Security Vault",
    description:
      "Add an extra layer of protection with two-factor authentication and backup codes.",
    icon: RiShieldKeyholeLine as IconType,
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

// Modal Component
function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-md rounded-2xl border-2 border-primary-btn/30 bg-gradient-to-br from-primary-elements to-primary-bg p-6 shadow-2xl shadow-primary-btn/20 ring-1 ring-white/10 animate-in zoom-in-95 duration-300">
        {/* Decorative glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary-btn/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-secondary-btn/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-secondary text-2xl font-bold bg-gradient-to-r from-primary-btn to-secondary-btn bg-clip-text text-transparent">
            {title}
          </h3>
          <button
            onClick={onClose}
              className="flex items-center justify-center w-9 h-9 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all duration-300 hover:scale-110 active:scale-95"
          >
            <AiOutlineClose size={20} />
          </button>
        </div>
        {children}
        </div>
      </div>
    </div>
  );
}

export function SettingsSection(): JSX.Element {
  const { user, user_data } = useDashboardContext();
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [currentStep, setCurrentStep] = useState(1); // Step wizard state

  // Profile update state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string>(AVATAR_OPTIONS[0].url);
  const [oauthAvatar, setOauthAvatar] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(
    user_data?.twoFactorEnabled || false
  );
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrCodeLoaded, setQrCodeLoaded] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationToken, setVerificationToken] = useState("");
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorMessage, setTwoFactorMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [disableToken, setDisableToken] = useState("");
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [showBackupCodesModal, setShowBackupCodesModal] = useState(false);

  const primaryActionClasses =
    "inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary-btn to-secondary-btn px-6 py-3 font-semibold text-white font-secondary border-2 border-primary-btn/40 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary-btn/30 active:scale-95 disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none";
  const secondaryActionClasses =
    "inline-flex items-center justify-center rounded-xl border-2 border-white/20 bg-primary-elements/50 backdrop-blur-sm px-5 py-2.5 font-medium text-white transition-all duration-300 hover:border-primary-btn/50 hover:bg-primary-btn/10 hover:scale-[1.02] active:scale-95";
  const subtleCardClasses =
    "rounded-2xl border-2 border-white/10 bg-gradient-to-br from-primary-elements/80 to-primary-elements/50 backdrop-blur-sm p-6 relative overflow-hidden transition-all duration-300 hover:border-primary-btn/30 hover:shadow-xl hover:shadow-primary-btn/5";

  const totalSteps = 3;
  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));
  const goToStep = (step: number) => setCurrentStep(step);

  useEffect(() => {
    if (user_data) {
      // Split name into firstName and lastName
      const nameParts = (user_data.name || "").split(" ");
      const first = nameParts[0] || "";
      const last = nameParts.slice(1).join(" ") || "";

      setFirstName(first);
      setLastName(last);
      setTwoFactorEnabled(user_data.twoFactorEnabled || false);
      
      // Set current avatar
      if (user_data.avatar) {
        setSelectedAvatar(user_data.avatar);
        
        // Check if it's an OAuth avatar (not in our predefined list)
        const isOAuthAvatar = !AVATAR_OPTIONS.some(opt => opt.url === user_data.avatar);
        if (isOAuthAvatar) {
          setOauthAvatar(user_data.avatar);
        }
      }
    }
  }, [user_data]);

  // Keyboard navigation for steps
  useEffect(() => {
    if (activeTab !== "profile") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "ArrowRight" && currentStep < totalSteps) {
        setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
      } else if (e.key === "ArrowLeft" && currentStep > 1) {
        setCurrentStep((prev) => Math.max(prev - 1, 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, currentStep, totalSteps]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user_data || !user) return;

    // Validate inputs before making API calls
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    // Check if at least one name field has content
    if (!trimmedFirstName && !trimmedLastName) {
      setProfileMessage({
        type: "error",
        text: "Please provide at least a first name or last name",
      });
      return;
    }

    // Validate password if provided
    const trimmedPassword = newPassword.trim();
    if (trimmedPassword && trimmedPassword.length < 6) {
      setProfileMessage({
        type: "error",
        text: "Password must be at least 6 characters long",
      });
      return;
    }

    // Check if name would be empty after combining
    const newName = `${trimmedFirstName} ${trimmedLastName}`.trim();
    if (!newName) {
      setProfileMessage({
        type: "error",
        text: "Name cannot be empty",
      });
      return;
    }

    setProfileLoading(true);
    setProfileMessage(null);

    try {
      // Prepare update payload - send name, avatar, and password
      const payload: any = {
        name: newName,
        avatar: selectedAvatar,
      };

      // Add password to payload if provided (already trimmed in validation)
      if (trimmedPassword) {
        payload.password = trimmedPassword;
      }

      // Update profile using the existing API endpoint
      const updateResponse = await fetch(
        `${API_BASE_URL}/api/v1/user/${user.id}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!updateResponse.ok) {
        let errorMessage = "Failed to update profile";
        try {
          const errorData = await updateResponse.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          // If response is not JSON, use status text
          errorMessage = updateResponse.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      await updateResponse.json();

      // Clear password field on success
      setNewPassword("");
      setShowPassword(false);

      setProfileMessage({
        type: "success",
        text: "Profile updated successfully!",
      });

      // Refresh user data after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      Utils.LogLevel.ERROR && console.error("Profile update error:", error);
      setProfileMessage({
        type: "error",
        text: error.message || "Failed to update profile. Please try again.",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSetup2FA = async () => {
    if (!user) return;
    setTwoFactorLoading(true);
    setTwoFactorMessage(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/auth/enable-2fa`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to setup 2FA");
      }

      const data = await response.json();
      setQrCode(data.qrCode);
      setQrCodeLoaded(false);
      setBackupCodes(data.backupCodes || []);
      setIsSetupModalOpen(true);
      setTwoFactorMessage({
        type: "success",
        text: "2FA setup initiated. Please scan the QR code.",
      });
    } catch (error: any) {
      Utils.LogLevel.ERROR && console.error("2FA setup error:", error);
      setTwoFactorMessage({
        type: "error",
        text: error.message || "Failed to setup 2FA",
      });
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleVerificationSuccess = () => {
    setTwoFactorEnabled(true);
    setIsSetupModalOpen(false);
    setShowBackupCodesModal(true);
    setTwoFactorMessage({
      type: "success",
      text: "2FA enabled successfully! Save your backup codes.",
    });
  };

  const handleVerify2FA = async () => {
    if (!user) return;
    setTwoFactorLoading(true);

    if (!/^\d{6}$/.test(verificationToken)) {
      setTwoFactorMessage({
        type: "error",
        text: "Token must be a 6-digit number",
      });
      setTwoFactorLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/auth/verify-2fa`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            token: verificationToken,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to verify 2FA");
      }

      await response.json();
      setVerificationToken("");
      handleVerificationSuccess();
    } catch (error: any) {
      Utils.LogLevel.ERROR && console.error("2FA verification error:", error);
      setTwoFactorMessage({
        type: "error",
        text: error.message || "Failed to verify 2FA",
      });
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setTwoFactorLoading(true);
    setTwoFactorMessage(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/auth/disable-2fa`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            token: disableToken || undefined,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to disable 2FA");
      }

      setTwoFactorEnabled(false);
      setShowDisableConfirm(false);
      setDisableToken("");
      setTwoFactorMessage({
        type: "success",
        text: "2FA disabled successfully",
      });

      // Refresh user data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      Utils.LogLevel.ERROR && console.error("2FA disable error:", error);
      setTwoFactorMessage({
        type: "error",
        text: error.message || "Failed to disable 2FA",
      });
    } finally {
      setTwoFactorLoading(false);
    }
  };

  if (!user_data) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center w-full text-center">
        <h1 className="text-primary-text text-2xl font-bold animate-pulse">
          Loading settings...
        </h1>
      </div>
    );
  }

  const activeTabMeta = TABS.find((tab) => tab.id === activeTab)!;
  const joinedDate = new Date(user_data.createdAt).toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );

  return (
    <div className="bg-primary-bg w-full text-white font-primary relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary-btn/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-secondary-btn/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-primary-btn/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 md:px-8 lg:flex-row lg:py-12">
        <aside className="w-full space-y-6 lg:w-80 lg:sticky lg:top-8 lg:self-start">
          <div className={`${subtleCardClasses} relative group`}>
            {/* Decorative gradient border */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-btn/20 via-secondary-btn/20 to-primary-btn/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl"></div>
            
            <div className="flex flex-col items-center gap-5 text-center text-white relative z-10">
              <div className="relative group/avatar">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-btn to-secondary-btn rounded-3xl blur-lg opacity-50 group-hover/avatar:opacity-75 transition-opacity duration-300"></div>
                <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border-2 border-primary-btn/50 bg-gradient-to-br from-primary-elements to-primary-bg shadow-2xl ring-4 ring-primary-btn/20 transition-all duration-300 group-hover/avatar:scale-105 group-hover/avatar:ring-primary-btn/40">
                <LazyLoadingImage
                  dimension={{
                      width: "w-28",
                      height: "h-28",
                  }}
                  loading={loaded}
                >
                  <img
                    src={user_data.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=pingpong-paddle-1&backgroundColor=FF6B00"}
                    alt="profile image"
                      className={`h-full w-full object-cover transition-all duration-500 ${loaded ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
                    loading="lazy"
                    onLoad={() => setLoaded(true)}
                  />
                </LazyLoadingImage>
                  {!loaded && (
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary-btn/40 via-secondary-btn/40 to-primary-btn/40 opacity-90 blur-sm animate-pulse"></div>
                  )}
              </div>
              </div>
              
              <div className="space-y-2">
                <p className="font-secondary text-2xl font-bold tracking-wide bg-gradient-to-r from-primary-btn via-white to-secondary-btn bg-clip-text text-transparent">
                  {user_data.name}
                </p>
                <p className="text-xs uppercase tracking-[0.4em] text-white/50 font-medium">
                  @{user_data.email?.split("@")[0] || user?.email || "user"}
                </p>
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em]">
                <span className="rounded-lg border border-primary-btn/40 bg-gradient-to-br from-primary-btn/10 to-primary-btn/5 px-3 py-1.5 text-white/80 backdrop-blur-sm transition-all duration-300 hover:border-primary-btn/60 hover:scale-105">
                  🗓️ {joinedDate}
                </span>
                <span className="rounded-lg border border-secondary-btn/40 bg-gradient-to-br from-secondary-btn/10 to-secondary-btn/5 px-3 py-1.5 text-white/80 backdrop-blur-sm transition-all duration-300 hover:border-secondary-btn/60 hover:scale-105">
                  ⚡ Level {user_data.level}
                </span>
                <span
                  className={`rounded-lg border px-3 py-1.5 backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
                    twoFactorEnabled 
                      ? "border-emerald-400/60 bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 text-emerald-300" 
                      : "border-amber-400/60 bg-gradient-to-br from-amber-500/20 to-amber-500/10 text-amber-300"
                  }`}
                >
                  {twoFactorEnabled ? "🔒 2FA ON" : "⚠️ 2FA OFF"}
                </span>
              </div>
            </div>
          </div>

          <nav className={`${subtleCardClasses} space-y-3 p-3`}>
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-all duration-300 overflow-hidden ${
                    isActive
                      ? "bg-gradient-to-r from-primary-btn to-secondary-btn text-white scale-[1.02] shadow-lg shadow-primary-btn/30"
                      : "bg-primary-elements/30 text-white/70 hover:bg-primary-elements/60 hover:text-white hover:scale-[1.01] border-2 border-transparent hover:border-primary-btn/30"
                  }`}
                >
                  {/* Animated background glow for active tab */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-btn via-secondary-btn to-primary-btn opacity-50 animate-pulse"></div>
                  )}
                  
                    <span
                    className={`relative z-10 grid h-12 w-12 flex-shrink-0 place-items-center rounded-lg border-2 text-xl transition-all duration-300 ${
                        isActive
                        ? "border-white/30 bg-white/20 text-white backdrop-blur-sm shadow-lg"
                        : "border-primary-btn/40 bg-primary-bg/50 text-primary-btn group-hover:border-primary-btn/60 group-hover:bg-primary-btn/10 group-hover:scale-110"
                      }`}
                    >
                      <Icon />
                    </span>
                  
                  <span className="relative z-10 flex-1 min-w-0">
                      <p
                      className={`font-secondary text-base font-bold tracking-wide truncate ${
                        isActive ? "text-white" : "text-white/80 group-hover:text-white"
                      }`}
                      >
                        {tab.label}
                      </p>
                      <p
                      className={`text-[0.65rem] uppercase tracking-[0.25em] font-medium truncate ${
                        isActive ? "text-white/90" : "text-white/40 group-hover:text-white/60"
                      }`}
                      >
                        {tab.eyebrow}
                      </p>
                    </span>
                  
                  {isActive && (
                    <span className="relative z-10 flex items-center justify-center w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                  </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="flex-1 overflow-hidden rounded-2xl border-2 border-white/10 bg-gradient-to-br from-primary-elements/90 to-primary-elements/70 backdrop-blur-xl shadow-2xl">
          <header className="relative border-b-2 border-white/10 px-6 py-8 sm:px-8 sm:py-10 text-white overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-btn/10 to-secondary-btn/10 rounded-full blur-3xl -z-0"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-secondary-btn/10 to-primary-btn/10 rounded-full blur-3xl -z-0"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-lg bg-gradient-to-r from-primary-btn/20 to-secondary-btn/20 border border-primary-btn/30 backdrop-blur-sm">
                  <p className="text-[0.65rem] uppercase tracking-[0.3em] text-primary-btn font-bold">
              {activeTabMeta.eyebrow}
            </p>
                </span>
              </div>
              
              <h2 className="font-secondary text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white via-primary-btn to-secondary-btn bg-clip-text text-transparent leading-tight">
              {activeTabMeta.heading}
            </h2>
              
              <p className="mt-4 max-w-2xl text-sm sm:text-base leading-relaxed text-white/70">
              {activeTabMeta.description}
            </p>
            </div>
          </header>

          <div className="px-6 py-6 sm:px-8 sm:py-8">
            {activeTab === "profile" && (
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                {/* Step Progress Indicator */}
                <div className="flex items-center justify-between mb-8">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center flex-1">
                      <button
                        type="button"
                        onClick={() => goToStep(step)}
                        className={`group flex items-center justify-center w-12 h-12 rounded-full border-2 font-bold text-lg transition-all duration-300 ${
                          currentStep === step
                            ? 'bg-gradient-to-br from-primary-btn to-secondary-btn border-primary-btn text-white scale-110 shadow-lg shadow-primary-btn/50'
                            : currentStep > step
                            ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-400 text-emerald-400 hover:scale-105'
                            : 'bg-primary-elements/50 border-white/20 text-white/40 hover:border-white/40'
                        }`}
                      >
                        {currentStep > step ? '✓' : step}
                      </button>
                      {step < 3 && (
                        <div className={`flex-1 h-1 mx-2 rounded-full transition-all duration-500 ${
                          currentStep > step
                            ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                            : 'bg-white/10'
                        }`}></div>
                      )}
                    </div>
                  ))}
                </div>
                {/* Step Content with Slide Animation */}
                <div className="relative min-h-[400px]">
                  {/* Profile Information - Step 1: Identity */}
                  {currentStep === 1 && (
                    <div className={`${subtleCardClasses} animate-in fade-in slide-in-from-right-5 duration-500`}>
                  <div className="flex items-start gap-3 mb-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary-btn to-secondary-btn flex items-center justify-center text-white text-2xl shadow-lg">
                      👤
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-md bg-primary-btn/20 text-primary-btn text-[0.6rem] font-bold uppercase tracking-wider">
                          Step 1
                        </span>
                        <p className="text-[0.65rem] uppercase tracking-[0.3em] text-primary-btn font-bold">
                          Identity
                        </p>
                      </div>
                      <h3 className="font-secondary text-2xl font-bold text-white">
                        Who Are You?
                      </h3>
                      <p className="mt-1 text-sm text-white/60">
                        Let's start with the basics - your name on the scoreboard! 🏆
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="block text-xs uppercase tracking-[0.25em] text-white/70 font-semibold ml-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full rounded-xl border-2 border-white/10 bg-primary-bg/80 backdrop-blur-sm px-4 py-3 text-white placeholder:text-white/30 transition-all duration-300 focus:border-primary-btn focus:outline-none focus:ring-2 focus:ring-primary-btn/50 focus:bg-primary-bg hover:border-white/20"
                        placeholder="Enter your first name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs uppercase tracking-[0.25em] text-white/70 font-semibold ml-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full rounded-xl border-2 border-white/10 bg-primary-bg/80 backdrop-blur-sm px-4 py-3 text-white placeholder:text-white/30 transition-all duration-300 focus:border-primary-btn focus:outline-none focus:ring-2 focus:ring-primary-btn/50 focus:bg-primary-bg hover:border-white/20"
                        placeholder="Enter your last name"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Step 1 Navigation */}
                  <div className="flex justify-end mt-6">
                    <button
                      type="button"
                      onClick={nextStep}
                      className={`${primaryActionClasses} min-w-[180px]`}
                    >
                      Next: Choose Avatar →
                    </button>
                  </div>
                </div>
                  )}

                  {/* Avatar Selection - Step 2: Appearance */}
                  {currentStep === 2 && (
                    <div className={`${subtleCardClasses} animate-in fade-in slide-in-from-right-5 duration-500`}>
                  <div className="flex items-start gap-3 mb-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary-btn to-secondary-btn flex items-center justify-center text-white text-2xl shadow-lg">
                      🎨
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-md bg-primary-btn/20 text-primary-btn text-[0.6rem] font-bold uppercase tracking-wider">
                          Step 2
                        </span>
                        <p className="text-[0.65rem] uppercase tracking-[0.3em] text-primary-btn font-bold">
                    Appearance
                  </p>
                      </div>
                      <h3 className="font-secondary text-2xl font-bold text-white">
                        Choose Your Look
                  </h3>
                      <p className="mt-1 text-sm text-white/60">
                        Pick an avatar that matches your playing style! 🏓
                  </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* OAuth provider avatar if exists */}
                    {oauthAvatar && (
                      <button
                        type="button"
                        onClick={() => setSelectedAvatar(oauthAvatar)}
                        className={`relative group transition-all duration-300 ${
                          selectedAvatar === oauthAvatar ? "scale-105" : "hover:scale-110 hover:-translate-y-1"
                        }`}
                      >
                        {/* Glow effect */}
                        <div className={`absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-500/50 to-teal-500/50 blur-lg transition-opacity duration-300 ${
                          selectedAvatar === oauthAvatar ? "opacity-60" : "opacity-0 group-hover:opacity-40"
                        }`}></div>
                        
                        <div
                          className={`relative p-3 rounded-xl border-2 transition-all duration-300 overflow-hidden ${
                            selectedAvatar === oauthAvatar
                              ? "border-emerald-400 bg-gradient-to-br from-emerald-500/20 to-teal-600/20 shadow-lg shadow-emerald-500/30"
                              : "border-white/20 bg-gradient-to-br from-primary-bg/80 to-primary-elements/80 hover:border-emerald-400/60 backdrop-blur-sm"
                          }`}
                        >
                          {/* Selection highlight */}
                          {selectedAvatar === oauthAvatar && (
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 animate-pulse"></div>
                          )}
                          
                          <img
                            src={oauthAvatar}
                            alt="Your provider avatar"
                            className="relative z-10 w-full h-auto rounded-lg"
                          />
                          
                          {selectedAvatar === oauthAvatar && (
                            <div className="absolute -top-1.5 -right-1.5 w-7 h-7 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/50 animate-bounce">
                              <svg
                                className="w-4 h-4 text-white"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="3"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path d="M5 13l4 4L19 7"></path>
                              </svg>
                            </div>
                          )}
                        </div>
                        <p className={`text-center mt-2 text-xs font-bold tracking-wide transition-colors duration-300 ${
                          selectedAvatar === oauthAvatar ? "text-emerald-400" : "text-white/50 group-hover:text-white/80"
                        }`}>
                          Your Photo
                        </p>
                      </button>
                    )}
                    
                    {/* Predefined avatar options */}
                    {AVATAR_OPTIONS.map((avatar, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSelectedAvatar(avatar.url)}
                        className={`relative group transition-all duration-300 ${
                          selectedAvatar === avatar.url ? "scale-105" : "hover:scale-110 hover:-translate-y-1"
                        }`}
                      >
                        {/* Glow effect */}
                        <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${avatar.color} blur-lg transition-opacity duration-300 ${
                          selectedAvatar === avatar.url ? "opacity-60" : "opacity-0 group-hover:opacity-40"
                        }`}></div>
                        
                        <div
                          className={`relative p-3 rounded-xl border-2 transition-all duration-300 overflow-hidden ${
                            selectedAvatar === avatar.url
                              ? `border-primary-btn bg-gradient-to-br ${avatar.color} shadow-lg shadow-primary-btn/30`
                              : "border-white/20 bg-gradient-to-br from-primary-bg/80 to-primary-elements/80 hover:border-primary-btn/60 backdrop-blur-sm"
                          }`}
                        >
                          {/* Selection highlight */}
                          {selectedAvatar === avatar.url && (
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 animate-pulse"></div>
                          )}
                          
                          <img
                            src={avatar.url}
                            alt={avatar.name}
                            className="relative z-10 w-full h-auto rounded-lg transition-transform duration-300 group-hover:rotate-3"
                          />
                          
                          {selectedAvatar === avatar.url && (
                            <div className="absolute -top-1.5 -right-1.5 w-7 h-7 bg-gradient-to-br from-primary-btn to-secondary-btn rounded-full flex items-center justify-center shadow-lg shadow-primary-btn/50 animate-bounce">
                              <svg
                                className="w-4 h-4 text-white"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="3"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path d="M5 13l4 4L19 7"></path>
                              </svg>
                            </div>
                          )}
                        </div>
                        <p className={`text-center mt-2 text-xs font-bold tracking-wide transition-colors duration-300 ${
                          selectedAvatar === avatar.url ? "text-primary-btn" : "text-white/50 group-hover:text-white/80"
                        }`}>
                          {avatar.name}
                        </p>
                      </button>
                    ))}
                </div>

                  {/* Step 2 Navigation */}
                  <div className="flex justify-between mt-6">
                    <button
                      type="button"
                      onClick={prevStep}
                      className={secondaryActionClasses}
                    >
                      ← Back to Identity
                    </button>
                    <button
                      type="button"
                      onClick={nextStep}
                      className={`${primaryActionClasses} min-w-[180px]`}
                    >
                      Next: Security →
                    </button>
                      </div>
                      </div>
                  )}

                  {/* Password Section - Step 3: Security */}
                  {currentStep === 3 && (
                    <div className={`${subtleCardClasses} animate-in fade-in slide-in-from-right-5 duration-500`}>
                  <div className="flex items-start gap-3 mb-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary-btn to-secondary-btn flex items-center justify-center text-white text-2xl shadow-lg">
                      🔐
                      </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-md bg-primary-btn/20 text-primary-btn text-[0.6rem] font-bold uppercase tracking-wider">
                          Step 3
                        </span>
                        <p className="text-[0.65rem] uppercase tracking-[0.3em] text-primary-btn font-bold">
                      Security
                    </p>
                      </div>
                      <h3 className="font-secondary text-2xl font-bold text-white">
                        Secure Your Account
                    </h3>
                      <p className="mt-1 text-sm text-white/60">
                        Keep your account safe with a strong password. Leave blank to keep your current one. 🛡️
                    </p>
                    </div>
                  </div>
                  <div className="max-w-2xl">
                      <div className="space-y-2">
                      <label className="block text-xs uppercase tracking-[0.25em] text-white/70 font-semibold ml-1">
                        New Password (Optional)
                        </label>
                      <div className="relative group">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full rounded-xl border-2 border-white/10 bg-primary-bg/80 backdrop-blur-sm px-4 py-3 pr-12 text-white placeholder:text-white/30 transition-all duration-300 focus:border-primary-btn focus:outline-none focus:ring-2 focus:ring-primary-btn/50 focus:bg-primary-bg hover:border-white/20"
                          placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all duration-300"
                          >
                            {showPassword ? (
                              <AiOutlineEyeInvisible size={20} />
                            ) : (
                              <AiOutlineEye size={20} />
                            )}
                          </button>
                        </div>
                      <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-primary-btn/10 border border-primary-btn/20">
                        <span className="text-sm">💡</span>
                        <p className="text-xs text-white/60">
                          No need for your old password - just enter your new one (min. 6 characters)!
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Step 3 Navigation */}
                  <div className="flex justify-between mt-6">
                    <button
                      type="button"
                      onClick={prevStep}
                      className={secondaryActionClasses}
                    >
                      ← Back to Avatar
                    </button>
                  </div>
                </div>
                  )}
                </div>

                {/* Messages */}
                {profileMessage && (
                  <div
                    className={`flex items-start gap-3 rounded-xl border-2 px-5 py-4 text-sm backdrop-blur-sm shadow-lg animate-in fade-in slide-in-from-top-2 duration-500 ${
                      profileMessage.type === "success"
                        ? "border-emerald-400/40 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-200"
                        : "border-rose-400/40 bg-gradient-to-r from-rose-500/20 to-red-500/20 text-rose-200"
                    }`}
                  >
                    <span className={`text-2xl flex-shrink-0 ${profileMessage.type === "success" ? "animate-bounce" : "animate-pulse"}`}>
                      {profileMessage.type === "success" ? "✨" : "⚠️"}
                    </span>
                    <span className="font-semibold">{profileMessage.text}</span>
                  </div>
                )}

                {/* Sticky Save Button Section */}
                <div className={`${subtleCardClasses} border-2 border-primary-btn/30 sticky bottom-4 z-20 shadow-2xl shadow-primary-btn/20`}>
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xl shadow-lg animate-pulse">
                        ✓
                      </div>
                      <div className="flex-1">
                        <h3 className="font-secondary text-base font-bold text-white">
                          Step {currentStep} of {totalSteps}
                        </h3>
                        <p className="text-xs text-white/60">
                          {currentStep === 1 && "Set your identity"}
                          {currentStep === 2 && "Choose your avatar"}
                          {currentStep === 3 && "Secure your account"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      {currentStep < totalSteps && (
                        <button
                          type="button"
                          onClick={nextStep}
                          className={secondaryActionClasses}
                        >
                          Skip & Continue →
                        </button>
                      )}
                  <button
                    type="submit"
                    disabled={profileLoading}
                        className={`${primaryActionClasses} min-w-[180px] justify-center`}
                      >
                        {profileLoading ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </span>
                        ) : (
                          "💾 Save Changes"
                        )}
                  </button>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {activeTab === "2fa" && (
              <div className="space-y-6">
                {twoFactorEnabled ? (
                  <div className={`${subtleCardClasses} border-2 border-emerald-400/30 relative overflow-hidden`}>
                    {/* Success glow effect */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-start gap-4 mb-6">
                        <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl shadow-lg shadow-emerald-500/30 animate-pulse">
                          🔒
                        </div>
                        <div className="flex-1">
                          <h3 className="font-secondary text-2xl font-bold text-white mb-2">
                            Two-Factor Authentication Active
                    </h3>
                          <p className="text-sm text-white/70">
                      Your account is protected with an additional verification
                      layer. Keep your backup codes in a safe place in case you
                      misplace your device.
                    </p>
                        </div>
                      </div>

                    {!showDisableConfirm ? (
                        <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => setShowDisableConfirm(true)}
                            className="inline-flex items-center gap-2 justify-center rounded-xl border-2 border-rose-400/40 bg-gradient-to-r from-rose-500/10 to-red-500/10 px-5 py-2.5 font-semibold text-rose-300 transition-all duration-300 hover:border-rose-400/60 hover:bg-rose-500/20 hover:scale-[1.02] active:scale-95"
                        >
                            🔓 Disable 2FA
                        </button>
                      </div>
                    ) : (
                      <form
                        onSubmit={handleDisable2FA}
                          className="space-y-4 p-4 rounded-xl bg-rose-500/5 border-2 border-rose-400/30"
                      >
                          <p className="text-sm text-white/70 flex items-center gap-2">
                            <span className="text-base">⚠️</span>
                          Optionally confirm with a current authenticator code.
                        </p>
                        <input
                          type="text"
                          value={disableToken}
                          onChange={(e) => setDisableToken(e.target.value)}
                          placeholder="Optional 6-digit code"
                          maxLength={6}
                            className="w-full rounded-xl border-2 border-white/10 bg-primary-bg/80 backdrop-blur-sm px-4 py-3 text-white placeholder:text-white/30 transition-all duration-300 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/50 focus:bg-primary-bg hover:border-white/20"
                        />
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="submit"
                            disabled={twoFactorLoading}
                              className="inline-flex items-center gap-2 justify-center rounded-xl border-2 border-rose-400 bg-gradient-to-r from-rose-500/20 to-red-500/20 px-5 py-2.5 font-bold text-rose-200 transition-all duration-300 hover:bg-rose-500/30 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:scale-100"
                          >
                              {twoFactorLoading ? "🔄 Disabling..." : "✓ Confirm Disable"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowDisableConfirm(false);
                              setDisableToken("");
                            }}
                            className={secondaryActionClasses}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                    </div>
                  </div>
                ) : (
                  <div className={`${subtleCardClasses} border-2 border-amber-400/30 relative overflow-hidden`}>
                    {/* Warning glow effect */}
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-amber-500/10 to-orange-500/10 rounded-full blur-3xl"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-start gap-4 mb-6">
                        <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-2xl shadow-lg shadow-amber-500/30 animate-pulse">
                          🔓
                        </div>
                        <div className="flex-1">
                          <h3 className="font-secondary text-2xl font-bold text-white mb-2">
                            Add Extra Security Layer
                    </h3>
                          <p className="text-sm text-white/70">
                      Enable two-factor authentication to require a one-time
                            code from your authenticator app whenever you sign in. Protect your ping-pong stats! 🏓
                    </p>
                        </div>
                      </div>
                      
                    <button
                      onClick={handleSetup2FA}
                      disabled={twoFactorLoading}
                        className={primaryActionClasses}
                      >
                        {twoFactorLoading ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating secret...
                          </span>
                        ) : (
                          "🚀 Start 2FA Setup"
                        )}
                    </button>
                    </div>
                  </div>
                )}

                {twoFactorMessage && (
                  <div
                    className={`flex items-start gap-3 rounded-xl border-2 px-4 py-4 text-sm backdrop-blur-sm shadow-lg animate-in fade-in slide-in-from-top-2 duration-500 ${
                      twoFactorMessage.type === "success"
                        ? "border-emerald-400/40 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-200"
                        : "border-rose-400/40 bg-gradient-to-r from-rose-500/20 to-red-500/20 text-rose-200"
                    }`}
                  >
                    <span className={`text-xl flex-shrink-0 ${twoFactorMessage.type === "success" ? "animate-bounce" : "animate-pulse"}`}>
                      {twoFactorMessage.type === "success" ? "🔐" : "⚠️"}
                    </span>
                    <span className="font-medium">{twoFactorMessage.text}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* 2FA Setup Modal */}
      <Modal
        isOpen={isSetupModalOpen}
        onClose={() => {
          setIsSetupModalOpen(false);
          setQrCode(null);
          setQrCodeLoaded(false);
          setVerificationToken("");
        }}
        title="🔐 Setup Authenticator"
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-btn/10 border border-primary-btn/20">
            <span className="text-xl">📱</span>
          <p className="text-sm text-white/70">
            Scan this QR code with your authenticator app (Google Authenticator,
            Authy, etc.), then enter the 6-digit code below.
          </p>
          </div>

          {qrCode && (
            <div className="flex justify-center p-6 rounded-xl border-2 border-primary-btn/40 bg-white shadow-2xl shadow-primary-btn/20 relative overflow-hidden">
              {/* Decorative corners */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-4 border-l-4 border-primary-btn"></div>
              <div className="absolute top-2 right-2 w-4 h-4 border-t-4 border-r-4 border-primary-btn"></div>
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-4 border-l-4 border-primary-btn"></div>
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-4 border-r-4 border-primary-btn"></div>
              
              <LazyLoadingImage
                dimension={{
                  width: "w-48",
                  height: "h-48",
                }}
                loading={qrCodeLoaded}
                color="bg-gray-200"
              >
                <img
                  src={qrCode}
                  alt="2FA QR Code"
                  className={`h-48 w-48 object-contain transition-all duration-500 ${qrCodeLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
                  loading="lazy"
                  onLoad={() => setQrCodeLoaded(true)}
                  onError={() => setQrCodeLoaded(true)}
                />
              </LazyLoadingImage>
              {!qrCodeLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse">
                  <div className="w-32 h-32 bg-gray-300 rounded animate-pulse"></div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-[0.25em] text-white/70 font-semibold ml-1">
              Verification Code
            </label>
            <input
              type="text"
              value={verificationToken}
              onChange={(e) =>
                setVerificationToken(
                  e.target.value.replace(/\D/g, "").slice(0, 6)
                )
              }
              placeholder="000000"
              maxLength={6}
              className="w-full rounded-xl border-2 border-white/10 bg-primary-bg/80 backdrop-blur-sm px-4 py-4 text-center text-3xl font-bold tracking-[0.5em] text-white placeholder:text-white/20 transition-all duration-300 focus:border-primary-btn focus:outline-none focus:ring-2 focus:ring-primary-btn/50 focus:bg-primary-bg hover:border-white/20"
            />
          </div>

          {twoFactorMessage && twoFactorMessage.type === "error" && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-400/30">
              <span className="text-lg">⚠️</span>
              <p className="text-sm text-rose-300">{twoFactorMessage.text}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => {
                setIsSetupModalOpen(false);
                setQrCode(null);
          setQrCodeLoaded(false);
                setVerificationToken("");
              }}
              className={secondaryActionClasses}
            >
              Cancel
            </button>
            <button
              onClick={handleVerify2FA}
              disabled={twoFactorLoading || verificationToken.length !== 6}
              className={primaryActionClasses}
            >
              {twoFactorLoading ? "🔄 Verifying..." : "✓ Verify & Enable"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Backup Codes Modal */}
      <Modal
        isOpen={showBackupCodesModal}
        onClose={() => setShowBackupCodesModal(false)}
        title="💾 Backup Codes"
      >
        <div className="space-y-5">
          <div className="rounded-xl border-2 border-amber-400/50 bg-gradient-to-r from-amber-500/20 to-orange-500/20 p-4 backdrop-blur-sm shadow-lg shadow-amber-500/10">
            <p className="flex items-start gap-3 text-sm text-amber-200">
              <AiOutlineWarning className="mt-0.5 flex-shrink-0 text-amber-400 animate-pulse" size={20} />
              <span>
                <strong className="font-bold">Important:</strong> Store these codes in a safe place.
                Each can be used once if you lose your device. Guard them like your best serve! 🏓
              </span>
            </p>
          </div>

          <div className="p-4 rounded-xl border-2 border-white/10 bg-gradient-to-br from-primary-bg/90 to-primary-elements/90 backdrop-blur-sm shadow-inner">
            <div className="grid grid-cols-2 gap-3 font-mono text-sm">
            {backupCodes.map((code, index) => (
                <div
                key={`${code}-${index}`}
                  className="group relative rounded-lg border-2 border-primary-btn/40 bg-gradient-to-br from-primary-elements to-primary-bg px-3 py-3 text-center tracking-wider text-white font-bold transition-all duration-300 hover:border-primary-btn hover:scale-105 hover:shadow-lg hover:shadow-primary-btn/20"
              >
                  <span className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-primary-btn rounded-full text-xs flex items-center justify-center text-white font-bold opacity-60 group-hover:opacity-100 transition-opacity">
                    {index + 1}
              </span>
                  {code}
                </div>
            ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => {
                const codesString = backupCodes.join("\n");
                navigator.clipboard
                  .writeText(codesString)
                  .then(() => {
                    setTwoFactorMessage({
                      type: "success",
                      text: "Backup codes copied to clipboard!",
                    });
                  })
                  .catch(() => {
                    setTwoFactorMessage({
                      type: "error",
                      text: "Failed to copy codes",
                    });
                  });
              }}
              className="flex items-center gap-2 justify-center rounded-xl border-2 border-white/20 bg-primary-elements/50 backdrop-blur-sm px-5 py-2.5 font-semibold text-white transition-all duration-300 hover:border-primary-btn/50 hover:bg-primary-btn/10 hover:scale-[1.02] active:scale-95"
            >
              <AiOutlineCopy size={18} /> Copy All
            </button>
            <button
              onClick={() => {
                const codesString = backupCodes.join("\n");
                const blob = new Blob([codesString], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "backup-codes.txt";
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-2 justify-center rounded-xl border-2 border-white/20 bg-primary-elements/50 backdrop-blur-sm px-5 py-2.5 font-semibold text-white transition-all duration-300 hover:border-primary-btn/50 hover:bg-primary-btn/10 hover:scale-[1.02] active:scale-95"
            >
              <AiOutlineDownload size={18} /> Download
            </button>
            <button
              onClick={() => setShowBackupCodesModal(false)}
              className={primaryActionClasses}
            >
              ✓ Done
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
