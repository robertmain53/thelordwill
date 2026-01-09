'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface TourLeadFormProps {
  placeName: string;
  placeSlug: string;
  className?: string;
}

export function TourLeadForm({ placeName, placeSlug, className = '' }: TourLeadFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      country: formData.get('country'),
      groupSize: parseInt(formData.get('groupSize') as string) || 1,
      budget: formData.get('budget'),
      travelDates: formData.get('travelDates'),
      sourcePlace: placeSlug,
      sourcePage: typeof window !== 'undefined' ? window.location.href : '',
      interestedIn: [placeSlug],
    };

    try {
      const response = await fetch('/api/tour-leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      setIsSuccess(true);
    } catch (err) {
      setError('Failed to submit form. Please try again.');
      console.error('Form submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-green-600">Thank You!</CardTitle>
          <CardDescription>
            Your inquiry has been received. A tour specialist will contact you within 24 hours.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Check your email for confirmation and next steps.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Experience {placeName} in Person</CardTitle>
        <CardDescription>
          Join a Christian pilgrimage tour to walk where Jesus walked. Get a free quote from our trusted partners.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="John Smith"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-1">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium mb-1">
                Country
              </label>
              <input
                type="text"
                id="country"
                name="country"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="United States"
              />
            </div>

            <div>
              <label htmlFor="groupSize" className="block text-sm font-medium mb-1">
                Group Size
              </label>
              <select
                id="groupSize"
                name="groupSize"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">1 person</option>
                <option value="2">2 people</option>
                <option value="3-5">3-5 people</option>
                <option value="6-10">6-10 people</option>
                <option value="11+">11+ people (group tour)</option>
              </select>
            </div>

            <div>
              <label htmlFor="budget" className="block text-sm font-medium mb-1">
                Budget Preference
              </label>
              <select
                id="budget"
                name="budget"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="economy">Economy ($2,000-$3,500)</option>
                <option value="standard">Standard ($3,500-$5,000)</option>
                <option value="luxury">Luxury ($5,000-$8,000)</option>
                <option value="private">Private Tour ($8,000+)</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="travelDates" className="block text-sm font-medium mb-1">
              Preferred Travel Dates (or season)
            </label>
            <input
              type="text"
              id="travelDates"
              name="travelDates"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Spring 2026, December 2025, etc."
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? 'Submitting...' : 'Get Free Quote'}
            </Button>
            <p className="text-xs text-gray-500 text-center">
              No commitment required. Receive quotes from top Holy Land tour operators.
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Trusted by 10,000+ Christian travelers</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Expert biblical guides & secure booking</span>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
