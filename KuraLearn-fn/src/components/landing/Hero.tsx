import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Play,
  Shield,
  Brain,
  X,
  Search,
  Bell,
  UserCheck,
  Award as AwardIcon,
  HelpCircle,
  Users,
  BookOpen,
  Mail,
  CheckCircle2,
} from "lucide-react";
import teacherAvatar from "@/assets/teacher_avatar.png";
import studentAvatar from "@/assets/student_avatar.png";
import parentAvatar from "@/assets/parent_avatar.png";
import schoolAdminAvatar from "@/assets/school_admin_avatar.png";
import kuraLogo from "@/assets/kuraLogo.png";

export default function Hero() {
  const [videoOpen, setVideoOpen] = useState(false);

  return (
    <>
      <section
        id="hero"
        className="relative bg-white pt-28 md:pt-32 pb-20 md:pb-24 overflow-hidden"
      >
        {/* Soft Grid Lines Background */}
        <div className="absolute inset-0 moving-grid opacity-[0.4] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-6 lg:px-8 w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Headings & Text */}
            <div className="lg:col-span-6 space-y-8 text-center lg:text-left">
              {/* Super Header Tag */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 shadow-sm"
              >
                <span className="text-[10px] font-bold uppercase tracking-wide text-orange-700">
                  School management system
                </span>
              </motion.div>

              {/* Main Headline */}
              <div className="space-y-4">
                <motion.h1
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.6 }}
                  className="text-4xl sm:text-5xl xl:text-[52px] font-display font-extrabold tracking-tight text-slate-900 leading-[1.1]"
                >
                  Run your whole school <br /> from one place, <br />{" "}
                  <span className="text-blue-700">made for Rwanda.</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="text-sm font-semibold leading-relaxed text-slate-500 max-w-lg mx-auto lg:mx-0"
                >
                  KuraLearn helps schools manage classes, marks and attendance, keep parents
                  informed, and see which learners need extra support.
                </motion.p>
              </div>

              {/* Horizontal Tag badging */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap justify-center lg:justify-start gap-3"
              >
                <div className="flex items-center gap-1.5 rounded-full bg-purple-50 px-4 py-1.5 text-xs font-bold text-purple-700 shadow-sm border border-purple-100">
                  <UserCheck size={13} />
                  <span>Easy to Use</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-700 shadow-sm border border-emerald-100">
                  <CheckCircle2 size={13} />
                  <span>Works Offline</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-bold text-blue-700 shadow-sm border border-blue-100">
                  <Shield size={13} />
                  <span>Secure & Reliable</span>
                </div>
              </motion.div>

              {/* CTA Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
              >
                <Link
                  to="/login"
                  className="w-full sm:w-auto text-center rounded-xl bg-blue-600 px-8 py-4 text-sm font-bold text-white shadow-xl hover:bg-blue-700 transition-all hover:scale-105"
                >
                  Get Started Free
                </Link>
                <button
                  onClick={() => setVideoOpen(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-8 py-4 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
                >
                  <Play size={14} className="fill-slate-650 text-slate-650" />
                  <span>Watch Demo</span>
                </button>
              </motion.div>

              {/* Social Proof */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center lg:justify-start gap-3 pt-2"
              >
                {/* School/Teacher overlapping avatars */}
                <div className="flex -space-x-2.5">
                  <img
                    alt=""
                    src={teacherAvatar}
                    className="h-8 w-8 rounded-full border-2 border-white object-cover shadow-sm bg-slate-50"
                  />
                  <img
                    alt=""
                    src={studentAvatar}
                    className="h-8 w-8 rounded-full border-2 border-white object-cover shadow-sm bg-slate-50"
                  />
                  <img
                    alt=""
                    src={parentAvatar}
                    className="h-8 w-8 rounded-full border-2 border-white object-cover shadow-sm bg-slate-50"
                  />
                </div>
                <div className="text-left">
                  {/* Stars rating */}
                  <div className="flex gap-0.5 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className="text-sm">
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    Trusted by 500+ schools in Rwanda
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Right Column: Custom CSS High-Fidelity Dashboard Mockup */}
            <div className="lg:col-span-6 relative flex justify-center mt-6 lg:mt-0">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative w-full max-w-md md:max-w-lg xl:max-w-xl"
              >
                {/* Premium Background Glow behind mockup */}

                {/* Main Graphic Frame Container */}
                <div className="relative w-full rounded-2xl border border-white/10 bg-slate-900/40 p-2.5 shadow-lg overflow-hidden aspect-[4/3] flex items-center justify-center">
                  {/* Simulated School ERP Web Page */}
                  <div className="h-full w-full bg-white rounded-[1.6rem] shadow-md border border-slate-100 flex overflow-hidden text-[10px] font-sans">
                    {/* Sidebar (left) */}
                    <div className="w-32 bg-slate-50 border-r border-slate-100 p-2.5 flex flex-col justify-between select-none">
                      <div className="space-y-4">
                        {/* Logo header */}
                        <div className="flex items-center gap-1.5 px-1 py-0.5">
                          <img src={kuraLogo} alt="" className="h-4 w-4 object-contain" />
                          <span className="font-display text-[10px] font-extrabold text-slate-800">
                            KuraLearn
                          </span>
                        </div>
                        {/* Sidebar Items */}
                        <div className="space-y-0.5">
                          {[
                            { label: "Dashboard", icon: LayoutDashboard, active: true },
                            { label: "Students", icon: Users },
                            { label: "Teachers", icon: teacherAvatar },
                            { label: "Classes", icon: BookOpen },
                            { label: "Attendance", icon: UserCheck },
                            { label: "Exams", icon: AwardIcon },
                            { label: "Reports", icon: Bell },
                            { label: "Messages", icon: Mail },
                            { label: "Settings", icon: HelpCircle },
                          ].map((item, idx) => {
                            const Icon = item.icon;
                            const isActive = item.active;
                            return (
                              <div
                                key={item.label}
                                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                                  isActive
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-slate-500 hover:bg-slate-100/50"
                                }`}
                              >
                                {typeof Icon === "string" ? (
                                  <img
                                    src={Icon}
                                    alt=""
                                    className="h-3 w-3 rounded-full object-cover"
                                  />
                                ) : (
                                  <Icon
                                    size={11}
                                    className={isActive ? "text-blue-600" : "text-slate-500"}
                                  />
                                )}
                                <span>{item.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Main Work Area */}
                    <div className="flex-1 bg-white flex flex-col">
                      {/* Top Bar Header */}
                      <div className="h-10 border-b border-slate-100 px-4 flex items-center justify-between">
                        {/* Fake search */}
                        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1 text-slate-500 w-36">
                          <Search size={10} />
                          <span className="text-[10px] font-semibold">
                            Search students, marks...
                          </span>
                        </div>
                        {/* Actions */}
                        <div className="flex items-center gap-3">
                          <div className="relative p-1 text-slate-500 hover:text-slate-600 cursor-pointer">
                            <Bell size={11} />
                            <span className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-red-500" />
                          </div>
                          {/* Profile Block */}
                          <div className="flex items-center gap-2 pl-2 border-l border-slate-100">
                            <img
                              alt=""
                              src={schoolAdminAvatar}
                              className="h-5 w-5 rounded-full border border-slate-200 object-cover"
                            />
                            <div className="text-left">
                              <span className="block text-[10px] font-extrabold text-slate-800 leading-tight">
                                John Doe
                              </span>
                              <span className="block text-[6px] font-bold text-slate-500">
                                Admin
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Dashboard Contents Scroll */}
                      <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-[#fafbfc]">
                        {/* Stats grid */}
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            {
                              label: "Total Students",
                              value: "2,453",
                              color: "text-blue-600",
                              bg: "bg-blue-50",
                            },
                            {
                              label: "Teachers",
                              value: "125",
                              color: "text-emerald-700",
                              bg: "bg-emerald-50",
                            },
                            {
                              label: "Attendance",
                              value: "92%",
                              color: "text-red-600",
                              bg: "bg-red-50",
                            },
                            {
                              label: "Avg. Performance",
                              value: "78%",
                              color: "text-amber-700",
                              bg: "bg-amber-50",
                            },
                          ].map((stat) => (
                            <div
                              key={stat.label}
                              className="bg-white rounded-lg border border-slate-100 p-2 text-left"
                            >
                              <span className="block text-[7px] font-bold text-slate-500 uppercase tracking-tight">
                                {stat.label}
                              </span>
                              <span
                                className={`block text-xs font-bold tracking-tight mt-0.5 ${stat.color}`}
                              >
                                {stat.value}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Performance row */}
                        <div className="grid grid-cols-12 gap-3">
                          {/* Area Chart representation */}
                          <div className="col-span-8 bg-white border border-slate-100 rounded-lg p-2.5 flex flex-col justify-between">
                            <span className="block font-extrabold text-[10px] text-slate-800 mb-1">
                              Performance Overview
                            </span>

                            {/* Fake Sparkline Graph */}
                            <div className="h-16 w-full flex items-end relative py-1">
                              {/* Graphic vector lines representation */}
                              <svg
                                className="absolute inset-0 w-full h-full"
                                viewBox="0 0 100 40"
                                preserveAspectRatio="none"
                              >
                                <defs>
                                  <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                  </linearGradient>
                                </defs>
                                <path
                                  d="M 0 35 Q 20 20 40 28 T 80 10 T 100 15 L 100 40 L 0 40 Z"
                                  fill="url(#gradient)"
                                />
                                <path
                                  d="M 0 35 Q 20 20 40 28 T 80 10 T 100 15"
                                  fill="none"
                                  stroke="#3b82f6"
                                  strokeWidth="1.5"
                                />
                              </svg>
                              {/* Fake chart tooltips */}
                              <div className="absolute top-1 right-[20%] bg-[#0f172a] text-white rounded px-1.5 py-0.5 text-[6px] font-bold shadow-md">
                                Max Performance: 92%
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[6px] font-bold text-slate-500 uppercase tracking-wide pt-1 border-t border-slate-50">
                              <span>Jan</span>
                              <span>Feb</span>
                              <span>Mar</span>
                              <span>Apr</span>
                              <span>May</span>
                              <span>Jun</span>
                            </div>
                          </div>

                          {/* Doughnut Chart representation */}
                          <div className="col-span-4 bg-white border border-slate-100 rounded-lg p-2.5 flex flex-col justify-between">
                            <span className="block font-extrabold text-[10px] text-slate-800 mb-1">
                              Top Subjects Performance
                            </span>
                            <div className="flex items-center justify-center py-1">
                              <div className="h-12 w-12 rounded-full border-[6px] border-blue-500 border-t-slate-100 flex items-center justify-center relative shadow-sm">
                                <span className="text-[7px] font-bold text-slate-800">92%</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-x-1 gap-y-0.5 text-[6px] font-bold text-slate-500">
                              <div className="flex items-center gap-1">
                                <span className="h-1 w-1 rounded-full bg-blue-500" />
                                <span>Mathematics</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="h-1 w-1 rounded-full bg-[#10b981]" />
                                <span>Science</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="h-1 w-1 rounded-full bg-[#f59e0b]" />
                                <span>Kinyarwanda</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="h-1 w-1 rounded-full bg-slate-300" />
                                <span>Others</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Bottom row Activities & AI Insights */}
                        <div className="grid grid-cols-2 gap-3">
                          {/* Activities list */}
                          <div className="bg-white border border-slate-100 rounded-lg p-2.5 flex flex-col justify-between">
                            <div className="space-y-1.5">
                              <span className="block font-extrabold text-[10px] text-slate-800">
                                Recent Activities
                              </span>
                              <div className="space-y-1">
                                {[
                                  { text: "Term 2 results published", time: "2 hours ago" },
                                  { text: "New assignment posted", time: "5 hours ago" },
                                  { text: "Parent meeting scheduled", time: "1 day ago" },
                                ].map((act, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0"
                                  >
                                    <span className="font-bold text-slate-650 truncate max-w-[100px]">
                                      {act.text}
                                    </span>
                                    <span className="text-[6px] font-bold text-slate-500">
                                      {act.time}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* AI insight */}
                          <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-2.5 flex flex-col justify-between text-left">
                            <div className="space-y-1.5">
                              <span className="block font-bold text-[7px] text-blue-700 uppercase tracking-wide">
                                AI Insight
                              </span>
                              <p className="font-extrabold text-slate-800 leading-snug">
                                12 students need extra <br /> support in Mathematics
                              </p>
                            </div>
                            <button className="w-full text-center bg-blue-600 text-white rounded py-1 font-bold text-[7px] shadow-sm hover:bg-blue-700 mt-2">
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 w-full pointer-events-none z-0 select-none translate-y-[1px]">
          <svg
            className="w-full h-14 sm:h-20 min-w-[1000px]"
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            {/* Lighter Violet/Indigo Wave Layer Behind */}
            <path
              d="M0,30 C300,110 600,0 900,70 C1150,120 1320,80 1440,50 L1440,120 L0,120 Z"
              fill="#818cf8"
              fillOpacity="0.25"
            />
            {/* Primary Royal Blue Wave Layer In Front */}
            <path
              d="M0,60 C360,120 720,20 1080,90 C1260,120 1380,80 1440,70 L1440,120 L0,120 Z"
              fill="#2563eb"
              className="fill-blue-600"
            />
          </svg>
        </div>
      </section>

      {/* Video Demo Lightbox/Modal */}
      <AnimatePresence>
        {videoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-white/20 bg-slate-950 shadow-lg"
            >
              {/* Close Button */}
              <button
                onClick={() => setVideoOpen(false)}
                className="absolute top-4 right-4 z-10 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 transition-all"
              >
                <X size={18} />
              </button>

              {/* Video Mockup Content */}
              <div className="relative aspect-video w-full bg-slate-900 flex flex-col items-center justify-center text-center p-8">
                <div className="relative z-10 space-y-4 max-w-lg">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-white border border-white/20">
                    <Brain size={32} className="text-blue-700" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white font-display">
                    Experience KuraLearn Classroom Systems
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-350">
                    A guided walkthrough showcasing attendance automation, AI dashboard predictions,
                    syllabus planner, parent communications, and Kinyarwanda report cards.
                  </p>
                  <Link
                    to="/login"
                    onClick={() => setVideoOpen(false)}
                    className="inline-block rounded-full bg-blue-600 px-6 py-2.5 text-xs font-extrabold text-white hover:bg-blue-700 transition-all"
                  >
                    Click to Open Portal
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
