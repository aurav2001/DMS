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
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <section id="features" className="py-24 bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-100/30 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block px-5 py-2 bg-primary-50 text-primary-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-primary-100 shadow-sm"
          >
            Engineering Excellence
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }}
            className="text-3xl lg:text-5xl font-black text-slate-950 mb-8 tracking-tight leading-[1.1]"
          >
            Powerful Features for <br /> Modern Teams
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed"
          >
            Everything you need to manage your documents effectively in one place, backed by military-grade encryption.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              onMouseMove={handleMouseMove}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              style={{
                '--mouse-x': `${mousePos.x}px`,
                '--mouse-y': `${mousePos.y}px`,
              }}
              className="spotlight-card group"
            >
              <div className="relative z-10">
              <div className="bg-white w-16 h-16 rounded-[1.2rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 border border-slate-50">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-black text-slate-950 mb-4 tracking-tight">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed font-medium">
                  {feature.desc}
                </p>
                
                <div className="mt-10 flex items-center gap-2 text-primary-600 font-black text-sm group-hover:translate-x-2 transition-transform cursor-pointer">
                  Learn more <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
