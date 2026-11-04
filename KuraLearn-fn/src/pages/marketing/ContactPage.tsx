import React, { useState } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import MarketingHero from "@/components/marketing/MarketingHero";
import MarketingCTA from "@/components/marketing/MarketingCTA";
import teacherAvatar from "@/assets/teacher_avatar.png";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
  Send,
  CheckCircle,
  School,
} from "lucide-react";
import { CustomDropdown } from "@/components/ModernUi";

interface FaqItem {
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    question: "Is KuraLearn fully compatible with the REB curriculum?",
    answer:
      "Yes, KuraLearn is custom-designed from the ground up to support the Rwanda Education Board (REB) Competency-Based Curriculum framework. Teachers can construct lesson plans mapped to specific learning targets, and student report cards reflect direct competence-based performance indicators.",
  },
  {
    question: "Can KuraLearn operate offline in rural environments?",
    answer:
      "Absolutely. KuraLearn contains an offline-first local synchronization database engine. School servers can host interactive classroom modules, record teacher attendance, and complete student quizzes locally without active internet. Once connected to standard networks, all data uploads securely.",
  },
  {
    question: "How does fee payment tracking work for parents?",
    answer:
      "KuraLearn connects securely with leading mobile payments aggregators in Rwanda. Parents can track outstanding school balances, view invoice logs, and complete payments instantly via Mobile Money (MoMo). Real-time payment notifications are immediately issued to school finance admins.",
  },
  {
    question: "What onboarding training is provided to teachers?",
    answer:
      "We provide comprehensive, step-by-step physical and digital onboarding programs. Our professional training technicians travel to partner schools to run workshops for teachers, administrative staff, and system wardens, accompanied by local language brochures.",
  },
];

export default function ContactPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    inquiryType: "Demo Request",
    message: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API Submission
    setTimeout(() => {
      setFormSubmitted(true);
      // Reset form
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        inquiryType: "Demo Request",
        message: "",
      });
    }, 800);
  };

  const floatingStats = [
    {
      label: "Response Time",
      value: "< 24 Hours",
      position: "top-12 -left-8",
      color: "bg-blue-600",
      textColor: "text-white",
    },
    {
      label: "Support Rating",
      value: "4.9★ Review",
      position: "bottom-12 -right-4",
      color: "bg-purple-600",
      textColor: "text-white",
    },
  ];

  return (
    <div className="relative min-h-screen bg-slate-50 font-sans antialiased text-slate-800 selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      <Navbar />

      <MarketingHero
        badgeText="Contact KuraLearn"
        titlePrefix="Get In Touch with"
        titleHighlight="Our Team"
        subtitle="Have questions about KuraLearn features, pricing plans, custom portal configurations, or REB curriculum compatibility? We're happy to help."
        rightImage={teacherAvatar}
        floatingStats={floatingStats}
      />

      {/* Main Contact Form & Details Section */}
      <section className="py-20 bg-white relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-stretch">
            {/* Left Column: Interactive Contact Form */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-150 p-8 shadow-sm bg-slate-50/50 flex flex-col justify-center">
              {formSubmitted ? (
                <div className="text-center py-12 space-y-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 mx-auto shadow-sm">
                    <CheckCircle size={28} />
                  </div>
                  <h3 className="text-2xl font-display font-extrabold text-slate-900 tracking-tight">
                    Inquiry Submitted Successfully!
                  </h3>
                  <p className="text-xs font-semibold leading-relaxed text-slate-500 max-w-sm mx-auto">
                    Thank you for reaching out to KuraLearn. Our local EdTech consultants will
                    review your request and get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => setFormSubmitted(false)}
                    className="inline-flex rounded-full bg-slate-900 px-6 py-2 text-xs font-bold text-white shadow-md hover:bg-[#6d3eeb] transition-all"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6 text-left">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-display font-extrabold text-slate-900 tracking-tight leading-none">
                      Send a Message
                    </h3>
                    <p className="text-xs font-semibold leading-relaxed text-slate-500">
                      Fill out the form below and our Rwanda consulting team will connect with you.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        required
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="e.g. John Uwimana"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-800 placeholder-slate-350 focus:border-[#6d3eeb] focus:outline-none focus:ring-1 focus:ring-[#6d3eeb] transition-all shadow-sm"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="e.g. john@school.rw"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-800 placeholder-slate-350 focus:border-[#6d3eeb] focus:outline-none focus:ring-1 focus:ring-[#6d3eeb] transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Phone */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="e.g. +250 788 123 456"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-800 placeholder-slate-350 focus:border-[#6d3eeb] focus:outline-none focus:ring-1 focus:ring-[#6d3eeb] transition-all shadow-sm"
                      />
                    </div>

                    {/* Inquiry Type */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        Inquiry Category
                      </label>
                      <CustomDropdown
                        options={[
                          { value: "Demo Request", label: "Demo Request" },
                          { value: "Technical Support", label: "Technical Support" },
                          { value: "Partnerships", label: "Partnerships" },
                          { value: "General Inquiry", label: "General Inquiry" },
                        ]}
                        value={formData.inquiryType}
                        onChange={(val) => setFormData({ ...formData, inquiryType: val })}
                        placeholder="Select category"
                        clearable={false}
                        className="!rounded-2xl border-slate-200"
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      Message / Details
                    </label>
                    <textarea
                      name="message"
                      required
                      rows={4}
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Tell us about your school, total student count, and what goals you want to accomplish with KuraLearn..."
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-800 placeholder-slate-350 focus:border-[#6d3eeb] focus:outline-none focus:ring-1 focus:ring-[#6d3eeb] transition-all shadow-sm resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      aria-label="Send"
                      type="submit"
                      className="group flex items-center justify-center gap-1.5 w-full rounded-full bg-[#6d3eeb] py-3.5 text-xs font-bold text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.01]"
                    >
                      <span>Submit Inquiry</span>
                      <Send
                        size={13}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Right Column: Contact details cards */}
            <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
              {/* Kigali Details Card */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-md text-left space-y-6">
                <h4 className="font-display text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <School size={16} className="text-[#6d3eeb]" />
                  <span>KuraLearn Rwanda</span>
                </h4>

                <div className="space-y-4">
                  {/* Email */}
                  <div className="flex gap-3 items-start text-xs font-semibold text-slate-500">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 border border-blue-100 text-blue-600 shadow-sm">
                      <Mail size={13} />
                    </div>
                    <div>
                      <span className="block font-bold text-slate-800">Email Enquiries</span>
                      <span className="block leading-relaxed mt-0.5">info@kuralearn.rw</span>
                      <span className="block leading-relaxed">support@kuralearn.rw</span>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex gap-3 items-start text-xs font-semibold text-slate-500">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 shadow-sm">
                      <Phone size={13} />
                    </div>
                    <div>
                      <span className="block font-bold text-slate-800">Phone & WhatsApp</span>
                      <span className="block leading-relaxed mt-0.5">+250 788 123 456</span>
                      <span className="block leading-relaxed">+250 788 654 321</span>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex gap-3 items-start text-xs font-semibold text-slate-500">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-50 border border-purple-100 text-purple-600 shadow-sm">
                      <MapPin size={13} />
                    </div>
                    <div>
                      <span className="block font-bold text-slate-800">Office Location</span>
                      <span className="block leading-relaxed mt-0.5">
                        KG 660 St, Kacyiru, Kigali, Rwanda
                      </span>
                      <span className="block leading-relaxed opacity-75">
                        (Opposite Ministry of Education)
                      </span>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="flex gap-3 items-start text-xs font-semibold text-slate-500">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 border border-amber-100 text-amber-700 shadow-sm">
                      <Clock size={13} />
                    </div>
                    <div>
                      <span className="block font-bold text-slate-800">Working Hours</span>
                      <span className="block leading-relaxed mt-0.5">
                        Monday - Friday: 8:00 AM - 5:00 PM
                      </span>
                      <span className="block leading-relaxed">Saturday - Sunday: Closed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions Section */}
      <section className="py-20 bg-slate-50 border-t border-slate-100">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight leading-none">
              Frequently Asked Questions
            </h2>
            <p className="text-sm font-semibold text-slate-500 leading-relaxed">
              Find quick answers regarding onboarding, curriculum systems, and rural
              synchronization.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-150 bg-white shadow-sm overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between p-5 text-left text-xs sm:text-sm font-bold text-slate-800 hover:text-[#6d3eeb] transition-colors"
                  >
                    <span>{faq.question}</span>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {isOpen && (
                    <div className="border-t border-slate-100 bg-slate-50/50 p-5 text-xs font-semibold leading-relaxed text-slate-500 text-left">
                      {faq.answer}
                    </div>
                  )}
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
