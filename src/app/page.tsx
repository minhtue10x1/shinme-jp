import { About } from "@/components/home/about";
import { Blog } from "@/components/home/blog";
import { ConsultationSection } from "@/components/home/consultation-form";
import { Footer } from "@/components/home/footer";
import { Hero } from "@/components/home/hero";
import { HomeProvider } from "@/components/home/home-context";
import { MiniTestBand } from "@/components/home/mini-test-band";
import { Navbar } from "@/components/home/navbar";
import { PlacementTestDialog } from "@/components/home/placement-test-dialog";
import { Roadmap } from "@/components/home/roadmap";
import { SenseiTeam } from "@/components/home/sensei-team";

export default function HomePage() {
  return (
    <HomeProvider>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <About />
        <Roadmap />
        <SenseiTeam />
        <MiniTestBand />
        <Blog />
        <ConsultationSection />
      </main>
      <Footer />
      <PlacementTestDialog />
    </HomeProvider>
  );
}

