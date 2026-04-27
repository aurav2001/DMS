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
    const [subfolders, setSubfolders] = useState([]);
    const [overrides, setOverrides] = useState({}); // { folderId: access }
    const dropdownRef = useRef(null);
    const { token, user } = useAuth();


    useEffect(() => {
        if (isOpen && token) {
            fetchUsers();
            if (itemType === 'folder') {
                fetchSubfolders();
            }
        } else {
            setSubfolders([]);
            setOverrides({});
        }
    }, [isOpen, token, itemType, itemId]);

    const fetchSubfolders = async () => {
        try {
            const res = await axios.get(`${API_BASE}/folders/${itemId}/subfolders`, {
                headers: { 'x-auth-token': token }
            });
            setSubfolders(res.data || []);
        } catch (err) {
            console.error('Failed to fetch subfolders', err);
        }
    };

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
                (u.email.toLowerCase().includes(val.toLowerCase()) || 
                u.name.toLowerCase().includes(val.toLowerCase())) &&
                u.email !== user?.email
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
            const subfolderOverrides = Object.entries(overrides).map(([folderId, acc]) => ({
                folderId, access: acc
            }));

            const isBulk = itemType === 'folder' && subfolderOverrides.length > 0;
            const endpoint = isBulk 
                ? `${API_BASE}/folders/${itemId}/share-bulk`
                : itemType === 'folder' 
                    ? `${API_BASE}/folders/${itemId}/share`
                    : `${API_BASE}/documents/${itemId}/share`;
            
            const payload = isBulk 
                ? { email: selectedEmail, parentAccess: access, subfolderOverrides }
                : { email: selectedEmail, access };

            await axios.post(endpoint, payload, {
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
                            <div className="grid grid-cols-3 gap-2">
                                <button 
                                    onClick={() => setAccess('view')}
                                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                                        access === 'view' 
                                        ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-700 dark:text-primary-400' 
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                    }`}
                                >
                                    <span className="text-xs font-bold uppercase tracking-tighter">Viewer</span>
                                </button>
                                <button 
                                    onClick={() => setAccess('edit')}
                                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                                        access === 'edit' 
                                        ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-700 dark:text-primary-400' 
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                    }`}
                                >
                                    <span className="text-xs font-bold uppercase tracking-tighter">Editor</span>
                                </button>
                                <button 
                                    onClick={() => setAccess('none')}
                                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                                        access === 'none' 
                                        ? 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400' 
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                    }`}
                                >
                                    <span className="text-xs font-bold uppercase tracking-tighter">None</span>
                                </button>
                            </div>
                            <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
                                <Lock className="w-3 h-3" />
                                {access === 'view' ? 'Can view and download.' : access === 'edit' ? 'Can edit and manage.' : 'Item will be hidden from this user.'}
                            </p>
                        </div>

                        {/* Subfolder Specific Permissions */}
                        <AnimatePresence>
                            {itemType === 'folder' && subfolders.length > 0 && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="pt-4 border-t dark:border-slate-800 space-y-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                                            Manage Subfolders
                                        </label>
                                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500 font-bold uppercase tracking-wider">
                                            Optional Overrides
                                        </span>
                                    </div>
                                    
                                    <div className="max-h-48 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                                        {subfolders.map(sub => (
                                            <div key={sub._id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-all">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                                        <Shield className="w-3.5 h-3.5 text-amber-500" />
                                                    </div>
                                                    <span className="text-sm font-semibold dark:text-slate-200 truncate">{sub.name}</span>
                                                </div>
                                                
                                                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border dark:border-slate-700">
                                                    {['view', 'edit', 'none'].map((acc) => (
                                                        <button
                                                            key={acc}
                                                            onClick={() => setOverrides(prev => ({ ...prev, [sub._id]: acc }))}
                                                            className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all ${
                                                                (overrides[sub._id] || access) === acc 
                                                                ? acc === 'none' ? 'bg-red-500 text-white' : 'bg-primary-600 text-white'
                                                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                                            }`}
                                                        >
                                                            {acc === 'view' ? 'READ' : acc === 'edit' ? 'EDIT' : 'HIDE'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
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
