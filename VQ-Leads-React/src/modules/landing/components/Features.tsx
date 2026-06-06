import React from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Users, ShieldCheck, Zap, BarChart } from 'lucide-react';

const features = [
  {
    icon: <Target className="w-6 h-6 text-blue-400" />,
    title: "Lead Pipeline",
    description: "Visually manage your leads from new prospects to closed deals with intuitive Kanban boards."
  },
  {
    icon: <TrendingUp className="w-6 h-6 text-cyan-400" />,
    title: "Commission Tracking",
    description: "Automate commission calculations with custom splits, roles, and real-time payout tracking."
  },
  {
    icon: <Users className="w-6 h-6 text-indigo-400" />,
    title: "Team Management",
    description: "Organize your sales force, set permissions, and monitor individual agent performance seamlessly."
  },
  {
    icon: <Zap className="w-6 h-6 text-yellow-400" />,
    title: "Automated Workflows",
    description: "Set up triggers for follow-ups, lead assignments, and status updates to save hours of manual work."
  },
  {
    icon: <BarChart className="w-6 h-6 text-purple-400" />,
    title: "Advanced Analytics",
    description: "Generate deep insights on lead sources, conversion rates, and revenue projections."
  },
  {
    icon: <ShieldCheck className="w-6 h-6 text-green-400" />,
    title: "Bank-grade Security",
    description: "Your data is encrypted and protected with industry-leading security protocols and role-based access."
  }
];

export const Features: React.FC = () => {
  return (
    <section id="features" className="py-24 relative bg-[#0f172a] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-5xl font-bold text-white mb-6"
          >
            Everything you need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">scale your sales</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-slate-400"
          >
            Brisk provides a complete toolkit designed for high-performing sales teams. No more juggling multiple apps—manage it all in one powerful platform.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-blue-500/30 transition-all duration-300 group"
            >
              <div className="w-14 h-14 rounded-xl bg-slate-800/50 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-slate-800 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
