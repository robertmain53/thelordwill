#!/usr/bin/env tsx
/**
 * Seed Jerusalem as the first biblical place
 * This creates a sample Place record with verse mappings for testing
 */

import { PrismaClient } from '@prisma/client';
import { generateVerseId } from '../lib/bible';

const prisma = new PrismaClient();

async function main() {
  console.log('🏛️  Seeding Jerusalem as first biblical place...\n');

  // Create Jerusalem place
  const jerusalem = await prisma.place.upsert({
    where: { slug: 'jerusalem' },
    update: {},
    create: {
      slug: 'jerusalem',
      name: 'Jerusalem',
      description: 'The holy city of Jerusalem holds unparalleled significance in biblical history. Known as the City of David, Jerusalem was the capital of ancient Israel and the location of both Solomon\'s Temple and the Second Temple. It is where Jesus was crucified, buried, and resurrected, making it the most sacred city in Christianity.',
      biblicalContext: `Jerusalem appears over 800 times in the Bible, more than any other city. It was conquered by King David around 1000 BC and became the political and spiritual center of Israel. Solomon built the First Temple here, which housed the Ark of the Covenant.

The city witnessed Jesus' final week on earth - His triumphal entry, Last Supper, trial, crucifixion at Golgotha, and resurrection. The early church was born in Jerusalem at Pentecost (Acts 2), and the city remains central to biblical prophecy about the end times.`,
      historicalInfo: `Archaeological evidence confirms Jerusalem's ancient history dating back to the 4th millennium BC. The city has been destroyed and rebuilt multiple times throughout history. The Western Wall (part of the Second Temple complex) still stands today as Judaism's holiest site.

Modern Jerusalem is divided into four quarters: Jewish, Christian, Muslim, and Armenian. The Old City contains numerous sites of profound religious significance, including the Church of the Holy Sepulchre (traditional site of Jesus' crucifixion and tomb), the Garden of Gethsemane, and the Mount of Olives.`,
      latitude: 31.7683,
      longitude: 35.2137,
      country: 'Israel',
      region: 'Judea',
      tourHighlight: true,
      tourPriority: 100,
    },
  });

  console.log(`✓ Created place: ${jerusalem.name} (${jerusalem.slug})`);

  // Create verse mappings for key Jerusalem verses
  const verseMappings = [
    // Psalm 122:6 - "Pray for the peace of Jerusalem"
    { bookId: 19, chapter: 122, verse: 6, relevance: 100, type: 'prayer' },

    // 2 Chronicles 6:6 - God chose Jerusalem
    { bookId: 14, chapter: 6, verse: 6, relevance: 95, type: 'divine selection' },

    // Matthew 21:10 - Jesus' triumphal entry
    { bookId: 40, chapter: 21, verse: 10, relevance: 100, type: 'event' },

    // Luke 19:41 - Jesus wept over Jerusalem
    { bookId: 42, chapter: 19, verse: 41, relevance: 95, type: 'prophecy' },

    // Acts 1:8 - "You will be my witnesses in Jerusalem"
    { bookId: 44, chapter: 1, verse: 8, relevance: 90, type: 'mission' },

    // Revelation 21:2 - New Jerusalem
    { bookId: 66, chapter: 21, verse: 2, relevance: 100, type: 'prophecy' },

    // 2 Samuel 5:7 - David captured Jerusalem
    { bookId: 10, chapter: 5, verse: 7, relevance: 85, type: 'conquest' },

    // 1 Kings 8:1 - Solomon brought the ark to Jerusalem
    { bookId: 11, chapter: 8, verse: 1, relevance: 85, type: 'event' },

    // Luke 2:22 - Jesus presented at the temple in Jerusalem
    { bookId: 42, chapter: 2, verse: 22, relevance: 80, type: 'event' },

    // John 12:12 - Palm Sunday entry
    { bookId: 43, chapter: 12, verse: 12, relevance: 95, type: 'event' },
  ];

  console.log(`\nAdding ${verseMappings.length} verse mappings...`);

  for (const vm of verseMappings) {
    const verseId = generateVerseId(vm.bookId, vm.chapter, vm.verse);

    try {
      await prisma.placeVerseMapping.create({
        data: {
          placeId: jerusalem.id,
          verseId: verseId,
          relevanceScore: vm.relevance,
          mentionType: vm.type,
        },
      });

      console.log(`  ✓ Mapped verse: Book ${vm.bookId}:${vm.chapter}:${vm.verse} (${vm.type})`);
    } catch (error) {
      // Verse might not exist yet if ingestion incomplete
      console.log(`  ⚠ Skipped verse ${vm.bookId}:${vm.chapter}:${vm.verse} (not found in database)`);
    }
  }

  console.log('\n✅ Jerusalem seeded successfully!');
  console.log('\n🌐 You can now visit: http://localhost:3000/bible-places/jerusalem');
  console.log('📝 Note: Make sure to run the dev server with: npm run dev\n');
}

main()
  .catch((error) => {
    console.error('Error seeding Jerusalem:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
