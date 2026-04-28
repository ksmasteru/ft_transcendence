import React from 'react';
import { WelcomeSection } from './WelcomeSection';
import { LoginForm } from './LoginForm';

export const Logo: React.FC = () => {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="relative">
        <img 
          src="/Logo.png"
          alt="Ping Pong Pro Logo" 
          className="w-auto h-150 object-contain animate-glow"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 blur-xl -z-10 animate-pulse" />
      </div>
    </div>
  );
};

const BackgroundBlurCircles: React.FC = () => {
  const rightCircleSVG = `
    <svg width="965" height="982" viewBox="0 0 965 982" fill="none" xmlns="http://www.w3.org/2000/svg" 
         class="blur-circle-right" 
         style="width: 839px; height: 839px; flex-shrink: 0; fill: rgba(6, 125, 113, 0.30); filter: blur(250px); position: absolute; right: -200px; top: 50%; transform: translateY(-50%)">
      <g filter="url(#filter0_f_right)">
        <path d="M1339 715.5C1339 947.183 1151.18 1135 919.5 1135C687.817 1135 500 947.183 500 715.5C500 483.817 687.817 296 919.5 296C1151.18 296 1339 483.817 1339 715.5Z" 
              fill="#067D71" fill-opacity="0.3"/>
      </g>
      <defs>
        <filter id="filter0_f_right" x="0" y="-204" width="1839" height="1839" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feFlood flood-opacity="0" result="BackgroundImageFix"/>
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
          <feGaussianBlur stdDeviation="250" result="effect1_foregroundBlur"/>
        </filter>
      </defs>
    </svg>
  `;

  const leftCircleSVG = `
    <svg width="1152" height="982" viewBox="0 0 1152 982" fill="none" xmlns="http://www.w3.org/2000/svg" 
         class="blur-circle-left" 
         style="width: 839px; height: 839px; flex-shrink: 0; fill: rgba(6, 125, 113, 0.30); filter: blur(250px); position: absolute; left: -400px; top: 50%; transform: translateY(-50%)">
      <g filter="url(#filter0_f_left)">
        <path d="M652 305.5C652 537.183 464.183 725 232.5 725C0.816544 725 -187 537.183 -187 305.5C-187 73.8165 0.816544 -114 232.5 -114C464.183 -114 652 73.8165 652 305.5Z" 
              fill="#067D71" fill-opacity="0.3"/>
      </g>
      <defs>
        <filter id="filter0_f_left" x="-687" y="-614" width="1839" height="1839" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feFlood flood-opacity="0" result="BackgroundImageFix"/>
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
          <feGaussianBlur stdDeviation="250" result="effect1_foregroundBlur"/>
        </filter>
      </defs>
    </svg>
  `;

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: rightCircleSVG }} />
      <div dangerouslySetInnerHTML={{ __html: leftCircleSVG }} />
    </>
  );
};

const BackgroundImage: React.FC = () => {
  return (
    <div className="absolute inset-0 z-[1]">
      <img
        src="/background.jpg" 
        alt="Minimalism login page background"
        className="w-full h-full object-cover"
        loading="lazy" 
      />
    </div>
  );
};

const ContentLayout: React.FC = () => {
  return (
    <div className="relative z-[2] flex flex-row items-center justify-between gap-20 max-w-[1300px] w-[90%] max-md:flex-col max-md:gap-[60px] max-sm:gap-[50px] max-sm:px-5 max-sm:py-0">
      <div className="flex-1 flex flex-col items-center gap-10 max-w-[500px] w-full max-md:max-w-[450px] max-sm:max-w-[350px] order-1 max-md:order-2">
        <WelcomeSection />
        <LoginForm />
      </div>

      <div className="hidden md:block w-px h-96 bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>

      <div className="flex-1 flex items-center justify-center order-2 max-md:order-1">
        <Logo />
      </div>
    </div>
  );
};

const FontLoader: React.FC = () => {
  return (
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
    />
  );
};

export const LoginPage: React.FC = () => {
  return (
    <>
      <FontLoader />
      <main className="w-screen h-screen flex items-center justify-center bg-[#09080F] relative overflow-hidden">
        <BackgroundBlurCircles />
        <BackgroundImage />
        <ContentLayout />
      </main>
    </>
  );
};

export { BackgroundBlurCircles, BackgroundImage, ContentLayout, FontLoader };