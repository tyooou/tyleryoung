import { createClient } from "@sanity/client";

export const sanityClient = createClient({
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID,
  dataset: import.meta.env.VITE_SANITY_DATASET || "production",
  useCdn: true,
  apiVersion: "2024-01-01",
});

// Sanity file/image assets carry their own CDN url on the resolved asset ->
// this just makes that explicit at call sites that pull it out of a GROQ result.
export function fileUrl(asset) {
  return asset?.url ?? null;
}
