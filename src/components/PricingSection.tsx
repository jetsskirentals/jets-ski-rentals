import Link from 'next/link';
import { Clock, CheckCircle } from 'lucide-react';

const plans = [
  {
    duration: '15 min',
    weekday: '$35',
    weekend: '$45',
    description: 'Quick taste of the action',
    popular: false,
  },
  {
    duration: '30 min',
    weekday: '$60',
    weekend: '$75',
    description: 'Our most popular option',
    popular: true,
  },
  {
    duration: '1 hour',
    weekday: '$100',
    weekend: '$125',
    description: 'Explore the waters at your pace',
    popular: false,
  },
  {
    duration: '2 hours',
    weekday: '$175',
    weekend: '$220',
    description: 'The ultimate jet ski experience',
    popular: false,
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="section-heading mb-4">Simple, Transparent Pricing</h2>
          <p className="section-subheading">
            Choose the duration that fits your adventure. All rentals include safety equipment and a brief orientation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.duration}
              className={`relative card p-6 text-center ${
                plan.popular ? 'ring-2 ring-brand-500 shadow-xl shadow-brand-100' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-brand-500 to-ocean-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="flex items-center justify-center gap-1.5 mb-3 mt-2">
                <Clock className="w-4 h-4 text-brand-500" />
                <span className="font-bold text-brand-900 text-lg">{plan.duration}</span>
              </div>

              <p className="text-xs text-brand-600/50 mb-4">{plan.description}</p>

              <div className="space-y-1 mb-5">
                <div>
                  <span className="text-3xl font-bold text-brand-900">{plan.weekday}</span>
                  <span className="text-sm text-brand-600/50 ml-1">weekday</span>
                </div>
                <div className="text-sm text-brand-600/60">
                  {plan.weekend} weekend/holiday
                </div>
              </div>

              <div className="space-y-2 mb-6 text-left text-sm text-brand-700/70">
                {['Life vest included', 'Safety orientation', 'Per jet ski'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/booking"
                className={`block w-full text-sm py-2.5 rounded-xl font-semibold transition-all ${
                  plan.popular
                    ? 'btn-primary !shadow-md'
                    : 'btn-secondary'
                }`}
              >
                Book Now
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
