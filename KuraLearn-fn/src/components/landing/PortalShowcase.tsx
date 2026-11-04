import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, Brain, BookOpen, Clock, Heart, ShieldAlert } from "lucide-react";
import studentAvatar from "@/assets/student_avatar.png";
import teacherAvatar from "@/assets/teacher_avatar.png";
import parentAvatar from "@/assets/parent_avatar.png";
import headteacherAvatar from "@/assets/headteacher_avatar.png";
import schoolAdminAvatar from "@/assets/school_admin_avatar.png";

interface PortalTab {
  id: string;
  label: string;
  avatar: string;
  badge: string;
  title: string;
  description: string;
  color: string;
  accentBg: string;
  points: string[];
  mockCard: {
    title: string;
    sub: string;
    value: string;
  };
}

const portals: PortalTab[] = [
  {
    id: "teacher",
    label: "Teacher Portal",
    avatar: teacherAvatar,
    badge: "Smart Prep",
    title: "Reclaim Your Teaching Time",
    description:
      "KuraLearn streamlines lessons planning, assessment generation, grading, and attendance. Focus on what truly matters: inspiring and supporting your students.",
    color: "bg-purple-600",
    accentBg: "bg-purple-50 text-[#6d3eeb]",
    points: [
      "AI lesson plan assistant",
      "One-click attendance tracker",
      "Quick marks entry and digital report cards",
      "Upload syllabi and share cloud resources",
    ],
    mockCard: {
      title: "Teacher Overview",
      sub: "Average Class Score",
      value: "84% (Term 1)",
    },
  },
  {
    id: "student",
    label: "Student Portal",
    avatar: studentAvatar,
    badge: "Interactive",
    title: "Engage In A Personalized Learning Path",
    description:
      "Students gain access to dynamic, alignment-checked courses, fun continuous assessment quizzes, performance stats, and secure peer-to-peer messaging.",
    color: "bg-blue-600",
    accentBg: "bg-blue-50 text-blue-600",
    points: [
      "Access custom class slides & syllabus",
      "Gamified continuous revision quizzes",
      "Personalized learning dashboards",
      "Smart practice guides for weaker subjects",
    ],
    mockCard: {
      title: "Student Progress",
      sub: "Revision Quizzes Completed",
      value: "18 Quizzes",
    },
  },
  {
    id: "parent",
    label: "Parent Portal",
    avatar: parentAvatar,
    badge: "Monitoring",
    title: "Never Miss A Learning Moment",
    description:
      "Parents can securely log in to review real-time student attendance, exam report cards, teacher comments, school notices, and chat directly with teachers.",
    color: "bg-amber-600",
    accentBg: "bg-amber-50 text-amber-600",
    points: [
      "SMS & in-app attendance alerts",
      "Term report cards visible instantly",
      "Direct secure channel to classroom teachers",
      "Multilingual report summaries",
    ],
    mockCard: {
      title: "Parent Dashboard",
      sub: "Student School Attendance",
      value: "98.5% present",
    },
  },
  {
    id: "admin",
    label: "School Administration",
    avatar: headteacherAvatar,
    badge: "Management",
    title: "Centralized School Operations",
    description:
      "For headteachers, registrars and school administrators. Manage student records, fees, staff, audit logs and school statistics.",
    color: "bg-emerald-700",
    accentBg: "bg-emerald-50 text-emerald-700",
    points: [
      "Comprehensive digital registrar log",
      "Interactive school attendance audits",
      "Secure data locks & role protections",
      "Multi-tenant billing dashboard insights",
    ],
    mockCard: {
      title: "Admin Hub",
      sub: "Total Registered Students",
      value: "1,250 Students",
    },
  },
];

export default function PortalShowcase() {
  const [activeTab, setActiveTab] = useState("teacher");
  const tabData = portals.find((p) => p.id === activeTab)!;

  return (
    <section id="portals" className="py-24 bg-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-[#f8fafc] to-transparent -z-10" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#6d3eeb]">
            Role-Based Solutions
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight text-slate-800">
            A Specialized View for Every Stakeholder
          </h2>
          <p className="text-sm font-semibold text-slate-500 leading-relaxed">
            KuraLearn connects the entire academic circle. Select a portal below to experience the
            tailored UI and workflow features designed for each role.
          </p>
        </div>

        {/* Dynamic Portal Selector Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
          {portals.map((portal) => (
            <button
              key={portal.id}
              onClick={() => setActiveTab(portal.id)}
              className={`rounded-full px-6 py-3 text-xs font-bold transition-all ${
                activeTab === portal.id
                  ? "bg-slate-850 text-white shadow-md"
                  : "bg-slate-50 text-slate-550 border border-slate-100 hover:bg-slate-100/70"
              }`}
            >
              {portal.label}
            </button>
          ))}
        </div>

        {/* Interactive Content Display */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Descriptions */}
          <div className="lg:col-span-6 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                {/* Badge */}
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[10px] font-bold uppercase tracking-wide ${tabData.accentBg}`}
                >
                  {tabData.badge}
                </span>

                <h3 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-slate-800 leading-tight">
                  {tabData.title}
                </h3>

                <p className="text-sm font-semibold leading-relaxed text-slate-500">
                  {tabData.description}
                </p>

                {/* Bullets List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {tabData.points.map((pt) => (
                    <div key={pt} className="flex gap-2.5 items-start">
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${tabData.accentBg} bg-opacity-30`}
                      >
                        <Check size={12} className="stroke-[3]" />
                      </span>
                      <span className="text-xs font-bold text-slate-650 leading-snug">{pt}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-4">
                  <Link
                    to="/login"
                    className={`inline-flex items-center justify-center gap-1.5 rounded-full ${tabData.color} px-6 py-3 text-xs font-bold text-white shadow-md hover:shadow-lg`}
                  >
                    <span>Launch {tabData.label}</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Column: Visual Mockup */}
          <div className="lg:col-span-6 flex justify-center relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="relative w-full max-w-[450px]"
              >
                {/* Back Plate Card */}
                <div className="w-full aspect-[4/3] rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden relative shadow-inner">
                  <div className="absolute inset-0 opacity-[0.03] moving-grid" />

                  {/* Big avatar representation */}
                  <img
                    src={tabData.avatar}
                    alt={tabData.label}
                    className="h-[80%] w-auto object-contain drop-shadow-2xl"
                  />

                  {/* Glassmorphic card overlay */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/40 bg-white/70 p-4 shadow-lg flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        {tabData.mockCard.title}
                      </h4>
                      <p className="text-xs font-bold text-slate-500">{tabData.mockCard.sub}</p>
                    </div>
                    <span
                      className={`rounded-xl px-3.5 py-1.5 text-xs font-extrabold bg-slate-900 text-white`}
                    >
                      {tabData.mockCard.value}
                    </span>
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
