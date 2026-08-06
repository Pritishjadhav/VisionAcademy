import { HeroSection } from "@/components/home/HeroSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { AboutSection } from "@/components/home/AboutSection";
import { HighlightsSection } from "@/components/home/HighlightsSection";
import { CoursesSection } from "@/components/home/CoursesSection";
import { FacultySection } from "@/components/home/FacultySection";
import { ResultsSection } from "@/components/home/ResultsSection";
import { ContactSection } from "@/components/home/ContactSection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <AboutSection />
      <HighlightsSection />
      <CoursesSection />
      <FacultySection />
      <ResultsSection />
      <ContactSection />
    </>
  );
}
