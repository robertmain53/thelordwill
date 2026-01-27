/**
 * Poster API Route for Situations
 * Returns poster URL for a given situation slug
 * Uses the top verse from the situation for poster content
 */

import { NextRequest, NextResponse } from "next/server";
import { getSituationWithVerses, formatVerseReference } from "@/lib/db/situation-queries";
import { getPosterUrl } from "@/lib/posters/provider";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: "Slug is required" },
        { status: 400 }
      );
    }

    // Get situation with its top verses
    const situation = await getSituationWithVerses(slug, 1);

    if (!situation) {
      return NextResponse.json(
        { error: "Situation not found" },
        { status: 404 }
      );
    }

    // Get the top verse for the poster
    const topMapping = situation.verseMappings[0];
    if (!topMapping) {
      return NextResponse.json(
        { error: "No verses found for this situation" },
        { status: 404 }
      );
    }

    const verse = topMapping.verse;
    const verseRef = formatVerseReference(verse);
    const verseText = verse.textKjv || verse.textWeb || "";

    // Generate poster URL
    const posterUrl = await getPosterUrl({
      type: "situation",
      slug,
      verseRef,
      verseText,
    });

    return NextResponse.json({
      success: true,
      data: {
        slug,
        title: situation.title,
        posterUrl,
        verse: {
          reference: verseRef,
          text: verseText.substring(0, 200) + (verseText.length > 200 ? "..." : ""),
        },
      },
    });
  } catch (error) {
    console.error("Poster generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate poster" },
      { status: 500 }
    );
  }
}
