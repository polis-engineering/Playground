import { defineArrayMember, defineField, defineType } from "sanity";

export const MEDIA_MIN = 3;
export const MEDIA_MAX = 8;

export const galleryItem = defineType({
  name: "galleryItem",
  title: "Gallery item",
  type: "document",
  fields: [
    defineField({
      name: "title",
      description: "Used for accessibility and in the CMS; not rendered visibly in phase 1.",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "media",
      type: "array",
      of: [defineArrayMember({ type: "mediaAsset" })],
      validation: (rule) => rule.required().min(MEDIA_MIN).max(MEDIA_MAX),
    }),
  ],
  preview: {
    select: { title: "title", media: "media.0.image", count: "media.length" },
    prepare({ title, media }) {
      return { title, media };
    },
  },
});
