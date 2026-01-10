#!/usr/bin/env tsx
/**
 * Seed ONLY the Book table (66 books) using DIRECT database connection
 * Bypasses pgbouncer to avoid prepared statement conflicts
 *
 * Usage: npx tsx scripts/seed-books-direct.ts
 * Or: DIRECT_SEED=true npm run seed:books
 */

import { PrismaClient } from '@prisma/client';
import { BIBLE_BOOKS } from '../lib/bible';

// Use DIRECT_URL to bypass connection pooler for seeding
const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ No database URL found. Set DIRECT_URL or DATABASE_URL');
  process.exit(1);
}

console.log(`🔌 Connecting to database (direct: ${!!process.env.DIRECT_URL})...`);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

async function seedBooks() {
  console.log('📚 Seeding Book table...\n');

  let created = 0;
  let updated = 0;

  for (const book of BIBLE_BOOKS) {
    try {
      // Check if book exists first
      const existing = await prisma.book.findUnique({
        where: { id: book.id },
      });

      if (existing) {
        // Update existing book
        await prisma.book.update({
          where: { id: book.id },
          data: {
            name: book.name,
            slug: book.slug,
            testament: book.testament,
            genre: book.genre,
            chapters: book.chapters,
            verses: book.verses,
          },
        });
        updated++;
        console.log(`  🔄 Updated: ${book.name}`);
      } else {
        // Create new book
        await prisma.book.create({
          data: {
            id: book.id,
            name: book.name,
            slug: book.slug,
            testament: book.testament,
            genre: book.genre,
            chapters: book.chapters,
            verses: book.verses,
          },
        });
        created++;
        console.log(`  ✅ Created: ${book.name}`);
      }
    } catch (error) {
      console.error(`  ❌ Failed to process ${book.name}:`, error);
    }
  }

  console.log(`\n✅ Seeding complete!`);
  console.log(`  📗 Created: ${created} books`);
  console.log(`  📘 Updated: ${updated} books`);
  console.log(`  📚 Total: ${BIBLE_BOOKS.length} books\n`);
}

async function main() {
  try {
    console.log('🚀 Starting Book table seeding...\n');

    await seedBooks();

    // Verify
    const finalCount = await prisma.book.count();
    console.log(`📊 Final count: ${finalCount}/66 books`);

    if (finalCount === 66) {
      console.log('✅ All books seeded successfully!\n');
    } else {
      console.log(`⚠️  Only ${finalCount} books seeded (expected 66)\n`);
    }

  } catch (error) {
    console.error('❌ Error seeding books:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}
