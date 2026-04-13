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
  docCount 
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userDropdown, setUserDropdown] = useState(false);
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);

  const menuItems = [
    { icon: FileText, label: 'My Documents' },
    { icon: Users, label: 'Shared with Me' },
    { icon: Clock, label: 'Recent' },
    { icon: Star, label: 'Starred' },
    { icon: Trash2, label: 'Trash' },
  ];

  return (
    <div className={`min-h-screen flex ${darkMode ? 'dark bg-slate-950' : 'bg-slate-50'}`}>
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-slate-900 border-r dark:border-slate-800 transition-transform lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center gap-2 mb-10 px-2">
            <div className="bg-primary-600 p-2 rounded-lg">
              <Shield className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold dark:text-white">DocVault</span>
          </div>

          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => (
              <SidebarLink 
                key={item.label} 
                {...item} 
                active={activeTab === item.label} 
                onClick={() => setActiveTab(item.label)}
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
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-slate-900 border-b dark:border-slate-800 sticky top-0 z-30">
          <div className="flex items-center gap-4 flex-1">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-slate-400">
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
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            <div className="relative">
              <button onClick={() => setUserDropdown(!userDropdown)} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 pr-3 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-bold">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 hidden sm:inline">{user?.name}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${userDropdown ? 'rotate-180' : ''}`} />
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

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-2xl font-bold dark:text-white">{activeTab}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total {docCount} documents</p>
              </div>
              <button onClick={onUploadClick} className="btn-primary flex items-center gap-2">
                <Plus className="w-5 h-5" /> Upload New
              </button>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
