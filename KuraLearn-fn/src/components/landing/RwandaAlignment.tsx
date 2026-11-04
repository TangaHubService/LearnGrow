import React from "react";
import { motion } from "framer-motion";
import { Check, ShieldCheck, Flag, Shield, Landmark, BookOpen, AlertCircle } from "lucide-react";
import heroImg from "@/assets/kuralearn_hero.png";

export default function RwandaAlignment() {
  return (
    <section id="rwanda-alignment" className="py-24 bg-white relative overflow-hidden">
      {/* Background accents */}

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Visual representation */}
          <div className="lg:col-span-6 relative flex justify-center order-last lg:order-first">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative w-full max-w-[480px] rounded-2xl overflow-hidden shadow-lg border border-slate-100 p-3 bg-white"
            >
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-900">
                <img
                  src={heroImg}
                  alt="Students in Rwandan Classroom"
                  className="w-full h-full object-cover opacity-90"
                />

                {/* Visual tag overlay representing local flags/colors */}
                <div className="absolute top-4 left-4 bg-emerald-700/90 text-white rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide">
                  🇷🇼 Built for Rwanda
                </div>
              </div>

              {/* Glassmorphic floating card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/40 bg-white/80 p-4.5 shadow-lg flex gap-3.5 items-start"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Landmark size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-slate-800">
                    REB Syllabus Check
                  </h4>
                  <p className="text-xs font-semibold text-slate-500 leading-relaxed mt-0.5">
                    100% matched to the Competency-Based Curriculum (CBC) standard.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Right Column: Local alignment details */}
          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-650">
                REB CBC Standard Compliant
              </span>
              <h2 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight text-slate-800 leading-tight">
                Made for schools in Rwanda
              </h2>
              <p className="text-sm font-semibold leading-relaxed text-slate-500">
                Software should fit how schools here actually work. KuraLearn follows the Rwanda
                Basic Education Board (REB) syllabus and is built for places with limited internet.
              </p>
            </div>

            {/* Local features checklist */}
            <div className="space-y-6">
              {[
                {
                  title: "Competency-Based Curriculum (CBC) Support",
                  desc: "Automatic alignment tools mapped to standard CBC subjects. Record student assessments, grade core competencies, and export mark sheets easily.",
                },
                {
                  title: "High Support for Rural Schools",
                  desc: "Works under low-data or offline settings. Teachers can log student marks and take daily attendance without active internet. Data auto-syncs when online.",
                },
                {
                  title: "Multilingual Localizations",
                  desc: "Supports English, French, and Kinyarwanda out of the box, ensuring teachers, parents, and young students can engage in the language they speak best.",
                },
                {
                  title: "Direct Parent SMS Alerts",
                  desc: "No smartphone? No problem. KuraLearn’s smart platform auto-dispatches essential attendance triggers and academic notices via standard SMS to support rural parents.",
                },
              ].map((item, idx) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex gap-3 items-start"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-650 bg-opacity-80">
                    <Check size={12} className="stroke-[3]" />
                  </span>
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-800">
                      {item.title}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
