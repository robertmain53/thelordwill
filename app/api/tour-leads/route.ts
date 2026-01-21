import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

type UTMShape = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  fbclid?: string;
};

type ContextShape = {
  type?: string;
  slug?: string;
  name?: string;
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function toStr(v: unknown): string | null {
  if (typeof v === 'string') return v.trim() || null;
  if (v == null) return null;
  return String(v).trim() || null;
}

function clampLen(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) : s;
}

function toStrClamped(v: unknown, max: number): string | null {
  const s = toStr(v);
  return s ? clampLen(s, max) : null;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeUTM(body: unknown, request: NextRequest): UTMShape {
  const bodyObj: Record<string, unknown> = isObject(body) ? body : {};
  if (isObject(bodyObj.utm)) {
    return {
      utm_source: toStr(bodyObj.utm.utm_source) || undefined,
      utm_medium: toStr(bodyObj.utm.utm_medium) || undefined,
      utm_campaign: toStr(bodyObj.utm.utm_campaign) || undefined,
      utm_term: toStr(bodyObj.utm.utm_term) || undefined,
      utm_content: toStr(bodyObj.utm.utm_content) || undefined,
      gclid: toStr(bodyObj.utm.gclid) || undefined,
      fbclid: toStr(bodyObj.utm.fbclid) || undefined,
    };
  }

  // Legacy compatibility (rarely present on /api URL)
  const url = new URL(request.url);
  return {
    utm_source: toStr(url.searchParams.get('utm_source') || bodyObj.utmSource) || undefined,
    utm_medium: toStr(url.searchParams.get('utm_medium') || bodyObj.utmMedium) || undefined,
    utm_campaign: toStr(url.searchParams.get('utm_campaign') || bodyObj.utmCampaign) || undefined,
    utm_term: toStr(url.searchParams.get('utm_term') || bodyObj.utmTerm) || undefined,
    utm_content: toStr(url.searchParams.get('utm_content') || bodyObj.utmContent) || undefined,
    gclid: toStr(url.searchParams.get('gclid') || bodyObj.gclid) || undefined,
    fbclid: toStr(url.searchParams.get('fbclid') || bodyObj.fbclid) || undefined,
  };
}

function normalizeContext(body: unknown): ContextShape {
  const bodyObj: Record<string, unknown> = isObject(body) ? body : {};
  if (isObject(bodyObj.context)) {
    return {
      type: toStr(bodyObj.context.type) || undefined,
      slug: toStr(bodyObj.context.slug) || undefined,
      name: toStr(bodyObj.context.name) || undefined,
    };
  }
  return {};
}

function normalizeInterestedIn(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const item of v) {
    const s = toStr(item);
    if (s && s.length <= 120) out.push(s);
    if (out.length >= 10) break;
  }
  return out;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Honeypot: if filled, silently accept but do not persist.
    const hp = toStr(body?.hp);
    if (hp) {
      return NextResponse.json({ success: true, message: 'Submitted' }, { status: 200 });
    }

    const name = toStrClamped(body?.name, 120);
    const email = toStrClamped(body?.email, 190);

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const utm = normalizeUTM(body, request);
    const context = normalizeContext(body);

    const sourceReferrer =
      toStrClamped(body?.sourceReferrer, 500) ||
      toStrClamped(request.headers.get('referer'), 500) ||
      null;

    const groupSizeRaw = toStrClamped(body?.groupSizeRaw, 40);
    const affiliateId = toStrClamped(body?.affiliateId, 60) || 'bein-harim';

    // DB rate limit: max 3 submissions / 10 minutes per email
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentCount = await prisma.tourLead.count({
      where: { email, createdAt: { gte: tenMinAgo } },
    });
    if (recentCount >= 3) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a few minutes and try again.' },
        { status: 429 }
      );
    }

    // Deduplicate: same email + contextSlug (or sourcePlace) within 24h returns existing
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dedupeKey = context.slug || toStr(body?.sourcePlace);
    if (dedupeKey) {
      const existing = await prisma.tourLead.findFirst({
        where: { email, contextSlug: dedupeKey, createdAt: { gte: dayAgo } },
        select: { id: true },
      });
      if (existing) {
        return NextResponse.json({ success: true, id: existing.id, message: 'Already received' }, { status: 200 });
      }
    }

    // FK-safe sourcePlace: only set if Place.slug exists, else null.
    let sourcePlace: string | null = toStrClamped(body?.sourcePlace, 200);
    if (sourcePlace) {
      const placeExists = await prisma.place.findUnique({
        where: { slug: sourcePlace },
        select: { slug: true },
      });
      if (!placeExists) sourcePlace = null;
    }

    const estimatedCommission = 5000 * 0.15;

    const tourLead = await prisma.tourLead.create({
      data: {
        name,
        email,
        phone: toStrClamped(body?.phone, 60),
        country: toStrClamped(body?.country, 80),

        interestedIn: normalizeInterestedIn(body?.interestedIn),
        travelDates: toStrClamped(body?.travelDates, 120),
        groupSize: Number.isFinite(Number(body?.groupSize)) ? Number(body.groupSize) : 1,
        budget: toStrClamped(body?.budget, 40),

        sourcePlace,
        sourcePage: toStrClamped(body?.sourcePage, 500),
        sourceReferrer,

        utmSource: utm.utm_source ? clampLen(utm.utm_source, 120) : null,
        utmMedium: utm.utm_medium ? clampLen(utm.utm_medium, 120) : null,
        utmCampaign: utm.utm_campaign ? clampLen(utm.utm_campaign, 120) : null,
        utmTerm: utm.utm_term ? clampLen(utm.utm_term, 120) : null,
        utmContent: utm.utm_content ? clampLen(utm.utm_content, 120) : null,
        gclid: utm.gclid ? clampLen(utm.gclid, 160) : null,
        fbclid: utm.fbclid ? clampLen(utm.fbclid, 160) : null,

        contextType: context.type ? clampLen(context.type, 40) : null,
        contextSlug: (context.slug || toStr(body?.sourcePlace)) ? clampLen(String(context.slug || body?.sourcePlace), 200) : null,
        contextName: context.name ? clampLen(context.name, 140) : null,
        groupSizeRaw,

        affiliateId,
        commission: estimatedCommission,
        status: 'new',
      },
    });

    return NextResponse.json(
      { success: true, id: tourLead.id, message: 'Tour inquiry submitted successfully' },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error creating tour lead:', error);
    const isDev = process.env.NODE_ENV !== 'production';
    return NextResponse.json(
      {
        error:
          isDev && error instanceof Error
            ? error.message
            : isDev
              ? String(error)
              : 'Failed to submit tour inquiry',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const adminToken = process.env.ADMIN_TOKEN;
    const provided = request.headers.get('x-admin-token');
    if (adminToken && provided !== adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);

    const where = status ? { status } : {};

    const leads = await prisma.tourLead.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        place: { select: { name: true, slug: true } },
      },
    });

    return NextResponse.json({ leads, count: leads.length });
  } catch (error: unknown) {
    console.error('Error fetching tour leads:', error);
    const isDev = process.env.NODE_ENV !== 'production';
    return NextResponse.json(
      {
        error:
          isDev && error instanceof Error
            ? error.message
            : isDev
              ? String(error)
              : 'Failed to fetch tour leads',
      },
      { status: 500 }
    );
  }
}
