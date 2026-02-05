export interface ResourceLink {
  href: string;
  label: string;
  description: string;
}

export interface RelatedLinkFallback {
  href: string;
  title: string;
  description: string;
  type: "place" | "situation" | "profession" | "prayer-point" | "name" | "itinerary" | "verse";
}

export declare const RESOURCE_LINKS: ResourceLink[];
export declare const FALLBACK_ENTITY_LINKS: RelatedLinkFallback[];
