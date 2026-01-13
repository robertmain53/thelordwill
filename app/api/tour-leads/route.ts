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

function normalizeUTM(body: any, request: NextRequest): UTMShape {
  // Prefer body.utm (sent by client). request.url here is /api/tour-leads and usually has no UTM.
  if (isObject(body?.utm)) {
    return {
      utm_source: toStr(body.utm.utm_source) || undefined,
      utm_medium: toStr(body.utm.utm_medium) || undefined,
      utm_campaign: toStr(body.utm.utm_campaign) || undefined,
      utm_term: toStr(body.utm.utm_term) || undefined,
      utm_content: toStr(body.utm.utm_content) || undefined,
      gclid: toStr(body.utm.gclid) || undefined,
      fbclid: toStr(body.utm.fbclid) || undefined,
    };
  }

  // Legacy compatibility
  const url = new URL(request.url);
  return {
    utm_source: toStr(url.searchParams.get('utm_source') || body?.utmSource) || undefined,
    utm_medium: toStr(url.searchParams.get('utm_medium') || body?.utmMedium) || undefined,
    utm_campaign: toStr(url.searchParams.get('utm_campaign') || body?.utmCampaign) || undefined,
  };
}

function normalizeContext(body: any): ContextShape {
  if (isObject(body?.context)) {
    return {
      type: toStr(body.context.type) || undefined,
      slug: toStr(body.context.slug) || undefined,
      name: toStr(body.context.name) || undefined,
    };
  }
  return {};
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const utm = normalizeUTM(body, request);
    const context = normalizeContext(body);
    const sourceReferrer = toStr(body?.sourceReferrer);
    const groupSizeRaw = toStr(body?.groupSizeRaw);
    const affiliateId = toStr(body?.affiliateId) || 'bein-harim';

    // Calculate expected commission (example: 15% of average $5000 tour)
    const avgTourPrice = 5000;
    const commissionRate = 0.15;
    const estimatedCommission = avgTourPrice * commissionRate;

    // Create tour lead in database
    const tourLead = await prisma.tourLead.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        country: body.country || null,
        interestedIn: body.interestedIn || [],
        travelDates: body.travelDates || null,
        groupSize: body.groupSize || 1,
        budget: body.budget || null,
        sourcePlace: body.sourcePlace || null,
        sourcePage: body.sourcePage || null,
        sourceReferrer: sourceReferrer || null,
        utmSource: utm.utm_source || null,
        utmMedium: utm.utm_medium || null,
        utmCampaign: utm.utm_campaign || null,
        utmTerm: utm.utm_term || null,
        utmContent: utm.utm_content || null,
        gclid: utm.gclid || null,
        fbclid: utm.fbclid || null,
        contextType: context.type || null,
        contextSlug: context.slug || null,
        contextName: context.name || null,
        groupSizeRaw: groupSizeRaw || null,
        affiliateId, // Default tour partner, can be overridden safely
        commission: estimatedCommission,
        status: 'new',
      },
    });

    // TODO: Send email notification to tour operators
    // TODO: Send confirmation email to lead
    // TODO: Add to CRM/marketing automation

    return NextResponse.json(
      {
        success: true,
        id: tourLead.id,
        message: 'Tour inquiry submitted successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating tour lead:', error);
    return NextResponse.json(
      { error: 'Failed to submit tour inquiry' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve tour leads (admin only)
export async function GET(request: NextRequest) {
  try {
    // Minimal protection: require an admin token header.
    // Set ADMIN_TOKEN in env (Vercel/hosting).
    const adminToken = process.env.ADMIN_TOKEN;
    const provided = request.headers.get('x-admin-token');
    if (adminToken && provided !== adminToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    const where = status ? { status } : {};

    const leads = await prisma.tourLead.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        place: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({
      leads,
      count: leads.length,
    });
  } catch (error) {
    console.error('Error fetching tour leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tour leads' },
      { status: 500 }
    );
  }
}