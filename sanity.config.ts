"use client";

import { defineConfig } from "sanity";
import { muxInput } from "sanity-plugin-mux-input";
import { structureTool } from "sanity/structure";
import { apiVersion, dataset, projectId } from "./src/sanity/env";
import { schemaTypes } from "./src/sanity/schemaTypes";

export default defineConfig({
  name: "cylinder-gallery",
  title: "Cylinder Gallery",
  basePath: "/studio",
  projectId: projectId || "missing-project-id",
  dataset,
  apiVersion,
  schema: { types: schemaTypes },
  plugins: [structureTool(), muxInput()],
});
