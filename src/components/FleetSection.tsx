import { Waves } from 'lucide-react';
import Link from 'next/link';

const jetSkis = [
  {
    name: 'Wave Runner 1',
    model: 'Yamaha EX Sport',
    description: 'Perfect for beginners and families. Stable, easy to handle, and a blast on the water!',
    features: ['Beginner Friendly', 'Seats 1-2', 'Smooth Ride'],
    color: 'from-brand-500 to-ocean-600',
  },
  {
    name: 'Wave Runner 2',
    model: 'Sea-Doo Spark',
    description: 'Lightweight and agile, great for thrill-seekers who love speed and tight turns.',
    features: ['High Performance', 'Seats 1-2', 'Agile Handling'],
    color: 'from-ocean-500 to-brand-600',
  },
];

export default function FleetSection() {
  return (
    <section id="fleet" className="py-20 md:py-28 bg-gradient-to-b from-white to-brand-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="section-heading mb-4">Our Fleet</h2>
          <p className="section-subheading">
            Two top-quality jet skis ready to take you on an adventure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {jetSkis.map((ski) => (
            <div key={ski.name} className="card group hover:shadow-xl transition-shadow duration-300">
              {/* Jet ski visual */}
              <div className={`relative h-48 bg-gradient-to-br ${ski.color} flex items-center justify-center`}>
                <Waves className="w-24 h-24 text-white/30" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">
                    {ski.model}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-brand-900 mb-2">{ski.name}</h3>
                <p className="text-brand-700/60 text-sm mb-4 leading-relaxed">{ski.description}</p>

                <div className="flex flex-wrap gap-2 mb-5">
                  {ski.features.map((feature) => (
                    <span
                      key={feature}
                      className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                <Link
                  href="/booking"
                  className="btn-primary w-full text-center block text-sm !py-2.5"
                >
                  Reserve This Jet Ski
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
