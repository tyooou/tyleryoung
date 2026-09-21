#!/usr/bin/env node
// One-time setup for the Map tab: adds the "map" page doc, backfills
// lat/lng onto existing experience entries (matched by company — edit the
// coordinates below or in Sanity Studio if they're off), and seeds a handful
// of placeholder foodSpot docs so the tab has something to render before
// real NZ eats data is entered. Safe to re-run: everything is upserted by a
// deterministic _id or guarded with setIfMissing.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@sanity/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvFile(path.join(root, ".env.local"));
loadEnvFile(path.join(root, ".env"));

const { VITE_SANITY_PROJECT_ID, VITE_SANITY_DATASET, SANITY_WRITE_TOKEN } = process.env;
if (!VITE_SANITY_PROJECT_ID || !SANITY_WRITE_TOKEN) {
  console.error(
    "Missing VITE_SANITY_PROJECT_ID and/or SANITY_WRITE_TOKEN — set them in .env.local before running this script.",
  );
  process.exit(1);
}

const client = createClient({
  projectId: VITE_SANITY_PROJECT_ID,
  dataset: VITE_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: SANITY_WRITE_TOKEN,
  useCdn: false,
});

// Approximate coordinates, matched by company — good enough to place a pin,
// not surveyed. Correct in Sanity Studio any time.
const EXPERIENCE_COORDS = {
  WDCC: { lat: -36.8523, lng: 174.7683 },
  Marops: { lat: -36.8485, lng: 174.7633 },
  "Agile Workspace": { lat: -36.8595, lng: 174.7649 },
  Alimetry: { lat: -36.8697, lng: 174.7773 },
  "MOCYBORG Robotics": { lat: 31.2304, lng: 121.4737 },
};

async function backfillExperienceCoords() {
  const experiences = await client.fetch(`*[_type == "experience"]{_id, company}`);
  let patched = 0;
  for (const exp of experiences) {
    const coords = EXPERIENCE_COORDS[exp.company];
    if (!coords) continue;
    await client
      .patch(exp._id)
      .setIfMissing({ lat: coords.lat, lng: coords.lng })
      .commit();
    patched++;
  }
  console.log(`Checked ${experiences.length} experience entries, backfilled coordinates on ${patched}.`);
}

async function seedMapPage() {
  const pages = await client.fetch(`*[_type == "page"]{order}`);
  const nextOrder = pages.length ? Math.max(...pages.map((p) => p.order ?? 0)) + 1 : 0;
  const existing = await client.fetch(`*[_type == "page" && id == "map"][0]{_id}`);
  if (existing) {
    console.log('Page "map" already exists, skipping.');
    return;
  }
  await client.create({
    _type: "page",
    id: "map",
    label: "Map",
    icon: "map",
    enabled: true,
    order: nextOrder,
  });
  console.log(`Created "map" page doc at order ${nextOrder}.`);
}

// Placeholder NZ eats — swap the review/rating for the real thing whenever
// it's ready; these exist so the tab isn't empty in the meantime.
const PLACEHOLDER_EATS = [
  {
    title: "Ima Cuisine",
    city: "Auckland",
    lat: -36.8567,
    lng: 174.7584,
    rating: 5,
    review: "Placeholder review — swap for the real one. Korean-Japanese fusion on K Road, always packed for a reason.",
  },
  {
    title: "Kokako Organic Coffee",
    city: "Auckland",
    lat: -36.8636,
    lng: 174.7401,
    rating: 4,
    review: "Placeholder review — swap for the real one. Great flat white, laptop-friendly.",
  },
  {
    title: "Ombra",
    city: "Wellington",
    lat: -41.2939,
    lng: 174.7793,
    rating: 5,
    review: "Placeholder review — swap for the real one. Cicchetti and negronis on Cuba St.",
  },
  {
    title: "Fergburger",
    city: "Queenstown",
    lat: -45.0312,
    lng: 168.6626,
    rating: 4,
    review: "Placeholder review — swap for the real one. Queue is real, burger is realer.",
  },
  {
    title: "Atomic Coffee Roasters",
    city: "Christchurch",
    lat: -43.5321,
    lng: 172.6362,
    rating: 4,
    review: "Placeholder review — swap for the real one. Solid single-origin, roasted on site.",
  },
  {
    title: "The White House",
    city: "Wellington",
    lat: -41.2924,
    lng: 174.7772,
    rating: 5,
    review: "Placeholder review — swap for the real one. Old-school fine dining, worth the occasion.",
  },
];

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function seedFoodSpots() {
  let created = 0;
  for (const spot of PLACEHOLDER_EATS) {
    const slug = slugify(spot.title);
    const _id = `foodSpot-${slug}`;
    const result = await client.createIfNotExists({
      _id,
      _type: "foodSpot",
      name: { _type: "slug", current: slug },
      ...spot,
    });
    if (result._createdAt) created++;
  }
  console.log(`Seeded ${created} new placeholder food spots (${PLACEHOLDER_EATS.length - created} already existed).`);
}

// Airport coordinates (not city centers) for the flight-line overlay.
// Shanghai uses Hongqiao (SHA), not Pudong (PVG) — that's the airport the
// Guangzhou leg actually used. Auckland is seeded here too (coordinates
// matching MapCard's former hardcoded AUCKLAND_AIRPORT constant) so it's a
// normal visitedCity doc like every other pin, rather than a one-off object
// hardcoded separately in MapCard.jsx and the sidebar.
const VISITED_CITIES = [
  { city: "Auckland", country: "New Zealand", continent: "Oceania", lat: -37.0082, lng: 174.785 },
  { city: "Hong Kong", country: "Hong Kong", continent: "Asia", lat: 22.308, lng: 113.9185 },
  { city: "Hanoi", country: "Vietnam", continent: "Asia", lat: 21.2212, lng: 105.8072 },
  { city: "Shanghai", country: "China", continent: "Asia", lat: 31.1979, lng: 121.3363 },
  { city: "Guangzhou", country: "China", continent: "Asia", lat: 23.3924, lng: 113.2988 },
  { city: "Singapore", country: "Singapore", continent: "Asia", lat: 1.3644, lng: 103.9915 },
  { city: "Gold Coast", country: "Australia", continent: "Oceania", lat: -28.1644, lng: 153.505 },
  { city: "Melbourne", country: "Australia", continent: "Oceania", lat: -37.669, lng: 144.841 },
  { city: "Sydney", country: "Australia", continent: "Oceania", lat: -33.9399, lng: 151.1753 },
  { city: "Queenstown", country: "New Zealand", continent: "Oceania", lat: -45.0211, lng: 168.7392 },
  { city: "Dunedin", country: "New Zealand", continent: "Oceania", lat: -45.9281, lng: 170.198 },
  { city: "Wellington", country: "New Zealand", continent: "Oceania", lat: -41.3272, lng: 174.8053 },
];

async function seedVisitedCities() {
  // createOrReplace (not createIfNotExists) — coordinates here get
  // corrected from time to time (e.g. the Shanghai airport swap above), and
  // those edits should actually take on a re-run rather than being
  // silently skipped because the doc already exists.
  for (const entry of VISITED_CITIES) {
    const slug = slugify(entry.city);
    await client.createOrReplace({
      _id: `visitedCity-${slug}`,
      _type: "visitedCity",
      name: { _type: "slug", current: slug },
      ...entry,
    });
  }
  console.log(`Upserted ${VISITED_CITIES.length} visited cities.`);
}

// Explicit point-to-point legs, not a star out of Auckland — the actual
// trips weren't all direct from home (the Hanoi/Hong Kong/Singapore loop
// was its own thing, separate from the Guangzhou-Shanghai leg). Every name
// here must match a VISITED_CITIES `city` exactly, "Auckland" included.
const FLIGHT_LEGS = [
  { from: "Auckland", to: "Hong Kong" },
  { from: "Auckland", to: "Guangzhou" },
  { from: "Auckland", to: "Wellington" },
  { from: "Hanoi", to: "Singapore" },
  { from: "Hanoi", to: "Hong Kong" },
  { from: "Hong Kong", to: "Singapore" },
  { from: "Guangzhou", to: "Shanghai" },
  { from: "Auckland", to: "Gold Coast" },
  { from: "Auckland", to: "Melbourne" },
  { from: "Auckland", to: "Sydney" },
  { from: "Sydney", to: "Gold Coast" },
  { from: "Auckland", to: "Queenstown" },
  { from: "Auckland", to: "Dunedin" },
];

async function seedFlightLegs() {
  for (const leg of FLIGHT_LEGS) {
    const _id = `flightLeg-${slugify(leg.from)}-${slugify(leg.to)}`;
    await client.createOrReplace({ _id, _type: "flightLeg", ...leg });
  }
  console.log(`Upserted ${FLIGHT_LEGS.length} flight legs.`);
}

async function main() {
  await backfillExperienceCoords();
  await seedMapPage();
  await seedFoodSpots();
  await seedVisitedCities();
  await seedFlightLegs();
  console.log("\nDone. Review in Sanity Studio (/admin) — coordinates and eats data are placeholders.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
