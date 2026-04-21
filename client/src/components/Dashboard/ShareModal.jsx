import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, User, Mail, ChevronDown, Check, Shield, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../utils/api';

const ShareModal = ({ isOpen, onClose, itemName, itemType, itemId, onSuccess }) => {
    const [search, setSearch] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [selectedEmail, setSelectedEmail] = useState('');
    const [access, setAccess] = useState('view');
    const [loading, setLoading] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const { token } = useAuth();


    useEffect(() => {
        if (isOpen && token) {
            fetchUsers();
        }
    }, [isOpen, token]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${API_BASE}/auth/users`, {
                headers: { 'x-auth-token': token }
            });
            setAllUsers(res.data || []);
        } catch (err) {
            console.error('Failed to fetch users', err);
        }
    };

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearch(val);
        setSelectedEmail(val); // Allow manual typing
        if (val.trim()) {
            const filtered = allUsers.filter(u => 
                u.email.toLowerCase().includes(val.toLowerCase()) || 
                u.name.toLowerCase().includes(val.toLowerCase())
            );
            setSuggestions(filtered);
            setIsDropdownOpen(filtered.length > 0);
        } else {
            setSuggestions([]);
            setIsDropdownOpen(false);
        }
    };

    const selectUser = (user) => {
        setSelectedEmail(user.email);
        setSearch(user.email);
        setIsDropdownOpen(false);
    };

    const handleShare = async () => {
        if (!selectedEmail) return toast.error('Please enter an email');
        
        setLoading(true);
        try {
            const endpoint = itemType === 'folder' 
                ? `${API_BASE}/folders/${itemId}/share`
                : `${API_BASE}/documents/${itemId}/share`;
            
            await axios.post(endpoint, { email: selectedEmail, access }, {
                headers: { 'x-auth-token': token }
            });
            
            toast.success(`Shared with ${selectedEmail}`);
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Sharing failed');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />

                {/* Modal Content */}
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
                >
                    {/* Header */}
                    <div className="p-6 pb-0 flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Shield className="w-5 h-5 text-primary-500" />
                                Share item
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Sharing <span className="font-semibold text-primary-600 dark:text-primary-400">"{itemName}"</span>
                            </p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Search / Email Input */}
                        <div className="relative" ref={dropdownRef}>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                User Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    value={search}
                                    onChange={handleSearchChange}
                                    placeholder="name@example.com"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all dark:text-white"
                                />
                                
                                {/* Autocomplete Dropdown */}
                                <AnimatePresence>
                                    {isDropdownOpen && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute left-0 right-0 top-[calc(100%+8px)] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-xl z-10 max-h-48 overflow-y-auto"
                                        >
                                            {suggestions.map((u) => (
                                                <button
                                                    key={u.email}
                                                    onClick={() => selectUser(u)}
                                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-left transition-colors"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                                        <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-900 dark:text-white">{u.name}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Access Selection */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                                Permission Level
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => setAccess('view')}
                                    className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                                        access === 'view' 
                                        ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-700 dark:text-primary-400' 
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                    }`}
                                >
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${access === 'view' ? 'border-primary-500 bg-primary-500' : 'border-slate-300'}`}>
                                        {access === 'view' && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="text-sm font-medium">Viewer</span>
                                </button>
                                <button 
                                    onClick={() => setAccess('edit')}
                                    className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                                        access === 'edit' 
                                        ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-700 dark:text-primary-400' 
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                    }`}
                                >
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${access === 'edit' ? 'border-primary-500 bg-primary-500' : 'border-slate-300'}`}>
                                        {access === 'edit' && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="text-sm font-medium">Editor</span>
                                </button>
                            </div>
                            <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
                                <Lock className="w-3 h-3" />
                                {access === 'view' ? 'Can view and download the item.' : 'Can edit, delete, and manage the item.'}
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 pt-0">
                        <button 
                            onClick={handleShare}
                            disabled={loading || !selectedEmail}
                            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary-500/20 transition-all active:scale-[0.98]"
                        >
                            {loading ? 'Processing...' : 'Share Now'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ShareModal;
