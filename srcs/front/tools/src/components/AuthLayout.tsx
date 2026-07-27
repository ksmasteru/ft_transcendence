import Banner from "../assets/landing_page_banner_4k.png";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps): JSX.Element {
  return (
    <div
      className="background-auth"
      style={{ backgroundImage: `url(${Banner})` }}
    >
      <img
        src={Banner}
        alt="Ping Pong Banner"
        className="absolute inset-0 w-full h-full object-cover z-0"
      />
      {/* Dark Overlay for Readability */}
      <div className="absolute inset-0 bg-black/60 z-0"></div>

      {/* Content Wrapper: Centers the main text and form */}
      <div className="auth-elements-container font-primary relative z-10 mx-2 sm:mx-4 md:mx-auto">
        {children}
      </div>
    </div>
  );
}
