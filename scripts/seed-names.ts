#!/usr/bin/env tsx
/**
 * Seed popular biblical names (schema-compliant version)
 * Fields: name, slug, meaning, originLanguage, characterDescription, metaTitle, metaDescription
 */

import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL || '';
const urlWithoutCache = databaseUrl.includes('?')
  ? `${databaseUrl}&pgbouncer=true&statement_cache_size=0`
  : `${databaseUrl}?pgbouncer=true&statement_cache_size=0`;

const prisma = new PrismaClient({
  datasources: { db: { url: urlWithoutCache } },
});

const names = [
  {
    slug: 'john',
    name: 'John',
    meaning: 'God is gracious',
    originLanguage: 'Hebrew',
    characterDescription: 'John is one of the most significant names in the Bible. From Hebrew Yochanan, meaning "Yahweh is gracious" - the name combines Yahweh (the name of God) with chanan (to be gracious or show favor). John the Baptist was Jesus\' cousin who prepared the way for His ministry. The Apostle John was one of Jesus\' closest disciples, author of the Gospel of John, three epistles, and Revelation. Known as the "beloved disciple," John witnessed Jesus\' transfiguration, crucifixion, and resurrection.',
    metaTitle: 'Meaning of John in the Bible - God is Gracious',
    metaDescription: 'Discover the biblical meaning of the name John. Learn about John the Baptist, the Apostle John, and why this name means "God is gracious" in Hebrew.',
  },
  {
    slug: 'mary',
    name: 'Mary',
    meaning: 'Beloved, wished-for child',
    originLanguage: 'Hebrew',
    characterDescription: 'Mary is the most celebrated woman in the Bible. From Hebrew Miryam, possibly meaning "bitter," "beloved," or "rebellious." Mary, the mother of Jesus, was chosen by God to bear His Son, demonstrating extraordinary faith and obedience. The Bible records her humility, pondering God\'s word in her heart, and her presence at Jesus\' crucifixion. Mary Magdalene was a devoted follower of Jesus, present at His crucifixion and the first witness to His resurrection.',
    metaTitle: 'Meaning of Mary in the Bible - Beloved of God',
    metaDescription: 'Explore the biblical meaning of Mary. Learn about Mary the mother of Jesus, Mary Magdalene, and the significance of this beloved name.',
  },
  {
    slug: 'david',
    name: 'David',
    meaning: 'Beloved',
    originLanguage: 'Hebrew',
    characterDescription: 'David was Israel\'s greatest king, a man after God\'s own heart. From Hebrew Dawid, meaning "beloved" or "dear one" - the name comes from the Hebrew root dod, meaning "beloved." As a shepherd boy, he defeated Goliath with faith in God. As king, he united Israel and established Jerusalem as its capital. David was a warrior, poet, and musician who wrote many Psalms. Despite his failures, including adultery with Bathsheba, David\'s genuine repentance and love for God made him a model of faith. Jesus is called the Son of David, fulfilling prophecies about David\'s eternal throne.',
    metaTitle: 'Meaning of David in the Bible - Beloved King',
    metaDescription: 'Discover the biblical meaning of David, Israel\'s greatest king. Learn why David was called "a man after God\'s own heart" and explore his legacy.',
  },
  {
    slug: 'sarah',
    name: 'Sarah',
    meaning: 'Princess',
    originLanguage: 'Hebrew',
    characterDescription: 'Sarah was Abraham\'s wife and the mother of Isaac. Originally named Sarai meaning "my princess," God renamed her Sarah meaning "princess" or "noblewoman" when promising she would be the mother of nations. At 90 years old, Sarah miraculously gave birth to Isaac, becoming the mother of the Jewish nation. She is honored in the New Testament as an example of faith and is called "a holy woman" who trusted God.',
    metaTitle: 'Meaning of Sarah in the Bible - Princess & Mother of Nations',
    metaDescription: 'Learn the biblical meaning of Sarah, Abraham\'s wife. Discover how God renamed her and fulfilled His promise to make her a princess and mother of nations.',
  },
  {
    slug: 'michael',
    name: 'Michael',
    meaning: 'Who is like God?',
    originLanguage: 'Hebrew',
    characterDescription: 'Michael is one of the chief archangels in Scripture. From Hebrew Mikha\'el, a rhetorical question meaning "Who is like God?" - the name combines mi (who), ke (like), and El (God). Michael is mentioned in both the Old and New Testaments. In Daniel, Michael is called "one of the chief princes" and the protector of Israel. In Jude and Revelation, Michael leads God\'s angelic armies against Satan. His name itself is a declaration that no one compares to God.',
    metaTitle: 'Meaning of Michael in the Bible - Who is Like God?',
    metaDescription: 'Explore the biblical meaning of Michael, the archangel. Learn about Michael\'s role as protector and warrior in Scripture.',
  },
  {
    slug: 'elizabeth',
    name: 'Elizabeth',
    meaning: 'God is my oath',
    originLanguage: 'Hebrew',
    characterDescription: 'Elizabeth was the mother of John the Baptist and a relative of Mary. From Hebrew Elisheva, meaning "God is my oath" or "my God has sworn" - the name combines El (God) with sheva (oath). Described as righteous and blameless, Elizabeth and her husband Zechariah were childless until old age when God miraculously gave them a son. When pregnant Mary visited her, Elizabeth was filled with the Holy Spirit and prophesied about Mary\'s child. She is remembered for her faith and the joy she expressed at God\'s redemption.',
    metaTitle: 'Meaning of Elizabeth in the Bible - God\'s Faithful Oath',
    metaDescription: 'Discover the biblical meaning of Elizabeth, mother of John the Baptist. Learn about her faith and the miracle of her son\'s birth.',
  },
  {
    slug: 'joshua',
    name: 'Joshua',
    meaning: 'The Lord is salvation',
    originLanguage: 'Hebrew',
    characterDescription: 'Joshua was Moses\' successor who led Israel into the Promised Land. From Hebrew Yehoshua, meaning "Yahweh is salvation" - the name is composed of Yahweh (God\'s name) and yasha (to save). Joshua is the Hebrew form of Jesus. As a young man, he was one of only two faithful spies who believed God could give them Canaan. After Moses\' death, Joshua courageously led Israel in conquering the land, including the famous victory at Jericho. His leadership and unwavering faith in God made him one of Israel\'s greatest leaders.',
    metaTitle: 'Meaning of Joshua in the Bible - The Lord Saves',
    metaDescription: 'Learn the biblical meaning of Joshua, Moses\' successor. Discover how Joshua led Israel into the Promised Land and why his name means "Yahweh is salvation."',
  },
  {
    slug: 'rachel',
    name: 'Rachel',
    meaning: 'Ewe (female sheep)',
    originLanguage: 'Hebrew',
    characterDescription: 'Rachel was Jacob\'s beloved wife and the mother of Joseph and Benjamin. From Hebrew Rachel, meaning "ewe" or "female sheep" - the name reflects the pastoral culture of ancient Israel where shepherding was highly valued. Jacob worked 14 years to marry her because of his deep love. Though beautiful and loved, Rachel struggled with infertility before God blessed her with Joseph. She died giving birth to Benjamin. Rachel is remembered for her beauty, her husband\'s devoted love, and as the mother of two of Israel\'s twelve tribes.',
    metaTitle: 'Meaning of Rachel in the Bible - Jacob\'s Beloved Wife',
    metaDescription: 'Explore the biblical meaning of Rachel, Jacob\'s beloved wife. Learn about her story, struggles, and legacy as mother of Joseph and Benjamin.',
  },
  {
    slug: 'daniel',
    name: 'Daniel',
    meaning: 'God is my judge',
    originLanguage: 'Hebrew',
    characterDescription: 'Daniel was a prophet and wise man who served in the Babylonian and Persian empires. From Hebrew Daniyyel, meaning "God is my judge" or "God has judged" - the name combines Dan (judge) with El (God). Taken into exile as a young man, Daniel distinguished himself through wisdom and unwavering faithfulness to God. Famous for surviving the lions\' den and interpreting dreams, Daniel received prophetic visions about future kingdoms and the coming Messiah. His integrity, prayer life, and courage in the face of persecution make him an exemplary model of faith.',
    metaTitle: 'Meaning of Daniel in the Bible - God\'s Faithful Judge',
    metaDescription: 'Discover the biblical meaning of Daniel, the prophet who survived the lions\' den. Learn about his wisdom, visions, and unwavering faith.',
  },
  {
    slug: 'ruth',
    name: 'Ruth',
    meaning: 'Friend, companion',
    originLanguage: 'Hebrew',
    characterDescription: 'Ruth was a Moabite woman who showed extraordinary loyalty to her Israelite mother-in-law Naomi. Possibly from Hebrew re\'ut meaning "friend" or "companion." After her husband\'s death, Ruth refused to abandon Naomi, famously declaring, "Where you go I will go, and where you stay I will stay. Your people will be my people and your God my God." Her faithfulness led her to Boaz, whom she married, becoming the great-grandmother of King David and an ancestor of Jesus. She is celebrated as a model of loyalty, faith, and redemption.',
    metaTitle: 'Meaning of Ruth in the Bible - Loyal Friend & Redeemer',
    metaDescription: 'Learn the biblical meaning of Ruth, the loyal Moabite woman. Discover her beautiful story of redemption and how she became David\'s great-grandmother.',
  },
  {
    slug: 'peter',
    name: 'Peter',
    meaning: 'Rock',
    originLanguage: 'Greek',
    characterDescription: 'Peter (originally named Simon) was one of Jesus\' twelve apostles and part of His inner circle. From Greek Petros, meaning "rock" or "stone" - Jesus gave Simon this name, saying "You are Peter (Petros), and on this rock (petra) I will build my church." A fisherman by trade, Peter was impulsive, passionate, and bold. He walked on water, witnessed the Transfiguration, and confessed Jesus as the Christ. Though he denied Jesus three times, Peter was restored and became a pillar of the early church. He preached at Pentecost, performed miracles, and wrote two New Testament epistles.',
    metaTitle: 'Meaning of Peter in the Bible - The Rock',
    metaDescription: 'Discover the biblical meaning of Peter, the rock on which Jesus built His church. Learn about this apostle\'s transformation from fisherman to church leader.',
  },
];

async function main() {
  console.log('✨ Seeding Biblical Names...\n');

  let created = 0;

  for (const nameData of names) {
    try {
      const name = await prisma.name.upsert({
        where: { slug: nameData.slug },
        update: {},
        create: {
          slug: nameData.slug,
          name: nameData.name,
          meaning: nameData.meaning,
          originLanguage: nameData.originLanguage,
          characterDescription: nameData.characterDescription,
          metaTitle: nameData.metaTitle,
          metaDescription: nameData.metaDescription,
        },
      });

      console.log(`✓ Created: ${name.name} - "${name.meaning}"`);
      created++;
    } catch (error) {
      console.error(`Error creating name ${nameData.slug}:`, error);
    }
  }

  console.log('\n✅ Names seeded successfully!\n');
  console.log('📊 Summary:');
  console.log(`  Names created: ${created}`);
  console.log('\n🌐 Test URLs:');
  console.log('  http://localhost:3000/meaning-of-john-in-the-bible');
  console.log('  http://localhost:3000/meaning-of-mary-in-the-bible');
  console.log('  http://localhost:3000/meaning-of-david-in-the-bible\n');
}

main()
  .catch((error) => {
    console.error('Error seeding names:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
