import React, { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Users, GraduationCap, School, BookOpen, ClipboardCheck, ArrowUpRight } from "lucide-react";

interface StatItem {
  id: string;
  icon: any;
  value: number;
  suffix: string;
  label: string;
  subText: string;
  color: string;
}

const stats: StatItem[] = [
  {
    id: "students",
    icon: GraduationCap,
    value: 12000,
    suffix: "+",
    label: "Active Learners",
    subText: "Smarter classrooms",
    color: "bg-blue-600",
  },
  {
    id: "teachers",
    icon: Users,
    value: 450,
    suffix: "+",
    label: "Trained Teachers",
    subText: "Automated workflows",
    color: "bg-purple-600",
  },
  {
    id: "schools",
    icon: School,
    value: 50,
    suffix: "+",
    label: "Partner Schools",
    subText: "Rwanda curriculum aligned",
    color: "bg-emerald-700",
  },
  {
    id: "assessments",
    icon: ClipboardCheck,
    value: 25000,
    suffix: "+",
    label: "Assessments Run",
    subText: "Continuous evaluation",
    color: "bg-amber-600",
  },
];

function Counter({
  value,
  suffix,
  duration = 2,
}: {
  value: number;
  suffix: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let start = 0;
    const end = value;
    const totalSteps = 60;
    const increment = end / totalSteps;
    const stepTime = (duration * 1000) / totalSteps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [isInView, value, duration]);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1) + "k";
    }
    return num.toString();
  };

  return (
    <span ref={ref} className="tabular-nums">
      {formatNumber(count)}
      {suffix}
    </span>
  );
}

export default function TrustedBy() {
  return (
    <section id="trusted" className="py-20 bg-white relative overflow-hidden">
      {/* Background visual shapes */}

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-xs font-bold uppercase tracking-wide text-[#6d3eeb]"
          >
            Real Impact in African Classrooms
          </motion.h2>
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight text-slate-800"
          >
            One system for running your school
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-sm font-semibold text-slate-500 leading-relaxed"
          >
            KuraLearn is driving academic excellence, continuous learning, and admin automation
            across institutions in Kigali, Huye, Musanze, and beyond.
          </motion.p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-md shadow-slate-100/50 hover:shadow-xl hover:border-indigo-100 transition-all glow-card"
              >
                <div className="space-y-4">
                  {/* Icon Widget */}
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stat.color} text-white shadow-md shadow-slate-100`}
                  >
                    <Icon size={20} />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-baseline">
                      <Counter value={stat.value} suffix={stat.suffix} />
                    </h4>
                    <p className="text-sm font-bold text-slate-700">{stat.label}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      {stat.subText}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-50 pt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#6d3eeb]">
                    Learn more
                  </span>
                  <ArrowUpRight size={12} className="text-[#6d3eeb]" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* School Logo Showcase */}
        <div className="mt-16 border-t border-slate-100 pt-10 text-center space-y-6">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-350">
            Adopted by Leading Public and Private Institutions
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-60 grayscale hover:grayscale-0 transition-all duration-300">
            {[
              "Kigali Academic Academy",
              "Green Hills School",
              "Riviera High School",
              "Excella School",
              "Huye Modern Lycée",
            ].map((name) => (
              <span key={name} className="text-sm font-extrabold text-slate-500 whitespace-nowrap">
                🏫 {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
