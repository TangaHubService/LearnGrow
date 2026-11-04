import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";

interface FloatingStat {
  label: string;
  value: string;
  position: string; // e.g., "top-10 -left-6"
  color: string; // Tailwind bg color class
  textColor: string; // Tailwind text color class
}

interface MarketingHeroProps {
  badgeText: string;
  titlePrefix: string;
  titleHighlight: string;
  titleSuffix?: string;
  subtitle: string;
  primaryCtaText?: string;
  primaryCtaTo?: string;
  secondaryCtaText?: string;
  secondaryCtaAction?: () => void;
  rightImage: string;
  floatingStats?: FloatingStat[];
  gradientTheme?: "blue-purple" | "orange-amber" | "emerald-teal";
}

export default function MarketingHero({
  badgeText,
  titlePrefix,
  titleHighlight,
  titleSuffix = "",
  subtitle,
  primaryCtaText = "Request Demo",
  primaryCtaTo = "/login",
  secondaryCtaText,
  secondaryCtaAction,
  rightImage,
  floatingStats = [],
  gradientTheme = "blue-purple",
}: MarketingHeroProps) {
  const highlightStyles = {
    "blue-purple": "text-indigo-300",
    "orange-amber": "text-orange-400",
    "emerald-teal": "text-emerald-400",
  };

  return (
    <section className="relative bg-indigo-950 pt-28 md:pt-32 pb-20 md:pb-24 overflow-hidden text-white border-b border-white/5">
      {/* Moving background mesh grid */}
      <div className="absolute inset-0 moving-grid opacity-[0.06] pointer-events-none" />

      {/* Decorative ambient glowing blobs */}

      <div className="mx-auto max-w-7xl px-6 lg:px-8 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Side: Content */}
          <div className="lg:col-span-6 space-y-5 text-center lg:text-left">
            {/* Pill Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 shadow-sm"
            >
              <span className="text-[10px] font-bold uppercase tracking-wide text-[#c7d2fe]">
                {badgeText}
              </span>
            </motion.div>

            {/* Typography Heading System */}
            <div className="space-y-3">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="text-3xl sm:text-4xl lg:text-[46px] xl:text-[54px] font-display font-extrabold tracking-tight text-white leading-[1.15]"
              >
                {titlePrefix}{" "}
                <span className={highlightStyles[gradientTheme]}>{titleHighlight}</span>{" "}
                {titleSuffix}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-xs sm:text-sm font-semibold leading-relaxed text-slate-350 max-w-xl mx-auto lg:mx-0"
              >
                {subtitle}
              </motion.p>
            </div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2"
            >
              <a
                href={primaryCtaTo}
                className="w-full sm:w-auto text-center rounded-full bg-[#6d3eeb] px-8 py-3 text-xs font-bold text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.03] active:scale-[0.98]"
              >
                {primaryCtaText}
              </a>
              {secondaryCtaText && (
                <button
                  aria-label="Next"
                  onClick={secondaryCtaAction}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-8 py-3 text-xs font-bold text-white shadow-sm hover:bg-white/10 transition-all hover:scale-[1.03] active:scale-[0.98]"
                >
                  <span>{secondaryCtaText}</span>
                  <ArrowRight size={13} className="text-slate-400" />
                </button>
              )}
            </motion.div>
          </div>

          {/* Right Side: Graphic Visual with Floating stats cards */}
          <div className="lg:col-span-6 relative flex justify-center mt-6 lg:mt-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative w-full max-w-md md:max-w-lg xl:max-w-xl"
            >
              {/* Premium Background Glow behind image */}

              {/* Main Graphic Visual */}
              <div className="relative rounded-2xl border border-white/10 bg-slate-900/40 p-2.5 shadow-lg overflow-hidden aspect-[4/3] flex items-center justify-center">
                <img
                  src={rightImage}
                  alt="Marketing Visual"
                  className="h-full w-full object-cover rounded-[1.6rem]"
                />
              </div>

              {/* Floating Stat Cards with Framer Motion */}
              {floatingStats.map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + idx * 0.1, duration: 0.5 }}
                  className={`absolute ${stat.position} ${stat.color} ${stat.textColor} hidden sm:flex items-center gap-2 rounded-2xl border border-white/10 p-2.5 shadow-xl hover:scale-105 transition-transform duration-300 pointer-events-none z-20`}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-current">
                    <CheckCircle2 size={11} />
                  </div>
                  <div className="text-left">
                    <span className="block text-[10px] font-bold uppercase tracking-wide leading-none">
                      {stat.label}
                    </span>
                    <span className="block text-xs font-bold tracking-tight mt-1 leading-none">
                      {stat.value}
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Premium Double-Curved Wave SVG Divider (Bottom) - Merges flawlessly with white content sections below */}
      <div className="absolute bottom-0 left-0 right-0 w-full pointer-events-none z-0 select-none translate-y-[1px]">
        <svg
          className="w-full h-12 sm:h-16 min-w-[1000px]"
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <path
            d="M0,35 C320,115 640,10 960,75 C1200,125 1340,85 1440,55 L1440,120 L0,120 Z"
            fill="#818cf8"
            fillOpacity="0.12"
          />
          <path
            d="M0,65 C380,125 760,25 1140,95 C1280,125 1380,85 1440,75 L1440,120 L0,120 Z"
            fill="#ffffff"
          />
        </svg>
      </div>
    </section>
  );
}
