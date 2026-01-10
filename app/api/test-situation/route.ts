import { NextResponse } from 'next/server';
import { getSituationWithVerses } from '@/lib/db/situation-queries';
import { generateIntroduction, generateFAQs } from '@/lib/content/generator';
import { formatVerseReference } from '@/lib/db/situation-queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Step 1: Get situation data
    const situationData = await getSituationWithVerses('anxiety', 10);

    if (!situationData) {
      return NextResponse.json({ error: 'Situation not found' }, { status: 404 });
    }

    // Step 2: Prepare verses for generation
    const versesForGeneration = situationData.verseMappings.slice(0, 5).map((mapping) => ({
      reference: formatVerseReference(mapping.verse),
      text: mapping.verse.textKjv || mapping.verse.textWeb || '',
    }));

    // Step 3: Test introduction generation
    let introduction;
    try {
      introduction = await generateIntroduction({
        situation: situationData.title,
        verses: versesForGeneration,
        targetWordCount: 300,
      });
    } catch (error) {
      return NextResponse.json({
        error: 'Introduction generation failed',
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }

    // Step 4: Test FAQ generation
    let faqs;
    try {
      faqs = await generateFAQs(situationData.title, versesForGeneration);
    } catch (error) {
      return NextResponse.json({
        error: 'FAQ generation failed',
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      situation: situationData.title,
      verseCount: situationData.verseMappings.length,
      introductionLength: introduction.content.length,
      faqCount: faqs.length,
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
