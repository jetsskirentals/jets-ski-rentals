import { Waves, MapPin, Phone, Mail, Clock } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-brand-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-400 to-ocean-400 rounded-xl flex items-center justify-center">
                <Waves className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-lg font-bold">Jet&apos;s Ski Rentals</div>
              </div>
            </div>
            <p className="text-brand-300 text-sm leading-relaxed">
              Experience the thrill of jet skiing on the open water. Book online in seconds and ride the waves!
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2 text-brand-300">
              <li><a href="/#about" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="/#fleet" className="hover:text-white transition-colors">Our Fleet</a></li>
              <li><a href="/#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              <li><Link href="/booking" className="hover:text-white transition-colors">Book Now</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Contact Us</h4>
            <ul className="space-y-3 text-brand-300 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-brand-400 shrink-0" />
                123 Beach Blvd, Coastal City, FL 33000
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-400 shrink-0" />
                (555) 123-4567
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-400 shrink-0" />
                info@jetsskirentals.com
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Hours</h4>
            <ul className="space-y-2 text-brand-300 text-sm">
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-400 shrink-0" />
                Daily: 9:00 AM - 6:00 PM
              </li>
              <li className="text-brand-400 text-xs mt-2">
                Weather permitting. Hours may vary seasonally.
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-brand-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-brand-400 text-sm">
            &copy; {new Date().getFullYear()} Jet&apos;s Ski Rentals. All rights reserved.
          </p>
          <div className="flex gap-6 text-brand-400 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
