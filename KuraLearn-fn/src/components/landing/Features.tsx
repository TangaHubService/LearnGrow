import React from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Calendar,
  Award,
  BookOpen,
  MessageSquare,
  FileSpreadsheet,
  CloudLightning,
  Globe,
  WifiOff,
  UserCheck,
  ShieldCheck,
  Bell,
} from "lucide-react";

interface FeatureItem {
  icon: any;
  title: string;
  description: string;
  badge?: string;
  color: string;
  textColor: string;
}

const mainFeatures: FeatureItem[] = [
  {
    icon: Brain,
    title: "Learner Analytics",
    description:
      "See which learners are falling behind, with suggestions on how teachers can help them.",
    badge: "AI assisted",
    color: "bg-purple-50 border-purple-100 group-hover:border-purple-300",
    textColor: "text-[#6d3eeb]",
  },
  {
    icon: UserCheck,
    title: "Smart Attendance",
    description:
      "Take quick digital attendance on mobile or desktop. Notify parents in real-time if a student is absent from class.",
    color: "bg-blue-50 border-blue-100 group-hover:border-blue-300",
    textColor: "text-blue-600",
  },
  {
    icon: Award,
    title: "Marks & Automated Reports",
    description:
      "Say goodbye to manual paperwork. Enter student scores and generate beautiful, print-ready, Kinyarwanda/English report cards in seconds.",
    badge: "Saves Hours",
    color: "bg-emerald-50 border-emerald-100 group-hover:border-emerald-300",
    textColor: "text-emerald-700",
  },
  {
    icon: BookOpen,
    title: "Assessments & Quizzes",
    description:
      "Create lesson quizzes, assign homework, and conduct standard terms tests with automatic grading and performance graphs.",
    color: "bg-amber-50 border-amber-100 group-hover:border-amber-300",
    textColor: "text-amber-700",
  },
  {
    icon: MessageSquare,
    title: "Parent Communications",
    description:
      "Keep parents in the loop. Share performance updates, general notices, or private messages directly to their parent portal dashboard.",
    color: "bg-rose-50 border-rose-100 group-hover:border-rose-300",
    textColor: "text-rose-600",
  },
  {
    icon: FileSpreadsheet,
    title: "Lesson Plan Builder",
    description:
      "Plan lessons, check them against the curriculum, and share them with school heads.",
    color: "bg-teal-50 border-teal-100 group-hover:border-teal-300",
    textColor: "text-teal-600",
  },
  {
    icon: WifiOff,
    title: "Offline-Friendly App",
    description:
      "Optimized for rural settings. Sync school information locally. Work perfectly offline and upload changes automatically when online.",
    badge: "Rural Support",
    color: "bg-cyan-50 border-cyan-100 group-hover:border-cyan-300",
    textColor: "text-cyan-600",
  },
  {
    icon: CloudLightning,
    title: "Google Drive Integrations",
    description:
      "Upload and organize learning syllabi, course resources, and video lectures directly linked with standard cloud drives.",
    color: "bg-indigo-50 border-indigo-100 group-hover:border-indigo-300",
    textColor: "text-indigo-650",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function Features() {
  return (
    <section id="features" className="py-24 bg-[#f8fafc] relative overflow-hidden">
      {/* Visual Accents */}

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
          <span className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#6d3eeb]">
            Everything you need
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight text-slate-800">
            Everything your school needs in one place
          </h2>
          <p className="text-sm font-semibold text-slate-500 leading-relaxed">
            From attendance and marks to reports and parent updates, KuraLearn keeps your school's
            daily work in one system.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
        >
          {mainFeatures.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                variants={cardVariants}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-xl hover:border-slate-200 transition-all duration-300"
              >
                <div className="space-y-4">
                  {/* Badge */}
                  {feat.badge && (
                    <span className="absolute top-4 right-4 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter text-[#6d3eeb]">
                      {feat.badge}
                    </span>
                  )}

                  {/* Icon Wrapper */}
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${feat.color} ${feat.textColor} border transition-all duration-300 shadow-sm`}
                  >
                    <Icon size={20} />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-base font-extrabold text-slate-800 tracking-tight group-hover:text-[#6d3eeb] transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 leading-relaxed line-clamp-4">
                      {feat.description}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-1.5 border-t border-slate-50 pt-4">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 group-hover:text-[#6d3eeb] transition-colors">
                    Saves School Time
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Small Feature Grid Summary */}
        <div className="mt-16 bg-white/50 border border-slate-100 rounded-2xl p-8">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-6 text-center">
            More platform capabilities
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Bell, label: "Real-time Alerts" },
              { icon: ShieldCheck, label: "Data Protection Compliant" },
              { icon: Globe, label: "Multilingual Support" },
              { icon: FileSpreadsheet, label: "REB Marksheet Sync" },
            ].map((subFeat, i) => {
              const SubIcon = subFeat.icon;
              return (
                <div key={subFeat.label} className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-[#6d3eeb]">
                    <SubIcon size={14} />
                  </div>
                  <span className="text-xs font-bold text-slate-700">{subFeat.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
