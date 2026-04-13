import React from 'react';
import { motion } from 'framer-motion';
import { Play, ArrowRight, FileText, CheckCircle } from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl -z-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
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
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-600"></span>
              </span>
              Trusted by 10,000+ teams worldwide
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 leading-tight mb-6">
              Manage Your <span className="gradient-text">Documents</span> Smarter
            </h1>
            
            <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-xl">
              The ultimate vault for your digital assets. Securely store, share, and collaborate on documents with your team in real-time.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <button className="btn-primary flex items-center gap-2">
                Get Started Free <ArrowRight className="w-5 h-5" />
              </button>
              <button className="btn-outline flex items-center gap-2">
                <Play className="w-5 h-5 fill-current" /> Watch Demo
              </button>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-6">
              <div className="flex items-center gap-2 text-slate-500 font-medium">
                <CheckCircle className="text-green-500 w-5 h-5" /> No credit card required
              </div>
              <div className="flex items-center gap-2 text-slate-500 font-medium">
                <CheckCircle className="text-green-500 w-5 h-5" /> 14-day free trial
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
            <div className="relative z-10 glass-effect p-8 rounded-3xl shadow-2xl animate-float">
              <div className="flex items-center justify-between mb-6">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="text-sm font-medium text-slate-400">docvault_dashboard_v2.pxd</div>
              </div>
              
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-white transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="bg-white p-2 rounded-lg shadow-sm">
                        <FileText className={`w-6 h-6 ${i === 1 ? 'text-blue-500' : i === 2 ? 'text-purple-500' : 'text-orange-500'}`} />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-700">Project_Files_0{i}.pdf</div>
                        <div className="text-xs text-slate-400">Uploaded 2h ago • 4.2 MB</div>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Decorative background elements */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-600/10 rounded-full -z-10 animate-pulse"></div>
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-primary-600/10 rounded-full -z-10 delay-700 animate-pulse"></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
