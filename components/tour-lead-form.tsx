'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  isValidLocale,
  type Locale,
  DEFAULT_LOCALE,
} from '@/lib/i18n/locales';

interface TourLeadFormProps {
  placeName?: string;
  placeSlug?: string;
  /** Optional higher-level context (e.g., itinerary slug). */
  contextSlug?: string;
  contextType?: 'place' | 'itinerary' | 'hub' | 'unknown';
  className?: string;
}

type TourLeadTextPack = {
  title: string;
  description: string;
  successTitle: string;
  successBody: string;
  fields: Record<string, string>;
  placeholders: Record<string, string>;
  submit: string;
  submitting: string;
  footnoteLine1: string;
  footnoteLine2: string;
};

const TOUR_LEAD_TEXTS: Record<Locale, TourLeadTextPack> = {
  en: {
    title: 'Experience {place} in Person',
    description: 'Request quotes from vetted Holy Land tour operators. Compare itineraries, inclusions, and travel dates.',
    successTitle: 'Request Received!',
    successBody: 'Thank you for your interest. Our partners will be in touch with you shortly with tour options.',
    fields: {
      name: 'Full Name',
      email: 'Email Address',
      phone: 'Phone Number',
      country: 'Country of Residence',
      groupSize: 'Group Size',
      budget: 'Budget (USD)',
      dates: 'Travel Dates',
    },
    placeholders: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1 (555) 000-0000',
      country: 'United States',
      groupSize: 'Select group size',
      budget: '$5,000 - $10,000',
      dates: 'Dec 1 - Dec 10',
    },
    submit: 'Request a Quote',
    submitting: 'Sending Request...',
    footnoteLine1: 'Request quotes from vetted Holy Land tour operators',
    footnoteLine2: 'Compare itineraries, inclusions, and travel dates',
  },
  es: {
    title: 'Visita {place} en persona',
    description: 'Solicita cotizaciones a operadores de tours en Tierra Santa. Compara itinerarios, servicios e itinerarios.',
    successTitle: '¡Solicitud recibida!',
    successBody: 'Gracias por tu interés. Nuestros socios te contactarán pronto con opciones de viaje.',
    fields: {
      name: 'Nombre completo',
      email: 'Correo electrónico',
      phone: 'Número de teléfono',
      country: 'País de residencia',
      groupSize: 'Tamaño del grupo',
      budget: 'Presupuesto (USD)',
      dates: 'Fechas de viaje',
    },
    placeholders: {
      name: 'Juan Pérez',
      email: 'juan@ejemplo.com',
      phone: '+34 600 000 000',
      country: 'España',
      groupSize: 'Selecciona tamaño',
      budget: '$5,000 - $10,000',
      dates: '1 Dic - 10 Dic',
    },
    submit: 'Solicitar cotización',
    submitting: 'Enviando solicitud…',
    footnoteLine1: 'Solicita cotizaciones a operadores de Tierra Santa',
    footnoteLine2: 'Compara itinerarios, servicios y fechas de viaje',
  },
  pt: {
    title: 'Experimente {place} pessoalmente',
    description: 'Solicite cotações com operadores de viagens da Terra Santa. Compare roteiros, inclusões e datas de viagem.',
    successTitle: 'Solicitação recebida!',
    successBody: 'Obrigado pelo seu interesse. Nossos parceiros entrarão em contato em breve com opções de viagem.',
    fields: {
      name: 'Nome completo',
      email: 'E-mail',
      phone: 'Telefone',
      country: 'País de residência',
      groupSize: 'Tamanho do grupo',
      budget: 'Orçamento (USD)',
      dates: 'Datas da viagem',
    },
    placeholders: {
      name: 'João Silva',
      email: 'joao@exemplo.com',
      phone: '+55 11 90000-0000',
      country: 'Brasil',
      groupSize: 'Selecione o grupo',
      budget: '$5,000 - $10,000',
      dates: '1 Dez - 10 Dez',
    },
    submit: 'Solicitar cotação',
    submitting: 'Enviando solicitação…',
    footnoteLine1: 'Peça cotações com operadores da Terra Santa',
    footnoteLine2: 'Compare roteiros, inclusões e datas',
  },
};

export function TourLeadForm({
  placeName = 'the Holy Land',
  placeSlug = 'holy-land',
  contextSlug,
  contextType = 'unknown',
  className = '',
}: TourLeadFormProps) {
  const pathname = usePathname();
  const derivedLocale = pathname?.split('/')[1];
  const locale =
    isValidLocale(derivedLocale) ? (derivedLocale as Locale) : DEFAULT_LOCALE;
  const localeText = TOUR_LEAD_TEXTS[locale];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    const groupSizeRaw = String(formData.get('groupSize') ?? '1');
    const groupSizeMin = parseGroupSizeMin(groupSizeRaw);

    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      country: formData.get('country'),
      // Honeypot: should remain empty for humans.
      hp: formData.get('company'),
      // Keep backward-compatible numeric field, but make it meaningful.
      groupSize: groupSizeMin,
      // Add non-breaking context fields (backend can ignore if not used).
      groupSizeRaw,
      budget: formData.get('budget'),
      travelDates: formData.get('travelDates'),
      sourcePlace: placeSlug,
      sourcePage: typeof window !== 'undefined' ? window.location.href : '',
      sourceReferrer: typeof window !== 'undefined' ? document.referrer : '',
      utm: typeof window !== 'undefined' ? getUTMParams(window.location.search) : {},
      context: {
        type: contextType,
        slug: contextSlug || placeSlug,
        name: placeName,
      },
      interestedIn: [contextSlug || placeSlug],
    };

    try {
      const response = await fetch('/api/tour-leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const payload = (await response.json().catch(() => null)) as unknown;
      const errorMessage =
        typeof payload === 'object' &&
        payload !== null &&
        'error' in payload &&
        typeof (payload as { error?: unknown }).error === 'string'
          ? (payload as { error?: string }).error
          : '';
      if (!response.ok) {
        const msg = errorMessage || 'Something went wrong. Please try again later.';
        throw new Error(msg);
      }

      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Request Received!</h3>
            <p className="text-gray-600">
              Thank you for your interest. Our partners will be in touch with you shortly with tour options.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Experience {placeName} in Person</CardTitle>
        <CardDescription>
          Request quotes from vetted Holy Land tour operators. Compare itineraries, inclusions, and travel dates.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Honeypot field (anti-bot). Hidden from users, visible to many bots. */}
          <div
            aria-hidden="true"
            className="absolute left-[-10000px] top-auto w-[1px] h-[1px] overflow-hidden"
          >
            <label htmlFor="company">Company</label>
            <input
              type="text"
              id="company"
              name="company"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              {localeText.fields.name}
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={localeText.placeholders.name}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                {localeText.fields.email}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={localeText.placeholders.email}
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-1">
                {localeText.fields.phone}
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={localeText.placeholders.phone}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="country" className="block text-sm font-medium mb-1">
                {localeText.fields.country}
              </label>
              <input
                type="text"
                id="country"
                name="country"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={localeText.placeholders.country}
              />
            </div>
            <div>
              <label htmlFor="groupSize" className="block text-sm font-medium mb-1">
                {localeText.fields.groupSize}
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
            <label htmlFor="budget" className="block text-sm font-medium mb-1">
                {localeText.fields.budget}
              </label>
              <select
                id="budget"
                name="budget"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{localeText.placeholders.budget}</option>
                <option value="budget">$1,500 - $2,500</option>
                <option value="standard">$2,500 - $3,500</option>
                <option value="premium">$3,500 - $5,000</option>
                <option value="luxury">$5,000+</option>
              </select>
            </div>
            <div>
            <label htmlFor="travelDates" className="block text-sm font-medium mb-1">
                {localeText.fields.dates}
              </label>
              <input
                type="text"
                id="travelDates"
                name="travelDates"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={localeText.placeholders.dates}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm p-2 bg-red-50 rounded">
              {error}
            </div>
          )}

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors"
              disabled={isSubmitting}
            >
              {isSubmitting ? localeText.submitting : localeText.submit}
            </Button>

          <p className="text-xs text-gray-500 text-center mt-2">
            By submitting this form, you agree to share your information with our selected travel partners.
          </p>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{localeText.footnoteLine1}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{localeText.footnoteLine2}</span>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function parseGroupSizeMin(raw: string): number {
  // Normalize to the minimum plausible group size for analytics & routing.
  if (raw.includes('-')) {
    const n = Number(raw.split('-')[0]);
    return Number.isFinite(n) ? n : 1;
  }
  if (raw.endsWith('+')) {
    const n = Number(raw.replace('+', ''));
    return Number.isFinite(n) ? n : 11;
  }
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function getUTMParams(search: string) {
  const p = new URLSearchParams(search);
  const utm_source = p.get('utm_source') || '';
  const utm_medium = p.get('utm_medium') || '';
  const utm_campaign = p.get('utm_campaign') || '';
  const utm_term = p.get('utm_term') || '';
  const utm_content = p.get('utm_content') || '';
  const gclid = p.get('gclid') || '';
  const fbclid = p.get('fbclid') || '';
  return { utm_source, utm_medium, utm_campaign, utm_term, utm_content, gclid, fbclid };
}
