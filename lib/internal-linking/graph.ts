import { getCanonicalUrl } from "@/lib/utils";
import {
  getRelatedLinks,
  type EntityType,
  type EntityRecord,
  type RelatedLink,
} from "@/lib/internal-linking";

const MAX_VERSE_LINKS = 8;
const MAX_ENTITY_LINKS = 8;

export interface VerseGraphRow {
  reference: string;
  bookId: number;
  chapter: number;
  verseNumber: number;
  relevanceScore: number;
  snippet?: string;
}

export interface GraphLinkSet {
  verseLinks: RelatedLink[];
  entityLinks: RelatedLink[];
}

function toVerseLink(row: VerseGraphRow): RelatedLink {
  const snippet = row.snippet
    ? row.snippet.replace(/\s+/g, " ").trim()
    : undefined;
  const description = snippet
    ? snippet.length > 100
      ? `${snippet.slice(0, 100)}…`
      : snippet
    : `Relevance: ${row.relevanceScore}`;

  return {
    href: getCanonicalUrl(`/verse/${row.bookId}/${row.chapter}/${row.verseNumber}`),
    title: row.reference,
    description,
    type: "verse",
  };
}

export function buildVerseGraphLinks(rows: VerseGraphRow[], limit = MAX_VERSE_LINKS): RelatedLink[] {
  return rows
    .slice()
    .sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      if (a.reference !== b.reference) {
        return a.reference.localeCompare(b.reference);
      }
      return 0;
    })
    .slice(0, limit)
    .map(toVerseLink);
}

export async function getEntityGraphLinks(
  entityType: EntityType,
  record: EntityRecord,
  limit = MAX_ENTITY_LINKS,
): Promise<RelatedLink[]> {
  const links = await getRelatedLinks(entityType, record);
  return links
    .slice()
    .sort((a, b) => a.title.localeCompare(b.title))
    .slice(0, limit);
}

export async function getGraphLinkSet(options: {
  entityType: EntityType;
  record: EntityRecord;
  verseRows: VerseGraphRow[];
  verseLimit?: number;
  entityLimit?: number;
}): Promise<GraphLinkSet> {
  const verseLinks = buildVerseGraphLinks(options.verseRows, options.verseLimit ?? MAX_VERSE_LINKS);
  const entityLinks = await getEntityGraphLinks(
    options.entityType,
    options.record,
    options.entityLimit ?? MAX_ENTITY_LINKS,
  );

  return {
    verseLinks,
    entityLinks,
  };
}
