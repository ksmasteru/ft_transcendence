import { useNavigate } from "react-router-dom";
import Logo from "../assets/ping_pong_logo.png";
import Banner from "../assets/landing_page_banner_4k.png";
import { PrimaryButton, SecondaryButton } from "../components/Buttons";

export function LandingPage(): JSX.Element {
  const navigate = useNavigate();

  return (
    <div
      className="background-auth relative overflow-hidden"
      style={{ backgroundImage: `url(${Banner})` }}
    >
      <img
        src={Banner}
        alt="Ping Pong Banner"
        className="absolute inset-0 w-full h-full object-cover z-0"
      />
      {/* Enhanced Dark Overlay with Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70 z-0"></div>

      {/* Animated Accent Elements - Ping Pong Themed */}
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
        {/* Cyan Glow - Top Left */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl animate-pulse"></div>
        {/* Orange Glow - Bottom Right */}
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        {/* Cyan Glow - Bottom Left */}
        <div className="absolute bottom-32 left-20 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Content Wrapper: Centers the main text and buttons */}
      <div className="relative z-10 flex flex-col items-center text-center mx-auto px-3 sm:px-4 md:px-6 py-8 sm:py-12 md:py-16">
        {/* Logo with Glow Effect */}
        <div className="relative mb-6 sm:mb-8 md:mb-10 lg:mb-12 animate-float">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-orange-500 rounded-full blur-2xl opacity-40 animate-pulse"></div>
          <img
            src={Logo}
            alt="Logo"
            className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 drop-shadow-2xl"
          />
        </div>

        {/* Main Heading with Gradient Text */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-primary font-extrabold leading-tight mb-4 sm:mb-5 md:mb-6 animate-fadeInUp px-2">
          <span className="block bg-gradient-to-r from-cyan-400 via-white to-cyan-400 bg-clip-text text-transparent drop-shadow-2xl mb-1 sm:mb-2">
            Ready to Play?
          </span>
          <span className="block bg-gradient-to-r from-orange-400 via-white to-orange-400 bg-clip-text text-transparent drop-shadow-2xl">
            It's Your Serve
          </span>
        </h1>

        {/* Tagline with Enhanced Styling */}
        <div className="relative mb-6 sm:mb-8 md:mb-10 lg:mb-12 xl:mb-14 w-full max-w-2xl px-4">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent blur-xl"></div>
          <p className="relative text-sm sm:text-base md:text-lg lg:text-xl text-white font-secondary font-medium tracking-wide px-4 sm:px-6 py-2 sm:py-3 rounded-full border-2 border-white/20 bg-white/5 backdrop-blur-sm shadow-2xl animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            Track stats • Connect with friends • Dominate the leaderboard
          </p>
        </div>

        {/* Buttons Container with Enhanced Layout */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 w-full max-w-md justify-center items-center animate-fadeInUp px-4" style={{ animationDelay: '0.4s' }}>
          <SecondaryButton
            func={() => navigate("/sign-up/")}
            props={{ children: "🏓 Join Now" }}
          />
          <PrimaryButton
            func={() => navigate("/sign-in/")}
            props={{ children: "⚡ Sign In" }}
          />
        </div>

        {/* Subtitle/Additional Info */}
        <p className="mt-6 sm:mt-8 md:mt-10 text-xs sm:text-sm text-gray-400 font-secondary tracking-widest uppercase animate-fadeInUp px-4" style={{ animationDelay: '0.6s' }}>
          Join the Ultimate Ping Pong Community
        </p>
      </div>

      {/* Add Custom Animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
