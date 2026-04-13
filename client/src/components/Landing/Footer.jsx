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
    <footer className="bg-slate-900 text-slate-400 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-primary-600 p-2 rounded-lg">
                <Shield className="text-white w-6 h-6" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">DocVault</span>
            </div>
            <p className="text-sm leading-relaxed mb-6">
              The world's most advanced and secure document management system for modern teams.
            </p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-primary-400 transition-colors"><TwitterIcon className="w-5 h-5" /></a>
              <a href="#" className="hover:text-primary-400 transition-colors"><GithubIcon className="w-5 h-5" /></a>
              <a href="#" className="hover:text-primary-400 transition-colors"><LinkedinIcon className="w-5 h-5" /></a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase text-sm tracking-widest">Quick Links</h4>
            <ul className="space-y-4">
              {['Home', 'About', 'Features', 'Pricing', 'Contact'].map(link => (
                <li key={link}><a href="#" className="hover:text-white transition-colors">{link}</a></li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase text-sm tracking-widest">Resources</h4>
            <ul className="space-y-4">
              {['Documentation', 'API Reference', 'Security', 'Privacy Policy', 'Terms of Service'].map(link => (
                <li key={link}><a href="#" className="hover:text-white transition-colors">{link}</a></li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase text-sm tracking-widest">Stay Updated</h4>
            <p className="text-sm mb-6">Get the latest updates and security news.</p>
            <div className="flex gap-2">
              <input type="email" placeholder="Email address" className="bg-slate-800 border-none rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-primary-500 w-full" />
              <button className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 transition-colors">
                <Mail className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="pt-12 border-t border-slate-800 text-center text-sm">
          <p>© {new Date().getFullYear()} DocVault Inc. All rights reserved. Designed with ❤️ for professionals.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
