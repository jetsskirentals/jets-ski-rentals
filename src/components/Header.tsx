'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Waves } from 'lucide-react';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-brand-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-ocean-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-brand-300 transition-shadow">
              <Waves className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-brand-900 leading-tight">Jet&apos;s Ski</span>
              <span className="text-[10px] font-semibold text-brand-500 uppercase tracking-widest -mt-0.5">Rentals</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { href: '/#about', label: 'About' },
              { href: '/#fleet', label: 'Our Fleet' },
              { href: '/#reviews', label: 'Reviews' },
              { href: '/#pricing', label: 'Pricing' },
              { href: '/#contact', label: 'Contact' },
            ].map(link => (
              <a
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-brand-700 hover:text-brand-900 hover:bg-brand-50 rounded-lg transition-colors"
              >
                {link.label}
              </a>
            ))}
            <Link href="/booking" className="ml-3 btn-primary text-sm !py-2.5 !px-5">
              Book Now
            </Link>
          </nav>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-brand-50 text-brand-700"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-brand-100">
            <nav className="flex flex-col gap-1">
              {[
                { href: '/#about', label: 'About' },
                { href: '/#fleet', label: 'Our Fleet' },
                { href: '/#reviews', label: 'Reviews' },
                { href: '/#pricing', label: 'Pricing' },
                { href: '/#contact', label: 'Contact' },
              ].map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 text-brand-700 hover:bg-brand-50 rounded-lg font-medium"
                >
                  {link.label}
                </a>
              ))}
              <Link
                href="/booking"
                onClick={() => setMobileOpen(false)}
                className="mt-2 btn-primary text-center"
              >
                Book Now
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
