import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, FileText, Send, UserCheck, AlertCircle, FileImage, FileVideo, FileAudio, Archive, File, FileCode } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE } from '../../utils/api';


const GlobalShareModal = ({ onClose, onSuccess }) => {
    const [step, setStep] = useState(1); // 1: Select File, 2: Enter Email
    const [search, setSearch] = useState('');
    const [documents, setDocuments] = useState([]);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [email, setEmail] = useState('');
    const [allUsers, setAllUsers] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetchingDocs, setFetchingDocs] = useState(false);

    useEffect(() => {
        fetchMyDocs();
        fetchAllUsers();
    }, []);

    const fetchAllUsers = async () => {
        try {
            const res = await axios.get(`${API_BASE}/auth/users`);
            setAllUsers(res.data);
        } catch (err) {
            console.error('Failed to fetch users directory');
        }
    };

    const fetchMyDocs = async () => {
        setFetchingDocs(true);
        try {
            const res = await axios.get(`${API_BASE}/documents`, { params: { tab: 'My Documents' } });
            setDocuments(res.data);
        } catch (err) {
            toast.error('Failed to load your documents');
        }
        setFetchingDocs(false);
    };

    const getDocIcon = (type) => {
        const t = type?.toLowerCase() || '';
        if (t.includes('image')) return <FileImage className="w-6 h-6 text-orange-500" />;
        if (t.includes('pdf')) return <FileText className="w-6 h-6 text-red-500" />;
        if (t.includes('video')) return <FileVideo className="w-6 h-6 text-purple-500" />;
        if (t.includes('audio')) return <FileAudio className="w-6 h-6 text-green-500" />;
        if (t.includes('zip') || t.includes('compressed')) return <Archive className="w-6 h-6 text-amber-600" />;
        if (t.includes('javascript') || t.includes('html') || t.includes('css') || t.includes('code')) return <FileCode className="w-6 h-6 text-blue-500" />;
        return <File className="w-6 h-6 text-slate-400" />;
    };

    const handleShare = async () => {
        if (!email) {
            toast.error('Please enter a valid email');
            return;
        }
        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE}/documents/${selectedDoc._id}/share`, { email });
            toast.success(res.data.message || 'Shared successfully!');
            onSuccess?.();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Sharing failed');
        } finally {
            setLoading(false);
        }
    };

    const filteredDocs = documents.filter(doc => 
        doc.title.toLowerCase().includes(search.toLowerCase())
    );

    const filteredUsers = allUsers.filter(u => 
        u.email.toLowerCase().includes(email.toLowerCase()) || 
        u.name.toLowerCase().includes(email.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border dark:border-slate-800"
            >
                {/* Header */}
                <div className="p-6 border-b dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold dark:text-white">Share a File</h2>
                        <p className="text-sm text-slate-500">Step {step} of 2: {step === 1 ? 'Select a file' : 'Enter recipient'}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-6 h-6 dark:text-slate-400" />
                    </button>
                </div>

                <div className="p-6">
                    {step === 1 ? (
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search your documents..." 
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary-500 dark:text-white transition-all"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                {fetchingDocs ? (
                                    [1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-50 dark:bg-slate-800 rounded-xl animate-pulse"></div>)
                                ) : filteredDocs.length > 0 ? (
                                    filteredDocs.map(doc => (
                                        <button 
                                            key={doc._id}
                                            onClick={() => { setSelectedDoc(doc); setStep(2); }}
                                            className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-primary-50 dark:hover:bg-primary-900/10 border border-transparent hover:border-primary-100 dark:hover:border-primary-900/30 transition-all group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                                                    {getDocIcon(doc.fileType)}
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-semibold dark:text-slate-200 truncate">{doc.title}</p>
                                                    <p className="text-xs text-slate-500">{(doc.fileSize / 1024 / 1024).toFixed(1)} MB • {doc.fileType}</p>
                                                </div>
                                            </div>
                                            <div className="bg-primary-600 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                <UserCheck className="w-4 h-4" />
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="text-center py-10 text-slate-500">
                                        <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                        <p>No documents found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 p-4 bg-primary-50 dark:bg-primary-900/10 rounded-2xl border border-primary-100 dark:border-primary-900/20">
                                <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm">
                                    {getDocIcon(selectedDoc?.fileType)}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-xs text-primary-600 dark:text-primary-400 font-bold uppercase tracking-wider">Sharing document</p>
                                    <p className="font-bold dark:text-white truncate">{selectedDoc?.title}</p>
                                </div>
                                <button onClick={() => setStep(1)} className="ml-auto text-xs font-bold text-primary-600 hover:underline">Change</button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Recipient Email</label>
                                    <div className="relative">
                                        <input 
                                            type="email" 
                                            placeholder="Enter user's email address..." 
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary-500 dark:text-white transition-all"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                setShowSuggestions(true);
                                            }}
                                            onFocus={() => setShowSuggestions(true)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleShare()}
                                            autoFocus
                                        />
                                        
                                        {/* Suggestions Dropdown */}
                                        <AnimatePresence>
                                            {showSuggestions && email.length > 1 && filteredUsers.length > 0 && (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                                    className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-2xl shadow-2xl z-[110] max-h-48 overflow-y-auto overflow-hidden py-2"
                                                >
                                                    <div className="px-3 py-1 text-[10px] text-slate-400 font-bold uppercase tracking-widest border-b dark:border-slate-700 mb-1">
                                                        Matching Users
                                                    </div>
                                                    {filteredUsers.map(u => (
                                                        <button 
                                                            key={u.email}
                                                            onClick={() => {
                                                                setEmail(u.email);
                                                                setShowSuggestions(false);
                                                            }}
                                                            className="w-full flex items-center justify-between px-4 py-2 hover:bg-primary-50 dark:hover:bg-primary-900/10 text-left transition-colors"
                                                        >
                                                            <div>
                                                                <p className="text-sm font-semibold dark:text-white">{u.name}</p>
                                                                <p className="text-xs text-slate-500">{u.email}</p>
                                                            </div>
                                                            <div className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full dark:text-slate-400 font-bold">Select</div>
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-2 px-1 italic">
                                        Note: Person must have a DocVault account with this email.
                                    </p>
                                </div>

                                <button 
                                    onClick={handleShare}
                                    disabled={loading}
                                    className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold shadow-lg shadow-primary-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" /> Confirm Share
                                        </>
                                    )}
                                </button>
                                
                                <button 
                                    onClick={() => setStep(1)}
                                    className="w-full py-3 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                                >
                                    Go Back
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default GlobalShareModal;
