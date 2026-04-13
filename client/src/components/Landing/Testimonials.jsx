import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Legal Analyst at TechCore",
    quote: "DocVault has completely transformed how our team manages sensitive case files. The version control is a lifesaver!",
    avatar: "SJ"
  },
  {
    name: "Michael Chen",
    role: "Project Manager at BuildIt",
    quote: "The interface is so intuitive. Our team was onboarded within hours, and the search feature is incredibly fast.",
    avatar: "MC"
  },
  {
    name: "Emily Rodriguez",
    role: "Director of Operations",
    quote: "Finally, a DMS that actually makes sense. The sharing controls give us peace of mind when working with clients.",
    avatar: "ER"
  }
];

const Testimonials = () => {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">What Our Users Say</h2>
          <p className="text-lg text-slate-600">Join thousands of teams who trust DocVault.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-8 rounded-3xl bg-slate-50 border border-slate-100"
            >
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-lg text-slate-700 italic mb-8">"{t.quote}"</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-bold text-slate-900">{t.name}</div>
                  <div className="text-sm text-slate-500">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
