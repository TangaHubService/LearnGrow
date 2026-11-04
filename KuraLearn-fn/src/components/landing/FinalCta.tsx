import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import educationIllustration from "@/assets/education_illustration.png";
import { CheckCircle2 } from "lucide-react";

export default function FinalCta() {
  return (
    <section className="relative max-w-7xl mx-auto px-6 lg:px-8 mt-16 mb-20 md:mb-28 z-10 text-left">
      {/* Glow Aura Background Effect */}

      {/* Floating Card Inner Box */}
      <div className="relative rounded-2xl border border-white/10 bg-indigo-950 px-8 py-10 md:py-14 md:px-12 shadow-lg overflow-hidden text-white">
        {/* Moving Grid Layer */}
        <div className="absolute inset-0 opacity-[0.06] moving-grid pointer-events-none" />

        {/* Ambient Blobs */}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
          {/* Left Column: Details */}
          <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wide text-[#c7d2fe]">
                Get started
              </span>
            </div>

            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-2xl sm:text-3xl xl:text-[38px] font-display font-extrabold tracking-tight text-white leading-[1.2]"
            >
              See how KuraLearn works for your school
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-xs sm:text-sm font-semibold leading-relaxed text-slate-350 max-w-lg mx-auto lg:mx-0"
            >
              Join hundreds of schools in Rwanda already using KuraLearn to simplify school
              management, streamline operations, and improve student learning outcomes.
            </motion.p>

            {/* Checklist */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center lg:justify-start pt-1 text-[10px] font-bold text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-emerald-400" />
                <span>REB Curriculum Compliant</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-emerald-400" />
                <span>Works Offline (Local Sync)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-emerald-400" />
                <span>30-Day Free Trial</span>
              </div>
            </div>

            {/* Actions Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-3"
            >
              <Link
                to="/login"
                className="w-full sm:w-auto text-center rounded-full bg-white px-8 py-3 text-xs font-bold text-[#6d3eeb] shadow-xl hover:bg-slate-50 transition-all hover:scale-[1.03] active:scale-[0.98]"
              >
                Request a Demo
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto text-center rounded-full border border-white/20 bg-white/5 px-8 py-3 text-xs font-bold text-white shadow-sm transition-all hover:bg-white/10 hover:scale-[1.03] active:scale-[0.98]"
              >
                Start Free Trial
              </Link>
            </motion.div>
          </div>

          {/* Right Column: Image with Overlays */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end relative mt-6 lg:mt-0">
            <div className="relative w-full max-w-[340px] lg:max-w-none">
              {/* Floating Stat Widget */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="absolute -top-4 -left-6 z-20 flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/60 p-2.5 shadow-lg pointer-events-none text-left"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 size={10} />
                </div>
                <div>
                  <span className="block text-[7px] font-bold uppercase tracking-wide text-slate-400">
                    Total Saved Hours
                  </span>
                  <span className="block text-[11px] font-bold text-white leading-none mt-0.5">
                    10,000+ Hrs
                  </span>
                </div>
              </motion.div>

              {/* Floating Badge */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="absolute -bottom-4 right-2 z-20 flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/60 p-2.5 shadow-lg pointer-events-none text-left"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                  <CheckCircle2 size={10} />
                </div>
                <div>
                  <span className="block text-[7px] font-bold uppercase tracking-wide text-slate-400">
                    School Rating
                  </span>
                  <span className="block text-[11px] font-bold text-white leading-none mt-0.5">
                    4.9★ Rating
                  </span>
                </div>
              </motion.div>

              {/* Central Image inside visual card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="rounded-2xl overflow-hidden shadow-lg border border-white/10 relative z-10 aspect-[4/3] bg-slate-900/40"
              >
                <img
                  src={educationIllustration}
                  alt="KuraLearn Students"
                  className="w-full h-full object-cover select-none pointer-events-none opacity-90"
                />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
