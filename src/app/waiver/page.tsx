import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BookingWizard from '@/components/BookingWizard';

export const metadata = {
  title: "Complete Your Waiver | Jet's Ski Rentals",
  description: "Complete your jet ski rental waiver. Select your date, time, and complete the required safety waivers.",
};

export default function WaiverPage() {
  return (
    <>
      <Header />
      <main className="pt-20 md:pt-24 min-h-screen bg-gradient-to-b from-brand-50/30 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center mb-10">
            <div className="inline-block bg-brand-100 text-brand-800 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              Waiver & Check-in
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-brand-900 mb-3">
              Complete Your Waiver
            </h1>
            <p className="text-brand-700/60 max-w-lg mx-auto">
              Select your date and time, then complete the required safety waivers to finalize your reservation.
            </p>
          </div>
          <BookingWizard isGroupon />
        </div>
      </main>
      <Footer />
    </>
  );
}
