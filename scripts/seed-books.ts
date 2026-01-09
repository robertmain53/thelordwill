#!/usr/bin/env tsx
/**
 * Seed ONLY the Book table (66 books)
 * Quick script to fix production 404s caused by missing Book data
 *
 * Usage: npx tsx scripts/seed-books.ts
 * Or: npm run seed:books
 */

import { PrismaClient } from '@prisma/client';
import { BIBLE_BOOKS } from '../lib/bible';

const prisma = new PrismaClient();

async function seedBooks() {
  console.log('📚 Seeding Book table...\n');

  let created = 0;
  let updated = 0;

  for (const book of BIBLE_BOOKS) {
    const result = await prisma.book.upsert({
      where: { id: book.id },
      update: {
        name: book.name,
        slug: book.slug,
        testament: book.testament,
        genre: book.genre,
        chapters: book.chapters,
        verses: book.verses,
      },
      create: {
        id: book.id,
        name: book.name,
        slug: book.slug,
        testament: book.testament,
        genre: book.genre,
        chapters: book.chapters,
        verses: book.verses,
      },
    });

    // Check if it was created or updated by checking if createdAt === updatedAt
    const checkBook = await prisma.book.findUnique({
      where: { id: book.id },
    });

    if (checkBook) {
      if (checkBook.createdAt.getTime() === checkBook.updatedAt.getTime()) {
        created++;
        console.log(`  ✅ Created: ${book.name}`);
      } else {
        updated++;
        console.log(`  🔄 Updated: ${book.name}`);
      }
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

    // Check current status
    const currentCount = await prisma.book.count();
    console.log(`Current book count: ${currentCount}/66\n`);

    await seedBooks();

    // Verify
    const finalCount = await prisma.book.count();
    console.log(`\n📊 Final count: ${finalCount}/66 books`);

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
