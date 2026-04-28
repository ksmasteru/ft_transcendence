import React from 'react';

export const WelcomeSection: React.FC = () => {
  return (
    <section className="text-center mb-5">
      <h2 className="text-5xl font-semibold text-white mb-2 max-md:text-[42px] max-sm:text-4xl">
        Welcome
      </h2>
      <p className="text-base font-normal text-[rgba(255,255,255,0.7)] max-sm:text-sm">
        We are glad to see you back with us
      </p>
    </section>
  );
};
