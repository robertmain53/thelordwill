import { MockPosterProvider } from "./providers/mock";

export interface PosterDescriptor {
  verseId: number;
  reference: string;
  tagline: string;
  description: string;
  orientation: "portrait" | "landscape";
  colorPalette: string[];
}

export interface PosterProvider {
  describeVersePoster(verseId: number): Promise<PosterDescriptor>;
}

export function createPosterProvider(): PosterProvider {
  const configured = process.env.POSTER_PROVIDER?.toLowerCase() ?? "";

  if (configured === "mock" || configured === "" || configured === "placid") {
    return new MockPosterProvider();
  }

  console.warn(`Unsupported poster provider "${configured}", falling back to mock.`);
  return new MockPosterProvider();
}
