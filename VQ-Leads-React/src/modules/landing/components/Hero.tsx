import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Activity, Users, Zap } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden min-h-[90vh] flex items-center">
      <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* Left Text Content */}
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6"
            >
              <Zap size={14} className="text-blue-400" />
              <span>Next-Gen CRM is Here</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight"
            >
              Close deals faster with <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                intelligent workflows
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
            >
              Brisk CRM helps sales teams track leads, automate follow-ups, and calculate commissions effortlessly. Manage your entire pipeline in one stunning interface.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <Link 
                to="/login" 
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-full font-semibold text-lg flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-blue-900/30 group"
              >
                <span>Start Free Trial</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                to="/login" 
                className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-full font-semibold text-lg flex items-center justify-center transition-all"
              >
                Book a Demo
              </Link>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="mt-10 flex items-center justify-center lg:justify-start gap-4 text-sm text-slate-500"
            >
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0f172a] bg-slate-800 flex items-center justify-center overflow-hidden">
                     <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                  </div>
                ))}
              </div>
              <p>Trusted by <span className="text-white font-semibold">10,000+</span> sales pros</p>
            </motion.div>
          </div>

          {/* Right Visual/Mockup Content */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotateY: 15 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1, delay: 0.4, type: "spring" }}
            className="flex-1 relative perspective-1000 hidden md:block"
          >
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#1e293b]/50 backdrop-blur-sm shadow-2xl shadow-blue-900/20 transform rotate-2 hover:rotate-0 transition-transform duration-500">
              {/* Mockup Header */}
              <div className="h-10 border-b border-white/10 flex items-center px-4 gap-2 bg-slate-900/80">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              {/* Mockup Body */}
              <div className="p-6">
                <div className="flex gap-4 mb-6">
                  <div className="flex-1 bg-slate-800/50 rounded-xl p-4 border border-white/5">
                    <Activity className="text-cyan-400 mb-2" size={24} />
                    <div className="text-2xl font-bold text-white mb-1">$45.2k</div>
                    <div className="text-xs text-slate-400">Monthly Revenue</div>
                  </div>
                  <div className="flex-1 bg-slate-800/50 rounded-xl p-4 border border-white/5">
                    <Users className="text-blue-400 mb-2" size={24} />
                    <div className="text-2xl font-bold text-white mb-1">1,204</div>
                    <div className="text-xs text-slate-400">Active Leads</div>
                  </div>
                </div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-slate-800/30 rounded-lg border border-white/5 flex items-center px-4 gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-700/50 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="h-4 w-24 bg-slate-700/50 rounded mb-2" />
                        <div className="h-3 w-32 bg-slate-800 rounded" />
                      </div>
                      <div className="h-6 w-16 bg-blue-500/20 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Floating elements */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-6 -right-6 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl shadow-xl"
            >
              <div className="text-xs text-cyan-300 font-semibold mb-1">Deal Closed! 🚀</div>
              <div className="text-sm text-white font-bold">Acme Corp - $12,500</div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
