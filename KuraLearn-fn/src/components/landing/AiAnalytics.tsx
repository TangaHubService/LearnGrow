import React from "react";
import { motion } from "framer-motion";
import { Brain, TrendingUp, AlertTriangle, Lightbulb, CheckCircle2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "Week 1", score: 62, prediction: 65 },
  { name: "Week 3", score: 68, prediction: 72 },
  { name: "Week 5", score: 71, prediction: 78 },
  { name: "Week 7", score: 74, prediction: 85 },
  { name: "Week 9", score: 78, prediction: 90 },
  { name: "Week 11", score: 82, prediction: 94 },
];

export default function AiAnalytics() {
  return (
    <section id="ai-analytics" className="py-24 bg-slate-850 text-white relative overflow-hidden">
      {/* Moving decorative background grids */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-900/50 to-slate-950 opacity-90 -z-10" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Descriptive AI Features */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 shadow-sm"
              >
                <span className="text-xs font-bold uppercase tracking-wide text-purple-300">
                  Learner insights
                </span>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight text-white"
              >
                Spot learners who need help early
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="text-sm font-semibold text-slate-400 leading-relaxed"
              >
                KuraLearn’s embedded AI engine automatically monitors attendance, continuous
                revision marks, and classroom participation to spot trends before they impact final
                national REB marks.
              </motion.p>
            </div>

            {/* AI Callouts Grid */}
            <div className="space-y-6">
              {[
                {
                  icon: AlertTriangle,
                  title: "Risk Student Alerts",
                  desc: "System identifies students whose marks are declining by over 10% or who missed consecutive classes, prompting early action.",
                  color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
                },
                {
                  icon: Lightbulb,
                  title: "Smart Teacher Recommendations",
                  desc: "Get auto-generated revision worksheets and competency focus maps for your classes to assist weak learners.",
                  color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
                },
                {
                  icon: CheckCircle2,
                  title: "Parent-Friendly Summaries",
                  desc: "Transcribes complex performance reports into clear, local language audio/text updates sent straight to parents.",
                  color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
                },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className={`flex gap-4 p-4 rounded-2xl border ${item.color}`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/5">
                      <Icon size={16} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold uppercase tracking-wide text-white">
                        {item.title}
                      </h4>
                      <p className="text-xs font-semibold text-slate-350 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Right Column: High-fidelity Neon Mock Chart Dashboard */}
          <div className="lg:col-span-7 flex justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="w-full max-w-[550px] rounded-2xl border border-slate-700 bg-slate-900/60 p-6 shadow-lg relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-purple-400">
                    KuraLearn Insights
                  </span>
                  <h3 className="text-sm font-extrabold text-white">Class performance predictor</h3>
                </div>
                <div className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[10px] font-bold text-emerald-400">
                  <TrendingUp size={12} />
                  <span>AI Grade Boost +12.4%</span>
                </div>
              </div>

              {/* Real Area Chart */}
              <div className="h-60 w-full mb-6 text-slate-400">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6d3eeb" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6d3eeb" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorPrediction" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="name"
                      stroke="#475569"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#475569"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      domain={[50, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "12px",
                        color: "#fff",
                        fontSize: "11px",
                        fontWeight: "bold",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#6d3eeb"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorScore)"
                      name="Current Grade Average"
                    />
                    <Area
                      type="monotone"
                      dataKey="prediction"
                      stroke="#38bdf8"
                      strokeWidth={3}
                      strokeDasharray="4 4"
                      fillOpacity={1}
                      fill="url(#colorPrediction)"
                      name="AI Predicted Average"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Floating overlay 1: Alert badge */}
              <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4">
                <div className="rounded-2xl bg-slate-800/40 border border-slate-700/50 p-3.5">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-amber-400 block mb-1">
                    Attention Required
                  </span>
                  <p className="text-sm font-extrabold text-white">3 Weak Learners</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">
                    Flagged in mathematics
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-800/40 border border-slate-700/50 p-3.5">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-purple-400 block mb-1">
                    Predictive insight
                  </span>
                  <p className="text-sm font-extrabold text-white">96% Syllabus Complete</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">
                    Class on-track for mock exams
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
