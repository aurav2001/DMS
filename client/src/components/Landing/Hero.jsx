import React from 'react';
import { motion } from 'framer-motion';
import { Play, ArrowRight, FileText, CheckCircle, FileImage, FileCode, FileVideo, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => {
  const mockupFiles = [
    { name: 'Branding_Assets.zip', type: 'zip', icon: FileText, color: 'text-amber-500' },
    { name: 'Product_Demo.mp4', type: 'video', icon: FileVideo, color: 'text-purple-500' },
    { name: 'Project_Specs.pdf', type: 'pdf', icon: FileText, color: 'text-red-500' },
  ];

  return (
    <section className="relative pt-24 pb-24 overflow-hidden bg-mesh">
      {/* Decorative Orbs with Parallax Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl -z-10">
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-primary-200/30 rounded-full blur-[140px] mix-blend-multiply"
        ></motion.div>
        <motion.div 
          animate={{ x: [0, -40, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-1/4 right-0 w-[700px] h-[700px] bg-indigo-200/30 rounded-full blur-[140px] mix-blend-multiply"
        ></motion.div>
        <motion.div 
          animate={{ x: [0, 30, 0], y: [0, -40, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/3 w-[400px] h-[400px] bg-purple-200/20 rounded-full blur-[120px] mix-blend-screen"
        ></motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          {/* Content Wrapper */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
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
              DocVault Enterprise v3.0 - Next-Gen Storage
            </motion.div>
            
            <h1 className="text-5xl lg:text-7xl font-black text-slate-950 leading-[1] mb-10 tracking-tight">
              Manage Your <br />
              <span className="gradient-text drop-shadow-[0_0_35px_rgba(99,102,241,0.3)]">Documents</span> <br />
              <span className="relative">
                Smarter.
                <svg className="absolute -bottom-4 left-0 w-full h-3 text-primary-200/60 -z-10" viewBox="0 0 300 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 15C50 5 150 5 295 15" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/>
                </svg>
              </span>
            </h1>
            
            <p className="text-lg text-slate-600/90 mb-12 leading-relaxed max-w-xl font-medium">
              The ultimate high-fidelity vault for your digital life. Store, share, and collaborate with enterprise-grade security and unmatched speed.
            </p>
            
            <div className="flex flex-wrap gap-5">
              <Link to="/register" className="btn-primary group !px-10">
                <span className="flex items-center gap-2">
                  Get Started Free 
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <button className="btn-outline group !px-10">
                <span className="flex items-center gap-2">
                  <Play className="w-5 h-5 fill-current group-hover:scale-110 transition-transform text-primary-600" /> 
                  Watch Demo
                </span>
              </button>
            </div>

            <div className="mt-16 pt-8 border-t border-slate-100">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Trusted by world-class teams</p>
              <div className="flex flex-wrap items-center gap-8 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                <div className="flex items-center gap-2 font-black text-xl">
                  <Shield className="w-6 h-6" /> TECHCORP
                </div>
                <div className="flex items-center gap-2 font-black text-xl">
                  <div className="w-6 h-6 bg-slate-950 rounded-sm"></div> NEXUS
                </div>
                <div className="flex items-center gap-2 font-black text-xl">
                  <div className="w-8 h-8 border-4 border-slate-950 rounded-full"></div> ORBIT
                </div>
              </div>
            </div>
          </motion.div>

          {/* Premium Visuals Section */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }} 
            animate={{ opacity: 1, scale: 1, rotate: 0 }} 
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            {/* The Main Mockup Glass Card */}
            <div className="relative z-10 glass-effect p-2 rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)] animate-float backdrop-blur-3xl overflow-hidden border-white/60">
              <div className="bg-white/40 rounded-[3.5rem] p-10 border border-white/30 relative overflow-hidden">
                {/* Scanner effect */}
                <motion.div 
                  animate={{ top: ['-100%', '200%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-20 bg-gradient-to-b from-transparent via-primary-400/10 to-transparent pointer-events-none"
                />

                <div className="flex items-center justify-between mb-12">
                  <div className="flex gap-2.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-red-400/80 shadow-lg shadow-red-400/30"></div>
                    <div className="w-3.5 h-3.5 rounded-full bg-yellow-400/80 shadow-lg shadow-yellow-400/30"></div>
                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-400/80 shadow-lg shadow-emerald-400/30"></div>
                  </div>
                  <div className="px-5 py-2 bg-slate-900/5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 border border-white/50">
                    docvault_dashboard_premium.vhd
                  </div>
                </div>
                
                <div className="space-y-8">
                  {mockupFiles.map((file, i) => (
                    <motion.div 
                      key={i} 
                      whileHover={{ x: 15, scale: 1.05 }}
                      className="flex items-center justify-between p-6 glass-card rounded-[2rem] hover:bg-white/80 transition-all cursor-pointer group border-white/50 shadow-xl"
                    >
                      <div className="flex items-center gap-6">
                        <div className="bg-white p-4 rounded-2xl shadow-2xl shadow-slate-200/50 group-hover:rotate-12 transition-transform duration-500">
                          <file.icon className={`w-8 h-8 ${file.color}`} />
                        </div>
                        <div>
                          <div className="font-black text-slate-900 text-lg">{file.name}</div>
                          <div className="text-[11px] font-black text-slate-400/80 uppercase tracking-widest mt-1">
                            Uploaded 2h ago • {4.2 + (i*1.1)} MB
                          </div>
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-white shadow-xl opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                        <ArrowRight className="w-6 h-6" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Floating Decorative Blobs */}
            <motion.div 
              animate={{ y: [0, -40, 0], rotate: [0, 20, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 10, repeat: Infinity }}
              className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/30 rounded-[3rem] blur-3xl z-0"
            ></motion.div>
            <motion.div 
              animate={{ y: [0, 60, 0], rotate: [0, -25, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 12, repeat: Infinity, delay: 1 }}
              className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary-400/30 rounded-full blur-3xl z-0"
            ></motion.div>
            
            {/* Status floating badge */}
            <motion.div 
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1.5, duration: 1 }}
              className="absolute top-1/3 -right-16 bg-white/95 backdrop-blur-2xl p-6 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] border border-white/60 z-20 hidden xl:block animate-float-slow"
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-200">
                  <Shield className="text-white w-8 h-8" />
                </div>
                <div>
                  <div className="text-base font-black text-slate-900 leading-none">Security</div>
                  <div className="text-[11px] font-black text-green-500 uppercase mt-2 tracking-widest">Verified 100%</div>
                </div>
              </div>
            </motion.div>

            {/* Additional floating element */}
            <motion.div 
              animate={{ y: [0, 30, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
              className="absolute -bottom-10 -right-4 bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-emerald-200 z-30 hidden xl:block"
            >
              System Online
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
