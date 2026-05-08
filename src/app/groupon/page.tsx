import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BookingWizard from '@/components/BookingWizard';

export const metadata = {
  title: "Groupon Booking | Jet's Ski Rentals",
  description: "Complete your Groupon jet ski rental booking. Select your date and time, and complete the required waivers.",
};

export default function GrouponPage() {
  return (
    <>
      <Header />
      <main className="pt-20 md:pt-24 min-h-screen bg-gradient-to-b from-brand-50/30 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center mb-10">
            <div className="inline-block bg-green-100 text-green-800 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              Groupon Booking
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-brand-900 mb-3">
              Complete Your Reservation
            </h1>
            <p className="text-brand-700/60 max-w-lg mx-auto">
              Since you purchased through Groupon, no additional payment is needed. Just select your date, time, and complete the required waivers.
            </p>
          </div>
          <BookingWizard isGroupon />
        </div>
      </main>
      <Footer />
    </>
  );
}
