import React from 'react';
import { motion } from 'framer-motion';
import { 
  Cloud, 
  Search, 
  History, 
  Lock, 
  Users, 
  Activity 
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
    <section id="features" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }}
            className="text-4xl font-bold text-slate-900 mb-4"
          >
            Powerful Features for Modern Teams
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-600 max-w-2xl mx-auto"
          >
            Everything you need to manage your documents effectively in one place.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:border-primary-100 transition-all group"
            >
              <div className="bg-slate-50 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary-50 transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
