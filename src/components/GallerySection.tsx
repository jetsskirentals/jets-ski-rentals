import Image from 'next/image';

const photos = [
  { src: '/jetski-action3.jpeg', alt: 'Jet ski riders on the open water' },
  { src: '/jetski-action4.jpeg', alt: 'Father and son riding a WaveRunner' },
  { src: '/jetskis-fleet.jpeg', alt: 'Two Yamaha WaveRunners ready to ride' },
  { src: '/jetski-action2.jpeg', alt: 'Jet ski action on the water' },
];

export default function GallerySection() {
  return (
    <section className="py-16 md:py-20 bg-brand-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="section-heading mb-4">See the Action</h2>
          <p className="section-subheading">
            Real photos from our riders out on the water.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {photos.map((photo, i) => (
            <div
              key={photo.src}
              className={`relative overflow-hidden rounded-xl ${
                i === 0 ? 'col-span-2 row-span-2 h-64 md:h-80' : 'h-32 md:h-40'
              }`}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                className="object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
