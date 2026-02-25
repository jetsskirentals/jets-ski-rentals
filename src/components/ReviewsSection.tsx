'use client';

import { useEffect, useState } from 'react';
import { Star, Quote } from 'lucide-react';

interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
}

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    fetch('/api/reviews')
      .then(r => r.json())
      .then(data => setReviews(data.reviews))
      .catch(() => {});
  }, []);

  return (
    <section id="reviews" className="py-20 md:py-28 bg-gradient-to-b from-brand-50/50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="section-heading mb-4">What Our Riders Say</h2>
          <p className="section-subheading">
            Real reviews from real riders. See why people love jet skiing with us.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {reviews.map((review) => (
            <div key={review.id} className="card p-6 relative">
              <Quote className="absolute top-4 right-4 w-8 h-8 text-brand-100" />

              <div className="flex text-yellow-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < review.rating ? 'fill-current' : 'text-gray-200'
                    }`}
                  />
                ))}
              </div>

              <p className="text-brand-800/70 text-sm leading-relaxed mb-4 italic">
                &ldquo;{review.comment}&rdquo;
              </p>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-brand-400 to-ocean-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {review.customerName.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-brand-900 text-sm">{review.customerName}</p>
                  <p className="text-xs text-brand-600/50">
                    {new Date(review.date).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {reviews.length === 0 && (
          <p className="text-center text-brand-600/50">Loading reviews...</p>
        )}
      </div>
    </section>
  );
}
