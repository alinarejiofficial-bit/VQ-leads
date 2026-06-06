import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        scrolled 
          ? 'bg-[#0f172a]/80 backdrop-blur-xl border-white/10 py-3 shadow-lg' 
          : 'bg-transparent border-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
            <span className="text-xl">❖</span>
          </div>
          <span className="font-bold text-xl tracking-tight text-white">Brisk</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </div>

        <div className="flex items-center gap-4">
          <Link 
            to="/login" 
            className="text-sm font-semibold text-white hover:text-cyan-400 transition-colors"
          >
            Sign In
          </Link>
          <Link 
            to="/login" 
            className="text-sm font-semibold bg-white text-[#0f172a] px-5 py-2.5 rounded-full hover:bg-slate-200 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-white/10"
          >
            Get Started
          </Link>
        </div>
      </div>
    </motion.nav>
  );
};
