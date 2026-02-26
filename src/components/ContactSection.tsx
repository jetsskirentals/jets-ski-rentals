import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import Link from 'next/link';

export default function ContactSection() {
  return (
    <section id="contact" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="section-heading mb-4">Get In Touch</h2>
          <p className="section-subheading">
            Questions? We&apos;d love to hear from you. Reach out or just book online!
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            <div className="card p-6 flex items-start gap-4">
              <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                <MapPin className="w-6 h-6 text-brand-600" />
              </div>
              <div>
                <h4 className="font-semibold text-brand-900 mb-1">Location</h4>
                <p className="text-sm text-brand-700/60">Grady Brown Park<br />Freeport, FL 32439</p>
              </div>
            </div>

            <div className="card p-6 flex items-start gap-4">
              <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                <Phone className="w-6 h-6 text-brand-600" />
              </div>
              <div>
                <h4 className="font-semibold text-brand-900 mb-1">Phone</h4>
                <p className="text-sm text-brand-700/60">(850) 276-6063</p>
              </div>
            </div>

            <div className="card p-6 flex items-start gap-4">
              <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                <Mail className="w-6 h-6 text-brand-600" />
              </div>
              <div>
                <h4 className="font-semibold text-brand-900 mb-1">Email</h4>
                <p className="text-sm text-brand-700/60">jetsskirentalsllc@gmail.com</p>
              </div>
            </div>

            <div className="card p-6 flex items-start gap-4">
              <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-brand-600" />
              </div>
              <div>
                <h4 className="font-semibold text-brand-900 mb-1">Hours</h4>
                <p className="text-sm text-brand-700/60">Daily: 9:00 AM - 6:00 PM<br />Weather permitting</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-brand-700/60 mb-6">
              The easiest way to reserve is online — pick your date and ride!
            </p>
            <Link href="/booking" className="btn-primary inline-flex items-center gap-2 text-lg">
              Book Your Jet Ski Now
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
