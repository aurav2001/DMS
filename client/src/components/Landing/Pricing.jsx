import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const plans = [
  {
    name: "Free",
    price: "0",
    features: ["5GB Storage", "Basic Search", "Single User", "Community Support"],
    recommended: false
  },
  {
    name: "Pro",
    price: "29",
    features: ["50GB Storage", "Full-text Search", "Version History", "Role-based Access", "Priority Support"],
    recommended: true
  },
  {
    name: "Enterprise",
    price: "99",
    features: ["Unlimited Storage", "Advanced AI Search", "Audit Logs", "SAML SSO", "24/7 Dedicated Support"],
    recommended: false
  }
];

const Pricing = () => {
  return (
    <section id="pricing" className="py-16 sm:py-20 lg:py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-14 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 sm:mb-4">Simple, Transparent Pricing</h2>
          <p className="text-base sm:text-lg text-slate-600 px-2">Choose the plan that fits your needs.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-md sm:max-w-none mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm border-2 ${plan.recommended ? 'border-primary-600 lg:scale-105 shadow-xl z-10' : 'border-slate-100'}`}
            >
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider whitespace-nowrap">
                  Recommended
                </div>
              )}
              <div className="text-center mb-6 sm:mb-8">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">${plan.price}</span>
                  <span className="text-sm sm:text-base text-slate-400">/month</span>
                </div>
              </div>

              <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm sm:text-base text-slate-600">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button className={`w-full py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base transition-all ${plan.recommended ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}>
                Choose {plan.name}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
