import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BookingWizard from '@/components/BookingWizard';

export const metadata = {
  title: "Book Your Jet Ski | Jet's Ski Rentals",
  description: "Reserve your jet ski in minutes. Choose a date, pick your ride, and confirm your booking online.",
};

export default function BookingPage() {
  return (
    <>
      <Header />
      <main className="pt-20 md:pt-24 min-h-screen bg-gradient-to-b from-brand-50/30 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-brand-900 mb-3">
              Book Your Ride
            </h1>
            <p className="text-brand-700/60 max-w-lg mx-auto">
              Select your date, choose a duration, pick your jet ski, and you&apos;re all set!
            </p>
          </div>
          <BookingWizard />
        </div>
      </main>
      <Footer />
    </>
  );
}
