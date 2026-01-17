export type TravelItinerary = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  days: number;
  region: "Holy Land" | "Greece & Turkey" | "Egypt & Sinai" | "Rome" | "Jordan";
  bestSeason: string;
  whoItsFor: string;
  highlights: string[];
  dailyPlan: Array<{
    day: number;
    title: string;
    places: string[]; // slugs or names
    readings: string[]; // references
    notes: string;
  }>;
  faqs: Array<{ question: string; answer: string }>;
};
 
export const TRAVEL_ITINERARIES: TravelItinerary[] = [
  {
    slug: "holy-land-7-days-gospels",
    title: "7-Day Holy Land Pilgrimage (Gospels Focus)",
    metaTitle: "7-Day Holy Land Pilgrimage Itinerary (Gospels Focus) | The Lord Will",
    metaDescription:
      "A practical 7-day Holy Land itinerary centered on the Gospels, with daily readings, realistic pacing, and a discipleship-first structure.",
    days: 7,
    region: "Holy Land",
    bestSeason: "Spring and fall typically offer comfortable temperatures and manageable crowds.",
    whoItsFor: "First-time pilgrims who want a Gospel-centered plan with realistic time budgets.",
    highlights: [
      "Jerusalem: key Gospel locations and Old Testament backdrop",
      "Galilee circuit: Nazareth, Capernaum, Mount of Beatitudes, Sea of Galilee",
      "Bethlehem day trip with respectful guidance",
      "Daily Scripture reading plan mapped to locations",
    ],
    dailyPlan: [
      {
        day: 1,
        title: "Arrival + Orientation",
        places: ["Jerusalem"],
        readings: ["Psalm 122", "Luke 19:41–44"],
        notes: "Light day: adjust to travel, establish group expectations, and set a discipleship purpose.",
      },
      {
        day: 2,
        title: "Jerusalem: Teaching, conflict, and redemption",
        places: ["Jerusalem"],
        readings: ["Luke 22", "Luke 23"],
        notes: "Structure the day around key narrative movements: teaching → betrayal → trial.",
      },
      {
        day: 3,
        title: "Jerusalem: Resurrection focus",
        places: ["Jerusalem"],
        readings: ["Luke 24", "John 20"],
        notes: "Plan quiet reflection time; avoid over-scheduling to prevent spiritual fatigue.",
      },
      {
        day: 4,
        title: "Bethlehem day trip",
        places: ["Bethlehem"],
        readings: ["Micah 5:2", "Matthew 2:1–12"],
        notes: "Emphasize respectful conduct and local guide coordination.",
      },
      {
        day: 5,
        title: "Nazareth + transition to Galilee",
        places: ["Nazareth"],
        readings: ["Luke 1:26–38", "Luke 4:14–30"],
        notes: "Use this day to frame Jesus’ early ministry and hometown reception.",
      },
      {
        day: 6,
        title: "Sea of Galilee ministry circuit",
        places: ["Capernaum", "Sea of Galilee"],
        readings: ["Matthew 5–7", "Mark 4:35–41"],
        notes: "Keep travel times realistic; build margin for crowds and weather.",
      },
      {
        day: 7,
        title: "Wrap-up + sending",
        places: ["Jerusalem"],
        readings: ["Matthew 28:16–20", "Acts 1:8"],
        notes: "Close with commitments: how the trip changes daily discipleship back home.",
      },
    ],
    faqs: [
      {
        question: "Is this itinerary suitable for church groups?",
        answer:
          "Yes. It is designed for groups by using realistic pacing, built-in reflection time, and a discipleship-first structure rather than a “maximum sites” approach.",
      },
      {
        question: "Do I need a guide for this itinerary?",
        answer:
          "For a first trip, a vetted local guide or a structured tour often improves logistics, reduces friction, and helps keep the schedule realistic.",
      },
      {
        question: "What Bible readings should I prioritize daily?",
        answer:
          "Prioritize the passages directly tied to the day’s locations. Use one Gospel narrative thread to avoid scattered reading and to maximize spiritual coherence.",
      },
      {
        question: "Can I shorten this to 5 days?",
        answer:
          "Yes. Combine the Jerusalem days, keep one Galilee day, and retain Bethlehem only if it fits the group’s energy and logistics.",
      },
      {
        question: "How do you avoid ‘tourism-only’ outcomes?",
        answer:
          "By anchoring each day in Scripture, adding reflection prompts, and ending with concrete commitments for life at home.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // NEW ITINERARIES
  // ---------------------------------------------------------------------------

  {
    slug: "holy-land-5-days-jerusalem-core",
    title: "5-Day Holy Land Pilgrimage (Jerusalem Core)",
    metaTitle: "5-Day Holy Land Itinerary (Jerusalem Core) | The Lord Will",
    metaDescription:
      "A realistic 5-day itinerary focused on Jerusalem’s biblical arc—Passion, Resurrection, and discipleship—designed for short trips and first-time groups.",
    days: 5,
    region: "Holy Land",
    bestSeason: "Spring and fall for comfortable walking conditions and fewer weather disruptions.",
    whoItsFor: "Short-stay pilgrims, church groups, and first-timers who want spiritual depth without aggressive site-counting.",
    highlights: [
      "Jerusalem-centric plan with time buffers and daily reflection prompts",
      "Passion + Resurrection narrative flow (Luke–John)",
      "Optional Bethlehem half-day with respectful logistics",
      "Designed to reduce burnout: fewer transfers, more meaning",
    ],
    dailyPlan: [
      {
        day: 1,
        title: "Arrival + spiritual orientation",
        places: ["Jerusalem"],
        readings: ["Psalm 122", "Luke 19:28–44"],
        notes: "Set expectations: fewer sites, more Scripture coherence. Keep the day light for jet lag and group cohesion.",
      },
      {
        day: 2,
        title: "Jerusalem: teaching and confrontation",
        places: ["Jerusalem"],
        readings: ["Luke 20", "Luke 21"],
        notes: "Frame the day around Jesus’ public ministry and the cost of discipleship. Add quiet journaling time.",
      },
      {
        day: 3,
        title: "Jerusalem: Passion narrative",
        places: ["Jerusalem"],
        readings: ["Luke 22", "Luke 23"],
        notes: "Do not compress the schedule. Build margin for prayer and silence; avoid “rushing” the Passion story.",
      },
      {
        day: 4,
        title: "Jerusalem: Resurrection and restoration",
        places: ["Jerusalem"],
        readings: ["Luke 24", "John 21"],
        notes: "Focus on resurrection faith and restoration. End with a group debrief: what changed internally?",
      },
      {
        day: 5,
        title: "Sending + optional Bethlehem",
        places: ["Jerusalem", "Bethlehem"],
        readings: ["Micah 5:2", "Matthew 28:16–20"],
        notes: "If Bethlehem is included, keep it simple and respectful; otherwise use the time for commissioning prayer.",
      },
    ],
    faqs: [
      {
        question: "Is 5 days enough for the Holy Land?",
        answer:
          "It can be, if you choose a single focus. This plan prioritizes depth in Jerusalem rather than trying to cover everything.",
      },
      {
        question: "How do you prevent schedule overload?",
        answer:
          "By limiting transfers, building margins, and anchoring the flow to a single Scripture narrative thread instead of maximizing locations.",
      },
      {
        question: "Can we add Galilee?",
        answer:
          "Not recommended for 5 days unless you drop Bethlehem and accept a long transfer day. Consider the 7-day Gospel itinerary instead.",
      },
      {
        question: "What’s the best spiritual rhythm per day?",
        answer:
          "Morning reading + midday reflection + evening debrief. Keep the reading tied to the day’s narrative arc.",
      },
    ],
  },

  {
    slug: "holy-land-10-days-jesus-ministry-full",
    title: "10-Day Holy Land Pilgrimage (Jesus’ Ministry: Galilee to Jerusalem)",
    metaTitle: "10-Day Holy Land Pilgrimage Itinerary (Galilee to Jerusalem) | The Lord Will",
    metaDescription:
      "A discipleship-oriented 10-day itinerary tracing Jesus’ ministry from Galilee through Jerusalem, with practical pacing and Scripture coherence.",
    days: 10,
    region: "Holy Land",
    bestSeason: "Spring and fall for comfortable travel across regions and longer walking days.",
    whoItsFor: "Church groups and returning pilgrims who want a fuller ministry arc without a frantic schedule.",
    highlights: [
      "Galilee base: Nazareth, Capernaum, Sea of Galilee circuit",
      "Teaching emphasis: Sermon on the Mount, parables, miracles",
      "Jerusalem climax: Passion, Resurrection, and commissioning",
      "Built-in “margin days” to prevent fatigue and logistics collapse",
    ],
    dailyPlan: [
      {
        day: 1,
        title: "Arrival + reset day",
        places: ["Jerusalem"],
        readings: ["Psalm 84", "Psalm 122"],
        notes: "Light schedule. Use the day for orientation, safety/logistics briefing, and group spiritual goals.",
      },
      {
        day: 2,
        title: "Nazareth: incarnation and calling",
        places: ["Nazareth"],
        readings: ["Luke 1:26–38", "Luke 4:14–30"],
        notes: "Introduce the concept of ‘place-based discipleship’: locations serve Scripture, not the reverse.",
      },
      {
        day: 3,
        title: "Capernaum + early ministry rhythm",
        places: ["Capernaum", "Sea of Galilee"],
        readings: ["Mark 1:21–39", "Matthew 4:18–25"],
        notes: "Focus on Jesus’ authority in teaching, deliverance, and healing—then reflect on modern discipleship practice.",
      },
      {
        day: 4,
        title: "Teaching day: Sermon on the Mount",
        places: ["Sea of Galilee"],
        readings: ["Matthew 5–7"],
        notes: "Slow day with long reading. Replace some travel with Scripture immersion and discussion.",
      },
      {
        day: 5,
        title: "Parables and faith under pressure",
        places: ["Sea of Galilee"],
        readings: ["Mark 4", "Mark 5:21–43"],
        notes: "Plan flexible boat/waterfront time depending on weather. Build margin for group needs.",
      },
      {
        day: 6,
        title: "Transition day + rest margin",
        places: ["Jerusalem"],
        readings: ["Luke 9:51–62"],
        notes: "Treat transfer as part of the narrative: ‘setting His face toward Jerusalem.’ Avoid late-night over-programming.",
      },
      {
        day: 7,
        title: "Jerusalem: public ministry and confrontation",
        places: ["Jerusalem"],
        readings: ["Luke 19:45–48", "Luke 20"],
        notes: "Maintain a clear arc: cleansing/teaching → opposition → the cost of witness.",
      },
      {
        day: 8,
        title: "Jerusalem: the Last Supper and betrayal",
        places: ["Jerusalem"],
        readings: ["Luke 22"],
        notes: "Set a reverent pace. Add a guided communion/reflection moment appropriate to your tradition.",
      },
      {
        day: 9,
        title: "Jerusalem: crucifixion and meaning",
        places: ["Jerusalem"],
        readings: ["Luke 23", "Isaiah 53"],
        notes: "Keep the day emotionally realistic. Avoid stacking too many extra sites that distract from the core reading.",
      },
      {
        day: 10,
        title: "Resurrection + commissioning",
        places: ["Jerusalem"],
        readings: ["Luke 24", "Matthew 28:16–20"],
        notes: "End with a concrete ‘rule of life’ plan: prayer, Scripture, community, mission after the trip.",
      },
    ],
    faqs: [
      {
        question: "Is 10 days too long for beginners?",
        answer:
          "Not if paced well. This plan includes margin days and limits unnecessary transfers to reduce fatigue and keep spiritual focus.",
      },
      {
        question: "How do you maintain Scripture coherence across many days?",
        answer:
          "By using a clear narrative arc (Galilee → Jerusalem) and choosing readings that match the day’s theological purpose.",
      },
      {
        question: "Can we add Jordan or Egypt to this plan?",
        answer:
          "It’s possible, but it often dilutes the discipleship focus. Consider separate themed itineraries for Jordan or Sinai.",
      },
      {
        question: "How do you handle mixed mobility in groups?",
        answer:
          "Use optional walking segments, define rendezvous points, and schedule rest blocks. Avoid “everyone must do everything.”",
      },
    ],
  },

  {
    slug: "jordan-3-days-petra-mount-nebo",
    title: "3-Day Jordan Extension (Mount Nebo, Madaba, Petra)",
    metaTitle: "3-Day Jordan Bible Travel Extension (Mount Nebo & Petra) | The Lord Will",
    metaDescription:
      "A compact 3-day Jordan extension pairing biblical geography (Mount Nebo, Madaba) with Petra, designed as an add-on to Holy Land trips.",
    days: 3,
    region: "Jordan",
    bestSeason: "Spring and fall for comfortable desert temperatures and fewer weather extremes.",
    whoItsFor: "Pilgrims adding a short Jordan segment to a Holy Land trip, with manageable driving distances.",
    highlights: [
      "Mount Nebo: reflection on Moses’ final view and faithful endurance",
      "Madaba: map tradition and biblical geography context",
      "Petra: cultural and historical perspective with flexible pacing",
      "A ‘theology of journey’ focus rather than site-collecting",
    ],
    dailyPlan: [
      {
        day: 1,
        title: "Madaba + Mount Nebo: the view and the promise",
        places: ["Madaba", "Mount Nebo"],
        readings: ["Deuteronomy 34", "Joshua 1:1–9"],
        notes: "Keep the day reflective: leadership transition, promises, and obedience as the true ‘arrival.’",
      },
      {
        day: 2,
        title: "Travel to Petra + orientation",
        places: ["Petra"],
        readings: ["Psalm 121", "Hebrews 11:13–16"],
        notes: "Make travel part of discipleship: patience, mutual care, and endurance. Keep Petra entry flexible.",
      },
      {
        day: 3,
        title: "Petra exploration + return",
        places: ["Petra"],
        readings: ["Isaiah 40:28–31", "2 Corinthians 4:16–18"],
        notes: "Plan optional distance tiers: short route for limited mobility, longer route for strong walkers.",
      },
    ],
    faqs: [
      {
        question: "Is Petra biblically required?",
        answer:
          "No. It’s a meaningful cultural and historical addition, while Mount Nebo/Madaba carry clearer biblical geography resonance.",
      },
      {
        question: "Can we do Jordan in 2 days?",
        answer:
          "Possible, but rushed. You typically need to drop Petra or reduce it to a brief stop, which may not be worth it.",
      },
      {
        question: "What should the group focus on spiritually?",
        answer:
          "A theology of journey: endurance, leadership transition, and hope—rather than maximizing attractions.",
      },
    ],
  },

  {
    slug: "egypt-sinai-6-days-exodus-theme",
    title: "6-Day Egypt & Sinai Journey (Exodus Theme)",
    metaTitle: "6-Day Egypt & Sinai Bible Travel Itinerary (Exodus Theme) | The Lord Will",
    metaDescription:
      "A practical 6-day Egypt & Sinai itinerary centered on Exodus themes: deliverance, wilderness formation, and covenant—built for realistic travel pacing.",
    days: 6,
    region: "Egypt & Sinai",
    bestSeason: "Late fall through early spring for milder desert temperatures and easier long driving days.",
    whoItsFor: "Bible study groups and returning pilgrims who want a themed journey emphasizing formation and covenant.",
    highlights: [
      "Exodus narrative as spiritual formation: deliverance → wilderness → covenant",
      "Realistic long-distance pacing with rest buffers",
      "Scripture-first structure to avoid over-tourism",
      "Strong ‘application’ prompts for community life after the trip",
    ],
    dailyPlan: [
      {
        day: 1,
        title: "Arrival + Exodus framing",
        places: ["Cairo"],
        readings: ["Exodus 1", "Exodus 2:1–10"],
        notes: "Set a narrative lens: God’s deliverance begins before it feels visible. Keep the day light for travel adjustment.",
      },
      {
        day: 2,
        title: "Deliverance theme: calling and confrontation",
        places: ["Cairo"],
        readings: ["Exodus 3", "Exodus 4:1–17"],
        notes: "Focus on vocation and fear. Add guided discussion on obedience and identity under pressure.",
      },
      {
        day: 3,
        title: "Transition into Sinai: wilderness formation begins",
        places: ["Sinai"],
        readings: ["Exodus 13:17–22", "Exodus 14"],
        notes: "Long travel day. Use short readings and structured reflection breaks, not heavy schedules.",
      },
      {
        day: 4,
        title: "Wilderness: provision and trust",
        places: ["Sinai"],
        readings: ["Exodus 16", "Exodus 17:1–7"],
        notes: "Keep the day contemplative. The goal is formation, not exhaustion.",
      },
      {
        day: 5,
        title: "Covenant focus: holiness and community",
        places: ["Sinai"],
        readings: ["Exodus 19", "Exodus 20:1–17"],
        notes: "Anchor discussions in community ethics: worship, truth, justice, and responsibility to others.",
      },
      {
        day: 6,
        title: "Return + sending: the life after deliverance",
        places: ["Cairo"],
        readings: ["Deuteronomy 6:4–9", "Hebrews 3:7–19"],
        notes: "Close with application: how ‘wilderness lessons’ shape decisions back home.",
      },
    ],
    faqs: [
      {
        question: "Is this itinerary historically precise in every detail?",
        answer:
          "It is Scripture-centered and theme-based. It prioritizes biblical theology and discipleship formation over speculative claims.",
      },
      {
        question: "How physically demanding is Sinai travel?",
        answer:
          "Travel days can be long. Plan early starts, hydration, and rest buffers; avoid stacking heavy walking and long transfers on the same day.",
      },
      {
        question: "What makes this a discipleship itinerary rather than sightseeing?",
        answer:
          "Daily readings are primary, reflection time is built in, and the spiritual arc is consistent: deliverance → formation → covenant → application.",
      },
    ],
  },

  {
    slug: "greece-turkey-7-days-pauls-journeys",
    title: "7-Day Greece & Turkey Route (Paul’s Journeys Overview)",
    metaTitle: "7-Day Bible Travel Itinerary: Paul’s Journeys (Greece & Turkey) | The Lord Will",
    metaDescription:
      "A practical 7-day itinerary following key locations tied to Paul’s ministry, structured around Acts and the epistles for doctrinal clarity and realistic pacing.",
    days: 7,
    region: "Greece & Turkey",
    bestSeason: "Spring and early fall for comfortable city walking and fewer peak-season disruptions.",
    whoItsFor: "Church groups and Bible students seeking Acts + epistles coherence with manageable transfers.",
    highlights: [
      "Acts narrative thread with paired epistle readings for context",
      "Balanced pacing: teaching blocks + travel blocks",
      "Emphasis on church formation, perseverance, and mission",
      "Designed to work even if specific site access varies",
    ],
    dailyPlan: [
      {
        day: 1,
        title: "Orientation: mission and calling",
        places: ["Thessaloniki"],
        readings: ["Acts 16:6–15", "1 Thessalonians 1"],
        notes: "Start with the mission lens: why Paul travels. Keep the day flexible for arrival logistics.",
      },
      {
        day: 2,
        title: "Perseverance under pressure",
        places: ["Thessaloniki"],
        readings: ["Acts 17:1–9", "1 Thessalonians 2:1–12"],
        notes: "Teach a simple framework: opposition → endurance → community building.",
      },
      {
        day: 3,
        title: "Berea + discernment culture",
        places: ["Berea"],
        readings: ["Acts 17:10–15", "2 Timothy 3:14–17"],
        notes: "Focus on ‘examining the Scriptures’ and how to build healthy doctrinal habits in a church.",
      },
      {
        day: 4,
        title: "Athens: gospel and culture",
        places: ["Athens"],
        readings: ["Acts 17:16–34"],
        notes: "Keep this as a teaching day: worldview analysis and respectful evangelism.",
      },
      {
        day: 5,
        title: "Corinth: church health and holiness",
        places: ["Corinth"],
        readings: ["Acts 18:1–11", "1 Corinthians 1:10–17"],
        notes: "Discuss unity, moral formation, and spiritual gifts without making the day overly academic.",
      },
      {
        day: 6,
        title: "Ephesus focus: discipleship and endurance",
        places: ["Ephesus"],
        readings: ["Acts 19:1–20", "Ephesians 6:10–18"],
        notes: "Emphasize long-term discipleship and spiritual resilience. Build quiet prayer time.",
      },
      {
        day: 7,
        title: "Wrap-up: mission continuity",
        places: ["Ephesus"],
        readings: ["Acts 20:17–24", "2 Timothy 4:6–8"],
        notes: "Close with a ‘mission plan’ for the group: how to live Acts-shaped faith back home.",
      },
    ],
    faqs: [
      {
        question: "Do we need to hit every city to make this meaningful?",
        answer:
          "No. Meaning comes from Scripture coherence. If logistics change, keep the Acts thread and adjust locations without losing the teaching arc.",
      },
      {
        question: "How do we handle access restrictions to specific sites?",
        answer:
          "Treat geography as a backdrop. Prepare readings and teaching segments that do not depend on a single location being open.",
      },
      {
        question: "Is this suitable for younger groups?",
        answer:
          "Yes, if you shorten teaching blocks and add interactive reflection. Keep travel fatigue in mind and avoid late-night stacking.",
      },
    ],
  },

  {
    slug: "rome-3-days-paul-peter-early-church",
    title: "3-Day Rome Focus (Paul, Peter, and the Early Church)",
    metaTitle: "3-Day Rome Bible Travel Itinerary (Early Church Focus) | The Lord Will",
    metaDescription:
      "A compact 3-day Rome itinerary centered on the early church, Paul’s witness, and resilient faith—designed for add-on travel and clear Scripture structure.",
    days: 3,
    region: "Rome",
    bestSeason: "Spring and fall for comfortable walking days and fewer weather extremes.",
    whoItsFor: "Travelers who want a short, Scripture-anchored Rome plan focused on witness, endurance, and church identity.",
    highlights: [
      "Acts-to-epistles coherence: witness under pressure",
      "Short itinerary that prioritizes reflection and application",
      "Minimal transfers; primarily walking-based pacing",
      "Designed for add-on days before/after wider Europe travel",
    ],
    dailyPlan: [
      {
        day: 1,
        title: "Orientation: Rome and gospel witness",
        places: ["Rome"],
        readings: ["Acts 28:16–31", "Romans 1:1–17"],
        notes: "Introduce the theme: faithful witness inside constraints. Keep the day light and focused.",
      },
      {
        day: 2,
        title: "Resilient community and hope",
        places: ["Rome"],
        readings: ["Romans 8:18–39", "2 Timothy 1:6–14"],
        notes: "Make this a ‘formation day’: prayer, discussion, and concrete commitments for courage.",
      },
      {
        day: 3,
        title: "Sending: mission continuity",
        places: ["Rome"],
        readings: ["Philippians 1:12–21", "2 Timothy 4:1–8"],
        notes: "Close with application: witness in modern systems, workplaces, and family life.",
      },
    ],
    faqs: [
      {
        question: "Can this Rome plan work without a specialized guide?",
        answer:
          "Yes. It is Scripture-anchored and not dependent on detailed site interpretation, though a guide can improve logistics.",
      },
      {
        question: "What is the spiritual emphasis of this itinerary?",
        answer:
          "Witness under pressure, resilient hope, and continuity of mission—rooted in Acts and Paul’s epistles.",
      },
      {
        question: "Can we extend it to 5 days?",
        answer:
          "Yes. Add one day for deeper Romans study (chapters 5–8) and one day for early church themes (Acts 2; 1 Peter 1).",
      },
    ],
  },

  {
    slug: "holy-land-4-days-galilee-essentials",
    title: "4-Day Galilee Essentials (Nazareth to Sea of Galilee)",
    metaTitle: "4-Day Galilee Bible Travel Itinerary (Nazareth & Sea of Galilee) | The Lord Will",
    metaDescription:
      "A compact 4-day Galilee-focused itinerary centered on Jesus’ early ministry: Nazareth, Capernaum, teaching, and faith—optimized for minimal transfers and maximum Scripture coherence.",
    days: 4,
    region: "Holy Land",
    bestSeason: "Spring and fall for comfortable lakeside and hillside walking.",
    whoItsFor: "Short trips, families, and groups who want a focused Galilee plan without Jerusalem complexity.",
    highlights: [
      "Nazareth as framework for incarnation and calling",
      "Capernaum + Sea of Galilee ministry rhythm (Mark’s early chapters)",
      "Teaching-first day built around Matthew 5–7",
      "Low-transfer structure to reduce fatigue and complexity",
    ],
    dailyPlan: [
      {
        day: 1,
        title: "Nazareth: calling and identity",
        places: ["Nazareth"],
        readings: ["Luke 1:26–38", "Luke 4:14–30"],
        notes: "Set expectations: the goal is formation through Scripture, not a checklist of attractions.",
      },
      {
        day: 2,
        title: "Capernaum: authority and compassion",
        places: ["Capernaum"],
        readings: ["Mark 1:21–39", "Matthew 8:14–17"],
        notes: "Emphasize Jesus’ authority expressed through healing and teaching; include a group prayer block.",
      },
      {
        day: 3,
        title: "Teaching immersion day",
        places: ["Sea of Galilee"],
        readings: ["Matthew 5–7"],
        notes: "Slow day by design. Trade extra transfers for time in the text, discussion, and silent reflection.",
      },
      {
        day: 4,
        title: "Faith under pressure + wrap-up",
        places: ["Sea of Galilee"],
        readings: ["Mark 4:35–41", "John 21:1–17"],
        notes: "Close with restoration and calling: ‘feed my sheep’ as practical discipleship after travel.",
      },
    ],
    faqs: [
      {
        question: "Does this work as a first Holy Land trip?",
        answer:
          "Yes, especially if your group prefers fewer logistics. It provides strong Gospel grounding without the complexity of a full Jerusalem schedule.",
      },
      {
        question: "Can we add Jerusalem as a day trip?",
        answer:
          "Not recommended for 4 days. The transfer load tends to dilute the Galilee focus. Consider the 7-day itinerary instead.",
      },
      {
        question: "How do we keep the group engaged without many ‘major’ sites?",
        answer:
          "By building a clear spiritual rhythm: Scripture, reflection, prayer, and a daily application question.",
      },
    ],
  },

  {
    slug: "holy-land-8-days-psalms-prophets-to-gospels",
    title: "8-Day Holy Land Journey (Psalms & Prophets to the Gospels)",
    metaTitle: "8-Day Holy Land Itinerary (Psalms & Prophets to the Gospels) | The Lord Will",
    metaDescription:
      "An 8-day itinerary that connects Old Testament foundations (Psalms and Prophets) to the Gospels, with practical pacing and a coherent biblical storyline.",
    days: 8,
    region: "Holy Land",
    bestSeason: "Spring and fall to support longer walking days with fewer heat-related slowdowns.",
    whoItsFor: "Bible readers who want stronger Old Testament context alongside Gospel locations.",
    highlights: [
      "Psalms + Prophets framework to interpret the Gospels more deeply",
      "Jerusalem foundations + Galilee ministry sequence",
      "Designed for teaching: short lectures + daily reading blocks",
      "Avoids frantic site stacking by using story-driven days",
    ],
    dailyPlan: [
      {
        day: 1,
        title: "Arrival + story framing",
        places: ["Jerusalem"],
        readings: ["Psalm 122", "Isaiah 2:1–5"],
        notes: "Frame the week as one storyline: promise → fulfillment. Keep the day light for arrival.",
      },
      {
        day: 2,
        title: "Jerusalem: Psalms of ascent and worship",
        places: ["Jerusalem"],
        readings: ["Psalm 84", "Psalm 121", "Psalm 122"],
        notes: "Use Psalms to shape worship posture and pilgrimage meaning rather than overloading locations.",
      },
      {
        day: 3,
        title: "Prophetic hope and fulfillment lens",
        places: ["Jerusalem"],
        readings: ["Isaiah 53", "Zechariah 9:9", "Luke 19:28–44"],
        notes: "Keep teaching short but clear: prophecy as theological lens, not sensational speculation.",
      },
      {
        day: 4,
        title: "Bethlehem: promise and incarnation",
        places: ["Bethlehem"],
        readings: ["Micah 5:2", "Matthew 1:18–25", "Luke 2:1–20"],
        notes: "Maintain respectful conduct and avoid rushed crowd dynamics by planning time buffers.",
      },
      {
        day: 5,
        title: "Nazareth: obedience and identity",
        places: ["Nazareth"],
        readings: ["Luke 1:26–38", "Luke 4:14–30"],
        notes: "Focus on formation: humility, obedience, and mission identity.",
      },
      {
        day: 6,
        title: "Galilee: teaching and the kingdom",
        places: ["Sea of Galilee", "Capernaum"],
        readings: ["Matthew 5–7", "Mark 1:21–39"],
        notes: "One ‘long reading’ day is intentional. Keep logistics simple; prioritize Scripture coherence.",
      },
      {
        day: 7,
        title: "Jerusalem: Passion and covenant",
        places: ["Jerusalem"],
        readings: ["Luke 22", "Luke 23"],
        notes: "Avoid compressing the Passion. Build prayer blocks and silence time.",
      },
      {
        day: 8,
        title: "Resurrection + sending",
        places: ["Jerusalem"],
        readings: ["Luke 24", "Acts 1:8"],
        notes: "Close with a practical discipleship plan: habits, community accountability, mission steps.",
      },
    ],
    faqs: [
      {
        question: "Is this itinerary appropriate for mixed Bible familiarity?",
        answer:
          "Yes. It includes short, clear readings and uses Psalms/Prophets as interpretive scaffolding without requiring academic background.",
      },
      {
        question: "How is this different from a standard Holy Land tour?",
        answer:
          "It is story-driven. Each day’s places are selected to serve a coherent Scripture arc rather than maximizing site count.",
      },
      {
        question: "Can we swap out Bethlehem?",
        answer:
          "Yes. If logistics or group energy require it, replace Bethlehem with an extra Jerusalem day focused on Luke 19–24.",
      },
    ],
  },
];
