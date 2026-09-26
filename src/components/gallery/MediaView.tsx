"use client";

import { useEffect, useRef } from "react";
import { MEDIA_DEFAULTS } from "@/lib/gallery/defaults";
import { imageSources } from "@/lib/gallery/props";
import type { MediaAsset, MediaImage } from "@/lib/gallery/types";

const muxStreamUrl = (playbackId: string) => `https://stream.mux.com/${playbackId}.m3u8`;

function Img({ image, alt, eager, onError }: { image: MediaImage; alt: string; eager?: boolean; onError?: () => void }) {
  const { src, srcSet } = imageSources(image, MEDIA_DEFAULTS.imageWidths);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- frame box is fixed by aspect tokens; Sanity CDN srcset is built by hand.
    <img
      className="cg-media"
      src={src}
      srcSet={srcSet}
      sizes={srcSet ? MEDIA_DEFAULTS.imageSizes : undefined}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      onError={onError}
    />
  );
}

function Video({ asset, playing, onError }: { asset: MediaAsset; playing: boolean; onError?: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  });

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.muted = true;
    const src = asset.video?.src;
    const playbackId = asset.video?.playbackId;
    let destroy: (() => void) | undefined;
    let cancelled = false;
    if (src) {
      video.src = src;
    } else if (playbackId) {
      const url = muxStreamUrl(playbackId);
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
      } else {
        import("hls.js").then(({ default: Hls }) => {
          if (cancelled) return;
          if (!Hls.isSupported()) return onErrorRef.current?.();
          const hls = new Hls({ capLevelToPlayerSize: true });
          hls.on(Hls.Events.ERROR, (_event, data) => data.fatal && onErrorRef.current?.());
          hls.loadSource(url);
          hls.attachMedia(video);
          destroy = () => hls.destroy();
        });
      }
    }
    return () => {
      cancelled = true;
      destroy?.();
    };
  }, [asset.video?.src, asset.video?.playbackId]);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (playing) video.play().catch(() => {});
    else video.pause();
  }, [playing]);

  const poster = asset.poster ? imageSources(asset.poster, MEDIA_DEFAULTS.imageWidths).src : undefined;
  return (
    <video
      ref={ref}
      className="cg-media"
      poster={poster}
      muted
      playsInline
      loop
      preload="metadata"
      aria-label={asset.alt}
      onError={onError}
    />
  );
}

export type MediaViewProps = {
  asset: MediaAsset;
  /** Video only: play when true; pausing keeps the current frame. */
  playing: boolean;
  failed?: boolean;
  eager?: boolean;
  onError?: () => void;
};

/** One media asset filling its frame. Failed media → poster, else solid fallback (spec §10). */
export function MediaView({ asset, playing, failed, eager, onError }: MediaViewProps) {
  if (failed) {
    return asset.poster ? (
      <Img image={asset.poster} alt={asset.alt} eager={eager} />
    ) : (
      <div className="cg-media-fallback" role="img" aria-label={asset.alt} />
    );
  }
  if (asset.kind === "video") return <Video asset={asset} playing={playing} onError={onError} />;
  if (!asset.image) return <div className="cg-media-fallback" role="img" aria-label={asset.alt} />;
  return <Img image={asset.image} alt={asset.alt} eager={eager} onError={onError} />;
}
