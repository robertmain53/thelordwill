/**
 * Performance Monitoring Utilities
 * Track Core Web Vitals: LCP, INP, CLS, FCP, TTFB
 */

export interface WebVitalsMetric {
  id: string;
  name: 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  navigationType: string;
}

/**
 * Report Web Vitals to analytics
 * Can be used in app/layout.tsx or _app.tsx
 */
export function reportWebVitals(metric: WebVitalsMetric) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Web Vital:', {
      name: metric.name,
      value: Math.round(metric.value),
      rating: metric.rating,
    });
  }

  // Send to analytics service in production
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to your analytics service
    // Examples:
    // - Google Analytics
    // - Vercel Analytics
    // - Custom endpoint

    // Example for Google Analytics:
    // window.gtag?.('event', metric.name, {
    //   value: Math.round(metric.value),
    //   metric_id: metric.id,
    //   metric_value: metric.value,
    //   metric_delta: metric.delta,
    // });
  }
}

/**
 * Performance thresholds for Core Web Vitals
 */
export const PERFORMANCE_THRESHOLDS = {
  LCP: {
    good: 2000, // < 2.0s (target: < 2.0s)
    poor: 4000,
  },
  INP: {
    good: 200, // < 200ms (target: < 200ms)
    poor: 500,
  },
  CLS: {
    good: 0.1,
    poor: 0.25,
  },
  FCP: {
    good: 1800,
    poor: 3000,
  },
  TTFB: {
    good: 800,
    poor: 1800,
  },
} as const;

/**
 * Determine if a metric meets the performance target
 */
export function meetsPerformanceTarget(
  name: keyof typeof PERFORMANCE_THRESHOLDS,
  value: number
): boolean {
  return value < PERFORMANCE_THRESHOLDS[name].good;
}

/**
 * Calculate performance rating
 */
export function getPerformanceRating(
  name: keyof typeof PERFORMANCE_THRESHOLDS,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = PERFORMANCE_THRESHOLDS[name];

  if (value < thresholds.good) {
    return 'good';
  }

  if (value < thresholds.poor) {
    return 'needs-improvement';
  }

  return 'poor';
}
