import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    // Extract UTM parameters from URL if present
    const url = new URL(request.url);
    const utmSource = url.searchParams.get('utm_source') || body.utmSource;
    const utmMedium = url.searchParams.get('utm_medium') || body.utmMedium;
    const utmCampaign = url.searchParams.get('utm_campaign') || body.utmCampaign;

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
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        utmCampaign: utmCampaign || null,
        affiliateId: 'bein-harim', // Default tour partner
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
