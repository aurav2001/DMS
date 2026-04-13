import React from 'react';
import { motion } from 'framer-motion';

const steps = [
  { number: "01", title: "Register & Login", desc: "Create your secure account in seconds and get started immediately." },
  { number: "02", title: "Upload Documents", desc: "Drag and drop your files into our secure vault with ease." },
  { number: "03", title: "Organize & Tag", desc: "Use tags and folders to keep your documents structured and searchable." },
  { number: "04", title: "Share & Collaborate", desc: "Invite team members and collaborate on files with full control." }
];

const HowItWorks = () => {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">How It Works</h2>
          <p className="text-lg text-slate-600">Simple steps to streamline your document workflow.</p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative text-center"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 text-primary-600 rounded-2xl text-2xl font-bold mb-6 relative z-10">
                {step.number}
              </div>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-full h-0.5 border-t-2 border-dashed border-primary-100 -z-0"></div>
              )}
              <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
              <p className="text-slate-600">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
