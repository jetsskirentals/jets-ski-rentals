import { Shield, Clock, Smile, Award } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Safety First',
    description: 'All riders receive a safety briefing. Life vests and equipment are always included.',
  },
  {
    icon: Clock,
    title: 'Flexible Rentals',
    description: 'From quick 15-minute rides to 2-hour adventures — pick what suits you.',
  },
  {
    icon: Smile,
    title: 'Family Friendly',
    description: 'Fun for all skill levels. Our team will get you comfortable on the water.',
  },
  {
    icon: Award,
    title: 'Top Equipment',
    description: 'Well-maintained, late-model jet skis serviced after every rental.',
  },
];

export default function AboutSection() {
  return (
    <section id="about" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="section-heading mb-4">Why Choose Jet&apos;s Ski Rentals?</h2>
          <p className="section-subheading">
            We make it easy, safe, and unforgettable. Here&apos;s what sets us apart.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group text-center p-6 rounded-2xl hover:bg-brand-50 transition-colors duration-300"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-brand-100 to-ocean-100 rounded-2xl mb-5 group-hover:from-brand-200 group-hover:to-ocean-200 transition-colors">
                <feature.icon className="w-7 h-7 text-brand-600" />
              </div>
              <h3 className="text-lg font-bold text-brand-900 mb-2">{feature.title}</h3>
              <p className="text-brand-700/60 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
