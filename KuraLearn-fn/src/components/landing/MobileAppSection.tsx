import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, Download, CheckCircle, WifiOff, Cpu, RefreshCw } from "lucide-react";

interface AppView {
  id: string;
  name: string;
  tagline: string;
  desc: string;
  screenTitle: string;
  screenList: string[];
  mockData: {
    heading: string;
    sub: string;
    value?: string;
    items: string[];
  };
}

const apps: AppView[] = [
  {
    id: "teacher",
    name: "Teacher Mobile App",
    tagline: "Classroom ERP In Your Pocket",
    desc: "Take attendance in under 30 seconds, record terms test marks directly, view lesson schedules, and message parent groups on the go.",
    screenTitle: "Daily Teacher Actions",
    screenList: [
      "Instant student roll call",
      "Term assessment marks ledger",
      "Direct chat with parent contacts",
      "Offline cache auto-upload",
    ],
    mockData: {
      heading: "Senior 1 Math",
      sub: "Quick Attendance (18 May)",
      items: [
        "Jean-Luc R. - Present",
        "Divine M. - Present",
        "Fiona U. - Absent",
        "Patrick N. - Present",
      ],
    },
  },
  {
    id: "student",
    name: "Student Learning App",
    tagline: "Gamified Revision & Resource Hub",
    desc: "Review daily slides uploaded by teachers, practice CBC tests in a fun, points-based interface, and track subject paths anywhere, anytime.",
    screenTitle: "My Learning Goals",
    screenList: [
      "Interactive math & science paths",
      "Gamified continuous tests",
      "Direct cloud download for reading slides",
      "Offline reading mode",
    ],
    mockData: {
      heading: "Gamified Revision",
      sub: "Mathematics Quiz (Term 2)",
      items: [
        "Algebra Prep - 90/100",
        "Competency Slide - Read",
        "Statistics Test - 85/100",
        "Syllabus Status - 88% done",
      ],
    },
  },
  {
    id: "parent",
    name: "Parent Engagement App",
    tagline: "Safe Tracking & Instant Reports",
    desc: "Get notified instantly when your student misses a roll call. View report cards the moment they are generated, and view teacher feedbacks.",
    screenTitle: "Parent Dashboard Summary",
    screenList: [
      "SMS & push attendance updates",
      "Term evaluation reports",
      "Teacher communication logs",
      "Class timetables & reminders",
    ],
    mockData: {
      heading: "Divine Keza Progress",
      sub: "Academic Status Dashboard",
      value: "94% Average Grade",
      items: [
        "Maths - 94% (A)",
        "Chemistry - 88% (A)",
        "History - 92% (A)",
        "Attendance - 100% Present",
      ],
    },
  },
];

export default function MobileAppSection() {
  const [activeApp, setActiveApp] = useState("teacher");
  const currentApp = apps.find((a) => a.id === activeApp)!;

  return (
    <section id="mobile-app" className="py-24 bg-[#f8fafc] relative overflow-hidden">
      {/* Background visual graphics */}

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Descriptive info & tab selector */}
          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#6d3eeb]">
                Mobile Readiness
              </span>
              <h2 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight text-slate-800 leading-tight">
                Anytime, Anywhere Learning on Mobile & Tablet
              </h2>
              <p className="text-sm font-semibold leading-relaxed text-slate-500">
                KuraLearn is optimized for the African mobile landscape. Our native-style responsive
                experience demands minimal device resources, operates offline, and conserves
                cellular bandwidth.
              </p>
            </div>

            {/* Mobile Tabs selector */}
            <div className="grid grid-cols-3 gap-2">
              {apps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => setActiveApp(app.id)}
                  className={`rounded-2xl py-3.5 px-2 text-center text-xs font-bold transition-all border ${
                    activeApp === app.id
                      ? "bg-slate-850 text-white border-slate-850 shadow-md"
                      : "bg-white text-slate-550 border-slate-150 hover:bg-slate-50"
                  }`}
                >
                  {app.name.split(" ")[0]} Portal
                </button>
              ))}
            </div>

            {/* App specific highlights */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeApp}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-slate-800">{currentApp.tagline}</h3>
                  <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                    {currentApp.desc}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentApp.screenList.map((feature) => (
                    <div key={feature} className="flex gap-2.5 items-start">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[#6d3eeb]">
                        <CheckCircle size={12} className="stroke-[3]" />
                      </span>
                      <span className="text-xs font-bold text-slate-650 leading-snug">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Low-data / offline banners */}
            <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 rounded-2xl bg-white border border-slate-150 px-4 py-2.5 shadow-sm">
                <WifiOff size={16} className="text-sky" />
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Offline Capacity
                  </h4>
                  <p className="text-xs font-bold text-slate-650">Syncs when online</p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-2xl bg-white border border-slate-150 px-4 py-2.5 shadow-sm">
                <Cpu size={16} className="text-emerald-700" />
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Low Data Footprint
                  </h4>
                  <p className="text-xs font-bold text-slate-650">Uses 75% less data</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Custom Animated Phone Mockup */}
          <div className="lg:col-span-6 flex justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative w-[280px] h-[550px] rounded-[48px] border-[12px] border-slate-800 bg-slate-900 shadow-lg overflow-hidden"
            >
              {/* Speaker & Notch details */}
              <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 flex items-center justify-center z-30">
                <div className="w-16 h-3 rounded-full bg-slate-900" />
              </div>

              {/* Phone Screen Container */}
              <div className="w-full h-full bg-white pt-8 pb-4 px-4 flex flex-col justify-between relative overflow-hidden select-none">
                <div className="absolute inset-0 opacity-[0.03] moving-grid" />

                {/* Simulated Screen header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 z-10">
                  <div className="flex items-center gap-1.5">
                    <span className="h-4 w-4 rounded-full bg-indigo-50 flex items-center justify-center text-[7px] text-[#6d3eeb] font-bold">
                      K
                    </span>
                    <span className="text-[10px] font-bold text-slate-800 uppercase tracking-tighter">
                      KuraLearn
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-350 flex items-center gap-0.5 uppercase">
                    <Smartphone size={8} /> Active
                  </span>
                </div>

                {/* Simulated Screen content body */}
                <div className="flex-1 py-4 flex flex-col justify-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeApp}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-4"
                    >
                      <div className="space-y-1">
                        <span className="text-[7px] font-bold uppercase tracking-wide text-[#6d3eeb]">
                          {currentApp.screenTitle}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800">
                          {currentApp.mockData.heading}
                        </h4>
                        <p className="text-[10px] font-bold text-slate-500">
                          {currentApp.mockData.sub}
                        </p>
                      </div>

                      {/* Mock List */}
                      <div className="space-y-2">
                        {currentApp.mockData.items.map((item, index) => (
                          <div
                            key={item}
                            className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 flex items-center justify-between"
                          >
                            <span className="text-[10px] font-bold text-slate-650 leading-tight">
                              {item}
                            </span>
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Simulated Screen Footer */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 z-10">
                  <span className="text-[10px] font-bold uppercase text-[#6d3eeb] tracking-wide">
                    SYNCED OK
                  </span>
                  <span className="text-[10px] font-bold text-slate-300">© 2026</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
