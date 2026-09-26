import { parseAspect } from "@/lib/gallery/aspect";
import { renderMockSvg } from "@/lib/gallery/mockSvg";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ item: string; asset: string; aspect: string }> },
) {
  const { item, asset, aspect } = await params;
  const svg = renderMockSvg(Number(item) || 0, Number(asset) || 0, parseAspect(aspect.replace("x", ":"), () => {}));
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
