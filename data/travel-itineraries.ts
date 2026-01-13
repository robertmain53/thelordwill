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
];
