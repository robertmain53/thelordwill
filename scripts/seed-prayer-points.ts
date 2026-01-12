#!/usr/bin/env tsx
/**
 * Seed Prayer Points table using DIRECT database connection
 * Bypasses pgbouncer to avoid prepared statement conflicts
 *
 * Based on high search volume, low competition keywords for prayer points
 *
 * Usage: npx tsx scripts/seed-prayer-points.ts
 */

import { PrismaClient } from '@prisma/client';

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

interface PrayerPointData {
  slug: string;
  title: string;
  description: string;
  category: string;
  priority: number;
  dailyRotation: boolean;
  metaTitle: string;
  metaDescription: string;
}

const PRAYER_POINTS: PrayerPointData[] = [
  {
    slug: 'open-heavens',
    title: 'Open Heavens Prayer Points',
    description: 'Powerful prayer points to break through spiritual barriers and access divine blessings. Experience breakthrough prayers that open the windows of heaven over your life.',
    category: 'breakthrough',
    priority: 95,
    dailyRotation: true,
    metaTitle: 'Open Heavens Prayer Points with Bible Verses | Breakthrough Prayers',
    metaDescription: 'Discover powerful open heavens prayer points with Scripture. Break through spiritual barriers and access God\'s abundant blessings with biblical prayers for breakthrough.',
  },
  {
    slug: 'mfm',
    title: 'MFM Prayer Points',
    description: 'Mountain of Fire and Miracles (MFM) style aggressive prayer points for spiritual warfare and deliverance. Battle-tested prayers rooted in Scripture for overcoming every obstacle.',
    category: 'spiritual-warfare',
    priority: 92,
    dailyRotation: true,
    metaTitle: 'MFM Prayer Points with Bible Verses | Spiritual Warfare Prayers',
    metaDescription: 'Powerful MFM prayer points backed by Scripture. Engage in spiritual warfare with aggressive prayers for deliverance, protection, and victory over every enemy.',
  },
  {
    slug: 'breakthrough',
    title: 'Prayer Points for Breakthrough',
    description: 'Scripturally-based prayer points for achieving breakthrough in every area of life. Experience supernatural intervention with powerful biblical declarations and petitions.',
    category: 'breakthrough',
    priority: 98,
    dailyRotation: true,
    metaTitle: 'Prayer Points for Breakthrough with Bible Verses | Breakthrough Prayers',
    metaDescription: 'Biblical prayer points for breakthrough in career, relationships, finances, and health. Pray Scripture-based prayers for supernatural intervention and divine favor.',
  },
  {
    slug: 'thanksgiving',
    title: 'Prayer Points for Thanksgiving',
    description: 'Heartfelt prayer points expressing gratitude and thanksgiving to God. Biblical prayers of appreciation that cultivate a heart of worship and open doors for more blessings.',
    category: 'worship',
    priority: 85,
    dailyRotation: true,
    metaTitle: 'Prayer Points for Thanksgiving with Bible Verses | Gratitude Prayers',
    metaDescription: 'Powerful thanksgiving prayer points rooted in Scripture. Express gratitude to God with biblical prayers that cultivate worship and attract divine blessings.',
  },
  {
    slug: 'rccg-100-days-fasting',
    title: 'RCCG 100 Days Fasting Prayer Points',
    description: 'Comprehensive prayer points for the Redeemed Christian Church of God (RCCG) annual 100 days of fasting and prayer. Biblical prayers for spiritual growth and transformation.',
    category: 'fasting',
    priority: 88,
    dailyRotation: false,
    metaTitle: 'RCCG 100 Days Fasting Prayer Points | Biblical Fast Prayers',
    metaDescription: 'Biblical prayer points for RCCG 100 days of fasting and prayer. Scripture-based prayers for spiritual breakthrough, transformation, and divine encounters.',
  },
  {
    slug: 'forgiveness',
    title: 'Prayer Points for Forgiveness',
    description: 'Biblically-grounded prayer points for seeking God\'s forgiveness and forgiving others. Experience healing, freedom, and restoration through scriptural prayers of repentance.',
    category: 'healing',
    priority: 82,
    dailyRotation: true,
    metaTitle: 'Prayer Points for Forgiveness with Bible Verses | Repentance Prayers',
    metaDescription: 'Biblical prayer points for forgiveness and reconciliation. Pray Scripture-based prayers for divine mercy, healing, and freedom from guilt and shame.',
  },
  {
    slug: 'fasting',
    title: 'Fasting Prayer Points',
    description: 'Powerful prayer points to accompany your fasting for spiritual breakthrough. Biblical prayers that align with fasting for maximum spiritual impact and divine response.',
    category: 'fasting',
    priority: 90,
    dailyRotation: true,
    metaTitle: 'Fasting Prayer Points with Bible Verses | Biblical Fast Prayers',
    metaDescription: 'Powerful fasting prayer points rooted in Scripture. Combine biblical fasting with targeted prayers for breakthrough, deliverance, and spiritual growth.',
  },
  {
    slug: 'business-breakthrough',
    title: 'Prayer Points for Business Breakthrough',
    description: 'Scripturally-based prayer points for success, prosperity, and favor in business and career. Biblical declarations for divine wisdom, supernatural provision, and marketplace success.',
    category: 'financial',
    priority: 87,
    dailyRotation: true,
    metaTitle: 'Prayer Points for Business Breakthrough | Biblical Success Prayers',
    metaDescription: 'Biblical prayer points for business breakthrough and success. Pray Scripture-based prayers for favor, wisdom, and supernatural provision in your career and business.',
  },
  {
    slug: 'spiritual-warfare',
    title: 'Spiritual Warfare Prayer Points',
    description: 'Aggressive biblical prayer points for engaging in spiritual warfare against demonic forces. Scripture-based prayers for protection, victory, and breakthrough in spiritual battles.',
    category: 'spiritual-warfare',
    priority: 93,
    dailyRotation: true,
    metaTitle: 'Spiritual Warfare Prayer Points with Bible Verses | Battle Prayers',
    metaDescription: 'Powerful spiritual warfare prayer points backed by Scripture. Engage demons and dark forces with biblical prayers for victory, protection, and deliverance.',
  },
  {
    slug: 'pornography-deliverance',
    title: 'Prayer Points for Pornography Deliverance',
    description: 'Compassionate yet powerful prayer points for freedom from pornography addiction. Biblical prayers for deliverance, purity, and restoration with relevant Scripture.',
    category: 'deliverance',
    priority: 78,
    dailyRotation: false,
    metaTitle: 'Prayer Points for Pornography Deliverance | Biblical Freedom Prayers',
    metaDescription: 'Biblical prayer points for deliverance from pornography addiction. Pray Scripture-based prayers for purity, freedom, and restoration of sexual integrity.',
  },
  {
    slug: 'safe-travel',
    title: 'Prayer Points for Safe Travel',
    description: 'Biblical prayer points for protection and safety during travel. Scriptural prayers invoking God\'s angels and divine protection for journeys by land, air, or sea.',
    category: 'protection',
    priority: 80,
    dailyRotation: true,
    metaTitle: 'Prayer Points for Safe Travel with Bible Verses | Travel Protection',
    metaDescription: 'Biblical prayer points for safe travel and journey mercies. Pray Scripture-based prayers for divine protection, angelic guardianship, and safe arrival.',
  },
  {
    slug: 'powerful',
    title: 'Powerful Prayer Points',
    description: 'Collection of the most powerful prayer points from Scripture. Battle-tested biblical prayers that move mountains, change situations, and invoke God\'s supernatural intervention.',
    category: 'general',
    priority: 96,
    dailyRotation: true,
    metaTitle: 'Most Powerful Prayer Points with Bible Verses | Effective Prayers',
    metaDescription: 'Discover the most powerful prayer points from Scripture. Pray effective biblical prayers that move mountains, change circumstances, and invoke divine intervention.',
  },
  {
    slug: 'church',
    title: 'Prayer Points for the Church',
    description: 'Comprehensive prayer points for church growth, unity, revival, and spiritual awakening. Biblical intercession for pastors, leaders, and the body of Christ.',
    category: 'intercession',
    priority: 75,
    dailyRotation: false,
    metaTitle: 'Prayer Points for the Church with Bible Verses | Church Prayers',
    metaDescription: 'Biblical prayer points for church growth, revival, and unity. Pray Scripture-based prayers for pastors, leaders, and spiritual awakening in the body of Christ.',
  },
  {
    slug: 'afternoon',
    title: 'Afternoon Prayer Points',
    description: 'Timely prayer points for afternoon intercession with Scripture. Biblical prayers for strength, productivity, and divine favor during the afternoon hours.',
    category: 'daily',
    priority: 72,
    dailyRotation: true,
    metaTitle: 'Afternoon Prayer Points with Bible Verses | Midday Prayers',
    metaDescription: 'Biblical afternoon prayer points for midday intercession. Pray Scripture-based prayers for renewed strength, productivity, and continued blessing throughout the day.',
  },
  {
    slug: '40-powerful-prayers',
    title: '40 Powerful Prayer Points',
    description: 'Comprehensive collection of 40 powerful prayer points from Scripture. Biblical prayers covering every area of life for breakthrough, protection, provision, and blessing.',
    category: 'general',
    priority: 89,
    dailyRotation: false,
    metaTitle: '40 Powerful Prayer Points with Bible Verses | Complete Prayer Guide',
    metaDescription: 'Complete guide to 40 powerful biblical prayer points. Comprehensive Scripture-based prayers for breakthrough, protection, provision, healing, and spiritual growth.',
  },
  {
    slug: '7-financial-breakthrough',
    title: '7 Financial Breakthrough Prayer Points',
    description: 'Seven targeted prayer points for financial breakthrough and prosperity. Biblical prayers for debt cancellation, supernatural provision, and financial wisdom.',
    category: 'financial',
    priority: 91,
    dailyRotation: true,
    metaTitle: '7 Financial Breakthrough Prayer Points | Biblical Prosperity Prayers',
    metaDescription: 'Seven powerful financial breakthrough prayer points from Scripture. Pray biblical prayers for debt freedom, supernatural provision, and abundant prosperity.',
  },
  {
    slug: 'midnight',
    title: 'Midnight Prayer Points',
    description: 'Strategic prayer points for midnight warfare and intercession. Biblical prayers specifically for the spiritual significance of praying at midnight for breakthrough and deliverance.',
    category: 'spiritual-warfare',
    priority: 84,
    dailyRotation: true,
    metaTitle: 'Midnight Prayer Points with Bible Verses | Warfare Prayers',
    metaDescription: 'Powerful midnight prayer points rooted in Scripture. Engage in spiritual warfare during the midnight hour with biblical prayers for breakthrough and deliverance.',
  },
];

async function seedPrayerPoints() {
  console.log('🙏 Seeding Prayer Points table...\n');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const prayerPoint of PRAYER_POINTS) {
    try {
      // Check if prayer point exists
      const existing = await prisma.prayerPoint.findUnique({
        where: { slug: prayerPoint.slug },
      });

      if (existing) {
        // Update existing prayer point
        await prisma.prayerPoint.update({
          where: { slug: prayerPoint.slug },
          data: {
            title: prayerPoint.title,
            description: prayerPoint.description,
            category: prayerPoint.category,
            priority: prayerPoint.priority,
            dailyRotation: prayerPoint.dailyRotation,
            metaTitle: prayerPoint.metaTitle,
            metaDescription: prayerPoint.metaDescription,
          },
        });
        updated++;
        console.log(`  🔄 Updated: ${prayerPoint.title}`);
      } else {
        // Create new prayer point
        await prisma.prayerPoint.create({
          data: prayerPoint,
        });
        created++;
        console.log(`  ✅ Created: ${prayerPoint.title}`);
      }
    } catch (error) {
      skipped++;
      console.error(`  ❌ Failed to process ${prayerPoint.title}:`, error);
    }
  }

  console.log(`\n✅ Seeding complete!`);
  console.log(`  🙏 Created: ${created} prayer points`);
  console.log(`  🔄 Updated: ${updated} prayer points`);
  console.log(`  ⚠️  Skipped: ${skipped} prayer points`);
  console.log(`  📋 Total: ${PRAYER_POINTS.length} prayer points\n`);
}

async function main() {
  try {
    console.log('🚀 Starting Prayer Points seeding...\n');

    await seedPrayerPoints();

    // Verify
    const finalCount = await prisma.prayerPoint.count();
    console.log(`📊 Final count: ${finalCount} prayer points in database`);

    // Show breakdown by category
    const byCategory = await prisma.prayerPoint.groupBy({
      by: ['category'],
      _count: true,
    });

    console.log('\n📂 Prayer points by category:');
    byCategory.forEach((group) => {
      console.log(`  ${group.category}: ${group._count} prayer points`);
    });

    // Show daily rotation count
    const dailyRotation = await prisma.prayerPoint.count({
      where: { dailyRotation: true },
    });
    console.log(`\n🔄 Daily rotation pool: ${dailyRotation} prayer points\n`);

  } catch (error) {
    console.error('❌ Error seeding prayer points:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}
