import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Shield, ChevronDown, User, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setUserDropdown(false);
    navigate('/');
  };

  const navLinks = [
    { name: 'Home', href: '#' },
    { name: 'About', href: '#about' },
    { name: 'Features', href: '#features' },
    { name: 'Contact', href: '#contact' },
  ];

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'glass-effect py-2 shadow-lg' : 'bg-transparent py-4'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-primary-600 p-2 rounded-lg">
              <Shield className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold gradient-text">DocVault</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a key={link.name} href={link.href} className="text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors">
                {link.name}
              </a>
            ))}
          </div>

          {/* Auth Buttons / Profile */}
          <div className="hidden md:flex items-center gap-4">
            {!user ? (
              <>
                <Link to="/login" className="text-slate-600 dark:text-slate-300 font-medium hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Login</Link>
                <Link to="/register" className="btn-primary">Get Started</Link>
              </>
            ) : (
              <div className="relative">
                <button 
                  onClick={() => setUserDropdown(!userDropdown)} 
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-slate-200 p-1 pr-3 rounded-full hover:bg-slate-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                    {getInitials(user.name)}
                  </div>
                  <span className="text-sm font-medium text-slate-700">{user.name.split(' ')[0]}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${userDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {userDropdown && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                      animate={{ opacity: 1, y: 0, scale: 1 }} 
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-52 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50"
                    >
                      <div className="p-2">
                        <div className="px-3 py-2 border-b border-slate-50 mb-1">
                          <p className="text-xs text-slate-400 font-medium">Signed in as</p>
                          <p className="text-sm font-semibold text-slate-700 truncate">{user.email}</p>
                        </div>
                        <Link 
                          to="/dashboard" 
                          onClick={() => setUserDropdown(false)}
                          className="flex items-center gap-3 w-full p-2.5 text-sm text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-primary-500" /> Dashboard
                        </Link>
                        {user.role === 'Admin' && (
                          <Link 
                            to="/admin" 
                            onClick={() => setUserDropdown(false)}
                            className="flex items-center gap-3 w-full p-2.5 text-sm text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                          >
                            <Shield className="w-4 h-4 text-red-500" /> Admin Panel
                          </Link>
                        )}
                        <hr className="my-1 border-slate-50" />
                        <button 
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full p-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        >
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
            className="md:hidden glass-effect border-t bg-white"
          >
            <div className="px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <a key={link.name} href={link.href} onClick={() => setIsOpen(false)} className="block text-lg text-slate-600 font-medium">
                  {link.name}
                </a>
              ))}
              
              <div className="pt-4 border-t border-slate-100">
                {!user ? (
                  <div className="flex flex-col gap-3">
                    <Link to="/login" onClick={() => setIsOpen(false)} className="w-full text-center py-3 bg-slate-50 rounded-xl font-medium text-slate-700">Login</Link>
                    <Link to="/register" onClick={() => setIsOpen(false)} className="btn-primary w-full text-center py-3">Get Started</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl mb-4">
                      <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold">
                        {getInitials(user.name)}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-bold text-slate-900 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    <Link to="/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-2 w-full p-3 text-slate-700 font-medium bg-slate-50 rounded-xl hover:bg-primary-50 transition-colors">
                      <LayoutDashboard className="w-5 h-5 text-primary-600" /> Dashboard
                    </Link>
                    {user.role === 'Admin' && (
                      <Link to="/admin" onClick={() => setIsOpen(false)} className="flex items-center gap-2 w-full p-3 text-slate-700 font-medium bg-slate-50 rounded-xl hover:bg-primary-50 transition-colors">
                        <Shield className="w-5 h-5 text-red-600" /> Admin Panel
                      </Link>
                    )}
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full p-3 text-red-600 font-bold bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                    >
                      <LogOut className="w-5 h-5" /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
