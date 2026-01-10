/**
 * Translation utilities for Bible verses
 * Server-side utilities for preparing translation data
 */

export interface Translation {
  version: string;
  fullName: string;
  text: string | null;
}

/**
 * Helper to map database fields to translation objects
 * Can be used on both server and client
 */
export function prepareTranslations(verse: {
  textKjv: string | null;
  textWeb: string | null;
  textAsv: string | null;
  textBbe: string | null;
  textYlt: string | null;
}): Translation[] {
  return [
    {
      version: 'KJV',
      fullName: 'King James Version',
      text: verse.textKjv,
    },
    {
      version: 'WEB',
      fullName: 'World English Bible',
      text: verse.textWeb,
    },
    {
      version: 'ASV',
      fullName: 'American Standard Version',
      text: verse.textAsv,
    },
    {
      version: 'BBE',
      fullName: 'Bible in Basic English',
      text: verse.textBbe,
    },
    {
      version: 'YLT',
      fullName: "Young's Literal Translation",
      text: verse.textYlt,
    },
  ];
}
