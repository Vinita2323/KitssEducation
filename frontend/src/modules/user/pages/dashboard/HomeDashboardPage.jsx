import React from "react";
import { motion } from "framer-motion";
import { HeroBannerCarousel } from "../../components/dashboard/HeroBannerCarousel";
import { ServicesSection } from "../../components/dashboard/ServicesSection";
import { HomeAboutSection } from "../../components/dashboard/HomeAboutSection";

export const HomeDashboardPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-8"
    >
      {/* 1. Edge-to-Edge Hero Carousel directly below header */}
      <HeroBannerCarousel />

      <div className="px-3.5 sm:px-5 lg:px-6 space-y-5 sm:space-y-6">
        {/* 2. Redesigned Services & Features (Our Services, Why Choose Us, Statistics) */}
        <ServicesSection />

        {/* 3. About Us — opens the full about page */}
        <HomeAboutSection />
      </div>
    </motion.div>
  );
};
