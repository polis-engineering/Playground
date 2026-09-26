import { NextStudio } from "next-sanity/studio";
import config from "../../../../sanity.config";
import { isSanityConfigured } from "@/sanity/env";

export const dynamic = "force-static";

export { metadata, viewport } from "next-sanity/studio";

export default function StudioPage() {
  if (!isSanityConfigured) {
    return (
      <main style={{ padding: 32, maxWidth: 640, lineHeight: 1.5 }}>
        <h1>Sanity Studio not configured</h1>
        <p>
          Set <code>NEXT_PUBLIC_SANITY_PROJECT_ID</code> and <code>NEXT_PUBLIC_SANITY_DATASET</code> (see{" "}
          <code>.env.example</code>) and add this origin to the project&apos;s CORS settings. The gallery runs on mock
          data until then.
        </p>
      </main>
    );
  }
  return <NextStudio config={config} />;
}
