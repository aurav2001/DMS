import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const Register = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8 sm:py-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full">
                <div className="text-center mb-6 sm:mb-10">
                    <Link to="/" className="inline-flex items-center gap-2 mb-4 sm:mb-6">
                        <div className="bg-primary-600 p-2 rounded-lg">
                            <Shield className="text-white w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <span className="text-xl sm:text-2xl font-bold gradient-text">DocVault</span>
                    </Link>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Create Account</h2>
                    <p className="text-sm sm:text-base text-slate-600 mt-2">Start managing your documents smarter today</p>
                </div>

                <div className="bg-white p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl shadow-xl border border-slate-100">
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 sm:p-6 text-center">
                        <div className="bg-amber-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                            <Shield className="text-amber-600 w-6 h-6" />
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-amber-900 mb-2">Self-Registration Disabled</h3>
                        <p className="text-amber-800 text-xs sm:text-sm leading-relaxed">
                            Registration is restricted to authorized personnel only.
                            If you need an account, please contact the **System Administrator** to get your credentials.
                        </p>
                    </div>

                    <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t text-center">
                        <p className="text-sm sm:text-base text-slate-600 mb-3 sm:mb-4">
                            Already have an account? {' '}
                            <Link to="/login" className="text-primary-600 font-bold hover:underline">Sign In</Link>
                        </p>
                        <Link to="/" className="text-sm text-slate-400 hover:text-slate-600">Back to Landing Page</Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
