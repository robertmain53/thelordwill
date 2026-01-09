#!/usr/bin/env tsx
/**
 * Seed popular professions for pSEO
 * These are common occupations that people search for biblical guidance
 */

import { PrismaClient } from '@prisma/client';

// Disable prepared statements for connection pooling
const databaseUrl = process.env.DATABASE_URL || '';
const urlWithoutCache = databaseUrl.includes('?')
  ? `${databaseUrl}&pgbouncer=true&statement_cache_size=0`
  : `${databaseUrl}?pgbouncer=true&statement_cache_size=0`;

const prisma = new PrismaClient({
  datasources: { db: { url: urlWithoutCache } },
});

const professions = [
  {
    slug: 'teachers',
    title: 'Teachers',
    description: 'As a teacher, you shape minds and hearts. The Bible offers profound wisdom for educators, emphasizing patience, wisdom, and the sacred responsibility of instruction.',
    metaTitle: 'Bible Verses for Teachers - Scripture & Inspiration',
    metaDescription: 'Encouraging Bible verses for teachers. Find wisdom, patience, and inspiration for your calling as an educator. Scriptures to guide and strengthen teachers.',
    content: 'Teaching is a noble calling mentioned throughout Scripture. From Moses instructing Israel to Jesus teaching His disciples, the Bible celebrates educators and offers guidance for those who teach.',
  },
  {
    slug: 'nurses',
    title: 'Nurses',
    description: 'Nurses provide compassionate care and healing. These Bible verses honor healthcare workers and offer strength for those serving others in their most vulnerable moments.',
    metaTitle: 'Bible Verses for Nurses - Healing & Compassion',
    metaDescription: 'Inspiring Bible verses for nurses and healthcare workers. Find strength, compassion, and purpose in your healing ministry through Scripture.',
    content: 'Nursing embodies Christ\'s compassion for the sick and suffering. These verses celebrate caregivers and provide encouragement for those in the healing profession.',
  },
  {
    slug: 'engineers',
    title: 'Engineers',
    description: 'Engineers build, design, and solve problems. The Bible speaks to builders and creators, from Noah\'s ark to Solomon\'s temple, celebrating wisdom and skillful work.',
    metaTitle: 'Bible Verses for Engineers - Wisdom & Excellence',
    metaDescription: 'Bible verses for engineers and builders. Discover Scripture about wisdom, excellence in work, and using your talents to serve God and others.',
    content: 'Engineering requires wisdom, precision, and creative problem-solving. These verses honor those who build and design, reflecting God\'s own creative nature.',
  },
  {
    slug: 'doctors',
    title: 'Doctors',
    description: 'Physicians heal and restore health. The Bible honors healers and offers wisdom for those entrusted with caring for the physical wellbeing of others.',
    metaTitle: 'Bible Verses for Doctors - Healing & Wisdom',
    metaDescription: 'Bible verses for doctors and physicians. Find wisdom and strength for your healing ministry through these encouraging Scriptures.',
    content: 'Jesus is called the Great Physician. These verses encourage doctors and celebrate the sacred work of healing and medical care.',
  },
  {
    slug: 'business-leaders',
    title: 'Business Leaders',
    description: 'Business leaders make decisions that impact many lives. The Bible offers timeless wisdom for leadership, integrity, and stewarding resources well.',
    metaTitle: 'Bible Verses for Business Leaders - Leadership & Integrity',
    metaDescription: 'Bible verses for business leaders and entrepreneurs. Discover Scripture about integrity, wise leadership, and honoring God in the marketplace.',
    content: 'Leadership in business requires wisdom, integrity, and servant-heartedness. These verses guide leaders to honor God in the marketplace.',
  },
  {
    slug: 'parents',
    title: 'Parents',
    description: 'Parents have the sacred calling of raising children. The Bible is filled with wisdom for mothers and fathers guiding the next generation.',
    metaTitle: 'Bible Verses for Parents - Raising Children in Faith',
    metaDescription: 'Bible verses for parents. Find wisdom, patience, and guidance for raising children in faith through these encouraging Scriptures.',
    content: 'Parenting is one of life\'s greatest callings. These verses offer practical wisdom and spiritual guidance for mothers and fathers.',
  },
  {
    slug: 'pastors',
    title: 'Pastors',
    description: 'Pastors shepherd God\'s flock with care and devotion. Scripture provides guidance, encouragement, and wisdom for those in spiritual leadership.',
    metaTitle: 'Bible Verses for Pastors - Shepherding & Leadership',
    metaDescription: 'Bible verses for pastors and spiritual leaders. Find encouragement and wisdom for shepherding God\'s people faithfully.',
    content: 'Pastoral ministry requires dedication, wisdom, and reliance on God. These verses encourage and guide those who shepherd the church.',
  },
  {
    slug: 'students',
    title: 'Students',
    description: 'Students pursue knowledge and wisdom. The Bible celebrates learning and offers guidance for those seeking to grow in understanding.',
    metaTitle: 'Bible Verses for Students - Wisdom & Learning',
    metaDescription: 'Bible verses for students. Find encouragement, wisdom, and purpose in your studies through these inspiring Scriptures.',
    content: 'The pursuit of knowledge is honored in Scripture. These verses encourage students and remind them that wisdom begins with the fear of the Lord.',
  },
  {
    slug: 'lawyers',
    title: 'Lawyers',
    description: 'Lawyers advocate for justice and truth. The Bible speaks extensively about justice, righteousness, and defending those in need.',
    metaTitle: 'Bible Verses for Lawyers - Justice & Truth',
    metaDescription: 'Bible verses for lawyers and advocates. Discover Scripture about justice, truth, and defending the vulnerable.',
    content: 'The legal profession seeks justice and truth. These verses guide lawyers to pursue righteousness and defend those who need advocacy.',
  },
  {
    slug: 'artists',
    title: 'Artists',
    description: 'Artists create beauty and express truth through their work. The Bible celebrates creativity as a reflection of our Creator God.',
    metaTitle: 'Bible Verses for Artists - Creativity & Beauty',
    metaDescription: 'Bible verses for artists and creatives. Find inspiration for using your gifts to create beauty and point others to God.',
    content: 'Artistic creativity reflects God\'s image in us. These verses celebrate artists and encourage them to use their gifts for His glory.',
  },
  {
    slug: 'social-workers',
    title: 'Social Workers',
    description: 'Social workers serve vulnerable populations with compassion. The Bible calls us to care for orphans, widows, and those in need.',
    metaTitle: 'Bible Verses for Social Workers - Compassion & Service',
    metaDescription: 'Bible verses for social workers. Find strength and purpose in serving vulnerable populations through these encouraging Scriptures.',
    content: 'Social work embodies Christ\'s call to serve the least of these. These verses encourage those who advocate for vulnerable people.',
  },
  {
    slug: 'entrepreneurs',
    title: 'Entrepreneurs',
    description: 'Entrepreneurs innovate and create value. Scripture offers wisdom for those who take risks and build new ventures.',
    metaTitle: 'Bible Verses for Entrepreneurs - Vision & Perseverance',
    metaDescription: 'Bible verses for entrepreneurs and business owners. Find wisdom, courage, and guidance for building your venture with integrity.',
    content: 'Entrepreneurship requires vision, courage, and perseverance. These verses guide business owners to build with wisdom and integrity.',
  },
  {
    slug: 'musicians',
    title: 'Musicians',
    description: 'Musicians use their gifts to create worship and beauty. The Bible is filled with references to music, singing, and instruments of praise.',
    metaTitle: 'Bible Verses for Musicians - Worship & Praise',
    metaDescription: 'Bible verses for musicians and worship leaders. Find inspiration for using your musical gifts to glorify God.',
    content: 'Music is a central part of worship in Scripture. These verses celebrate musicians and encourage them to use their gifts for God\'s glory.',
  },
  {
    slug: 'writers',
    title: 'Writers',
    description: 'Writers communicate truth and tell stories that impact lives. The Bible itself is the ultimate written word, inspiring writers throughout history.',
    metaTitle: 'Bible Verses for Writers - Truth & Communication',
    metaDescription: 'Bible verses for writers and authors. Find inspiration for using words to communicate truth and impact lives.',
    content: 'Words have power to build up or tear down. These verses guide writers to use their words wisely and communicate truth faithfully.',
  },
  {
    slug: 'military',
    title: 'Military Personnel',
    description: 'Military members serve and protect with courage. Scripture honors those who defend others and offers strength for warriors.',
    metaTitle: 'Bible Verses for Military - Courage & Protection',
    metaDescription: 'Bible verses for military personnel and veterans. Find strength, courage, and God\'s protection through these powerful Scriptures.',
    content: 'Military service requires courage and sacrifice. These verses honor those who serve and provide spiritual strength for warriors.',
  },
];

async function main() {
  console.log('💼 Seeding Professions...\n');

  let created = 0;

  for (const prof of professions) {
    try {
      const profession = await prisma.profession.upsert({
        where: { slug: prof.slug },
        update: {},
        create: {
          slug: prof.slug,
          title: prof.title,
          description: prof.description,
          metaTitle: prof.metaTitle,
          metaDescription: prof.metaDescription,
          content: prof.content,
        },
      });

      console.log(`✓ Created: ${profession.title} (${profession.slug})`);
      created++;
    } catch (error) {
      console.error(`Error creating profession ${prof.slug}:`, error);
    }
  }

  console.log('\n✅ Professions seeded successfully!\n');
  console.log('📊 Summary:');
  console.log(`  Professions created: ${created}`);
  console.log('\n🌐 Test URLs:');
  console.log('  http://localhost:3000/bible-verses-for-teachers');
  console.log('  http://localhost:3000/bible-verses-for-nurses');
  console.log('  http://localhost:3000/bible-verses-for-engineers\n');
}

main()
  .catch((error) => {
    console.error('Error seeding professions:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
