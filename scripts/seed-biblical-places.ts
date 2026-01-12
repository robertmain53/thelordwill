#!/usr/bin/env tsx
/**
 * Seed Biblical Places table using DIRECT database connection
 * Bypasses pgbouncer to avoid prepared statement conflicts
 *
 * Data source: BP.pdf - Biblical places across Holy Land, Jordan, Egypt, Turkey, Greece, Italy
 *
 * Usage: npx tsx scripts/seed-biblical-places.ts
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

interface BiblicalPlace {
  slug: string;
  name: string;
  description: string;
  historicalInfo?: string;
  biblicalContext?: string;
  modernName?: string;
  country: string;
  region: string;
  latitude?: number;
  longitude?: number;
  tourHighlight: boolean;
  tourPriority: number;
  metaTitle?: string;
  metaDescription?: string;
}

const BIBLICAL_PLACES: BiblicalPlace[] = [
  // ============================================================================
  // HOLY LAND - ISRAEL/PALESTINE (Core Biblical Sites)
  // ============================================================================
  {
    slug: 'jerusalem',
    name: 'Jerusalem',
    description: 'The holy city of Jerusalem, central to Judaism, Christianity, and Islam, where Jesus was crucified and resurrected.',
    historicalInfo: 'Jerusalem has been continuously inhabited for over 3,000 years. King David established it as the capital of Israel around 1000 BC. The First Temple was built by Solomon, destroyed by Babylonians in 586 BC, and the Second Temple was destroyed by Romans in 70 AD.',
    biblicalContext: 'Jerusalem appears over 800 times in the Bible. It was the site of Jesus\' crucifixion at Golgotha, His resurrection, and the location of the Upper Room where the Last Supper took place. The city is central to biblical prophecy and eschatology.',
    country: 'Israel',
    region: 'Judea',
    latitude: 31.7683,
    longitude: 35.2137,
    tourHighlight: true,
    tourPriority: 100,
    metaTitle: 'Visit Biblical Jerusalem | Holy Land Tours',
    metaDescription: 'Explore Jerusalem, the holy city where Jesus was crucified and resurrected. Walk the Via Dolorosa, visit the Garden Tomb, and experience the spiritual heart of Christianity.',
  },
  {
    slug: 'bethlehem',
    name: 'Bethlehem',
    description: 'The birthplace of Jesus Christ and the ancestral home of King David, located in the Judean hills south of Jerusalem.',
    historicalInfo: 'Bethlehem, meaning "House of Bread" in Hebrew, has been a significant site since ancient times. The Church of the Nativity, built over the traditional birthplace of Jesus, dates to the 4th century and is one of the oldest continuously operating churches in the world.',
    biblicalContext: 'Bethlehem is mentioned over 40 times in Scripture. It was the birthplace of King David (1 Samuel 17:12) and, centuries later, the birthplace of Jesus Christ (Luke 2:4-7), fulfilling Micah\'s prophecy (Micah 5:2).',
    country: 'Palestine',
    region: 'Judea',
    latitude: 31.7054,
    longitude: 35.2024,
    tourHighlight: true,
    tourPriority: 95,
    metaTitle: 'Bethlehem: Birthplace of Jesus | Biblical Tour Sites',
    metaDescription: 'Visit Bethlehem, where Jesus was born in a manger. Tour the Church of the Nativity, Shepherds\' Fields, and the town where prophecy became reality.',
  },
  {
    slug: 'nazareth',
    name: 'Nazareth',
    description: 'The hometown of Jesus where He grew up and began His ministry, located in the hills of Galilee.',
    historicalInfo: 'Nazareth was a small Jewish village in the first century, with an estimated population of 200-400 people. The Basilica of the Annunciation, built over the traditional site where Angel Gabriel appeared to Mary, is now one of the largest churches in the Middle East.',
    biblicalContext: 'Nazareth is where Mary received the announcement from Angel Gabriel (Luke 1:26-38), where Jesus spent His childhood and early adulthood, and where He was rejected when He began His ministry (Luke 4:16-30).',
    country: 'Israel',
    region: 'Galilee',
    latitude: 32.7023,
    longitude: 35.2969,
    tourHighlight: true,
    tourPriority: 90,
    metaTitle: 'Nazareth: Where Jesus Grew Up | Holy Land Tours',
    metaDescription: 'Explore Nazareth, the childhood home of Jesus. Visit the Basilica of the Annunciation, Nazareth Village, and walk where Jesus walked in Galilee.',
  },
  {
    slug: 'sea-of-galilee',
    name: 'Sea of Galilee',
    description: 'The freshwater lake where Jesus performed many miracles, called disciples, and taught from boats.',
    historicalInfo: 'The Sea of Galilee is Israel\'s largest freshwater lake, approximately 13 miles long and 8 miles wide. In Jesus\' time, the lake was surrounded by thriving fishing villages and was a major center of commerce and activity.',
    biblicalContext: 'The Sea of Galilee was central to Jesus\' ministry. Here He calmed the storm (Mark 4:35-41), walked on water (Matthew 14:22-33), called His first disciples who were fishermen (Matthew 4:18-22), and performed the miraculous catch of fish (Luke 5:1-11).',
    country: 'Israel',
    region: 'Galilee',
    latitude: 32.8152,
    longitude: 35.5880,
    tourHighlight: true,
    tourPriority: 88,
    metaTitle: 'Sea of Galilee: Where Jesus Walked on Water | Biblical Sites',
    metaDescription: 'Experience the Sea of Galilee where Jesus performed miracles, calmed storms, and called His disciples. Sail on the same waters that witnessed divine power.',
  },
  {
    slug: 'capernaum',
    name: 'Capernaum',
    description: 'Jesus\' ministry headquarters in Galilee, home to Peter and several other disciples.',
    historicalInfo: 'Capernaum was a prosperous fishing village on the northern shore of the Sea of Galilee. Archaeological excavations have uncovered a 4th-century synagogue built on the foundation of the synagogue where Jesus taught, and a house believed to be Peter\'s home.',
    biblicalContext: 'Jesus made Capernaum His home base during His Galilean ministry (Matthew 4:13). Here He healed Peter\'s mother-in-law (Mark 1:29-31), the paralytic lowered through the roof (Mark 2:1-12), and taught in the synagogue (John 6:59).',
    country: 'Israel',
    region: 'Galilee',
    latitude: 32.8807,
    longitude: 35.5753,
    tourHighlight: true,
    tourPriority: 85,
    metaTitle: 'Capernaum: Jesus\' Ministry Headquarters | Biblical Archaeology',
    metaDescription: 'Visit Capernaum, the town Jesus called home. See ancient synagogue ruins, Peter\'s house, and walk where Jesus performed numerous miracles.',
  },
  {
    slug: 'jericho',
    name: 'Jericho',
    description: 'One of the oldest continuously inhabited cities in the world, site of the famous wall that fell when Joshua marched around it.',
    historicalInfo: 'Jericho, known as the "City of Palms," is located 850 feet below sea level in the Jordan Valley. Archaeological evidence shows continuous habitation dating back 11,000 years, making it one of humanity\'s oldest settlements.',
    biblicalContext: 'Jericho\'s walls fell when Joshua and the Israelites marched around it (Joshua 6). Jesus passed through Jericho, where He healed blind Bartimaeus (Mark 10:46-52) and called Zacchaeus down from a sycamore tree (Luke 19:1-10).',
    country: 'Palestine',
    region: 'Jordan Valley',
    latitude: 31.8557,
    longitude: 35.4619,
    tourHighlight: true,
    tourPriority: 80,
    metaTitle: 'Jericho: The City Where Walls Fell | Ancient Biblical Sites',
    metaDescription: 'Explore Jericho, the oldest city in the world. Visit the archaeological site of Joshua\'s conquest and where Jesus encountered Zacchaeus.',
  },
  {
    slug: 'dead-sea',
    name: 'Dead Sea',
    description: 'The lowest point on Earth, famous for its high salt content and association with Sodom, Gomorrah, and the Dead Sea Scrolls.',
    historicalInfo: 'The Dead Sea sits 1,412 feet below sea level and has a salt concentration of 34%, making it nearly 10 times saltier than the ocean. The arid climate preserved the Dead Sea Scrolls in nearby caves for over 2,000 years.',
    biblicalContext: 'The Dead Sea region was the location of Sodom and Gomorrah (Genesis 19). David hid in the caves of En Gedi near the Dead Sea while fleeing from Saul (1 Samuel 24). The Dead Sea Scrolls, discovered in 1947, contained the oldest known biblical manuscripts.',
    country: 'Israel/Jordan',
    region: 'Jordan Valley',
    latitude: 31.5590,
    longitude: 35.4732,
    tourHighlight: true,
    tourPriority: 75,
    metaTitle: 'Dead Sea: Lowest Point on Earth | Biblical Geography',
    metaDescription: 'Visit the Dead Sea, site of Sodom and Gomorrah\'s judgment and where the Dead Sea Scrolls were discovered. Experience the unique biblical landscape.',
  },

  // ============================================================================
  // JORDAN (Across the Jordan River)
  // ============================================================================
  {
    slug: 'bethany-beyond-jordan',
    name: 'Bethany Beyond the Jordan',
    description: 'The site where John the Baptist baptized Jesus in the Jordan River.',
    historicalInfo: 'Also known as "Bethany Beyond the Jordan" or Al-Maghtas ("baptism" or "immersion" in Arabic), this site has been recognized by UNESCO as a World Heritage site. Archaeological excavations have uncovered churches, baptismal pools, and a monastery dating from the Roman and Byzantine periods.',
    biblicalContext: 'This is the location where John the Baptist conducted his ministry (John 1:28) and where Jesus was baptized (Matthew 3:13-17). The heavens opened, and God\'s voice declared, "This is my beloved Son, in whom I am well pleased."',
    country: 'Jordan',
    region: 'Jordan Valley',
    latitude: 31.8366,
    longitude: 35.5493,
    tourHighlight: true,
    tourPriority: 85,
    metaTitle: 'Bethany Beyond Jordan: Where Jesus Was Baptized | Holy Sites',
    metaDescription: 'Visit the authentic baptism site of Jesus in the Jordan River. Walk where John the Baptist ministered and witness the beginning of Christ\'s public ministry.',
  },
  {
    slug: 'mount-nebo',
    name: 'Mount Nebo',
    description: 'The mountain where Moses viewed the Promised Land before his death and was buried by God.',
    historicalInfo: 'Mount Nebo rises 2,680 feet above sea level and offers panoramic views of the Holy Land, including the Jordan River Valley, Jericho, and on clear days, Jerusalem. A Byzantine church and monastery were built here in the 4th century to commemorate Moses.',
    biblicalContext: 'From Mount Nebo, God showed Moses the Promised Land that he would not enter due to his disobedience at Meribah (Deuteronomy 34:1-6). Moses died here at age 120, and God Himself buried him in an unknown location.',
    country: 'Jordan',
    region: 'East of Jordan Valley',
    latitude: 31.7690,
    longitude: 35.7265,
    tourHighlight: true,
    tourPriority: 78,
    metaTitle: 'Mount Nebo: Where Moses Viewed the Promised Land | Biblical Mountains',
    metaDescription: 'Stand where Moses stood on Mount Nebo and view the Promised Land. Experience the profound biblical history of Israel\'s greatest prophet.',
  },
  {
    slug: 'madaba',
    name: 'Madaba',
    description: 'The "City of Mosaics," famous for the 6th-century mosaic map of the Holy Land in St. George\'s Church.',
    historicalInfo: 'Madaba flourished during the Byzantine period (5th-7th centuries) as a center of Christianity. The Madaba Map, created around 560 AD, is the oldest surviving cartographic representation of the Holy Land and includes over 150 Greek captions describing biblical locations.',
    biblicalContext: 'While not directly mentioned in the Bible, Madaba is located in the region of ancient Moab, east of the Dead Sea. The mosaic map depicts biblical sites including Jerusalem, Bethlehem, Jericho, and the Jordan River, providing invaluable historical context for biblical geography.',
    country: 'Jordan',
    region: 'East of Dead Sea',
    latitude: 31.7195,
    longitude: 35.7938,
    tourHighlight: false,
    tourPriority: 60,
    metaTitle: 'Madaba Mosaic Map: Ancient Biblical Geography | Jordan Tours',
    metaDescription: 'View the famous 6th-century mosaic map of the Holy Land in Madaba. See how early Christians understood biblical geography.',
  },

  // ============================================================================
  // EGYPT/SINAI (The Exodus Route)
  // ============================================================================
  {
    slug: 'mount-sinai',
    name: 'Mount Sinai',
    description: 'The mountain where Moses received the Ten Commandments from God, also called Mount Horeb.',
    historicalInfo: 'Mount Sinai (Jebel Musa in Arabic) rises 7,497 feet above sea level in the southern Sinai Peninsula. Pilgrims have climbed the mountain for centuries, following either the 3,750 Steps of Repentance carved by monks or the longer camel path.',
    biblicalContext: 'God called Moses to Mount Sinai (Exodus 19), where He gave the Ten Commandments and the Law (Exodus 20-24). Moses spent 40 days on the mountain receiving instructions for the Tabernacle. Elijah also fled here and heard God\'s "still small voice" (1 Kings 19:8-18).',
    country: 'Egypt',
    region: 'Sinai Peninsula',
    latitude: 28.5392,
    longitude: 33.9753,
    tourHighlight: true,
    tourPriority: 82,
    metaTitle: 'Mount Sinai: Where Moses Received the Ten Commandments | Biblical Mountains',
    metaDescription: 'Climb Mount Sinai where Moses encountered God and received the Ten Commandments. Experience the mountain of divine revelation.',
  },
  {
    slug: 'st-catherine-monastery',
    name: "St. Catherine's Monastery",
    description: 'One of the oldest continuously operating Christian monasteries in the world, built at the foot of Mount Sinai near the traditional site of the Burning Bush.',
    historicalInfo: 'Founded in the 6th century (around 548-565 AD) by Byzantine Emperor Justinian I, St. Catherine\'s Monastery has never been destroyed or closed. It houses an incredible collection of ancient manuscripts, icons, and the purported remains of St. Catherine of Alexandria.',
    biblicalContext: 'The monastery was built at the site traditionally identified as where Moses encountered the Burning Bush (Exodus 3:1-6). Inside the monastery walls, a living bush (believed by some to be a descendant of the original) is still shown to pilgrims.',
    country: 'Egypt',
    region: 'Sinai Peninsula',
    latitude: 28.5561,
    longitude: 33.9756,
    tourHighlight: true,
    tourPriority: 77,
    metaTitle: "St. Catherine's Monastery: Site of the Burning Bush | Ancient Christian Sites",
    metaDescription: "Visit St. Catherine's Monastery at Mount Sinai, one of Christianity's oldest monasteries. See the site of Moses' Burning Bush encounter.",
  },

  // ============================================================================
  // TURKEY (Paul's Missionary Journeys & Revelation Churches)
  // ============================================================================
  {
    slug: 'ephesus',
    name: 'Ephesus',
    description: 'One of the greatest cities of the ancient world, home to the Temple of Artemis, Paul\'s three-year ministry, and one of the Seven Churches of Revelation.',
    historicalInfo: 'Ephesus was the capital of the Roman province of Asia and had a population of over 250,000 at its peak. The city featured one of the Seven Wonders of the Ancient World (the Temple of Artemis), a 25,000-seat theater, and the famous Library of Celsus.',
    biblicalContext: 'Paul spent three years in Ephesus (Acts 19), establishing a strong church. He wrote 1 Corinthians from here and later wrote the Epistle to the Ephesians. Timothy pastored the church (1 Timothy 1:3), and tradition says John the Apostle spent his final years here, writing his Gospel and epistles.',
    country: 'Turkey',
    region: 'Western Anatolia',
    latitude: 37.9495,
    longitude: 27.3636,
    tourHighlight: true,
    tourPriority: 88,
    metaTitle: 'Ephesus: Ancient City of Paul and John | Biblical Archaeology',
    metaDescription: 'Explore Ephesus, where Paul preached for three years and John wrote his Gospel. Walk ancient streets and see the magnificent ruins of biblical history.',
  },
  {
    slug: 'pergamum',
    name: 'Pergamum',
    description: 'One of the Seven Churches of Revelation, known for its massive altar to Zeus and its library.',
    historicalInfo: 'Pergamum (modern Bergama) was a major cultural and political center with a library containing over 200,000 volumes, second only to Alexandria. The city was famous for developing parchment (pergamena) when Egypt cut off its papyrus supply.',
    biblicalContext: 'Jesus addressed the church at Pergamum in Revelation 2:12-17, acknowledging they dwelt "where Satan\'s throne is" (likely referring to the massive Altar of Zeus). Despite persecution, including the martyrdom of Antipas, the church remained faithful.',
    country: 'Turkey',
    region: 'Western Anatolia',
    latitude: 39.1313,
    longitude: 27.1847,
    tourHighlight: false,
    tourPriority: 65,
    metaTitle: 'Pergamum: City Where Satan\'s Throne Was | Seven Churches of Revelation',
    metaDescription: 'Visit Pergamum, one of the Seven Churches of Revelation. See the ancient Altar of Zeus and archaeological wonders of this biblical city.',
  },
  {
    slug: 'thyatira',
    name: 'Thyatira',
    description: 'One of the Seven Churches of Revelation, home of Lydia the purple cloth merchant.',
    historicalInfo: 'Thyatira (modern Akhisar) was a significant commercial center known for its trade guilds, particularly those dealing in purple dye, wool, and bronze work. The city\'s commercial prosperity created unique challenges for Christians regarding guild membership and pagan practices.',
    biblicalContext: 'Lydia, a dealer in purple cloth from Thyatira, became Paul\'s first European convert in Philippi (Acts 16:14-15). The church is rebuked in Revelation 2:18-29 for tolerating "Jezebel," who taught sexual immorality and idol worship.',
    country: 'Turkey',
    region: 'Western Anatolia',
    latitude: 38.9175,
    longitude: 27.8400,
    tourHighlight: false,
    tourPriority: 55,
    metaTitle: 'Thyatira: Home of Lydia the Purple Merchant | Biblical Trade Cities',
    metaDescription: 'Explore Thyatira, the commercial center where Lydia came from, one of the Seven Churches addressed in Revelation.',
  },
  {
    slug: 'sardis',
    name: 'Sardis',
    description: 'One of the Seven Churches of Revelation, once a wealthy and powerful city that Jesus warned was spiritually dead.',
    historicalInfo: 'Sardis was the capital of the ancient kingdom of Lydia and was famous for its wealth, particularly gold from the nearby Pactolus River. The city featured a magnificent temple to Artemis and a Jewish synagogue, one of the largest ancient synagogues ever discovered.',
    biblicalContext: 'Jesus\' message to Sardis in Revelation 3:1-6 is sobering: "You have a reputation of being alive, but you are dead." Despite appearing spiritually vibrant, the church was warned to wake up and strengthen what remained before it was too late.',
    country: 'Turkey',
    region: 'Western Anatolia',
    latitude: 38.4883,
    longitude: 28.0394,
    tourHighlight: false,
    tourPriority: 58,
    metaTitle: 'Sardis: The Dead Church That Appeared Alive | Seven Churches Tour',
    metaDescription: 'Visit Sardis, the wealthy city whose church received a wake-up call from Christ. See the temple ruins and ancient synagogue.',
  },
  {
    slug: 'philadelphia',
    name: 'Philadelphia',
    description: 'One of the Seven Churches of Revelation, praised for keeping God\'s word despite having little strength.',
    historicalInfo: 'Philadelphia (modern Alaşehir) was founded by Attalus II Philadelphus of Pergamon in the 2nd century BC. Located in a wine-growing region prone to earthquakes, the city served as a gateway to the high central plateau of Asia Minor.',
    biblicalContext: 'The church at Philadelphia received only praise in Revelation 3:7-13, with no rebuke. Jesus commended them for keeping His word despite their limited resources and promised them an open door that no one could shut. They would be kept from the hour of trial coming upon the whole world.',
    country: 'Turkey',
    region: 'Western Anatolia',
    latitude: 38.3536,
    longitude: 28.2828,
    tourHighlight: false,
    tourPriority: 60,
    metaTitle: 'Philadelphia: The Faithful Church | Seven Churches of Revelation',
    metaDescription: 'Explore Philadelphia, the church that received only praise from Christ. Walk where faithful believers kept God\'s word with little strength.',
  },
  {
    slug: 'laodicea',
    name: 'Laodicea',
    description: 'One of the Seven Churches of Revelation, rebuked by Jesus for being lukewarm, neither hot nor cold.',
    historicalInfo: 'Laodicea was a wealthy banking and commercial center, famous for producing black wool garments and a medical school that produced eye salve. The city received water via aqueduct from hot springs, which arrived lukewarm—the perfect metaphor for their spiritual condition.',
    biblicalContext: 'Jesus\' harshest rebuke went to Laodicea (Revelation 3:14-22): "Because you are lukewarm, and neither hot nor cold, I will spit you out of my mouth." Despite their material wealth, they were spiritually "wretched, pitiful, poor, blind, and naked."',
    country: 'Turkey',
    region: 'Western Anatolia',
    latitude: 37.8356,
    longitude: 29.1069,
    tourHighlight: false,
    tourPriority: 62,
    metaTitle: 'Laodicea: The Lukewarm Church | Seven Churches Biblical Tour',
    metaDescription: 'Visit Laodicea, the wealthy but spiritually poor church that Jesus threatened to reject. See the aqueduct ruins and ancient city.',
  },

  // ============================================================================
  // GREECE (Paul's European Ministry)
  // ============================================================================
  {
    slug: 'philippi',
    name: 'Philippi',
    description: 'The first European city where Paul preached the Gospel, site of Lydia\'s conversion and Paul\'s imprisonment.',
    historicalInfo: 'Philippi was named after Philip II of Macedon (father of Alexander the Great) and was later colonized by Rome as a military outpost. The Via Egnatia, the main Roman road connecting East and West, ran through the city.',
    biblicalContext: 'Paul received the "Macedonian call" vision and came to Philippi (Acts 16:9-40). Here Lydia was converted, a slave girl was freed from a demon, and Paul and Silas were imprisoned. After an earthquake freed them, the jailer and his household believed. Paul later wrote his epistle to the Philippians to this church.',
    country: 'Greece',
    region: 'Macedonia',
    latitude: 41.0136,
    longitude: 24.2869,
    tourHighlight: true,
    tourPriority: 80,
    metaTitle: 'Philippi: First European Church | Paul\'s Missionary Journeys',
    metaDescription: 'Visit Philippi where Paul brought Christianity to Europe. See the prison, the river where Lydia was baptized, and walk the Via Egnatia.',
  },
  {
    slug: 'thessalonica',
    name: 'Thessalonica',
    description: 'Major port city where Paul established a church and later wrote two epistles, modern-day Thessaloniki.',
    historicalInfo: 'Thessalonica was the capital of the Roman province of Macedonia and an important commercial port on the Via Egnatia. Named after the sister of Alexander the Great, the city was a crucial hub for trade and communication between Rome and the Eastern provinces.',
    biblicalContext: 'Paul spent three weeks in Thessalonica reasoning from the Scriptures in the synagogue (Acts 17:1-9). Despite opposition and a riot, a church was established. Paul wrote 1 and 2 Thessalonians to this congregation, addressing questions about Christ\'s return and encouraging them to remain faithful.',
    country: 'Greece',
    region: 'Macedonia',
    latitude: 40.6401,
    longitude: 22.9444,
    tourHighlight: true,
    tourPriority: 72,
    metaTitle: 'Thessalonica: Church of Paul\'s Letters | Biblical Greece Tours',
    metaDescription: 'Explore Thessalonica, the port city where Paul founded a church and wrote two epistles. Walk the streets of this historic biblical city.',
  },
  {
    slug: 'berea',
    name: 'Berea',
    description: 'The city whose people were praised for examining the Scriptures daily to verify Paul\'s teaching.',
    historicalInfo: 'Berea (modern Veria) was located about 45 miles west of Thessalonica, away from the main Via Egnatia route. This relative isolation may have contributed to the Jewish community\'s more open-minded approach to Paul\'s message.',
    biblicalContext: 'The Berean Jews are commended in Acts 17:10-15 as being "more noble" because they "received the word with all eagerness, examining the Scriptures daily to see if these things were so." Many believed, including prominent Greek men and women. The Berean approach became a model for biblical discernment.',
    country: 'Greece',
    region: 'Macedonia',
    latitude: 40.5214,
    longitude: 22.2014,
    tourHighlight: false,
    tourPriority: 65,
    metaTitle: 'Berea: City of Noble Bible Searchers | Paul\'s Ministry in Greece',
    metaDescription: 'Visit Berea, home of the noble-minded Jews who daily examined Scripture. Experience the birthplace of biblical discernment.',
  },
  {
    slug: 'athens',
    name: 'Athens',
    description: 'The philosophical capital of the ancient world where Paul delivered his famous Areopagus sermon about the "Unknown God."',
    historicalInfo: 'Athens was the intellectual center of ancient Greece, home to Plato\'s Academy, Aristotle\'s Lyceum, and the Areopagus court. Though past its political prime in Paul\'s day, it remained influential in philosophy, featuring Stoic and Epicurean schools of thought.',
    biblicalContext: 'Paul\'s spirit was provoked by the city\'s idolatry (Acts 17:16-34). He reasoned in the synagogue and marketplace, then delivered his masterful Areopagus address, using their altar "TO THE UNKNOWN GOD" to proclaim Christ. While some mocked, others believed, including Dionysius the Areopagite and a woman named Damaris.',
    country: 'Greece',
    region: 'Attica',
    latitude: 37.9838,
    longitude: 23.7275,
    tourHighlight: true,
    tourPriority: 83,
    metaTitle: 'Athens: Where Paul Preached to Philosophers | Biblical Greece',
    metaDescription: 'Stand on Mars Hill where Paul declared the Unknown God. Explore Athens and see where Christianity met Greek philosophy.',
  },
  {
    slug: 'corinth',
    name: 'Corinth',
    description: 'The cosmopolitan commercial city where Paul spent 18 months and later wrote two letters addressing serious church problems.',
    historicalInfo: 'Corinth was a major commercial hub with two ports (one on the Aegean, one on the Adriatic), making it one of the wealthiest cities in Greece. The city was infamous for sexual immorality, with the Temple of Aphrodite employing sacred prostitutes. "To Corinthianize" meant to practice sexual immorality.',
    biblicalContext: 'Paul spent 18 months in Corinth (Acts 18:1-18), working as a tentmaker with Aquila and Priscilla. He founded a church despite opposition and later wrote 1 and 2 Corinthians addressing divisions, immorality, spiritual gifts, and resurrection. The Corinthian letters provide crucial teaching on church life and love (1 Cor 13).',
    country: 'Greece',
    region: 'Peloponnese',
    latitude: 37.9065,
    longitude: 22.8809,
    tourHighlight: true,
    tourPriority: 85,
    metaTitle: 'Corinth: Paul\'s Problem Church | Ancient Biblical Cities',
    metaDescription: 'Visit ancient Corinth where Paul ministered for 18 months. See the bema seat, temple ruins, and understand the context of his famous letters.',
  },
  {
    slug: 'patmos',
    name: 'Patmos',
    description: 'The small island where John received the visions recorded in the Book of Revelation while in exile.',
    historicalInfo: 'Patmos is a small volcanic island in the Aegean Sea, part of the Dodecanese islands. Under Roman rule, it served as a place of exile for political prisoners. The Cave of the Apocalypse, where tradition says John received his visions, is now a UNESCO World Heritage site.',
    biblicalContext: 'John was exiled to Patmos "because of the word of God and the testimony of Jesus" (Revelation 1:9). On "the Lord\'s day," he received extraordinary visions of Christ, the seven churches, coming judgments, and the new heaven and new earth. The Book of Revelation was written from this island.',
    country: 'Greece',
    region: 'Dodecanese Islands',
    latitude: 37.3092,
    longitude: 26.5481,
    tourHighlight: true,
    tourPriority: 87,
    metaTitle: 'Patmos: Island of Revelation | Where John Saw Visions',
    metaDescription: 'Visit Patmos, the sacred island where John received the Book of Revelation. See the Cave of the Apocalypse and experience biblical prophecy.',
  },

  // ============================================================================
  // ITALY (Paul's Journey to Rome)
  // ============================================================================
  {
    slug: 'rome',
    name: 'Rome',
    description: 'The capital of the Roman Empire where Paul was imprisoned and both Peter and Paul were martyred.',
    historicalInfo: 'Rome was the center of the ancient world, with a population exceeding one million. The city featured magnificent structures like the Colosseum, Roman Forum, and Circus Maximus. Early Christians were often persecuted here, including mass executions under Nero after the Great Fire of 64 AD.',
    biblicalContext: 'Paul wrote his Epistle to the Romans before arriving in the city. He was later shipwrecked on the way to Rome (Acts 27) and spent two years under house arrest (Acts 28:16-31). Tradition holds that both Peter and Paul were martyred in Rome—Paul by beheading and Peter by crucifixion (upside down).',
    country: 'Italy',
    region: 'Lazio',
    latitude: 41.9028,
    longitude: 12.4964,
    tourHighlight: true,
    tourPriority: 78,
    metaTitle: 'Rome: Where Paul and Peter Were Martyred | Biblical Italy',
    metaDescription: 'Explore biblical Rome, capital of the empire. Visit catacombs, Paul\'s prison, and sites of early Christian martyrdom.',
  },
  {
    slug: 'malta',
    name: 'Malta',
    description: 'The island where Paul was shipwrecked for three months and performed miracles of healing.',
    historicalInfo: 'Malta (ancient Melita) is a small island nation south of Sicily. The traditional shipwreck site is St. Paul\'s Bay on the northern coast. Archaeological evidence supports significant Roman presence during Paul\'s time, and the island quickly became Christian after his visit.',
    biblicalContext: 'Paul was shipwrecked on Malta during his voyage to Rome (Acts 27-28). The islanders showed unusual kindness. Paul survived a viper bite without harm, and he healed Publius\' father and many others. The three months on Malta demonstrated God\'s protection and power through signs and wonders.',
    country: 'Malta',
    region: 'Mediterranean Island',
    latitude: 35.9375,
    longitude: 14.3754,
    tourHighlight: false,
    tourPriority: 68,
    metaTitle: 'Malta: Where Paul Was Shipwrecked | Apostolic Journeys',
    metaDescription: 'Visit Malta where Paul survived shipwreck and a viper bite. See St. Paul\'s Bay and experience the island of miracles.',
  },
];

async function seedBiblicalPlaces() {
  console.log('🏛️  Seeding Biblical Places table...\n');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const place of BIBLICAL_PLACES) {
    try {
      // Check if place exists
      const existing = await prisma.place.findUnique({
        where: { slug: place.slug },
      });

      if (existing) {
        // Update existing place
        await prisma.place.update({
          where: { slug: place.slug },
          data: {
            name: place.name,
            description: place.description,
            historicalInfo: place.historicalInfo,
            biblicalContext: place.biblicalContext,
            modernName: place.modernName,
            country: place.country,
            region: place.region,
            latitude: place.latitude,
            longitude: place.longitude,
            tourHighlight: place.tourHighlight,
            tourPriority: place.tourPriority,
            metaTitle: place.metaTitle,
            metaDescription: place.metaDescription,
          },
        });
        updated++;
        console.log(`  🔄 Updated: ${place.name} (${place.country})`);
      } else {
        // Create new place
        await prisma.place.create({
          data: place,
        });
        created++;
        console.log(`  ✅ Created: ${place.name} (${place.country})`);
      }
    } catch (error) {
      skipped++;
      console.error(`  ❌ Failed to process ${place.name}:`, error);
    }
  }

  console.log(`\n✅ Seeding complete!`);
  console.log(`  🏛️  Created: ${created} places`);
  console.log(`  🔄 Updated: ${updated} places`);
  console.log(`  ⚠️  Skipped: ${skipped} places`);
  console.log(`  📍 Total: ${BIBLICAL_PLACES.length} places\n`);
}

async function main() {
  try {
    console.log('🚀 Starting Biblical Places seeding...\n');

    await seedBiblicalPlaces();

    // Verify
    const finalCount = await prisma.place.count();
    console.log(`📊 Final count: ${finalCount} places in database`);

    // Show breakdown by region
    const byCountry = await prisma.place.groupBy({
      by: ['country'],
      _count: true,
    });

    console.log('\n📍 Places by country:');
    byCountry.forEach((group) => {
      console.log(`  ${group.country}: ${group._count} places`);
    });

    // Show tour highlights
    const highlights = await prisma.place.count({
      where: { tourHighlight: true },
    });
    console.log(`\n⭐ Tour highlights: ${highlights} featured places\n`);

  } catch (error) {
    console.error('❌ Error seeding biblical places:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}
