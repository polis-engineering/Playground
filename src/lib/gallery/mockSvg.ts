import type { Aspect } from "./types";

const SIZES: Record<Aspect, [number, number]> = {
  "16:9": [1600, 900],
  "4:3": [1200, 900],
  "1:1": [1000, 1000],
};

/** Labelled placeholder art for mock media. Hue is derived from item + asset so frames are distinguishable. */
export function renderMockSvg(item: number, asset: number, aspect: Aspect) {
  const [w, h] = SIZES[aspect];
  const hue = (item * 67 + asset * 23) % 360;
  const label = `#${String(item).padStart(2, "0")} · ${asset}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="hsl(${hue} 70% 58%)"/><stop offset="1" stop-color="hsl(${(hue + 50) % 360} 65% 32%)"/>
</linearGradient></defs>
<rect width="${w}" height="${h}" fill="url(#g)"/>
<rect x="24" y="24" width="${w - 48}" height="${h - 48}" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="4" rx="24"/>
<text x="50%" y="46%" fill="#fff" font-family="system-ui, sans-serif" font-size="${Math.round(h / 7)}" font-weight="700" text-anchor="middle" dominant-baseline="middle">${label}</text>
<text x="50%" y="62%" fill="rgba(255,255,255,0.8)" font-family="system-ui, sans-serif" font-size="${Math.round(h / 14)}" text-anchor="middle" dominant-baseline="middle">${aspect}</text>
</svg>`;
}
