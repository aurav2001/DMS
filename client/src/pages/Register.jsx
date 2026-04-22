import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, User, Mail, Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const Register = () => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(formData.name, formData.email, formData.password);
            toast.success('Registration successful. Welcome!');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full">
                <div className="text-center mb-10">
                    <Link to="/" className="inline-flex items-center gap-2 mb-6">
                        <div className="bg-primary-600 p-2 rounded-lg shadow-lg">
                            <Shield className="text-white w-6 h-6" />
                        </div>
                        <span className="text-2xl font-bold gradient-text">DocVault</span>
                    </Link>
                    <h2 className="text-3xl font-bold text-slate-900">Create Account</h2>
                    <p className="text-slate-600 mt-2">Start managing your documents smarter today</p>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 text-center">
                    <div className="bg-amber-50 text-amber-600 p-4 rounded-2xl mb-6 flex items-center gap-3 text-left">
                        <Lock className="w-10 h-10 shrink-0" />
                        <div>
                            <p className="font-bold text-sm">Registration Closed</p>
                            <p className="text-xs opacity-90">Self-registration is currently disabled. Please contact your System Administrator to get an account.</p>
                        </div>
                    </div>

                    <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                        To maintain high security and document integrity, DocVault accounts are strictly managed by administrative staff.
                    </p>

                    <button 
                        onClick={() => window.location.href = 'mailto:admin@docvault.com'} 
                        className="btn-primary w-full py-4 mt-2 flex items-center justify-center gap-2 font-bold shadow-lg shadow-primary-500/20 active:scale-95 transition-transform"
                    >
                        Request Access via Email <ArrowRight className="w-5 h-5" />
                    </button>
                </div>

                    <div className="mt-8 pt-6 border-t text-center">
                        <p className="text-slate-600">
                            Already have an account? {' '}
                            <Link to="/login" className="text-primary-600 font-bold hover:underline transition-all">Sign In</Link>
                        </p>
                    </div>
                <div className="mt-6 text-center">
                    <Link to="/" className="text-xs text-slate-400 hover:text-slate-600 font-medium">Back to Landing Page</Link>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
