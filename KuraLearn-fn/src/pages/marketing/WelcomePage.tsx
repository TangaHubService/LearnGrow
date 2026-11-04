import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import TrustedBy from "@/components/landing/TrustedBy";
import Features from "@/components/landing/Features";
import PortalShowcase from "@/components/landing/PortalShowcase";
import AiAnalytics from "@/components/landing/AiAnalytics";
import RwandaAlignment from "@/components/landing/RwandaAlignment";
import MobileAppSection from "@/components/landing/MobileAppSection";
import Testimonials from "@/components/landing/Testimonials";
import StatsImpact from "@/components/landing/StatsImpact";
import FinalCta from "@/components/landing/FinalCta";
import Footer from "@/components/landing/Footer";

export function WelcomePage() {
  const { isAuthenticated } = useAuth();

  // Guard: If authenticated, take them directly into the application dashboard
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="relative min-h-screen bg-[#f8fafc] font-sans antialiased text-slate-800 selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      {/* 1. Header Sticky Navbar */}
      <Navbar />

      {/* 2. Brand Hero Section */}
      <Hero />

      {/* 3. Social Proof/Stats Section */}
      <TrustedBy />

      {/* 4. Modular Features Grid */}
      <Features />

      {/* 5. Stakeholder Portals Showcase */}
      <PortalShowcase />

      {/* 6. Deep AI & Analytics Section */}
      <AiAnalytics />

      {/* 7. REB Competency Syllabus Alignment Section */}
      <RwandaAlignment />

      {/* 8. Responsive Mobile App Mockups */}
      <MobileAppSection />

      {/* 9. Glowing Operations Stats & Impact Metrics */}
      <StatsImpact />

      {/* 10. Locally Curated Reviews & Testimonials */}
      <Testimonials />

      {/* 13. High Conversion Closing Action Banner */}
      <FinalCta />

      {/* 14. Detailed Link Directory & Contact Footer */}
      <Footer />
    </div>
  );
}
