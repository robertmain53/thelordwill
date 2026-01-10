import { NextResponse } from 'next/server';
import {
  generateLinkingStrategy,
  generateBreadcrumbs,
  getTrendingNames,
  getThematicLinks,
  getRelatedSituations,
} from '@/lib/seo/internal-linking';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: Record<string, unknown> = {};

  try {
    // Test 1: Breadcrumbs (synchronous, should always work)
    try {
      results.breadcrumbs = generateBreadcrumbs('situation', 'Anxiety', 'anxiety');
      results.breadcrumbsSuccess = true;
    } catch (error) {
      results.breadcrumbsError = error instanceof Error ? error.message : String(error);
    }

    // Test 2: Trending Names
    try {
      const trendingNames = await getTrendingNames(2);
      results.trendingNames = {
        count: trendingNames.length,
        data: trendingNames,
      };
      results.trendingNamesSuccess = true;
    } catch (error) {
      results.trendingNamesError = error instanceof Error ? error.message : String(error);
    }

    // Test 3: Thematic Links
    try {
      const thematicLinks = await getThematicLinks('situation', 'anxiety');
      results.thematicLinks = {
        count: thematicLinks.length,
        data: thematicLinks,
      };
      results.thematicLinksSuccess = true;
    } catch (error) {
      results.thematicLinksError = error instanceof Error ? error.message : String(error);
    }

    // Test 4: Related Situations
    try {
      const relatedSituations = await getRelatedSituations('anxiety', 3);
      results.relatedSituations = {
        count: relatedSituations.length,
        data: relatedSituations,
      };
      results.relatedSituationsSuccess = true;
    } catch (error) {
      results.relatedSituationsError = error instanceof Error ? error.message : String(error);
    }

    // Test 5: Full Linking Strategy
    try {
      const breadcrumbs = generateBreadcrumbs('situation', 'Anxiety', 'anxiety');
      const linkingStrategy = await generateLinkingStrategy('situation', 'anxiety', breadcrumbs);
      results.linkingStrategy = {
        totalLinks: linkingStrategy.totalLinks,
        relatedSituationsCount: linkingStrategy.relatedSituations.length,
        trendingNamesCount: linkingStrategy.trendingNames.length,
        thematicLinksCount: linkingStrategy.thematicLinks.length,
      };
      results.linkingStrategySuccess = true;
    } catch (error) {
      results.linkingStrategyError = error instanceof Error ? error.message : String(error);
      results.linkingStrategyStack = error instanceof Error ? error.stack : undefined;
    }

    return NextResponse.json(results);

  } catch (error) {
    return NextResponse.json({
      error: 'Unexpected error',
      message: error instanceof Error ? error.message : String(error),
      results,
    }, { status: 500 });
  }
}
