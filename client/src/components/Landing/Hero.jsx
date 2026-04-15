import React from 'react';
import { motion } from 'framer-motion';
import { Play, ArrowRight, FileText, CheckCircle, FileImage, FileCode, FileVideo } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => {
  const mockupFiles = [
    { name: 'Branding_Assets.zip', type: 'zip', icon: FileText, color: 'text-amber-500' },
    { name: 'Product_Demo.mp4', type: 'video', icon: FileVideo, color: 'text-purple-500' },
    { name: 'Project_Specs.pdf', type: 'pdf', icon: FileText, color: 'text-red-500' },
  ];

  return (
    <section className="relative pt-32 pb-20 overflow-hidden bg-white">
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl -z-10">
        <div className="absolute top-1/4 left-0 w-[400px] h-[400px] bg-primary-100/50 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-0 w-[600px] h-[600px] bg-indigo-50/50 rounded-full blur-[100px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }} 
            whileInView={{ opacity: 1, x: 0 }} 
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-primary-100/50">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-600"></span>
              </span>
              Trusted by 10,000+ teams worldwide
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 leading-tight mb-8">
              Manage Your <span className="gradient-text">Documents</span> Smarter
            </h1>
            
            <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-xl">
              The ultimate vault for your digital assets. Securely store, share, and collaborate on documents with your team in real-time.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Link to="/register" className="btn-primary flex items-center gap-2">
                Get Started Free <ArrowRight className="w-5 h-5" />
              </Link>
              <button className="btn-outline flex items-center gap-2">
                <Play className="w-5 h-5 fill-current" /> Watch Demo
              </button>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-6">
              <div className="flex items-center gap-2 text-slate-500 font-medium">
                <CheckCircle className="text-green-500 w-5 h-5" /> Highly Secure SSL/TLS
              </div>
              <div className="flex items-center gap-2 text-slate-500 font-medium">
                <CheckCircle className="text-green-500 w-5 h-5" /> No Storage Limits
              </div>
            </div>
          </motion.div>

          {/* Visuals */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }} 
            whileInView={{ opacity: 1, scale: 1 }} 
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative z-10 bg-white/80 backdrop-blur-xl border border-slate-200 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] p-8 rounded-3xl animate-float">
              <div className="flex items-center justify-between mb-6">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="text-sm font-medium text-slate-400">docvault_dashboard_v2.pxd</div>
              </div>
              
              <div className="space-y-4">
                {mockupFiles.map((file, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 hover:bg-white rounded-xl border border-transparent hover:border-slate-100 hover:shadow-lg hover:shadow-slate-200/50 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-100">
                        <file.icon className={`w-6 h-6 ${file.color}`} />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{file.name}</div>
                        <div className="text-xs text-slate-400">Uploaded 2h ago • {4.2 + i} MB</div>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center text-primary-600">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Decorative background elements */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-600/20 dark:bg-indigo-400/20 rounded-full -z-10 animate-pulse"></div>
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-primary-600/20 dark:bg-primary-400/20 rounded-full -z-10 delay-700 animate-pulse"></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
