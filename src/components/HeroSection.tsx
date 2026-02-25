import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Star, Phone } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative min-h-[100vh] flex items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/jetski-action2.jpeg"
          alt="Jet skiing on the water"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-950/85 via-brand-900/70 to-brand-800/50" />
      </div>

      {/* Wave overlay */}
      <div className="absolute inset-0 opacity-10">
        <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path
            fill="white"
            d="M0,160L48,176C96,192,192,224,288,218.7C384,213,480,171,576,165.3C672,160,768,192,864,197.3C960,203,1056,181,1152,165.3C1248,149,1344,139,1392,133.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-40">
        <div className="max-w-3xl">
          {/* Logo */}
          <div className="mb-8">
            <Image
              src="/logo.png"
              alt="Jet's Ski Rentals"
              width={120}
              height={120}
              className="w-24 h-24 md:w-28 md:h-28 rounded-full shadow-2xl border-2 border-white/20"
            />
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-4">
            Ride the Waves{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">
              with Jet!
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/80 max-w-xl mb-6 leading-relaxed">
            Book your jet ski adventure in seconds. Pick a date, choose your ride, and get on the water — no calls, no waiting.
          </p>

          <div className="flex items-center gap-2 mb-10">
            <Phone className="w-5 h-5 text-yellow-400" />
            <a href="tel:8502766063" className="text-lg font-bold text-yellow-300 hover:text-yellow-200 transition-colors">
              (850) 276-6063
            </a>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Link
              href="/booking"
              className="inline-flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-brand-900 font-bold py-4 px-8 rounded-xl shadow-2xl hover:shadow-yellow-400/25 hover:-translate-y-1 transition-all duration-300 text-lg"
            >
              <Calendar className="w-5 h-5" />
              Book Now
            </Link>
            <a
              href="#pricing"
              className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold py-4 px-8 rounded-xl hover:bg-white/20 transition-all duration-300 text-lg"
            >
              View Pricing
            </a>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center gap-6 text-white/70 text-sm">
            <div className="flex items-center gap-1.5">
              <div className="flex text-yellow-400">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
              </div>
              <span>5.0 Average Rating</span>
            </div>
            <div className="w-px h-4 bg-white/20" />
            <span>Instant Confirmation</span>
            <div className="w-px h-4 bg-white/20" />
            <span>Secure Payment</span>
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="w-full h-16 md:h-24">
          <path
            fill="white"
            d="M0,64L60,69.3C120,75,240,85,360,80C480,75,600,53,720,48C840,43,960,53,1080,58.7C1200,64,1320,64,1380,64L1440,64L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z"
          />
        </svg>
      </div>
    </section>
  );
}
