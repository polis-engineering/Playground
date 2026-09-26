import type { Aspect } from "./types";

const SIZES: Record<Aspect, [number, number]> = {
  "16:9": [1600, 900],
  "4:3": [1200, 900],
  "1:1": [1000, 1000],
};

/** Placeholder media in the Figma "empty image" look (light checkerboard) with a small frame label. */
export function renderMockSvg(item: number, asset: number, aspect: Aspect) {
  const [w, h] = SIZES[aspect];
  const cell = Math.round(h / 16);
  const label = `#${String(item).padStart(2, "0")} · ${asset}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
<defs><pattern id="c" width="${cell * 2}" height="${cell * 2}" patternUnits="userSpaceOnUse">
<rect width="${cell * 2}" height="${cell * 2}" fill="#fafafa"/><rect width="${cell}" height="${cell}" fill="#ececec"/><rect x="${cell}" y="${cell}" width="${cell}" height="${cell}" fill="#ececec"/>
</pattern></defs>
<rect width="${w}" height="${h}" fill="url(#c)"/>
<text x="50%" y="48%" fill="rgba(0,0,0,0.25)" font-family="Helvetica Neue, Arial, sans-serif" font-size="${Math.round(h / 14)}" text-anchor="middle" dominant-baseline="middle">${label}</text>
<text x="50%" y="58%" fill="rgba(0,0,0,0.25)" font-family="Helvetica Neue, Arial, sans-serif" font-size="${Math.round(h / 22)}" text-anchor="middle" dominant-baseline="middle">${aspect}</text>
</svg>`;
}
