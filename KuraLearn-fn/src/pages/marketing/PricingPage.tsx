import React, { useState } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import MarketingHero from "@/components/marketing/MarketingHero";
import MarketingCTA from "@/components/marketing/MarketingCTA";
import studentAvatar from "@/assets/student_avatar.png";
import { Check, X, Shield, Zap, Globe, Building2 } from "lucide-react";

const plans = [
  {
    name: "Starter",
    description: "Perfect for small schools getting started.",
    monthlyPrice: 12,
    yearlyPrice: 9,
    features: [
      "Up to 150 students",
      "5 Teachers",
      "Core school management",
      "Attendance tracking",
      "Exams & assessments",
      "Basic reports",
    ],
    ctaText: "Get Started",
    color: "border-slate-100 hover:border-blue-200 bg-white",
    icon: Shield,
    iconColor: "text-blue-600 bg-blue-50 border-blue-100",
  },
  {
    name: "Basic",
    description: "For growing schools that need more tools.",
    monthlyPrice: 24,
    yearlyPrice: 19,
    features: [
      "Up to 500 students",
      "15 Teachers",
      "All Starter features",
      "Parent communication",
      "Timetable management",
      "Fee management",
      "Library management",
      "Email support",
    ],
    ctaText: "Get Started",
    color: "border-slate-100 hover:border-emerald-200 bg-white",
    icon: Globe,
    iconColor: "text-emerald-700 bg-emerald-50 border-emerald-100",
  },
  {
    name: "Professional",
    description: "For established schools that want advanced control.",
    monthlyPrice: 49,
    yearlyPrice: 39,
    features: [
      "Up to 1,500 students",
      "Unlimited Teachers",
      "All Basic features",
      "Advanced reports & analytics",
      "Inventory management",
      "Transport management",
      "Hostel management",
      "Multi-branch support",
      "Priority support",
    ],
    ctaText: "Get Started",
    isPopular: true,
    color: "border-indigo-200 bg-white shadow-xl hover:border-indigo-400 ring-2 ring-indigo-500/20",
    icon: Zap,
    iconColor: "text-indigo-600 bg-indigo-50 border-indigo-100",
  },
  {
    name: "Enterprise",
    description: "For large institutions with custom needs.",
    monthlyPrice: null, // Custom
    yearlyPrice: null, // Custom
    features: [
      "Unlimited students",
      "Unlimited Teachers",
      "All Professional features",
      "Custom integrations",
      "Dedicated account manager",
      "Onboarding & training",
      "SLA & uptime guarantee",
      "24/7 priority support",
    ],
    ctaText: "Contact Sales",
    color: "border-slate-100 hover:border-purple-200 bg-white",
    icon: Building2,
    iconColor: "text-purple-700 bg-purple-50 border-purple-100",
  },
];

const compareFeatures = [
  {
    category: "Core Operations",
    name: "Student Management",
    starter: true,
    basic: true,
    professional: true,
    enterprise: true,
  },
  {
    category: "Core Operations",
    name: "Attendance Tracking",
    starter: true,
    basic: true,
    professional: true,
    enterprise: true,
  },
  {
    category: "Core Operations",
    name: "Exams & Assessments",
    starter: true,
    basic: true,
    professional: true,
    enterprise: true,
  },
  {
    category: "Core Operations",
    name: "Reports & Analytics",
    starter: "Basic",
    basic: "Advanced",
    professional: "Advanced",
    enterprise: "Advanced + Custom",
  },
  {
    category: "Communication",
    name: "Parent Communication",
    starter: false,
    basic: true,
    professional: true,
    enterprise: true,
  },
  {
    category: "Finance & Admin",
    name: "Fee Management",
    starter: false,
    basic: true,
    professional: true,
    enterprise: true,
  },
  {
    category: "Finance & Admin",
    name: "Inventory Management",
    starter: false,
    basic: false,
    professional: true,
    enterprise: true,
  },
  {
    category: "Finance & Admin",
    name: "Multi-Branch Support",
    starter: false,
    basic: false,
    professional: true,
    enterprise: true,
  },
  {
    category: "Support",
    name: "Priority Support",
    starter: "Email",
    basic: "Email",
    professional: "Priority",
    enterprise: "24/7 Priority",
  },
  {
    category: "Platform",
    name: "Custom Integrations",
    starter: false,
    basic: false,
    professional: false,
    enterprise: true,
  },
];

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("yearly");

  const floatingStats = [
    {
      label: "Active Learners",
      value: "2,453",
      position: "top-12 -left-8",
      color: "bg-blue-600",
      textColor: "text-white",
    },
    {
      label: "Parent Satisfaction",
      value: "98%",
      position: "bottom-12 -right-4",
      color: "bg-purple-600",
      textColor: "text-white",
    },
  ];

  return (
    <div className="relative min-h-screen bg-slate-50 font-sans antialiased text-slate-800 selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      <Navbar />

      <MarketingHero
        badgeText="Simple, Transparent Pricing"
        titlePrefix="Flexible Plans for"
        titleHighlight="Every School"
        subtitle="Choose the perfect plan for your school's needs. All plans include core features to manage, teach, and inspire better learning."
        rightImage={studentAvatar}
        floatingStats={floatingStats}
      />

      {/* Plans Section */}
      <section className="py-20 bg-white relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          {/* Monthly / Yearly Toggle Switch */}
          <div className="flex justify-center items-center gap-4 mb-16">
            <span
              className={`text-sm font-bold ${billingPeriod === "monthly" ? "text-slate-900" : "text-slate-500"}`}
            >
              Monthly
            </span>
            <button
              role="switch"
              aria-checked={billingPeriod === "yearly"}
              aria-label="Yearly billing"
              onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "yearly" : "monthly")}
              className="relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-slate-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#6d3eeb] focus:ring-offset-2"
            >
              <span
                className={`${
                  billingPeriod === "yearly" ? "translate-x-7" : "translate-x-0"
                } pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
            <span
              className={`text-sm font-bold ${billingPeriod === "yearly" ? "text-slate-900" : "text-slate-500"} flex items-center gap-2`}
            >
              <span>Yearly</span>
              <span className="inline-block rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                Save up to 20%
              </span>
            </span>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch">
            {plans.map((plan, idx) => {
              const PlanIcon = plan.icon;
              const price = billingPeriod === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
              return (
                <div
                  key={idx}
                  className={`group relative flex flex-col justify-between rounded-2xl border p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 ${plan.color}`}
                >
                  {plan.isPopular && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#6d3eeb] px-4 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-md">
                      Most Popular
                    </span>
                  )}

                  <div className="space-y-6 text-left">
                    {/* Header */}
                    <div className="space-y-3">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${plan.iconColor} shadow-sm group-hover:scale-105 transition-transform duration-300`}
                      >
                        <PlanIcon size={20} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                      <p className="text-xs font-semibold leading-relaxed text-slate-500">
                        {plan.description}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="pt-2">
                      {price !== null ? (
                        <div className="flex items-baseline text-slate-900">
                          <span className="text-3xl font-extrabold tracking-tight">$</span>
                          <span className="text-5xl font-extrabold tracking-tight">{price}</span>
                          <span className="ml-1 text-sm font-bold text-slate-500">/month</span>
                        </div>
                      ) : (
                        <div className="text-slate-900">
                          <span className="text-3xl font-extrabold tracking-tight">Custom</span>
                        </div>
                      )}
                      <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wide">
                        {price !== null ? "Billed annually" : "Tailored for your school"}
                      </p>
                    </div>

                    {/* Features List */}
                    <ul className="space-y-3 pt-4 border-t border-slate-50">
                      {plan.features.map((feat, fidx) => (
                        <li
                          key={fidx}
                          className="flex items-start gap-2.5 text-xs font-semibold text-slate-500 leading-tight"
                        >
                          <Check size={14} className="text-emerald-700 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <div className="pt-8">
                    <a
                      href="/login"
                      className={`block w-full text-center rounded-full py-3 text-xs font-bold transition-all ${
                        plan.isPopular
                          ? "bg-[#6d3eeb] text-white shadow-lg hover:bg-indigo-700"
                          : "border border-slate-200 text-slate-650 hover:bg-slate-50 bg-white"
                      }`}
                    >
                      {plan.ctaText}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Matrix / Comparison Table Section */}
      <section className="py-20 bg-slate-50 border-y border-slate-100">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight leading-none">
              Compare All Plans
            </h2>
            <p className="text-sm font-semibold text-slate-500 leading-relaxed">
              Detailed features checklist to help you choose the right configuration.
            </p>
          </div>

          <div
            tabIndex={0}
            className="overflow-x-auto rounded-2xl border border-slate-150 bg-white shadow-sm"
          >
            <table className="w-full min-w-[700px] text-left border-collapse text-xs font-semibold text-slate-650">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-900 font-bold uppercase tracking-wide text-[10px]">
                  <th className="p-5">Features</th>
                  <th className="p-5">Starter</th>
                  <th className="p-5">Basic</th>
                  <th className="p-5">Professional</th>
                  <th className="p-5">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {compareFeatures.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-5 font-bold text-slate-800">{row.name}</td>
                    {/* Starter */}
                    <td className="p-5">
                      {typeof row.starter === "boolean" ? (
                        row.starter ? (
                          <Check size={16} className="text-emerald-700" />
                        ) : (
                          <X size={16} className="text-slate-500" />
                        )
                      ) : (
                        <span className="text-slate-600 font-bold">{row.starter}</span>
                      )}
                    </td>
                    {/* Basic */}
                    <td className="p-5">
                      {typeof row.basic === "boolean" ? (
                        row.basic ? (
                          <Check size={16} className="text-emerald-700" />
                        ) : (
                          <X size={16} className="text-slate-500" />
                        )
                      ) : (
                        <span className="text-slate-600 font-bold">{row.basic}</span>
                      )}
                    </td>
                    {/* Professional */}
                    <td className="p-5 bg-indigo-50/20">
                      {typeof row.professional === "boolean" ? (
                        row.professional ? (
                          <Check size={16} className="text-indigo-600 font-bold" />
                        ) : (
                          <X size={16} className="text-slate-500" />
                        )
                      ) : (
                        <span className="text-indigo-600 font-bold">{row.professional}</span>
                      )}
                    </td>
                    {/* Enterprise */}
                    <td className="p-5">
                      {typeof row.enterprise === "boolean" ? (
                        row.enterprise ? (
                          <Check size={16} className="text-emerald-700" />
                        ) : (
                          <X size={16} className="text-slate-500" />
                        )
                      ) : (
                        <span className="text-slate-600 font-bold">{row.enterprise}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <MarketingCTA />

      <Footer />
    </div>
  );
}
