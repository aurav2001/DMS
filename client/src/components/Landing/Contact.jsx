import React from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { motion } from 'framer-motion';

const Contact = () => {
  return (
    <section id="contact" className="py-16 sm:py-20 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16">
          {/* Info */}
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 sm:mb-6">Let's Talk</h2>
            <p className="text-base sm:text-lg text-slate-600 mb-8 sm:mb-10">
              Have questions about DocVault? Our team is here to help you get the most out of your document management.
            </p>

            <div className="space-y-4 sm:space-y-6">
              {[
                { icon: <Mail />, label: "Email", value: "[EMAIL_ADDRESS]" },
                { icon: <Phone />, label: "Phone", value: "+91 9818181818" },
                { icon: <MapPin />, label: "Location", value: "Block (B) Sec-63 Noida" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 sm:gap-4">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm text-slate-400 font-medium">{item.label}</div>
                    <div className="text-sm sm:text-base text-slate-900 font-semibold break-words">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-effect p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-slate-100"
          >
            <form className="space-y-4 sm:space-y-6">
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-inter" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input type="email" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-inter" placeholder="john@example.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-inter" placeholder="How can we help?" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                <textarea rows="4" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-inter" placeholder="Your message..."></textarea>
              </div>
              <button className="btn-primary w-full flex items-center justify-center gap-2">
                Send Message <Send className="w-5 h-5" />
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
