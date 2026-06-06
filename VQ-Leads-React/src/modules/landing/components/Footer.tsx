import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0b1121] border-t border-white/5 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-16">
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                <span className="text-sm">❖</span>
              </div>
              <span className="font-bold text-xl tracking-tight text-white">Brisk</span>
            </div>
            <p className="text-slate-400 text-sm max-w-sm leading-relaxed mb-6">
              The modern CRM built for speed, efficiency, and scale. Empower your sales team to close more deals faster than ever before.
            </p>
            <div className="flex gap-4">
              {/* Social icons placeholders */}
              {[1, 2, 3, 4].map((i) => (
                <a key={i} href="#" className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                  <div className="w-4 h-4 bg-slate-500 rounded-sm" />
                </a>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-6">Product</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><a href="#" className="hover:text-blue-400 transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Integrations</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Changelog</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><a href="#" className="hover:text-blue-400 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Brisk CRM. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-slate-500">
            <span>Designed with ♥️ by VQ Leads</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
