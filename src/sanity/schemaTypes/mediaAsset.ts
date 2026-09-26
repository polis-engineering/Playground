import { defineField, defineType } from "sanity";
import { dimensionsFromImageRef, nearestAspect } from "@/lib/gallery/aspect";
import { ASPECTS } from "@/lib/gallery/types";

type MediaParent = { kind?: "image" | "video"; image?: { asset?: { _ref?: string } } } | undefined;

const requiredWhen =
  (kind: "image" | "video", label: string) =>
  (value: unknown, context: { parent?: unknown }) => {
    const parent = context.parent as MediaParent;
    if (parent?.kind !== kind) return true;
    const asset = (value as { asset?: unknown } | undefined)?.asset;
    return asset ? true : `${label} is required for ${kind} media`;
  };

export const mediaAsset = defineType({
  name: "mediaAsset",
  title: "Media asset",
  type: "object",
  fields: [
    defineField({
      name: "kind",
      type: "string",
      initialValue: "image",
      options: {
        list: [
          { title: "Image", value: "image" },
          { title: "Video", value: "video" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "aspect",
      description: "Required. Drives the in-card aspect morph; auto-detect is a hint only.",
      type: "string",
      options: { list: [...ASPECTS], layout: "radio", direction: "horizontal" },
      validation: (rule) => [
        rule.required(),
        rule
          .custom((value, context) => {
            const parent = context.parent as MediaParent;
            const dims = dimensionsFromImageRef(parent?.image?.asset?._ref);
            if (!value || !dims) return true;
            const detected = nearestAspect(dims.width, dims.height);
            return detected && detected !== value
              ? `Image is ${dims.width}×${dims.height} (closest ${detected}); selected ${value}`
              : true;
          })
          .warning(),
      ],
    }),
    defineField({
      name: "image",
      type: "image",
      options: { hotspot: true },
      hidden: ({ parent }) => (parent as MediaParent)?.kind !== "image",
      validation: (rule) => rule.custom(requiredWhen("image", "Image")),
    }),
    defineField({
      name: "video",
      type: "mux.video",
      hidden: ({ parent }) => (parent as MediaParent)?.kind !== "video",
      validation: (rule) => rule.custom(requiredWhen("video", "Video")),
    }),
    defineField({
      name: "poster",
      type: "image",
      description: "Required for video.",
      hidden: ({ parent }) => (parent as MediaParent)?.kind !== "video",
      validation: (rule) => rule.custom(requiredWhen("video", "Poster")),
    }),
    defineField({
      name: "alt",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "label",
      description: "Media context tag (glass pill on the card). Optional.",
      type: "string",
    }),
    defineField({
      name: "description",
      description: "Media context tag, second part. Optional.",
      type: "string",
    }),
  ],
  preview: {
    select: { kind: "kind", aspect: "aspect", alt: "alt", image: "image", poster: "poster" },
    prepare({ kind, aspect, alt, image, poster }) {
      return { title: alt || "(no alt)", subtitle: `${kind ?? "?"} · ${aspect ?? "?"}`, media: image ?? poster };
    },
  },
});
