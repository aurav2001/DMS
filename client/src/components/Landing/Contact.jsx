import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE } from '../../utils/api';


const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/public/contact`, formData);
      if (res.data.success) {
        toast.success('Your message has been sent!');
        setFormData({ name: '', email: '', subject: '', message: '' });
      }
    } catch (err) {
      console.error('Contact Error:', err);
      toast.error(err.response?.data?.message || 'Failed to send message. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6">Let's Talk</h2>
              <p className="text-lg text-slate-600">
                Have questions about DocVault? Our team is here to help you get the most out of your document management.
              </p>
            </div>
            
            <div className="space-y-6">
              {[
                { icon: <Mail className="w-5 h-5" />, label: "Email", value: "support@docvault.com" },
                { icon: <Phone className="w-5 h-5" />, label: "Phone", value: "+91 9818181818" },
                { icon: <MapPin className="w-5 h-5" />, label: "Location", value: "Block (B) Sec-63 Noida" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-sm text-slate-400 font-medium">{item.label}</div>
                    <div className="text-slate-900 font-semibold">{item.value}</div>
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
            className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-primary-500/5 border border-slate-100"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                  <input 
                    type="text" 
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-inter" 
                    placeholder="John Doe" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input 
                    type="email" 
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-inter" 
                    placeholder="john@example.com" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                <input 
                  type="text" 
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-inter" 
                  placeholder="How can we help?" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                <textarea 
                  rows="4" 
                  name="message"
                  required
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-inter" 
                  placeholder="Your message..."
                ></textarea>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg"
              >
                {loading ? (
                  <>Sending... <Loader2 className="w-5 h-5 animate-spin" /></>
                ) : (
                  <>Send Message <Send className="w-5 h-5" /></>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
