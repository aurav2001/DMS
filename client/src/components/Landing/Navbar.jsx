import React, { useState, useEffect } from 'react';
import { Menu, X, Shield, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  
  // Placeholder for auth state
  const user = null; 

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#' },
    { name: 'About', href: '#about' },
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'glass-effect py-2 shadow-lg' : 'bg-transparent py-4'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="bg-primary-600 p-2 rounded-lg">
              <Shield className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold gradient-text">DocVault</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a key={link.name} href={link.href} className="text-slate-600 hover:text-primary-600 font-medium transition-colors">
                {link.name}
              </a>
            ))}
          </div>

          {/* Auth Buttons / Profile */}
          <div className="hidden md:flex items-center gap-4">
            {!user ? (
              <>
                <button className="text-slate-600 font-medium hover:text-primary-600 transition-colors">Login</button>
                <button className="btn-primary">Get Started</button>
              </>
            ) : (
              <div className="relative">
                <button onClick={() => setUserDropdown(!userDropdown)} className="flex items-center gap-2 bg-slate-100 p-1 pr-3 rounded-full hover:bg-slate-200 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-bold">JD</div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${userDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {userDropdown && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-48 glass-effect rounded-xl shadow-xl border overflow-hidden"
                    >
                      <div className="p-2">
                        <button className="flex items-center gap-2 w-full p-2 text-sm text-slate-600 hover:bg-primary-50 rounded-lg transition-colors">
                          <User className="w-4 h-4" /> Profile
                        </button>
                        <button className="flex items-center gap-2 w-full p-2 text-sm text-slate-600 hover:bg-primary-50 rounded-lg transition-colors">
                          <Settings className="w-4 h-4" /> Settings
                        </button>
                        <hr className="my-1 border-slate-100" />
                        <button className="flex items-center gap-2 w-full p-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <LogOut className="w-4 h-4" /> Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-600 p-2">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-effect border-t"
          >
            <div className="px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <a key={link.name} href={link.href} onClick={() => setIsOpen(false)} className="block text-lg text-slate-600 font-medium">
                  {link.name}
                </a>
              ))}
              <div className="pt-4 flex flex-col gap-4">
                <button className="btn-outline w-full">Login</button>
                <button className="btn-primary w-full">Get Started</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
