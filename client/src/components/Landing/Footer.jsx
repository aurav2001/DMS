import React from 'react';
import { Shield, Mail } from 'lucide-react';

const TwitterIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932L18.901 1.153zM17.61 20.644h2.039L6.486 3.24H4.298L17.61 20.644z" />
  </svg>
);

const GithubIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const LinkedinIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 2a2 2 0 1 1-2 2 2 2 0 0 1 2-2z" />
  </svg>
);

const Footer = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 pt-32 pb-16 relative overflow-hidden">
      {/* Decorative gradient orb */}
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary-900/10 rounded-full blur-[120px] -z-0 translate-x-1/3 translate-y-1/3"></div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-16 mb-20">
          {/* Brand Column */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-primary-600 p-2.5 rounded-2xl shadow-xl shadow-primary-900/20">
                <Shield className="text-white w-7 h-7" />
              </div>
              <span className="text-3xl font-black text-white tracking-tight">DocVault</span>
            </div>
            <p className="text-base leading-relaxed mb-10 max-w-sm font-medium">
              The world's most advanced and secure document management system for modern teams. Built with precision and care.
            </p>
            <div className="flex gap-5">
              {[TwitterIcon, GithubIcon, LinkedinIcon].map((Icon, i) => (
                <a key={i} href="#" className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center hover:bg-primary-600 hover:text-white transition-all duration-500 hover:-translate-y-1 border border-slate-800">
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div className="lg:col-span-2">
            <h4 className="text-white font-black mb-8 uppercase text-xs tracking-[0.2em]">Platform</h4>
            <ul className="space-y-4 font-medium">
              {['Home', 'About', 'Features', 'Contact', 'Pricing'].map(link => (
                <li key={link}>
                  <a href="#" className="hover:text-primary-400 transition-colors flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-600 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-white font-black mb-8 uppercase text-xs tracking-[0.2em]">Company</h4>
            <ul className="space-y-4 font-medium">
              {['Documentation', 'API Reference', 'Security', 'Privacy Policy', 'Terms'].map(link => (
                <li key={link}>
                  <a href="#" className="hover:text-primary-400 transition-colors flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-600 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="lg:col-span-4">
            <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-800 backdrop-blur-xl">
              <h4 className="text-white font-black mb-4 uppercase text-xs tracking-[0.2em]">Join our newsletter</h4>
              <p className="text-sm mb-8 font-medium leading-relaxed">Experience the future of document storage. No spam, just pure updates.</p>
              <div className="relative">
                <input 
                  type="email" 
                  placeholder="name@company.com" 
                  className="bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-primary-600 focus:border-transparent w-full transition-all outline-none text-white placeholder:text-slate-600" 
                />
                <button className="absolute right-2 top-2 bottom-2 bg-primary-600 text-white px-5 rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-900/20 active:scale-95 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-4 text-center font-bold uppercase tracking-widest">Secured by AES-256</p>
            </div>
          </div>
        </div>
        
        <div className="pt-12 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-6 text-sm font-medium">
          <p>© {new Date().getFullYear()} DocVault Inc. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Cookies</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Status</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
