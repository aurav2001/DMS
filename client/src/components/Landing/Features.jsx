import React from 'react';
import { motion } from 'framer-motion';
import { 
  Cloud, 
  Search, 
  History, 
  Lock, 
  Users, 
  Activity,
  ArrowRight
} from 'lucide-react';

const features = [
  {
    icon: <Cloud className="w-8 h-8 text-blue-500" />,
    title: "Upload & Store",
    desc: "Seamlessly upload PDF, DOCX, and images. Your files are encrypted and stored safely."
  },
  {
    icon: <Search className="w-8 h-8 text-indigo-500" />,
    title: "Full-text Search",
    desc: "Find any document instantly with our high-speed indexing search technology."
  },
  {
    icon: <History className="w-8 h-8 text-purple-500" />,
    title: "Version Control",
    desc: "Never lose an edit. Keep track of changes and roll back to previous versions anytime."
  },
  {
    icon: <Lock className="w-8 h-8 text-red-500" />,
    title: "Role-based Access",
    desc: "Control who sees what. Set permissions for Admin, Editor, and Viewer roles."
  },
  {
    icon: <Users className="w-8 h-8 text-green-500" />,
    title: "Real-time Collaboration",
    desc: "Work together with your team. Share documents and leave comments in real-time."
  },
  {
    icon: <Activity className="w-8 h-8 text-orange-500" />,
    title: "Audit Trail & Logs",
    desc: "Detailed logs of every action. Monitor who accessed or modified your documents."
  }
];

const Features = () => {
  return (
    <section id="features" className="py-32 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-indigo-100"
          >
            Engineering Excellence
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }}
            className="text-4xl lg:text-6xl font-black text-slate-950 mb-6 tracking-tight"
          >
            Powerful Features for <br /> Modern Teams
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-slate-600 max-w-2xl mx-auto font-medium"
          >
            Everything you need to manage your documents effectively in one place, backed by military-grade encryption.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="bg-slate-50/50 p-10 rounded-[2.5rem] border border-slate-100 hover:bg-white hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary-500/5 to-transparent rounded-bl-full"></div>
              
              <div className="bg-white w-20 h-20 rounded-2xl shadow-xl shadow-slate-200/50 flex items-center justify-center mb-10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-black text-slate-950 mb-4 tracking-tight">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed font-medium">
                {feature.desc}
              </p>
              
              <div className="mt-8 flex items-center gap-2 text-primary-600 font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                Learn more <ArrowRight className="w-4 h-4" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
