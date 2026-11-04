import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import MarketingHero from "@/components/marketing/MarketingHero";
import MarketingCTA from "@/components/marketing/MarketingCTA";
import kuralearnHero from "@/assets/kuralearn_hero.png";
import { Target, Eye, Heart, GraduationCap, Users, BookOpen, ShieldCheck } from "lucide-react";

const stats = [
  {
    label: "Partner Schools",
    value: "500+",
    icon: GraduationCap,
    color: "text-blue-600 bg-blue-50 border-blue-100",
  },
  {
    label: "Active Learners",
    value: "25,000+",
    icon: Users,
    color: "text-[#6d3eeb] bg-purple-50 border-purple-100",
  },
  {
    label: "Trained Teachers",
    value: "2,000+",
    icon: BookOpen,
    color: "text-emerald-700 bg-emerald-50 border-emerald-100",
  },
  {
    label: "Parent Satisfaction",
    value: "98%",
    icon: ShieldCheck,
    color: "text-amber-700 bg-amber-50 border-amber-100",
  },
];

export default function AboutPage() {
  const floatingStats = [
    {
      label: "Partner Schools",
      value: "500+ Active",
      position: "top-12 -left-8",
      color: "bg-blue-600",
      textColor: "text-white",
    },
    {
      label: "Assessments Run",
      value: "1M+ Complete",
      position: "bottom-12 -right-4",
      color: "bg-purple-600",
      textColor: "text-white",
    },
  ];

  return (
    <div className="relative min-h-screen bg-slate-50 font-sans antialiased text-slate-800 selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      <Navbar />

      <MarketingHero
        badgeText="About KuraLearn"
        titlePrefix="Helping Schools in"
        titleHighlight="Rwanda & Beyond"
        subtitle="We build software that helps schools run smoothly and helps teachers and learners get more out of every lesson."
        rightImage={kuralearnHero}
        floatingStats={floatingStats}
      />

      {/* Mission & Vision Section */}
      <section className="py-20 bg-white relative border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-stretch">
            {/* Mission */}
            <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-150 p-8 shadow-sm hover:shadow-xl transition-all duration-300 bg-white">
              <div className="space-y-6 text-left">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border text-[#6d3eeb] bg-purple-50 border-purple-100 shadow-sm group-hover:scale-105 transition-transform duration-300">
                  <Target size={20} />
                </div>
                <h3 className="text-2xl font-display font-extrabold text-slate-900 tracking-tight">
                  Our Mission
                </h3>
                <p className="text-sm font-semibold leading-relaxed text-slate-500">
                  To give African schools reliable, easy-to-use digital tools, and to cut the
                  paperwork that keeps teachers away from their learners.
                </p>
              </div>
            </div>

            {/* Vision */}
            <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-150 p-8 shadow-sm hover:shadow-xl transition-all duration-300 bg-white">
              <div className="space-y-6 text-left">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border text-blue-600 bg-blue-50 border-blue-100 shadow-sm group-hover:scale-105 transition-transform duration-300">
                  <Eye size={20} />
                </div>
                <h3 className="text-2xl font-display font-extrabold text-slate-900 tracking-tight">
                  Our Vision
                </h3>
                <p className="text-sm font-semibold leading-relaxed text-slate-500">
                  Every student should have access to a good education, wherever they live and
                  whatever their internet connection is like.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rwanda Education Transformation Story */}
      <section className="py-20 bg-slate-50 relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
            {/* Text column */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-100 bg-orange-50 px-3.5 py-1 text-[10px] font-bold uppercase tracking-wide text-orange-700 shadow-sm">
                <span>Rwanda EdTech Story</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-tight leading-none">
                Why we built KuraLearn for Rwanda
              </h2>

              <p className="text-sm font-semibold leading-relaxed text-slate-500">
                KuraLearn follows the Rwanda Education Board (REB) Competency-Based Curriculum, with
                built-in assessments and report cards in Kinyarwanda.
              </p>

              <p className="text-sm font-semibold leading-relaxed text-slate-500">
                Internet access varies across Rwanda, so KuraLearn keeps working offline. School
                classrooms can access interactive lessons and complete quizzes locally without
                active internet. Once connected to mobile networks or satellite broadband, records
                synchronize securely to the cloud.
              </p>

              <p className="text-sm font-semibold leading-relaxed text-slate-500">
                Headteachers, teachers, parents and students all use the same system, so everyone
                sees the same information.
              </p>
            </div>

            {/* Core Values Column */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-md text-left space-y-4">
                <h4 className="font-display text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Heart size={16} className="text-rose-700" />
                  <span>Our Core Values</span>
                </h4>
                <div className="space-y-4 text-xs font-semibold text-slate-500">
                  <div className="space-y-1">
                    <span className="block font-bold text-slate-800">1. Quality</span>
                    <span className="block leading-relaxed">
                      Building software that is secure, dependable and easy to use.
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="block font-bold text-slate-800">2. Inclusivity</span>
                    <span className="block leading-relaxed">
                      Bridging the technology divide with offline capabilities and multi-lingual
                      access.
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="block font-bold text-slate-800">3. Customer Focus</span>
                    <span className="block leading-relaxed">
                      Providing absolute transparency, strategic onboarding, and priority support.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar grid */}
      <section className="py-20 bg-white border-y border-slate-100">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight leading-none">
              Our Growing Impact
            </h2>
            <p className="text-sm font-semibold text-slate-500 leading-relaxed">
              We measure our success by how much it helps our partner schools and their learners.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((item, idx) => {
              const StatIcon = item.icon;
              return (
                <div
                  key={idx}
                  className="group relative flex flex-col items-center text-center p-6 rounded-2xl border border-slate-100 bg-slate-50/50 shadow-sm hover:shadow-lg hover:bg-white transition-all duration-300"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${item.color} shadow-sm group-hover:scale-105 transition-transform duration-300 mb-4`}
                  >
                    <StatIcon size={20} />
                  </div>
                  <span className="block text-3xl font-bold text-slate-900 tracking-tight">
                    {item.value}
                  </span>
                  <span className="block text-xs font-bold text-slate-500 mt-1 uppercase tracking-wide">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <MarketingCTA />

      <Footer />
    </div>
  );
}
