import Image from 'next/image';
import Link from 'next/link';

const jetSkis = [
  {
    name: 'Wave Runner 1',
    model: 'Yamaha EX Sport',
    description: 'Perfect for beginners and families. Stable, easy to handle, and a blast on the water!',
    features: ['Beginner Friendly', 'Seats 1-2', 'Smooth Ride'],
    image: '/jetskis-fleet.jpeg',
  },
  {
    name: 'Wave Runner 2',
    model: 'Yamaha EX Sport',
    description: 'Same great ride, double the fun! Bring a friend and race across the water.',
    features: ['Beginner Friendly', 'Seats 1-2', 'Smooth Ride'],
    image: '/jetski-action1.jpeg',
  },
];

export default function FleetSection() {
  return (
    <section id="fleet" className="py-20 md:py-28 bg-gradient-to-b from-white to-brand-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="section-heading mb-4">Our Fleet</h2>
          <p className="section-subheading">
            Two Yamaha EX Sport WaveRunners ready to take you on an adventure.
          </p>
        </div>

        {/* Full-width action photo */}
        <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden mb-10 max-w-4xl mx-auto">
          <Image
            src="/jetskis-fleet.jpeg"
            alt="Our two Yamaha EX Sport jet skis"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6">
            <span className="text-white font-bold text-lg md:text-xl">Both WaveRunners Ready to Ride</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {jetSkis.map((ski) => (
            <div key={ski.name} className="card group hover:shadow-xl transition-shadow duration-300">
              {/* Jet ski image */}
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={ski.image}
                  alt={ski.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="text-xs font-semibold text-white/90 uppercase tracking-wider bg-black/30 backdrop-blur-sm px-2 py-1 rounded">
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
