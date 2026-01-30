import { PosterDescriptor, PosterProvider } from "../poster-provider";

function paletteFromSeed(seed: number): string[] {
  const colors: string[] = [];
  let value = seed * 127;

  for (let i = 0; i < 4; i++) {
    const channel = (value + i * 83) % 0xffffff;
    colors.push(`#${channel.toString(16).padStart(6, "0")}`);
    value = Math.floor(value / 2);
  }

  return colors;
}

export class MockPosterProvider implements PosterProvider {
  async describeVersePoster(verseId: number): Promise<PosterDescriptor> {
    const colors = paletteFromSeed(verseId + 3);
    const orientation = verseId % 2 === 0 ? "portrait" : "landscape";

    return {
      verseId,
      reference: `Verse ${verseId}`,
      tagline: `A minimalist ${orientation} interpretation of Scripture from verse ${verseId}`,
      description:
        "Preview the palette and orientation that will guide the final art direction. More customization options coming soon.",
      orientation,
      colorPalette: colors,
    };
  }
}
