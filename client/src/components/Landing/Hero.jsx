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
    <section className="relative pt-32 pb-32 overflow-hidden bg-mesh">
      {/* Decorative Orbs with Parallax Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl -z-10">
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-primary-200/40 rounded-full blur-[120px] mix-blend-multiply"
        ></motion.div>
        <motion.div 
          animate={{ x: [0, -40, 0], y: [0, 50, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-1/4 right-0 w-[600px] h-[600px] bg-indigo-200/40 rounded-full blur-[120px] mix-blend-multiply"
        ></motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          {/* Content Wrapper */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 bg-white/50 backdrop-blur-md text-primary-700 px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-[0.2em] mb-8 border border-white/40 shadow-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-600"></span>
              </span>
              DocVault Enterprise v2.0 - Premium Release
            </motion.div>
            
            <h1 className="text-6xl lg:text-8xl font-black text-slate-950 leading-[1.1] mb-10 tracking-tight">
              Manage Your <br />
              <span className="gradient-text drop-shadow-[0_0_25px_rgba(99,102,241,0.2)]">Documents</span> <br />
              Smarter.
            </h1>
            
            <p className="text-xl text-slate-600/90 mb-12 leading-relaxed max-w-xl font-medium">
              The ultimate high-fidelity vault for your digital life. Store, share, and collaborate with enterprise-grade security and unmatched speed.
            </p>
            
            <div className="flex flex-wrap gap-5">
              <Link to="/register" className="btn-primary group">
                <span className="flex items-center gap-2">
                  Get Started Free 
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <button className="btn-outline group">
                <span className="flex items-center gap-2">
                  <Play className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" /> 
                  Watch Demo
                </span>
              </button>
            </div>

            <div className="mt-16 flex items-center gap-10">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500/10 p-2 rounded-xl">
                  <CheckCircle className="text-emerald-500 w-5 h-5" />
                </div>
                <span className="text-sm font-bold text-slate-700">AES-256 Encryption</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/10 p-2 rounded-xl">
                  <CheckCircle className="text-blue-500 w-5 h-5" />
                </div>
                <span className="text-sm font-bold text-slate-700">Cloud Synchronized</span>
              </div>
            </div>
          </motion.div>

          {/* Premium Visuals Section */}
          <motion.div 
            initial={{ opacity: 0, x: 100, rotate: 5 }} 
            animate={{ opacity: 1, x: 0, rotate: 0 }} 
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            {/* The Main Mockup Glass Card */}
            <div className="relative z-10 glass-effect p-2 rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] animate-float backdrop-blur-3xl overflow-hidden border-white/50">
              <div className="bg-white/40 rounded-[2.5rem] p-10 border border-white/20">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400/80 shadow-lg shadow-red-400/30"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400/80 shadow-lg shadow-yellow-400/30"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-400/80 shadow-lg shadow-emerald-400/30"></div>
                  </div>
                  <div className="px-4 py-1.5 bg-slate-900/5 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 border border-white/50">
                    docvault_dashboard_premium.vhd
                  </div>
                </div>
                
                <div className="space-y-6">
                  {mockupFiles.map((file, i) => (
                    <motion.div 
                      key={i} 
                      whileHover={{ x: 10, scale: 1.02 }}
                      className="flex items-center justify-between p-5 glass-card rounded-2xl hover:bg-white/60 transition-all cursor-pointer group border-white/40"
                    >
                      <div className="flex items-center gap-5">
                        <div className="bg-white p-3.5 rounded-2xl shadow-xl shadow-slate-200/50 group-hover:rotate-6 transition-transform">
                          <file.icon className={`w-7 h-7 ${file.color}`} />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-base">{file.name}</div>
                          <div className="text-[11px] font-bold text-slate-400/80 uppercase tracking-wider">
                            Uploaded 2h ago • {4.2 + (i*1.1)} MB
                          </div>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white shadow-lg opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Floating Decorative Blobs */}
            <motion.div 
              animate={{ y: [0, -30, 0], rotate: [0, 10, 0] }}
              transition={{ duration: 7, repeat: Infinity }}
              className="absolute -top-16 -right-16 w-32 h-32 bg-indigo-500/30 rounded-3xl blur-2xl z-0"
            ></motion.div>
            <motion.div 
              animate={{ y: [0, 40, 0], rotate: [0, -15, 0] }}
              transition={{ duration: 9, repeat: Infinity, delay: 1 }}
              className="absolute -bottom-16 -left-16 w-48 h-48 bg-primary-400/30 rounded-full blur-3xl z-0"
            ></motion.div>
            
            {/* Status floating badge */}
            <div className="absolute top-1/2 -right-12 translate-y-1/2 bg-white/90 backdrop-blur-xl p-4 rounded-3xl shadow-2xl border border-white/50 z-20 hidden xl:block">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center">
                  <FileText className="text-white w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-black text-slate-900 leading-none">Security</div>
                  <div className="text-[10px] font-bold text-green-500 uppercase mt-1">Verified</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
