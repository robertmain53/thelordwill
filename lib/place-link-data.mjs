/** @type {import("./place-link-data.d.ts").ResourceLink[]} */
export const RESOURCE_LINKS = [
  {
    href: "/bible-verses-for/anxiety",
    label: "Verses for Anxiety",
    description: "Comforting passages when worry takes hold",
  },
  {
    href: "/bible-verses-for/peace",
    label: "Verses for Peace",
    description: "Scripture that guards the heart and mind",
  },
  {
    href: "/prayer-points",
    label: "Prayer Points",
    description: "Scripture-backed prayers for any situation",
  },
  {
    href: "/names",
    label: "Biblical Names",
    description: "Explore meanings behind the characters in Scripture",
  },
];

/** @type {import("./place-link-data.d.ts").RelatedLinkFallback[]} */
export const FALLBACK_ENTITY_LINKS = [
  {
    href: "/bible-verses-for/anxiety",
    title: "Verses for Anxiety",
    description: "Peaceful passages that echo this sacred site.",
    type: "situation",
  },
  {
    href: "/bible-verses-for/peace",
    title: "Verses for Peace",
    description: "Scripture that mirrors the stillness around this location.",
    type: "situation",
  },
  {
    href: "/prayer-points",
    title: "Prayer Points",
    description: "Pray Scripture that aligns with your pilgrimage goals.",
    type: "prayer-point",
  },
  {
    href: "/names",
    title: "Biblical Names",
    description: "Discover the meaning of the characters who walked here.",
    type: "name",
  },
];
