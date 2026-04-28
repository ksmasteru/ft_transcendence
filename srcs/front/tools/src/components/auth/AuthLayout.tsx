import React from 'react';
import { Logo } from '../shared/Logo';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ title, subtitle, children }) => {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/@tabler/icons@2.40.0/icons-sprite.svg"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
      />
      <main className="w-screen h-screen flex items-center justify-center bg-[#09080F] relative overflow-hidden">
        <div>
          <div
            dangerouslySetInnerHTML={{
              __html:
                "<svg id=\"117:2447\" width=\"965\" height=\"982\" viewBox=\"0 0 965 982\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"blur-circle-right\" style=\"width: 839px; height: 839px; flex-shrink: 0; fill: rgba(6, 125, 113, 0.30); filter: blur(250px); position: absolute; right: -200px; top: 50%; transform: translateY(-50%)\"> <g filter=\"url(#filter0_f_117_2447)\"> <path d=\"M1339 715.5C1339 947.183 1151.18 1135 919.5 1135C687.817 1135 500 947.183 500 715.5C500 483.817 687.817 296 919.5 296C1151.18 296 1339 483.817 1339 715.5Z\" fill=\"#067D71\" fill-opacity=\"0.3\"></path> </g> <defs> <filter id=\"filter0_f_117_2447\" x=\"0\" y=\"-204\" width=\"1839\" height=\"1839\" filterUnits=\"userSpaceOnUse\" color-interpolation-filters=\"sRGB\"> <feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"></feFlood> <feBlend mode=\"normal\" in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"></feBlend> <feGaussianBlur stdDeviation=\"250\" result=\"effect1_foregroundBlur_117_2447\"></feGaussianBlur> </filter> </defs> </svg>",
            }}
          />
        </div>
        <div>
          <div
            dangerouslySetInnerHTML={{
              __html:
                "<svg id=\"117:2571\" width=\"1152\" height=\"982\" viewBox=\"0 0 1152 982\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"blur-circle-left\" style=\"width: 839px; height: 839px; flex-shrink: 0; fill: rgba(6, 125, 113, 0.30); filter: blur(250px); position: absolute; left: -400px; top: 50%; transform: translateY(-50%)\"> <g filter=\"url(#filter0_f_117_2571)\"> <path d=\"M652 305.5C652 537.183 464.183 725 232.5 725C0.816544 725 -187 537.183 -187 305.5C-187 73.8165 0.816544 -114 232.5 -114C464.183 -114 652 73.8165 652 305.5Z\" fill=\"#067D71\" fill-opacity=\"0.3\"></path> </g> <defs> <filter id=\"filter0_f_117_2571\" x=\"-687\" y=\"-614\" width=\"1839\" height=\"1839\" filterUnits=\"userSpaceOnUse\" color-interpolation-filters=\"sRGB\"> <feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"></feFlood> <feBlend mode=\"normal\" in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"></feBlend> <feGaussianBlur stdDeviation=\"250\" result=\"effect1_foregroundBlur_117_2571\"></feGaussianBlur> </filter> </defs> </svg>",
            }}
          />
        </div>
        <div className="absolute w-full h-full z-[1] left-0 top-0">
          <img
            src="/background.jpg" // Adjusted path to ensure it points to the correct location
            alt="Minimalism login page background"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-[2] flex flex-col items-center gap-10 max-w-[500px] w-[90%] max-md:max-w-[450px] max-md:gap-[35px] max-sm:max-w-[350px] max-sm:gap-[30px] max-sm:px-5 max-sm:py-0">
          <Logo />
          <section className="text-center mb-5">
            <h2 className="text-5xl font-semibold text-white mb-2 max-md:text-[42px] max-sm:text-4xl">
              {title}
            </h2>
            {subtitle && (
              <p className="text-base font-normal text-[rgba(255,255,255,0.7)] max-sm:text-sm">
                {subtitle}
              </p>
            )}
          </section>
          {children}
        </div>
      </main>
    </>
  );
};