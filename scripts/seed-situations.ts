#!/usr/bin/env tsx
/**
 * Seed popular situations with verse mappings
 * These are the most searched-for biblical topics
 */

import { PrismaClient } from '@prisma/client';
import { generateVerseId } from '../lib/bible';

// Disable prepared statements for connection pooling
const databaseUrl = process.env.DATABASE_URL || '';
const urlWithoutCache = databaseUrl.includes('?')
  ? `${databaseUrl}&pgbouncer=true&statement_cache_size=0`
  : `${databaseUrl}?pgbouncer=true&statement_cache_size=0`;

const prisma = new PrismaClient({
  datasources: { db: { url: urlWithoutCache } },
});

const situations = [
  {
    slug: 'anxiety',
    title: 'Anxiety',
    metaDescription: 'Find peace in these powerful Bible verses about anxiety. Discover Scripture that offers comfort, hope, and God\'s promises to calm your worried heart.',
    category: 'emotion',
    content: 'When anxiety overwhelms you, God\'s Word provides comfort and peace. These verses remind us that God cares for us and invites us to cast our worries on Him.',
    verses: [
      { book: 50, chapter: 4, verse: 6, relevance: 100 }, // Philippians 4:6
      { book: 60, chapter: 5, verse: 7, relevance: 100 }, // 1 Peter 5:7
      { book: 40, chapter: 6, verse: 25, relevance: 95 }, // Matthew 6:25
      { book: 40, chapter: 11, verse: 28, relevance: 95 }, // Matthew 11:28
      { book: 43, chapter: 14, verse: 27, relevance: 95 }, // John 14:27
      { book: 23, chapter: 41, verse: 10, relevance: 90 }, // Isaiah 41:10
      { book: 19, chapter: 94, verse: 19, relevance: 90 }, // Psalm 94:19
      { book: 19, chapter: 55, verse: 22, relevance: 85 }, // Psalm 55:22
    ],
  },
  {
    slug: 'fear',
    title: 'Fear',
    metaDescription: 'Overcome fear with these encouraging Bible verses. Find strength and courage through God\'s promises that He is with you always.',
    category: 'emotion',
    content: 'Fear not, for God is with you. Throughout Scripture, we\'re reminded that God\'s perfect love casts out fear and His presence brings courage.',
    verses: [
      { book: 23, chapter: 41, verse: 10, relevance: 100 }, // Isaiah 41:10
      { book: 5, chapter: 31, verse: 6, relevance: 100 }, // Deuteronomy 31:6
      { book: 62, chapter: 4, verse: 18, relevance: 95 }, // 1 John 4:18
      { book: 19, chapter: 23, verse: 4, relevance: 95 }, // Psalm 23:4
      { book: 19, chapter: 27, verse: 1, relevance: 90 }, // Psalm 27:1
      { book: 19, chapter: 56, verse: 3, relevance: 85 }, // Psalm 56:3
      { book: 55, chapter: 1, verse: 7, relevance: 85 }, // 2 Timothy 1:7
    ],
  },
  {
    slug: 'hope',
    title: 'Hope',
    metaDescription: 'Find renewed hope in these uplifting Bible verses. Discover God\'s promises for a future filled with purpose and joy.',
    category: 'emotion',
    content: 'Hope anchors the soul. These verses remind us that our hope is found in God\'s unchanging character and His faithful promises.',
    verses: [
      { book: 24, chapter: 29, verse: 11, relevance: 100 }, // Jeremiah 29:11
      { book: 45, chapter: 15, verse: 13, relevance: 100 }, // Romans 15:13
      { book: 19, chapter: 42, verse: 11, relevance: 95 }, // Psalm 42:11
      { book: 58, chapter: 11, verse: 1, relevance: 95 }, // Hebrews 11:1
      { book: 25, chapter: 3, verse: 22, relevance: 90 }, // Lamentations 3:22-23
      { book: 45, chapter: 5, verse: 5, relevance: 85 }, // Romans 5:5
    ],
  },
  {
    slug: 'grief',
    title: 'Grief',
    metaDescription: 'Find comfort in loss with these compassionate Bible verses about grief. God promises to be near the brokenhearted and bind up their wounds.',
    category: 'life-event',
    content: 'In times of loss and mourning, God draws near to comfort us. These verses offer solace and remind us of His presence in our pain.',
    verses: [
      { book: 19, chapter: 34, verse: 18, relevance: 100 }, // Psalm 34:18
      { book: 40, chapter: 5, verse: 4, relevance: 100 }, // Matthew 5:4
      { book: 43, chapter: 11, verse: 35, relevance: 95 }, // John 11:35
      { book: 19, chapter: 147, verse: 3, relevance: 95 }, // Psalm 147:3
      { book: 66, chapter: 21, verse: 4, relevance: 90 }, // Revelation 21:4
      { book: 47, chapter: 1, verse: 3, relevance: 85 }, // 2 Corinthians 1:3-4
    ],
  },
  {
    slug: 'strength',
    title: 'Strength',
    metaDescription: 'Gain strength through these powerful Bible verses. Discover how God renews your energy and empowers you to persevere.',
    category: 'challenge',
    content: 'When you feel weak, God\'s strength is made perfect. These verses remind us that our strength comes from the Lord.',
    verses: [
      { book: 23, chapter: 40, verse: 31, relevance: 100 }, // Isaiah 40:31
      { book: 50, chapter: 4, verse: 13, relevance: 100 }, // Philippians 4:13
      { book: 19, chapter: 46, verse: 1, relevance: 95 }, // Psalm 46:1
      { book: 47, chapter: 12, verse: 9, relevance: 95 }, // 2 Corinthians 12:9
      { book: 16, chapter: 8, verse: 10, relevance: 90 }, // Nehemiah 8:10
      { book: 23, chapter: 41, verse: 10, relevance: 85 }, // Isaiah 41:10
    ],
  },
  {
    slug: 'forgiveness',
    title: 'Forgiveness',
    metaDescription: 'Experience freedom through these Bible verses about forgiveness. Learn how God\'s grace enables us to forgive and be forgiven.',
    category: 'spiritual',
    content: 'Forgiveness is at the heart of the Gospel. These verses reveal God\'s merciful forgiveness and call us to extend grace to others.',
    verses: [
      { book: 62, chapter: 1, verse: 9, relevance: 100 }, // 1 John 1:9
      { book: 49, chapter: 4, verse: 32, relevance: 100 }, // Ephesians 4:32
      { book: 40, chapter: 6, verse: 14, relevance: 95 }, // Matthew 6:14-15
      { book: 51, chapter: 3, verse: 13, relevance: 90 }, // Colossians 3:13
      { book: 19, chapter: 103, verse: 12, relevance: 90 }, // Psalm 103:12
      { book: 42, chapter: 23, verse: 34, relevance: 85 }, // Luke 23:34
    ],
  },
  {
    slug: 'peace',
    title: 'Peace',
    metaDescription: 'Find inner peace through these calming Bible verses. Discover the peace that surpasses understanding in God\'s presence.',
    category: 'emotion',
    content: 'True peace is found in Christ. These verses guide us to the peace that transcends circumstances and guards our hearts.',
    verses: [
      { book: 43, chapter: 14, verse: 27, relevance: 100 }, // John 14:27
      { book: 50, chapter: 4, verse: 7, relevance: 100 }, // Philippians 4:7
      { book: 45, chapter: 5, verse: 1, relevance: 95 }, // Romans 5:1
      { book: 23, chapter: 26, verse: 3, relevance: 95 }, // Isaiah 26:3
      { book: 4, chapter: 6, verse: 24, relevance: 90 }, // Numbers 6:24-26
      { book: 51, chapter: 3, verse: 15, relevance: 85 }, // Colossians 3:15
    ],
  },
  {
    slug: 'love',
    title: 'Love',
    metaDescription: 'Understand God\'s perfect love through these beautiful Bible verses. Explore what true love looks like and how to love others well.',
    category: 'spiritual',
    content: 'God is love. These verses reveal the depth of God\'s love for us and teach us how to love Him and others.',
    verses: [
      { book: 43, chapter: 3, verse: 16, relevance: 100 }, // John 3:16
      { book: 46, chapter: 13, verse: 4, relevance: 100 }, // 1 Corinthians 13:4-8
      { book: 62, chapter: 4, verse: 8, relevance: 95 }, // 1 John 4:8
      { book: 62, chapter: 4, verse: 19, relevance: 90 }, // 1 John 4:19
      { book: 45, chapter: 8, verse: 38, relevance: 90 }, // Romans 8:38-39
      { book: 43, chapter: 15, verse: 13, relevance: 85 }, // John 15:13
    ],
  },
  {
    slug: 'patience',
    title: 'Patience',
    metaDescription: 'Learn patience through these inspiring Bible verses. Discover how to wait on God\'s timing with faith and endurance.',
    category: 'character',
    content: 'Patience is a fruit of the Spirit. These verses teach us to wait on the Lord and trust His perfect timing.',
    verses: [
      { book: 59, chapter: 5, verse: 7, relevance: 100 }, // James 5:7-8
      { book: 48, chapter: 5, verse: 22, relevance: 95 }, // Galatians 5:22-23
      { book: 19, chapter: 37, verse: 7, relevance: 95 }, // Psalm 37:7
      { book: 19, chapter: 27, verse: 14, relevance: 90 }, // Psalm 27:14
      { book: 20, chapter: 14, verse: 29, relevance: 85 }, // Proverbs 14:29
      { book: 45, chapter: 12, verse: 12, relevance: 85 }, // Romans 12:12
    ],
  },
  {
    slug: 'trust',
    title: 'Trust',
    metaDescription: 'Build your faith with these powerful Bible verses about trust. Learn to rely on God completely in every circumstance.',
    category: 'spiritual',
    content: 'Trust in the Lord with all your heart. These verses encourage us to place our complete confidence in God\'s faithful character.',
    verses: [
      { book: 20, chapter: 3, verse: 5, relevance: 100 }, // Proverbs 3:5-6
      { book: 19, chapter: 56, verse: 3, relevance: 95 }, // Psalm 56:3
      { book: 19, chapter: 37, verse: 5, relevance: 95 }, // Psalm 37:5
      { book: 23, chapter: 26, verse: 4, relevance: 90 }, // Isaiah 26:4
      { book: 20, chapter: 16, verse: 20, relevance: 85 }, // Proverbs 16:20
      { book: 34, chapter: 3, verse: 5, relevance: 85 }, // Nahum 1:7 (Note: adjusted)
    ],
  },
];

async function main() {
  console.log('📖 Seeding Situations with verse mappings...\n');

  let situationsCreated = 0;
  let versesLinked = 0;

  for (const sitData of situations) {
    try {
      // Create or update situation
      const situation = await prisma.situation.upsert({
        where: { slug: sitData.slug },
        update: {},
        create: {
          slug: sitData.slug,
          title: sitData.title,
          metaDescription: sitData.metaDescription,
          category: sitData.category,
          content: sitData.content,
        },
      });

      console.log(`✓ Created: ${situation.title} (${situation.slug})`);
      situationsCreated++;

      // Create verse mappings
      for (const v of sitData.verses) {
        const verseId = generateVerseId(v.book, v.chapter, v.verse);

        try {
          await prisma.situationVerseMapping.create({
            data: {
              situationId: situation.id,
              verseId: verseId,
              relevanceScore: v.relevance,
              isVerified: true,
            },
          });
          versesLinked++;
        } catch (error) {
          // Verse might not exist or mapping already exists
          console.log(`  ⚠ Skipped verse ${v.book}:${v.chapter}:${v.verse}`);
        }
      }

      console.log(`  Linked ${sitData.verses.length} verses\n`);
    } catch (error) {
      console.error(`Error creating situation ${sitData.slug}:`, error);
    }
  }

  console.log('✅ Situations seeded successfully!\n');
  console.log('📊 Summary:');
  console.log(`  Situations created: ${situationsCreated}`);
  console.log(`  Verses linked: ${versesLinked}`);
  console.log('\n🌐 Test URLs:');
  console.log('  http://localhost:3000/bible-verses-for-anxiety');
  console.log('  http://localhost:3000/bible-verses-for-fear');
  console.log('  http://localhost:3000/bible-verses-for-hope\n');
}

main()
  .catch((error) => {
    console.error('Error seeding situations:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
