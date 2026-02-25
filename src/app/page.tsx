import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from '@/components/HeroSection';
import AboutSection from '@/components/AboutSection';
import FleetSection from '@/components/FleetSection';
import PricingSection from '@/components/PricingSection';
import ReviewsSection from '@/components/ReviewsSection';
import ContactSection from '@/components/ContactSection';

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <AboutSection />
        <FleetSection />
        <PricingSection />
        <ReviewsSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
