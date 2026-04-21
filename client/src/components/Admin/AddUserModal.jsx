import React, { useState } from 'react';
import { X, User, Mail, Lock, Shield, Loader2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE } from '../utils/api';

const AddUserModal = ({ onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'Viewer'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            setLoading(true);
            console.log('Sending Add User Request:', { ...formData, password: '***' });
            
            // Note: axios global defaults for 'x-auth-token' are set in AuthContext.jsx
            // So we don't need to manually set headers here.
            await axios.post(`${API_BASE}/admin/users`, formData);
            
            toast.success('User created successfully');
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Add User Failed:', err.response?.data || err.message);
            toast.error(err.response?.data?.message || 'Failed to create user. Check console for details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 overflow-y-auto">
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md" onClick={onClose}></div>
            
            <div className="relative bg-slate-900 border border-white/10 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300 my-8">
                <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <div>
                        <h3 className="text-xl font-bold text-white">Create New User</h3>
                        <p className="text-sm text-slate-400">Complete the form to register a user</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 ml-1">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input 
                                required
                                type="text"
                                placeholder="Enter full name"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 ml-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input 
                                required
                                type="email"
                                placeholder="user@example.com"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 ml-1">Temporary Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input 
                                required
                                type="password"
                                placeholder="Set password"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 ml-1">Assign Role</label>
                        <div className="relative">
                            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <select 
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all appearance-none"
                                value={formData.role}
                                onChange={(e) => setFormData({...formData, role: e.target.value})}
                            >
                                <option value="Viewer" className="bg-slate-900">Viewer</option>
                                <option value="Editor" className="bg-slate-900">Editor</option>
                                <option value="Admin" className="bg-slate-900">Admin</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-2xl transition-all border border-white/10"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 group"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddUserModal;
