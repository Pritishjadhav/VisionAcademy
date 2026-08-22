import { HeroSection } from "@/components/home/HeroSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { AboutSection } from "@/components/home/AboutSection";
import { GallerySection } from "@/components/home/GallerySection";
import { HighlightsSection } from "@/components/home/HighlightsSection";
import { CoursesSection } from "@/components/home/CoursesSection";
import { FacultySection } from "@/components/home/FacultySection";
import { ResultsSection } from "@/components/home/ResultsSection";
import { ContactSection } from "@/components/home/ContactSection";
import { RedirectIfLoggedIn } from "@/components/auth/RedirectIfLoggedIn";

export default function Home() {
  return (
    <RedirectIfLoggedIn>
      <HeroSection />
      <FeaturesSection />
      <AboutSection />
      <GallerySection />
      <HighlightsSection />
      <CoursesSection />
      <FacultySection />
      <ResultsSection />
      <ContactSection />
    </RedirectIfLoggedIn>
  );
}
