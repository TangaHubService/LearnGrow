import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Quote, ArrowLeft, ArrowRight } from "lucide-react";
import teacherAvatar from "@/assets/teacher_avatar.png";
import parentAvatar from "@/assets/parent_avatar.png";
import headteacherAvatar from "@/assets/headteacher_avatar.png";
import studentAvatar from "@/assets/student_avatar.png";

interface Testimonial {
  name: string;
  role: string;
  school: string;
  avatar: string;
  rating: number;
  text: string;
}

const reviews: Testimonial[] = [
  {
    name: "Sister Marie-Claire",
    role: "Headteacher",
    school: "Lycee de Kigali",
    avatar: headteacherAvatar,
    rating: 5,
    text: "Before KuraLearn, generating report cards took us two full weeks of calculations and manual writing. Now, we produce complete, CBC-aligned PDF reports in less than three hours. It has transformed our administrative sanity.",
  },
  {
    name: "Jean-Bosco Nsengimana",
    role: "Mathematics Teacher",
    school: "Excella School, Kigali",
    avatar: teacherAvatar,
    rating: 5,
    text: "The AI weak learner alerts are incredibly accurate. KuraLearn helped me flag five students who were slipping behind in geometry, and the system generated customized worksheets that brought their marks up by 15%.",
  },
  {
    name: "Aline Uwase",
    role: "Parent of S2 Student",
    school: "Green Hills Academy",
    avatar: parentAvatar,
    rating: 5,
    text: "I love receiving the automatic SMS attendance updates. As a working mother, knowing my daughter is safely in class the moment roll call is taken gives me total peace of mind. The portal is clean and easy to navigate.",
  },
  {
    name: "Prince Keza",
    role: "S3 Student",
    school: "Riviera High School",
    avatar: studentAvatar,
    rating: 5,
    text: "Taking daily revision quizzes on KuraLearn feels like playing a game, and the points system keeps me motivated. Reviewing teacher lesson slides on my dad's phone helped me pass my chemistry terms test.",
  },
];

export default function Testimonials() {
  const [index, setIndex] = useState(0);

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % reviews.length);
  };

  const handlePrev = () => {
    setIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const current = reviews[index];

  return (
    <section id="testimonials" className="py-24 bg-white relative overflow-hidden">
      {/* Background accents */}

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Heading and navigation controls */}
          <div className="lg:col-span-5 space-y-6 text-center lg:text-left">
            <span className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#6d3eeb]">
              Success Stories
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight text-slate-800">
              Loved by Teachers, Parents, and Admins
            </h2>
            <p className="text-sm font-semibold text-slate-500 leading-relaxed max-w-md mx-auto lg:mx-0">
              Read how KuraLearn is helping schools across East Africa automate operations, improve
              marks, and foster continuous connection.
            </p>

            {/* Nav Arrows */}
            <div className="hidden lg:flex items-center gap-3 pt-4">
              <button
                onClick={handlePrev}
                aria-label="Previous review"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-150 bg-white text-slate-650 hover:bg-slate-50 shadow-sm transition-all"
              >
                <ArrowLeft size={16} />
              </button>
              <button
                onClick={handleNext}
                aria-label="Next review"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-150 bg-white text-slate-650 hover:bg-slate-50 shadow-sm transition-all"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Right Column: Sliding Testimonial Card */}
          <div className="lg:col-span-7 flex justify-center">
            <div className="w-full max-w-[550px] relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-2xl border border-slate-100 bg-[#f8fafc] p-8 shadow-sm relative flex flex-col justify-between"
                >
                  <Quote className="absolute top-6 right-6 h-12 w-12 text-[#6d3eeb]/5 stroke-[1.5]" />

                  <div className="space-y-6">
                    {/* Stars */}
                    <div className="flex gap-1 text-amber-400">
                      {Array.from({ length: current.rating }).map((_, i) => (
                        <Star key={i} size={14} fill="currentColor" />
                      ))}
                    </div>

                    <p className="text-sm font-semibold text-slate-650 leading-relaxed italic">
                      "{current.text}"
                    </p>

                    {/* Author block */}
                    <div className="flex items-center gap-4.5 pt-6 border-t border-slate-100">
                      <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center overflow-hidden shrink-0">
                        <img
                          src={current.avatar}
                          alt={current.name}
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wide text-slate-800">
                          {current.name}
                        </h4>
                        <p className="text-[10px] font-bold text-slate-500">
                          {current.role} • <span className="text-[#6d3eeb]">{current.school}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Mobile controls */}
              <div className="flex items-center justify-center gap-3 pt-6 lg:hidden">
                <button
                  onClick={handlePrev}
                  aria-label="Previous review"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-150 bg-white text-slate-650 hover:bg-slate-50 shadow-sm"
                >
                  <ArrowLeft size={14} />
                </button>
                <span className="text-xs font-bold text-slate-500">
                  {index + 1} / {reviews.length}
                </span>
                <button
                  onClick={handleNext}
                  aria-label="Next review"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-150 bg-white text-slate-650 hover:bg-slate-50 shadow-sm"
                >
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
