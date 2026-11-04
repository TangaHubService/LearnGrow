import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Globe, ChevronDown, ArrowRight } from "lucide-react";
import kuraLogo from "@/assets/kuraLogo.png";

const menuItems = [
  { label: "Home", href: "/welcome" },
  { label: "About", href: "/about" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState("EN");
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-3 sm:px-6 lg:px-8">
        <div
          className={`mx-auto max-w-7xl rounded-full border border-slate-200 bg-white px-4 py-2.5 transition-shadow duration-300 sm:px-6 ${
            isScrolled ? "shadow-md" : "shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/welcome" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-2 shadow-md ring-1 ring-slate-100">
                <img src={kuraLogo} alt="KuraLearn" className="h-full w-full object-contain" />
              </div>
              <div>
                <span className="font-display text-lg font-extrabold tracking-tight text-slate-900">
                  KuraLearn
                </span>
                <span className="block text-[10px] font-bold uppercase tracking-wide text-[#6d3eeb]">
                  Africa EdTech
                </span>
              </div>
            </Link>

            {/* Desktop Menu */}
            <nav className="hidden lg:flex items-center gap-8">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    to={item.href}
                    className={`font-sans text-xs font-semibold transition-colors hover:text-[#6d3eeb] ${
                      isActive ? "text-[#6d3eeb] font-bold" : "text-slate-650"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-4">
              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  aria-label={`Language: ${currentLang}`}
                  aria-expanded={langDropdownOpen}
                  className="flex items-center gap-1.5 rounded-full border border-slate-100 bg-white px-3 py-1.5 text-xs font-bold text-slate-650 shadow-sm hover:bg-slate-50 transition-colors"
                >
                  <Globe size={13} className="text-slate-500" />
                  <span>{currentLang}</span>
                  <ChevronDown size={12} className="text-slate-500" />
                </button>

                <AnimatePresence>
                  {langDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-28 rounded-xl border border-slate-100 bg-white p-1.5 shadow-xl ring-1 ring-black/5"
                    >
                      {["EN", "FR", "KN"].map((lang) => (
                        <button
                          key={lang}
                          onClick={() => {
                            setCurrentLang(lang);
                            setLangDropdownOpen(false);
                          }}
                          className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-bold text-slate-650 hover:bg-slate-50 hover:text-[#6d3eeb] transition-all"
                        >
                          {lang === "KN" ? "Kinyarwanda" : lang === "FR" ? "Français" : "English"}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Login Button */}
              <Link
                to="/login"
                className="rounded-full px-5 py-2 text-xs font-bold text-slate-650 hover:bg-slate-50 transition-all border border-slate-100 bg-white"
              >
                Sign In
              </Link>

              {/* CTA Button */}
              <Link
                to="/login"
                className="group relative flex items-center gap-1.5 overflow-hidden rounded-full bg-[#6d3eeb] px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:shadow-lg"
              >
                <span>Request Demo</span>
                <ArrowRight
                  size={13}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>

            {/* Mobile Hamburger */}
            <div className="flex items-center gap-3 lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileMenuOpen}
                className="rounded-full border border-slate-100 bg-white p-2 text-slate-600 shadow-sm"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed inset-y-0 right-0 z-40 w-full max-w-sm border-l border-slate-100 bg-white p-6 shadow-lg flex flex-col justify-between"
          >
            <div className="space-y-6 pt-20">
              <div className="flex flex-col gap-4">
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.label}
                      to={item.href}
                      className={`font-sans text-sm font-bold py-2 border-b border-slate-50 ${
                        isActive ? "text-[#6d3eeb]" : "text-slate-700 hover:text-[#6d3eeb]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                <span className="text-xs font-bold text-slate-500">Language</span>
                <div className="flex gap-2">
                  {["EN", "FR", "KN"].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setCurrentLang(lang)}
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                        currentLang === lang
                          ? "bg-indigo-50 text-[#6d3eeb]"
                          : "border border-slate-150 text-slate-500"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <Link
                to="/login"
                className="block text-center rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Sign In
              </Link>
              <Link
                to="/login"
                className="block text-center rounded-xl bg-[#6d3eeb] py-3 text-sm font-bold text-white shadow-md"
              >
                Request Free Trial
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
