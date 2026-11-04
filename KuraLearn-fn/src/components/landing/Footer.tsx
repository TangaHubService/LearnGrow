import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Twitter, Linkedin, Instagram, Youtube, MapPin, Phone, Mail } from "lucide-react";
import kuraLogo from "@/assets/kuraLogo.png";

export default function Footer() {
  return (
    <footer className="bg-blue-700 text-white pt-24 pb-12 relative mt-16">
      {/* Curved SVG Divider (Top Footer Wave) - Premium multi-layered organic wave segment */}
      <div className="absolute top-0 left-0 right-0 w-full pointer-events-none z-0 -translate-y-[99%] select-none">
        <svg
          className="w-full h-16 sm:h-24 min-w-[1000px]"
          viewBox="0 0 1440 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          {/* Layer 1: Vibrant Amber Accent Wave */}
          <path
            d="M0,90 C320,30 640,40 960,80 C1200,100 1340,50 1440,30 L1440,100 L0,100 Z"
            fill="#f59e0b"
            fillOpacity="0.25"
          />
          {/* Layer 2: Indigo-Blue Accent Wave */}
          <path
            d="M0,60 C380,10 760,20 1140,70 C1260,85 1380,45 1440,25 L1440,100 L0,100 Z"
            fill="#3b82f6"
            fillOpacity="0.35"
          />
          {/* Layer 3: Primary Footer Blue Wave (Matches the bg-blue-700 exactly) */}
          <path
            d="M0,80 C400,30 800,20 1200,75 C1300,90 1380,65 1440,50 L1440,100 L0,100 Z"
            fill="#1d4ed8"
          />
        </svg>
      </div>

      <div className="absolute inset-0 opacity-[0.05] moving-grid pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        {/* Footer Top Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pb-12 border-b border-white/10">
          {/* Logo & Intro Column (4 Cols) */}
          <div className="lg:col-span-4 space-y-6 text-left">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white p-1.5 shadow-md">
                <img src={kuraLogo} alt="KuraLearn" className="h-full w-full object-contain" />
              </div>
              <span className="font-display text-lg font-extrabold tracking-tight text-white">
                KuraLearn
              </span>
            </div>

            <p className="text-xs font-semibold leading-relaxed text-blue-100 max-w-xs">
              School management and learning software for schools in Rwanda.
            </p>

            {/* Social Icons row */}
            <div className="flex items-center gap-3 pt-2">
              {[
                { icon: Facebook, href: "#", label: "Facebook" },
                { icon: Twitter, href: "#", label: "Twitter" },
                { icon: Linkedin, href: "#", label: "LinkedIn" },
                { icon: Instagram, href: "#", label: "Instagram" },
                { icon: Youtube, href: "#", label: "YouTube" },
              ].map((soc, idx) => {
                const Icon = soc.icon;
                return (
                  <a
                    key={idx}
                    href={soc.href}
                    aria-label={soc.label}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                  >
                    <Icon size={13} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Platform Links Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-4 text-left">
            <h4 className="text-[10px] font-bold uppercase tracking-wide text-white">Platform</h4>
            <div className="flex flex-col gap-3 text-xs font-bold text-blue-100">
              <Link to="/about" className="hover:text-white transition-colors">
                About Us
              </Link>
              <Link to="/pricing" className="hover:text-white transition-colors">
                Pricing Tiers
              </Link>
              <Link to="/contact" className="hover:text-white transition-colors">
                Contact Support
              </Link>
              <Link to="/login" className="hover:text-white transition-colors">
                Portal Access
              </Link>
            </div>
          </div>

          {/* Learn & Support Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-4 text-left">
            <h4 className="text-[10px] font-bold uppercase tracking-wide text-white">
              Learn & Support
            </h4>
            <div className="flex flex-col gap-3 text-xs font-bold text-blue-100">
              <Link to="/about" className="hover:text-white transition-colors">
                Offline Support
              </Link>
              <Link to="/welcome" className="hover:text-white transition-colors">
                Help Center
              </Link>
              <Link to="/contact" className="hover:text-white transition-colors">
                Request a Demo
              </Link>
              <Link to="/about" className="hover:text-white transition-colors">
                REB Syllabus Map
              </Link>
            </div>
          </div>

          {/* Legal Links Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-4 text-left">
            <h4 className="text-[10px] font-bold uppercase tracking-wide text-white">Legal</h4>
            <div className="flex flex-col gap-3 text-xs font-bold text-blue-100">
              <Link to="/about" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link to="/about" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link to="/about" className="hover:text-white transition-colors">
                Security Audit
              </Link>
            </div>
          </div>

          {/* Contact Details Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-4 text-left">
            <h4 className="text-[10px] font-bold uppercase tracking-wide text-white">Contact Us</h4>
            <div className="space-y-3.5 text-[10px] font-semibold text-blue-100">
              <div className="flex gap-2 items-start">
                <MapPin size={13} className="shrink-0 text-white mt-0.5" />
                <span>KG 660 St, Kaciyiru, Kigali, Rwanda</span>
              </div>
              <div className="flex gap-2 items-center">
                <Phone size={13} className="shrink-0 text-white" />
                <span>+250 788 123 456</span>
              </div>
              <div className="flex gap-2 items-center">
                <Mail size={13} className="shrink-0 text-white" />
                <span>info@kuralearn.rw</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom copyright */}
        <div className="mt-8 text-center text-[10px] font-semibold text-blue-200">
          <p>© 2025 KuraLearn. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
