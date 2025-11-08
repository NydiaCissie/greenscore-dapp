import { NavigationBar } from "@/components/NavigationBar";
import { HeroSection } from "@/components/HeroSection";
import { FeatureHighlights } from "@/components/FeatureHighlights";
import { WorkflowTimeline } from "@/components/WorkflowTimeline";
import { SecurityPillars } from "@/components/SecurityPillars";
import { GreenScoreDashboard } from "@/components/GreenScoreDashboard";
import { AppFooter } from "@/components/AppFooter";

// Main page component for GreenScore dApp
export default function Page() {
  return (
    <>
      <NavigationBar />
      <main className="gs-main">
        <HeroSection />
        <FeatureHighlights />
        <WorkflowTimeline />
        <SecurityPillars />
        <GreenScoreDashboard />
        <AppFooter />
      </main>
    </>
  );
}

