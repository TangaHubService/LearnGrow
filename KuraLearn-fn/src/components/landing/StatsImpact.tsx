import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { TrendingUp, Clock, FileText, Share2, ArrowRight, CheckCircle2 } from "lucide-react";

interface ImpactCard {
  icon: any;
  metric: string;
  label: string;
  before: string;
  after: string;
  color: string;
  textColor: string;
  badge: string;
}

const impactMetrics: ImpactCard[] = [
  {
    icon: FileText,
    metric: "90%",
    label: "Paperwork Reduction",
    before: "Sacks of physical ledgers & paper report cards",
    after: "Instant digital entries, bulk PDF downloads & SMS logs",
    color: "bg-purple-500/10 border-purple-500/20 hover:border-purple-500/40",
    textColor: "text-[#6d3eeb]",
    badge: "Operational Efficiency",
  },
  {
    icon: Clock,
    metric: "30 to 2m",
    label: "Roll Call Speed-up",
    before: "30 minutes lost per teacher per day calling names",
    after: "2 minutes via KuraLearn smart teacher mobile app roll call",
    color: "bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40",
    textColor: "text-blue-400",
    badge: "Saved Teaching Time",
  },
  {
    icon: Share2,
    metric: "+25%",
    label: "Parent Engagement",
    before: "Parents waiting till end-of-term to see marks",
    after: "Daily SMS triggers, real-time grades & notices",
    color: "bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40",
    textColor: "text-emerald-400",
    badge: "Continuous Feedback",
  },
  {
    icon: TrendingUp,
    metric: "+14%",
    label: "Attendance Increase",
    before: "High absenteeism rates due to slow parental response",
    after: "Immediate triggers alert parents, reducing truancy",
    color: "bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40",
    textColor: "text-amber-400",
    badge: "Student Success",
  },
];

export default function StatsImpact() {
  return (
    <section id="impact" className="py-24 bg-slate-900 text-white relative overflow-hidden">
      {/* Background neon blurs */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-indigo-950 via-slate-900 to-slate-950 -z-10" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3.5 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-300 border border-indigo-500/20">
            Platform Metrics
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight text-white leading-tight">
            Quantifiable Administrative & Academic Impact
          </h2>
          <p className="text-sm font-semibold text-slate-400 leading-relaxed">
            By consolidating school administrative tasks into KuraLearn's smart platform, schools
            across Rwanda experience dramatic efficiency shifts that directly enrich classroom
            teaching.
          </p>
        </div>

        {/* Impact Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {impactMetrics.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className={`rounded-2xl border p-6 bg-slate-950/40 transition-all duration-300 flex flex-col justify-between ${card.color}`}
              >
                <div className="space-y-4">
                  {/* Badge */}
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wide ${card.textColor}`}
                  >
                    {card.badge}
                  </span>

                  {/* Icon Widget */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white">
                    <Icon size={18} />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-4xl font-extrabold text-white tracking-tight">
                      {card.metric}
                    </h3>
                    <h4 className="text-sm font-extrabold text-slate-200">{card.label}</h4>
                  </div>
                </div>

                {/* Before/After breakdown */}
                <div className="mt-8 pt-4 border-t border-slate-800 space-y-3">
                  <div>
                    <span className="text-[7px] font-bold uppercase tracking-wide text-slate-500 block">
                      Before KuraLearn
                    </span>
                    <p className="text-[10px] font-bold text-slate-400 leading-relaxed mt-0.5">
                      {card.before}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 py-0.5">
                    <ArrowRight size={10} className="text-[#6d3eeb]" />
                  </div>
                  <div>
                    <span className="text-[7px] font-bold uppercase tracking-wide text-emerald-400 block">
                      With KuraLearn
                    </span>
                    <p className="text-[10px] font-bold text-slate-200 leading-relaxed mt-0.5">
                      {card.after}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Hours Saved Summary Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-16 rounded-2xl border border-slate-700 bg-slate-950/30 p-8 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex gap-4 items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-300">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                Over 10,000+ Teaching Hours Reclaimed
              </h3>
              <p className="text-xs font-semibold text-slate-400 mt-0.5 leading-relaxed">
                By automating lesson planning syllabus compliance, attendance triggers, and marks
                computations.
              </p>
            </div>
          </div>
          <Link
            to="/login"
            className="rounded-full bg-[#6d3eeb] px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-indigo-650 transition-all whitespace-nowrap"
          >
            Calculate Your School Savings
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
