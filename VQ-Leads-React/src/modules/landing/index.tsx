import React from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { Footer } from './components/Footer';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white overflow-hidden font-sans selection:bg-primary/30 selection:text-white">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-cyan-600/10 blur-[100px]" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Navbar />
        <main>
          <Hero />
          <Features />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default LandingPage;
