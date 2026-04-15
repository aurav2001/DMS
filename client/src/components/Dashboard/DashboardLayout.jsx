import React, { useState } from 'react';
import { 
  Shield, 
  FileText, 
  Users, 
  Clock, 
  Star, 
  Trash2, 
  Settings, 
  Search, 
  Plus, 
  Menu, 
  X,
  ChevronDown,
  Moon,
  Sun,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const SidebarLink = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' : 'text-slate-600 hover:bg-slate-100'}`}
  >
    <Icon className="w-5 h-5" />
    <span className="font-semibold">{label}</span>
  </button>
);

const DashboardLayout = ({ 
  children, 
  onUploadClick, 
  activeTab, 
  setActiveTab, 
  searchQuery, 
  setSearchQuery,
  docCount,
  onShareClick 
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);

  const menuItems = [
    { icon: FileText, label: 'My Documents' },
    { icon: Users, label: 'Sharing' },
    { icon: Clock, label: 'Recent' },
    { icon: Star, label: 'Starred' },
    { icon: Trash2, label: 'Trash' },
  ];

  return (
    <div className={`min-h-screen flex ${darkMode ? 'dark bg-slate-950' : 'bg-slate-50'}`}>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          aria-hidden="true"
        />
      )}
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 sm:w-72 max-w-[85vw] bg-white dark:bg-slate-900 border-r dark:border-slate-800 transition-transform lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col p-4 sm:p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6 sm:mb-10 px-2">
            <div className="flex items-center gap-2">
              <div className="bg-primary-600 p-2 rounded-lg">
                <Shield className="text-white w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="text-xl sm:text-2xl font-bold dark:text-white">DocVault</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => (
              <SidebarLink
                key={item.label}
                {...item}
                active={activeTab === item.label}
                onClick={() => { setActiveTab(item.label); setSidebarOpen(false); }}
              />
            ))}
          </nav>

          <div className="pt-6 border-t dark:border-slate-800">
            {user?.role === 'Admin' && (
              <button 
                onClick={() => window.location.href = '/admin'}
                className="w-full flex items-center gap-3 px-4 py-3 mb-2 rounded-xl text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all font-semibold"
              >
                <Shield className="w-5 h-5" /> Admin Panel
              </button>
            )}
            <button 
              onClick={onShareClick}
              className="w-full flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-all font-bold group"
            >
              <Users className="w-5 h-5 group-hover:scale-110 transition-transform" /> Share a File
            </button>
            <SidebarLink icon={Settings} label="Settings" />
            <button 
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 mt-2 rounded-xl text-red-500 hover:bg-red-50 transition-all font-semibold"
            >
              <LogOut className="w-5 h-5" /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden w-full">
        {/* Header */}
        <header className="h-14 sm:h-16 flex items-center justify-between gap-3 px-3 sm:px-6 bg-white dark:bg-slate-900 border-b dark:border-slate-800 sticky top-0 z-30">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-slate-400 shrink-0">
              <Menu className="w-6 h-6" />
            </button>
            <div className="relative max-w-md w-full hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search documents..."
                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-1 focus:ring-primary-500 dark:text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 lg:hidden min-w-0">
              <div className="bg-primary-600 p-1.5 rounded-lg shrink-0">
                <Shield className="text-white w-4 h-4" />
              </div>
              <span className="text-base sm:text-lg font-bold dark:text-white truncate">DocVault</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className="relative">
              <button onClick={() => setUserDropdown(!userDropdown)} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 sm:pr-3 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs sm:text-sm font-bold">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 hidden sm:inline max-w-[120px] truncate">{user?.name}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform hidden sm:block ${userDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {userDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border dark:border-slate-700 py-2"
                  >
                    <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700">
                      <Plus className="w-4 h-4" /> Switch Account
                    </button>
                    <hr className="my-1 dark:border-slate-700" />
                    <button onClick={logout} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Mobile search */}
        <div className="md:hidden px-3 sm:px-6 pt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search documents..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-1 focus:ring-primary-500 dark:text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-5 sm:mb-8">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold dark:text-white">{activeTab}</h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Total {docCount} documents</p>
              </div>
              {user?.role !== 'Viewer' && (
                <button onClick={onUploadClick} className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
                  <Plus className="w-5 h-5" /> Upload New
                </button>
              )}
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
