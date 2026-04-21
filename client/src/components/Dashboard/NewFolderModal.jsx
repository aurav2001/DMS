import React, { useState } from 'react';
import { X, FolderPlus, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE } from '../../utils/api';

const NewFolderModal = ({ onClose, onSuccess, currentFolderId }) => {
    const [folderName, setFolderName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!folderName.trim()) return toast.error('Please enter a folder name');

        const token = localStorage.getItem('token');
        
        try {
            setLoading(true);
            await axios.post(`${API_BASE}/folders`, { 
                name: folderName, 
                parentId: currentFolderId === 'root' ? null : currentFolderId 
            }, {
                headers: { 'x-auth-token': token }
            });
            toast.success('Folder created successfully!');
            onSuccess();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create folder');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
            >
                <div className="p-8">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-2xl flex items-center justify-center">
                                <FolderPlus className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Create New Folder</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Keep your documents organized</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleCreate} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Folder Name</label>
                            <input 
                                autoFocus
                                type="text" 
                                className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-lg font-medium"
                                value={folderName}
                                onChange={(e) => setFolderName(e.target.value)}
                                placeholder="e.g. Tax Invoices 2024"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button 
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                disabled={loading}
                                className="flex-[2] btn-primary flex items-center justify-center gap-2 py-4 shadow-lg shadow-primary-500/25"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FolderPlus className="w-5 h-5" />}
                                {loading ? 'Creating...' : 'Create Folder'}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default NewFolderModal;
