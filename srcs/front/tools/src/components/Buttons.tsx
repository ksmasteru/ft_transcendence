// create reusable components for views

// buttons components
export function PrimaryButton({
  func,
  ...props
}: {
  func: Function;
  [key: string]: any;
}): JSX.Element {
  return (
    <button
      onClick={() => func()}
      className="
				relative
				font-secondary
				w-full sm:w-auto
				px-6 sm:px-8 md:px-10 py-3 sm:py-3.5 md:py-4
				bg-gradient-to-br from-cyan-500/80 via-cyan-600/70 to-cyan-700/80
				text-white font-bold text-xs sm:text-sm tracking-wide uppercase
				rounded-full 
				border border-cyan-400/20
				shadow-[0_8px_30px_rgb(0,0,0,0.4),0_2px_8px_rgba(6,182,212,0.15)]
				transition-all duration-300 transform 
				hover:shadow-[0_8px_40px_rgb(0,0,0,0.5),0_4px_12px_rgba(6,182,212,0.25)]
				hover:translate-y-[-2px]
				hover:from-cyan-500/90 hover:via-cyan-600/80 hover:to-cyan-700/90
				active:translate-y-[0px] active:scale-95
				focus:outline-none focus:ring-2 focus:ring-cyan-500/30
				backdrop-blur-sm
				overflow-hidden
				min-h-[44px]
				before:absolute before:inset-0 
				before:bg-gradient-to-t before:from-transparent before:via-white/5 before:to-white/10
				before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300
			"
      {...props.props}
    >
      {props.props.children}
    </button>
  );
}

export function SecondaryButton({
  func,
  ...props
}: {
  func: Function;
  [key: string]: any;
}): JSX.Element {
  return (
    <button
      onClick={() => func()}
      className="
				relative
				font-secondary
				w-full sm:w-auto 
				px-6 sm:px-8 md:px-10 py-3 sm:py-3.5 md:py-4
				bg-gradient-to-br from-orange-600/80 via-orange-700/70 to-orange-800/80
				text-white font-bold text-xs sm:text-sm tracking-wide uppercase
				rounded-full 
				border border-orange-500/20
				shadow-[0_8px_30px_rgb(0,0,0,0.4),0_2px_8px_rgba(249,115,22,0.15)]
				transition-all duration-300 transform 
				hover:shadow-[0_8px_40px_rgb(0,0,0,0.5),0_4px_12px_rgba(249,115,22,0.25)]
				hover:translate-y-[-2px]
				hover:from-orange-600/90 hover:via-orange-700/80 hover:to-orange-800/90
				active:translate-y-[0px] active:scale-95
				focus:outline-none focus:ring-2 focus:ring-orange-600/30
				backdrop-blur-sm
				overflow-hidden
				min-h-[44px]
				before:absolute before:inset-0 
				before:bg-gradient-to-t before:from-transparent before:via-white/5 before:to-white/10
				before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300
			"
      {...props.props}
    >
      {props.props.children}
    </button>
  );
}

export function AuthProvidersButtons() {
  const auth_login = (auth_provider: "google" | "42intra") => {
    // Store attempt info before redirect
    sessionStorage.setItem("auth_provider", auth_provider);
    // Use dynamic API URL for network access
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const apiUrl = `${protocol}//${hostname}:3000`;
    window.location.href = `${apiUrl}/api/v1/auth/${auth_provider}`;
  };

  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 font-secondary">
      <button
        type="button"
        onClick={auth_login.bind(null, "google")}
        className="flex items-center justify-center gap-3 w-full rounded-lg border border-gray-700 bg-secondary-btn py-3 text-md font-medium hover:bg-white/10 transition duration-500"
      >
        {/* small google icon placeholder */}
        <span className="h-5 w-5 rounded-sm bg-white/20 flex items-center justify-center text-xs">
          G
        </span>
        <span>Continue with Google</span>
      </button>

      <button
        type="button"
        onClick={auth_login.bind(null, "42intra")}
        className="flex items-center justify-center gap-3 w-full rounded-lg border border-gray-700 bg-secondary-btn py-3 text-md font-medium hover:bg-white/10 transition duration-500"
      >
        <span className="h-5 w-5 rounded-sm bg-white/20 flex items-center justify-center text-[10px] font-bold">
          42
        </span>
        <span>Continue with 42</span>
      </button>
    </div>
  );
}
