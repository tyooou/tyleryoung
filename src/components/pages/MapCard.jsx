import { useCallback, useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Plus, Minus, RotateCcw, Compass, Settings, Globe } from "lucide-react";
import CustomScrollbar from "../CustomScrollbar";
import StatTile from "../StatTile";
import HeaderTooltip from "../HeaderTooltip";

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY;
// Used both as the map's initial center and as the fixed anchor the
// default overview fits bounds around — a fixed point rather than an
// average of food-spot coordinates, which would drift toward whichever
// other NZ cities happen to be reviewed instead of staying on Auckland.
const AUCKLAND_CENTER = [174.7633, -36.8485];

// maplibre-gl works out its own worker script's URL at runtime from
// import.meta.url rather than a static `new URL(...)` Vite can see, so the
// bundler never picks up dist/maplibre-gl-worker.mjs (or the
// maplibre-gl-shared.mjs it in turn imports) as an asset — the browser 404s
// fetching it otherwise. Both files are vendored verbatim into public/
// (checked-in build output of this exact maplibre-gl version — re-copy them
// from node_modules/maplibre-gl/dist/ if the package is ever upgraded) and
// served unprocessed from there, so the worker's own relative import of its
// shared chunk keeps resolving correctly right next to it.
maplibregl.setWorkerUrl("/maplibre-gl/maplibre-gl-worker.mjs");

// Every color in the style below is read from the theme's own CSS custom
// properties (not hardcoded) so the basemap recolors itself on every theme
// this site has, not just the ones we happened to test against.
function cssVar(name) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

// A deliberately small, hand-authored style rather than one of MapTiler's
// premade ones — a premade style ships dozens of layers with their own
// fixed palette, and overriding all of them to track theme tokens is more
// fragile than just drawing the handful of layers this map actually needs.
function buildStyle() {
  return {
    version: 8,
    sources: {
      openmaptiles: {
        type: "vector",
        url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${MAPTILER_KEY}`,
      },
    },
    glyphs: `https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=${MAPTILER_KEY}`,
    layers: [
      {
        // Acts as the land color — OpenMapTiles has no single "land" fill,
        // land is just whatever isn't drawn over by water/landcover. This
        // must NOT be --bg: that's the exact token the surrounding content
        // pane's own background already uses (see PaneView.jsx), so any
        // view that's mostly/entirely land — extremely likely once zoomed
        // into a city — would paint a flat color identical to the page
        // around it and look like nothing rendered at all. --bg-secondary
        // keeps the map reading as its own distinct surface regardless of
        // how much water happens to be in frame.
        id: "background",
        type: "background",
        paint: { "background-color": cssVar("--bg-secondary") },
      },
      {
        id: "landcover",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "landcover",
        paint: { "fill-color": cssVar("--bg-tertiary"), "fill-opacity": 1 },
      },
      {
        // Wood/grass/farmland etc, tinted with the theme's "easy" green so
        // green space actually reads as green instead of the same flat
        // neutral as every other land pixel.
        id: "landcover-green",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "landcover",
        filter: [
          "in",
          ["get", "class"],
          [
            "literal",
            [
              "wood",
              "forest",
              "grass",
              "grassland",
              "wetland",
              "farmland",
              "crop",
            ],
          ],
        ],
        paint: {
          "fill-color": cssVar("--difficulty-easy"),
          "fill-opacity": 0.22,
        },
      },
      {
        // Dedicated parks/gardens/cemeteries get a stronger tint than
        // general landcover so they stand out from raw grassland.
        id: "landuse-park",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "landuse",
        filter: [
          "in",
          ["get", "class"],
          [
            "literal",
            ["park", "garden", "cemetery", "recreation_ground", "pitch"],
          ],
        ],
        paint: {
          "fill-color": cssVar("--difficulty-easy"),
          "fill-opacity": 0.3,
        },
      },
      {
        // Built-up land gets a faint accent wash so cities read as distinct
        // patches rather than the map looking uniformly empty until zoomed
        // in on the building layer.
        id: "landuse-urban",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "landuse",
        filter: [
          "in",
          ["get", "class"],
          ["literal", ["residential", "commercial", "industrial", "retail"]],
        ],
        paint: { "fill-color": cssVar("--accent"), "fill-opacity": 0.1 },
      },
      {
        id: "water",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "water",
        // --bg-quaternary rather than --bg-tertiary (which landcover already
        // uses) so coastlines read at a glance instead of blending into land.
        // Outline uses --text-secondary, not --border-secondary — half this
        // site's themes (nord, cobalt2, rose-pine, catppuccin-mocha,
        // tokyo-night) define --border-secondary as literally the same hex
        // as --bg-quaternary, which would make the outline invisible there.
        paint: {
          "fill-color": cssVar("--bg-quaternary"),
          "fill-outline-color": cssVar("--text-secondary"),
        },
      },
      {
        id: "waterway",
        type: "line",
        source: "openmaptiles",
        "source-layer": "waterway",
        paint: {
          "line-color": cssVar("--bg-quaternary"),
          "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.4, 14, 1.6],
        },
      },
      {
        // Only shows up once tiles carry building geometry (roughly z13+),
        // so it doesn't cost anything at the country/region zooms this map
        // spends most of its time at.
        id: "building",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "building",
        minzoom: 13,
        // Off by default (matches showBuildings' initial state below) — the
        // layer-toggle effect flips this once the map's loaded, but setting
        // it here too avoids a flash-visible-then-hidden frame at load.
        layout: { visibility: "none" },
        paint: {
          "fill-color": cssVar("--accent-secondary"),
          "fill-opacity": 0.45,
          "fill-outline-color": cssVar("--accent"),
        },
      },
      {
        id: "boundary",
        type: "line",
        source: "openmaptiles",
        "source-layer": "boundary",
        filter: ["<=", ["get", "admin_level"], 2],
        paint: {
          "line-color": cssVar("--border-secondary"),
          "line-width": 0.8,
        },
      },
      {
        // Roads are split into a colored hierarchy (motorways/trunks pull
        // the strongest accent, primary/secondary a softer one, everything
        // else stays neutral) instead of one flat line color for the whole
        // network — otherwise a dense road area was the single biggest
        // contributor to the map looking monotone.
        id: "transportation-minor",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        filter: [
          "!",
          [
            "in",
            ["get", "class"],
            ["literal", ["motorway", "trunk", "primary", "secondary"]],
          ],
        ],
        paint: {
          "line-color": cssVar("--border-secondary"),
          "line-width": ["interpolate", ["linear"], ["zoom"], 5, 0.2, 14, 1.4],
        },
      },
      {
        id: "transportation-major",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        filter: ["in", ["get", "class"], ["literal", ["primary", "secondary"]]],
        paint: {
          "line-color": cssVar("--accent-secondary"),
          "line-width": ["interpolate", ["linear"], ["zoom"], 5, 0.4, 14, 2.4],
        },
      },
      {
        id: "transportation-highway",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        filter: ["in", ["get", "class"], ["literal", ["motorway", "trunk"]]],
        paint: {
          "line-color": cssVar("--accent"),
          "line-width": ["interpolate", ["linear"], ["zoom"], 5, 0.6, 14, 3.2],
        },
      },
      {
        id: "place-label",
        type: "symbol",
        source: "openmaptiles",
        "source-layer": "place",
        filter: [
          "in",
          ["get", "class"],
          ["literal", ["country", "city", "town"]],
        ],
        layout: {
          "text-field": ["coalesce", ["get", "name:latin"], ["get", "name"]],
          // Symbol-layer text is rendered from glyph tiles MapLibre fetches
          // from MapTiler's fonts API (the `glyphs` URL above), not styled
          // via CSS — var(--font-mono) can't reach it. "Roboto Mono
          // Regular" is in MapTiler's font catalog; "Noto Sans Regular"
          // stays listed after it as a fallback for any glyph MapLibre
          // can't resolve in the mono stack.
          "text-font": ["Roboto Mono Regular", "Noto Sans Regular"],
          "text-size": 11,
        },
        paint: {
          "text-color": cssVar("--text-secondary"),
          "text-halo-color": cssVar("--bg"),
          "text-halo-width": 1.2,
        },
      },
    ],
  };
}

// Layer id -> [paint property, css var] — walked on every theme change so an
// already-loaded map recolors in place instead of reloading the whole style
// (which would flash and re-fetch every tile).
const THEME_PAINT = [
  ["background", "background-color", "--bg-secondary"],
  ["landcover", "fill-color", "--bg-tertiary"],
  ["landcover-green", "fill-color", "--difficulty-easy"],
  ["landuse-park", "fill-color", "--difficulty-easy"],
  ["landuse-urban", "fill-color", "--accent"],
  ["water", "fill-color", "--bg-quaternary"],
  ["water", "fill-outline-color", "--text-secondary"],
  ["waterway", "line-color", "--bg-quaternary"],
  ["building", "fill-color", "--accent-secondary"],
  ["building", "fill-outline-color", "--accent"],
  ["boundary", "line-color", "--border-secondary"],
  ["transportation-minor", "line-color", "--border-secondary"],
  // transportation-major/highway are deliberately absent here — their color
  // depends on the "colorful roads" setting too, not just the theme, so
  // they're re-applied from the settings effect below and from this
  // observer's own callback rather than this static table.
  ["flight-lines", "line-color", "--accent"],
  ["place-label", "text-color", "--text-secondary"],
  ["place-label", "text-halo-color", "--bg"],
];

// Shared by the "colorful roads" setting effect and the theme-retint
// observer, since both need to decide the same thing: accent hierarchy vs.
// flattened to the same neutral color the minor-road layer already uses.
function applyRoadColors(map, colorful) {
  const majorColor = cssVar(
    colorful ? "--accent-secondary" : "--border-secondary",
  );
  const highwayColor = cssVar(colorful ? "--accent" : "--border-secondary");
  if (map.getLayer("transportation-major"))
    map.setPaintProperty("transportation-major", "line-color", majorColor);
  if (map.getLayer("transportation-highway"))
    map.setPaintProperty("transportation-highway", "line-color", highwayColor);
}

// Spherical interpolation (slerp) between two [lng, lat] points along the
// great-circle path between them — a plain straight LineString between two
// far-apart points would draw the wrong path once reprojected onto the
// map's Mercator grid, so intermediate points are computed along the
// geodesic itself instead.
function greatCircleLine([lng1, lat1], [lng2, lat2], segments = 48) {
  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;
  const phi1 = toRad(lat1);
  const lambda1 = toRad(lng1);
  const phi2 = toRad(lat2);
  const lambda2 = toRad(lng2);
  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin((phi2 - phi1) / 2) ** 2 +
          Math.cos(phi1) *
            Math.cos(phi2) *
            Math.sin((lambda2 - lambda1) / 2) ** 2,
      ),
    );
  if (d === 0)
    return [
      [lng1, lat1],
      [lng2, lat2],
    ];
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const f = i / segments;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x =
      A * Math.cos(phi1) * Math.cos(lambda1) +
      B * Math.cos(phi2) * Math.cos(lambda2);
    const y =
      A * Math.cos(phi1) * Math.sin(lambda1) +
      B * Math.cos(phi2) * Math.sin(lambda2);
    const z = A * Math.sin(phi1) + B * Math.sin(phi2);
    const phi = Math.atan2(z, Math.sqrt(x * x + y * y));
    const lambda = Math.atan2(y, x);
    points.push([toDeg(lambda), toDeg(phi)]);
  }
  return points;
}

function ratingStars(rating) {
  return "★".repeat(rating) + "☆".repeat(Math.max(0, 5 - rating));
}

const PIN_ICONS = {
  food: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="11" height="11"><path d="M3 2v7c0 1.1.9 2 2 2h1v11"/><path d="M9 2v20"/><path d="M15 2c-1 3-1 5 0 7s3 2 3 2v11"/></svg>',
  work: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="11" height="11"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
  airport:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="11" height="11"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>',
};

function makePinElement(kind) {
  const el = document.createElement("div");
  el.className = "map-pin";
  el.innerHTML = `
    <div class="map-pin-dot map-pin-dot--${kind}">
      ${PIN_ICONS[kind]}
    </div>
    <div class="map-pin-bridge"></div>`;
  return el;
}

// titleTab, when given, renders the title as a clickable link (handled via
// event delegation in the "popup links" effect below, since popup content
// is raw HTML the map injects into the DOM — not React) that opens the
// given tab id instead of a plain heading.
function popupHtml(title, sub, extra, titleTab) {
  const titleHtml = titleTab
    ? `<div class="map-popup-title map-popup-link" data-tab="${titleTab}">${title}</div>`
    : `<div class="map-popup-title">${title}</div>`;
  return `
    <div class="map-popup">
      ${titleHtml}
      ${sub ? `<div class="map-popup-sub">${sub}</div>` : ""}
      ${extra || ""}
    </div>`;
}

// Wires a pin's hover-to-show/click-to-zoom behavior, including the
// invisible ".map-pin-bridge" triangle (tip at the pin, base under the
// popup) that keeps the popup open while the cursor travels the gap between
// them — without it, moving the mouse up from the pin toward the popup (e.g.
// to click the company-name link) crosses dead map space and closes the
// popup before it arrives.
function wirePinHoverAndClick(map, el, popup, lngLat) {
  const bridge = el.querySelector(".map-pin-bridge");
  const showPopup = () => {
    if (!popup.isOpen()) popup.setLngLat(lngLat).addTo(map);
    // Only hoverable while the popup's actually open — otherwise this
    // triangle would sit on top of the map (and its drag-to-pan handling)
    // above every idle pin all the time.
    bridge.style.pointerEvents = "auto";
  };
  const hidePopup = () => {
    popup.remove();
    bridge.style.pointerEvents = "none";
  };
  el.addEventListener("mouseenter", showPopup);
  el.addEventListener("mouseleave", hidePopup);
  bridge.addEventListener("mouseenter", showPopup);
  bridge.addEventListener("mouseleave", hidePopup);
  // The popup's own content is a separate DOM node the map injects lazily —
  // only reachable once it's actually been opened at least once.
  popup.on("open", () => {
    const popupEl = popup.getElement();
    popupEl.addEventListener("mouseenter", showPopup);
    popupEl.addEventListener("mouseleave", hidePopup);
  });
  // Click only zooms — it deliberately doesn't touch the popup, which is
  // hover-only (showPopup/hidePopup above).
  el.addEventListener("click", () => {
    map.flyTo({ center: lngLat, zoom: 14, duration: 900, essential: true });
  });
}

function MapCard({
  experiences = [],
  foodSpots = [],
  visitedCities = [],
  flightLegs = [],
  mapFocus,
  openWithPhotos,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const settingsRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showBuildings, setShowBuildings] = useState(false);
  const [showLandColor, setShowLandColor] = useState(true);
  const [showRoadColors, setShowRoadColors] = useState(false);
  const [showWorkPins, setShowWorkPins] = useState(true);
  const [showFoodPins, setShowFoodPins] = useState(true);
  const [showFlights, setShowFlights] = useState(true);
  const showRoadColorsRef = useRef(showRoadColors);

  const worked = experiences.filter(
    (exp) => typeof exp.lat === "number" && typeof exp.lng === "number",
  );

  // ---- init / teardown ----
  useEffect(() => {
    if (!MAPTILER_KEY || !containerRef.current) return;
    let map;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: buildStyle(),
        center: AUCKLAND_CENTER,
        zoom: 4,
        attributionControl: { compact: true },
      });
    } catch (err) {
      // WebGL init failures throw synchronously out of the constructor
      // itself, rather than surfacing through the "error" event below —
      // without this, that case is just a silent blank container.
      console.error("maplibre-gl failed to initialize:", err);
      setMapError({ message: err?.message || String(err) });
      return;
    }
    // Not MapLibre's built-in NavigationControl — its icon is a hardcoded
    // dark-gray (#333) raster baked into maplibre-gl.css, not theme-aware,
    // so it's nearly invisible against any dark theme. Themed buttons are
    // rendered in JSX below instead, calling map.zoomIn()/zoomOut() directly.
    map.on("load", () => setMapLoaded(true));
    // MapLibre only auto-resizes on the window's own resize event — it has
    // no way to know the container changed size for any other reason (this
    // sits inside a flex/scroll layout whose own size can settle a moment
    // after mount). Without this, the canvas can get stuck at whatever
    // (possibly 0x0) size it happened to see at construction time.
    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);
    // MapLibre swallows tile/style-fetch failures into an "error" event
    // rather than rejecting anything awaitable — without this, a bad key or
    // a referrer-restricted key (it works from the real domain, 403s from
    // localhost) just leaves a blank map with no signal why.
    map.on("error", (e) => {
      console.error("maplibre-gl error event:", e.error);
      setMapError(
        (prev) =>
          prev ?? { status: e.error?.status, message: e.error?.message },
      );
    });
    mapRef.current = map;
    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      setMapLoaded(false);
      setMapError(null);
    };
  }, []);

  // ---- re-tint the basemap whenever the site theme changes ----
  useEffect(() => {
    if (!mapLoaded) return;
    const map = mapRef.current;
    if (!map) return;
    const observer = new MutationObserver(() => {
      for (const [layerId, prop, varName] of THEME_PAINT) {
        if (map.getLayer(layerId))
          map.setPaintProperty(layerId, prop, cssVar(varName));
      }
      applyRoadColors(map, showRoadColorsRef.current);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [mapLoaded]);

  // ---- "colorful roads" setting — also re-applied by the theme observer
  // above (via showRoadColorsRef) so a theme switch doesn't snap roads back
  // to their accent color while this setting is off. ----
  useEffect(() => {
    showRoadColorsRef.current = showRoadColors;
    if (!mapLoaded || !mapRef.current) return;
    applyRoadColors(mapRef.current, showRoadColors);
  }, [showRoadColors, mapLoaded]);

  // ---- buildings / land-color layer toggles ----
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current;
    if (map.getLayer("building")) {
      map.setLayoutProperty(
        "building",
        "visibility",
        showBuildings ? "visible" : "none",
      );
    }
  }, [showBuildings, mapLoaded]);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current;
    const visibility = showLandColor ? "visible" : "none";
    ["landcover-green", "landuse-park", "landuse-urban"].forEach((id) => {
      if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", visibility);
    });
  }, [showLandColor, mapLoaded]);

  // ---- flight lines: great-circle routes along each explicit flightLeg
  // (not a star out of Auckland — some legs are city-to-city, e.g. the
  // Hanoi/Hong Kong/Singapore loop). Airport dots are real pin markers
  // (added in the markers effect below), not a layer, so this only handles
  // the arcs. Source/layer created once and its data updated in place
  // afterward (rather than being part of buildStyle()) since this data
  // arrives asynchronously from Sanity, after the map's already
  // constructed. ----
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current;

    const resolveCity = (name) => {
      const match = visitedCities.find((c) => c.city === name);
      return match &&
        typeof match.lat === "number" &&
        typeof match.lng === "number"
        ? [match.lng, match.lat]
        : null;
    };

    const linesGeoJSON = {
      type: "FeatureCollection",
      features: flightLegs
        .map((leg) => ({
          ...leg,
          fromCoords: resolveCity(leg.from),
          toCoords: resolveCity(leg.to),
        }))
        .filter((leg) => leg.fromCoords && leg.toCoords)
        .map((leg) => ({
          type: "Feature",
          properties: { from: leg.from, to: leg.to },
          geometry: {
            type: "LineString",
            coordinates: greatCircleLine(leg.fromCoords, leg.toCoords),
          },
        })),
    };

    const linesSource = map.getSource("flight-lines");
    if (linesSource) {
      linesSource.setData(linesGeoJSON);
    } else {
      map.addSource("flight-lines", { type: "geojson", data: linesGeoJSON });
      // Inserted before place-label so routes sit above the basemap/roads
      // but don't cover city name text.
      map.addLayer(
        {
          id: "flight-lines",
          type: "line",
          source: "flight-lines",
          layout: { "line-cap": "round" },
          paint: {
            "line-color": cssVar("--accent"),
            "line-width": 1.3,
            "line-dasharray": [1, 1.6],
            "line-opacity": 0.85,
          },
        },
        "place-label",
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded, visitedCities.length, flightLegs.length]);

  // ---- "flight paths" layer toggle (lines only — airport pin visibility
  // is handled by the pin-visibility effect alongside work/food) ----
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current;
    if (map.getLayer("flight-lines")) {
      map.setLayoutProperty(
        "flight-lines",
        "visibility",
        showFlights ? "visible" : "none",
      );
    }
  }, [showFlights, mapLoaded]);

  // ---- markers ----
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current;
    // Popups aren't bound to their marker via setPopup() (see below), so
    // removing the marker alone wouldn't also close a popup left open.
    markersRef.current.forEach(({ marker, popup }) => {
      marker.remove();
      popup.remove();
    });
    markersRef.current = [];

    // Popups are shown/hidden manually (mouseenter/mouseleave/click) below
    // rather than via marker.setPopup()'s automatic click-toggle binding —
    // that would fight with the click handler's own flyTo, closing the
    // popup on the same click that's supposed to zoom in on it.
    worked.forEach((exp) => {
      const el = makePinElement("work");
      const lngLat = [exp.lng, exp.lat];
      // openWithPhotos (not a plain tab id) decides for itself whether to
      // also split-open a photos tab — same "slug" either way.
      const popup = new maplibregl.Popup({
        offset: 20,
        closeButton: false,
      }).setHTML(popupHtml(exp.company, exp.location, null, exp.slug));
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(lngLat)
        .addTo(map);
      wirePinHoverAndClick(map, el, popup, lngLat);
      markersRef.current.push({ marker, kind: "work", popup });
    });

    foodSpots.forEach((spot) => {
      const el = makePinElement("food");
      const lngLat = [spot.lng, spot.lat];
      const popup = new maplibregl.Popup({
        offset: 20,
        closeButton: false,
      }).setHTML(
        popupHtml(
          `${spot.title}<span class="map-popup-stars">${ratingStars(spot.rating)}</span>`,
          `${spot.city ? `${spot.city}, NZ` : ""}`,
          `${
            spot.review
              ? `<div class="map-popup-review">${spot.review}</div>`
              : ""
          }`,
        ),
      );
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(lngLat)
        .addTo(map);
      wirePinHoverAndClick(map, el, popup, lngLat);
      markersRef.current.push({ marker, kind: "food", popup });
    });

    visitedCities.forEach((airport) => {
      if (typeof airport.lat !== "number" || typeof airport.lng !== "number")
        return;
      const el = makePinElement("airport");
      const lngLat = [airport.lng, airport.lat];
      const popup = new maplibregl.Popup({
        offset: 20,
        closeButton: false,
      }).setHTML(popupHtml(airport.city, airport.country));
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(lngLat)
        .addTo(map);
      wirePinHoverAndClick(map, el, popup, lngLat);
      markersRef.current.push({
        marker,
        kind: "airport",
        popup,
        slug: airport.slug,
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded, worked.length, foodSpots.length, visitedCities.length]);

  // ---- work / food / airport pin toggles — runs after the marker-rebuild
  // effect above on the same commit (declared later), so it also covers
  // markers that were just (re)created. ----
  useEffect(() => {
    markersRef.current.forEach(({ marker, kind }) => {
      const visible =
        kind === "food"
          ? showFoodPins
          : kind === "airport"
            ? showFlights
            : showWorkPins;
      marker.getElement().style.display = visible ? "" : "none";
    });
  }, [
    showWorkPins,
    showFoodPins,
    showFlights,
    mapLoaded,
    worked.length,
    foodSpots.length,
    visitedCities.length,
  ]);

  // ---- default overview: always anchored on Auckland, not a computed
  // average of whatever NZ cities happen to have food spots ----
  const flyToOverview = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const allPoints = [
      ...worked.map((e) => [e.lng, e.lat]),
      ...foodSpots.map((f) => [f.lng, f.lat]),
    ];
    // Only pull in points actually within the Auckland region — a wider
    // radius would drag in pins from other NZ cities (Wellington,
    // Christchurch, ...) or far-flung overseas roles and force fitBounds to
    // zoom out to fit them, when the overview should stay on Auckland
    // itself. ~1 degree keeps greater Auckland (North Shore, West/South/East
    // Auckland) in frame while excluding Hamilton (~1.1° south) and beyond.
    const [anchorLng, anchorLat] = AUCKLAND_CENTER;
    const NEARBY_DEGREES = 1;
    const nearby = allPoints.filter(
      ([lng, lat]) =>
        Math.abs(lng - anchorLng) < NEARBY_DEGREES &&
        Math.abs(lat - anchorLat) < NEARBY_DEGREES,
    );
    if (nearby.length === 0) {
      map.flyTo({ center: AUCKLAND_CENTER, zoom: 10, duration: 800 });
      return;
    }
    if (nearby.length === 1) {
      map.flyTo({ center: nearby[0], zoom: 10, duration: 800 });
      return;
    }
    const bounds = nearby.reduce(
      (b, p) => b.extend(p),
      new maplibregl.LngLatBounds(nearby[0], nearby[0]),
    );
    map.fitBounds(bounds, { padding: 56, duration: 800, maxZoom: 12 });
  }, [worked, foodSpots]);

  // ---- "global view" — fits every airport in the flight network into
  // frame at once, unlike flyToOverview which deliberately stays tight on
  // Auckland. ----
  const flyToGlobalView = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const points = visitedCities
      .filter((c) => typeof c.lat === "number" && typeof c.lng === "number")
      .map((c) => [c.lng, c.lat]);
    // Unlike before, Auckland is no longer a guaranteed hardcoded first
    // entry — points can be genuinely empty if visitedCities hasn't loaded
    // (or failed to fetch) yet, which would otherwise crash LngLatBounds.
    if (points.length === 0) return;
    const bounds = points.reduce(
      (b, p) => b.extend(p),
      new maplibregl.LngLatBounds(points[0], points[0]),
    );
    map.fitBounds(bounds, { padding: 48, duration: 1000, maxZoom: 4 });
  }, [visitedCities]);

  // ---- fly / fit in response to sidebar selection ----
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    if (!mapFocus) {
      flyToOverview();
      return;
    }

    const map = mapRef.current;
    const target =
      mapFocus.type === "experience"
        ? worked.find((e) => e.slug === mapFocus.slug)
        : mapFocus.type === "food"
          ? foodSpots.find((f) => f.slug === mapFocus.slug)
          : mapFocus.type === "airport"
            ? visitedCities.find((c) => c.slug === mapFocus.slug)
            : null;
    if (!target) return;
    map.flyTo({
      center: [target.lng, target.lat],
      zoom: 14,
      duration: 900,
      essential: true,
    });

    const found = markersRef.current.find(({ marker }) => {
      const { lng, lat } = marker.getLngLat();
      return lng === target.lng && lat === target.lat;
    });
    found?.popup.setLngLat([target.lng, target.lat]).addTo(map);
  }, [mapFocus, mapLoaded, worked, foodSpots, visitedCities, flyToOverview]);

  // ---- popup "company name" links — event-delegated on the map container
  // since popup content is raw HTML the map injects itself, not React ----
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !openWithPhotos) return;
    const container = mapRef.current.getContainer();
    const handleClick = (e) => {
      const link = e.target.closest(".map-popup-link");
      if (link?.dataset.tab) openWithPhotos(link.dataset.tab);
    };
    container.addEventListener("click", handleClick);
    return () => container.removeEventListener("click", handleClick);
  }, [mapLoaded, openWithPhotos]);

  // ---- close the settings popover on an outside click ----
  useEffect(() => {
    if (!settingsOpen) return;
    const handleClick = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [settingsOpen]);

  const countries = new Set(
    [
      ...experiences.map((e) => e.location?.split(",").pop()?.trim()),
      ...visitedCities.map((c) => c.country?.trim()),
    ]
      .filter(Boolean)
      .map((c) => c.toLowerCase()),
  ).size;
  const avgRating = foodSpots.length
    ? (
        foodSpots.reduce((sum, f) => sum + f.rating, 0) / foodSpots.length
      ).toFixed(1)
    : "—";

  return (
    <CustomScrollbar className="p-3 sm:p-5 font-mono select-none cursor-default">
      <div className="flex flex-col">
        <h2 className="font-bold text-5xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
          Map.
        </h2>
        <p className="text-base md:text-xl mt-3 ml-2">
          Everywhere I've worked, favourite places, and countries I've
          travelled!
        </p>

        <div className="ml-2 mt-6">
          <ul className="flex flex-wrap gap-8 mb-10">
            <StatTile label="Places Worked" value={experiences.length} />
            <StatTile label="Countries" value={countries} />
            <StatTile label="Spot Reviewed" value={foodSpots.length} />
            <StatTile
              label="Avg Rating"
              value={avgRating === "—" ? "—" : `${avgRating}`}
            />
          </ul>

          <div
            className="relative border border-[var(--border-secondary)] rounded overflow-hidden"
            style={{ height: "min(58vh, 590px)", minHeight: 590 }}
          >
            {MAPTILER_KEY ? (
              <>
                <div
                  ref={containerRef}
                  className="absolute inset-0"
                  style={{ position: "absolute", inset: 0 }}
                />
                {/* No overflow-hidden here (unlike before) — a HeaderTooltip
                    inside one of these buttons has to escape this wrapper's
                    bounds to be visible, so the stack's rounded silhouette is
                    done via rounded-t/rounded-b on the end buttons instead. */}
                <div className="absolute top-2.5 left-2.5 flex flex-col rounded border border-[var(--border-secondary)] z-10">
                  <button
                    type="button"
                    aria-label="Zoom in"
                    onClick={() => mapRef.current?.zoomIn()}
                    className="group relative w-7 h-7 flex items-center justify-center rounded-t bg-[var(--bg)] text-[var(--text)] border-b border-[var(--border-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--accent)] cursor-pointer"
                  >
                    <Plus size={14} />
                    <HeaderTooltip side="right">
                      <span className="text-[var(--text)]">Zoom in</span>
                    </HeaderTooltip>
                  </button>
                  <button
                    type="button"
                    aria-label="Zoom out"
                    onClick={() => mapRef.current?.zoomOut()}
                    className="group relative w-7 h-7 flex items-center justify-center bg-[var(--bg)] text-[var(--text)] border-b border-[var(--border-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--accent)] cursor-pointer"
                  >
                    <Minus size={14} />
                    <HeaderTooltip side="right">
                      <span className="text-[var(--text)]">Zoom out</span>
                    </HeaderTooltip>
                  </button>
                  <button
                    type="button"
                    aria-label="Reset view"
                    onClick={() => flyToOverview()}
                    className="group relative w-7 h-7 flex items-center justify-center bg-[var(--bg)] text-[var(--text)] border-b border-[var(--border-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--accent)] cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    <HeaderTooltip side="right">
                      <span className="text-[var(--text)]">Reset view</span>
                    </HeaderTooltip>
                  </button>
                  <button
                    type="button"
                    aria-label="Reset bearing to north"
                    onClick={() =>
                      mapRef.current?.easeTo({
                        bearing: 0,
                        pitch: 0,
                        duration: 400,
                      })
                    }
                    className="group relative w-7 h-7 flex items-center justify-center border-b border-[var(--border-secondary)] bg-[var(--bg)] text-[var(--text)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--accent)] cursor-pointer"
                  >
                    <Compass size={14} />
                    <HeaderTooltip side="right">
                      <span className="text-[var(--text)]">
                        Reset bearing to north
                      </span>
                    </HeaderTooltip>
                  </button>
                  <button
                    type="button"
                    aria-label="Global view"
                    onClick={() => flyToGlobalView()}
                    className="group relative w-7 h-7 flex items-center justify-center rounded-b bg-[var(--bg)] text-[var(--text)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--accent)] cursor-pointer"
                  >
                    <Globe size={14} />
                    <HeaderTooltip side="right">
                      <span className="text-[var(--text)]">Global view</span>
                    </HeaderTooltip>
                  </button>
                </div>
                <div
                  ref={settingsRef}
                  className="absolute top-2.5 right-2.5 z-10"
                >
                  <button
                    type="button"
                    aria-label="Map settings"
                    aria-expanded={settingsOpen}
                    onClick={() => setSettingsOpen((o) => !o)}
                    className={`group relative w-7 h-7 flex items-center justify-center rounded border border-[var(--border-secondary)] bg-[var(--bg)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--accent)] cursor-pointer ${
                      settingsOpen
                        ? "text-[var(--accent)]"
                        : "text-[var(--text)]"
                    }`}
                  >
                    <Settings size={14} />
                    {!settingsOpen && (
                      <HeaderTooltip side="left">
                        <span className="text-[var(--text)]">Map settings</span>
                      </HeaderTooltip>
                    )}
                  </button>
                  {settingsOpen && (
                    <div className="absolute top-9 right-0 w-44 rounded border border-[var(--border-secondary)] bg-[var(--bg)] p-2.5 flex flex-col gap-1.5 text-xs">
                      <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide">
                        Layers
                      </p>
                      <label className="flex items-center gap-2 cursor-pointer hover:text-[var(--accent)]">
                        <input
                          type="checkbox"
                          checked={showBuildings}
                          onChange={() => setShowBuildings((v) => !v)}
                          className="accent-[var(--accent)] cursor-pointer"
                        />
                        Buildings
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer hover:text-[var(--accent)]">
                        <input
                          type="checkbox"
                          checked={showLandColor}
                          onChange={() => setShowLandColor((v) => !v)}
                          className="accent-[var(--accent)] cursor-pointer"
                        />
                        Parks &amp; land tint
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer hover:text-[var(--accent)]">
                        <input
                          type="checkbox"
                          checked={showRoadColors}
                          onChange={() => setShowRoadColors((v) => !v)}
                          className="accent-[var(--accent)] cursor-pointer"
                        />
                        Road colors
                      </label>
                      <div className="h-px bg-[var(--border-secondary)] my-0.5" />
                      <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide">
                        Pins
                      </p>
                      <label className="flex items-center gap-2 cursor-pointer hover:text-[var(--accent)]">
                        <input
                          type="checkbox"
                          checked={showWorkPins}
                          onChange={() => setShowWorkPins((v) => !v)}
                          className="accent-[var(--accent)] cursor-pointer"
                        />
                        Work
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer hover:text-[var(--accent)]">
                        <input
                          type="checkbox"
                          checked={showFoodPins}
                          onChange={() => setShowFoodPins((v) => !v)}
                          className="accent-[var(--accent)] cursor-pointer"
                        />
                        Food
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer hover:text-[var(--accent)]">
                        <input
                          type="checkbox"
                          checked={showFlights}
                          onChange={() => setShowFlights((v) => !v)}
                          className="accent-[var(--accent)] cursor-pointer"
                        />
                        Airports
                      </label>
                    </div>
                  )}
                </div>
                {mapError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[var(--bg-secondary)] text-center px-6 pointer-events-none">
                    <p className="text-sm font-bold">
                      Map tiles failed to load
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] max-w-sm">
                      {mapError.status === 403 ? (
                        <>
                          Got a 403 from MapTiler. Your key is likely
                          referrer-restricted to your production domain — add{" "}
                          <code className="px-1 rounded bg-[var(--bg-tertiary)]">
                            localhost
                          </code>{" "}
                          to its allowed origins at{" "}
                          <code className="px-1 rounded bg-[var(--bg-tertiary)]">
                            cloud.maptiler.com/account/keys
                          </code>{" "}
                          to test locally.
                        </>
                      ) : (
                        mapError.message || "Check the console for details."
                      )}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[var(--bg-secondary)] text-center px-6">
                <p className="text-sm font-bold">Map needs a MapTiler key</p>
                <p className="text-xs text-[var(--text-secondary)] max-w-sm">
                  Add{" "}
                  <code className="px-1 rounded bg-[var(--bg-tertiary)]">
                    VITE_MAPTILER_KEY
                  </code>{" "}
                  to your .env (free tier at maptiler.com) to render the live
                  map. The eats list below still works without it.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        /* maplibre-gl.css sets font:12px/20px Helvetica Neue,Arial,Helvetica,
           sans-serif directly on .maplibregl-map — the same element we
           override for positioning above — which every DOM text node inside
           the map (attribution, popups via their own font-family:inherit)
           picks up instead of the site's monospace font. !important since
           this is deliberately overriding a third-party stylesheet, not
           fighting an accidental cascade tie. */
        .maplibregl-map { font-family: var(--font-mono) !important; }
        /* MapLibre's attribution control also hardcodes near-black text/links
           (same non-theme-aware issue as the zoom control's icon) — recolor
           via theme tokens so it stays legible in dark themes too. */
        .maplibregl-ctrl-attrib {
          font-size: 10px;
          background: color-mix(in srgb, var(--bg) 78%, transparent) !important;
          color: var(--text-secondary) !important;
        }
        .maplibregl-ctrl-attrib a { color: var(--text-secondary) !important; }
        .maplibregl-ctrl-logo { font-size: 10px; }
        .map-pin { cursor: pointer; }
        .map-pin-dot {
          width: 24px; height: 24px; border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex; align-items: center; justify-content: center;
          border: 2px solid var(--bg);
          transition: transform 150ms cubic-bezier(0.16,1,0.3,1);
        }
        .map-pin-dot svg { transform: rotate(45deg); color: var(--bg); }
        /* --difficulty-hard/--difficulty-medium rather than
           --accent/--accent-secondary — those now paint the map itself
           (highways, buildings), so pins in that color used to disappear
           against them. Red/amber stay free of any map layer's palette. */
        .map-pin-dot--work { background: var(--difficulty-hard); }
        .map-pin-dot--food { background: var(--difficulty-medium); }
        .map-pin-dot--airport { background: var(--difficulty-easy); }
        .map-pin:hover .map-pin-dot { transform: rotate(-45deg) scale(1.15); }
        /* Invisible hover bridge: tip at the pin, base up toward the popup
           (which opens above, offset 20px). pointer-events toggled per-pin
           in JS — off while idle so it doesn't sit on top of map dragging. */
        .map-pin-bridge {
          position: absolute;
          left: 50%;
          bottom: 100%;
          width: 160px;
          height: 28px;
          transform: translateX(-50%);
          clip-path: polygon(50% 100%, 0 0, 100% 0);
          pointer-events: none;
        }
        .maplibregl-popup-content {
          background: var(--bg); color: var(--text);
          border: 1px solid var(--border-secondary); border-radius: 6px;
          font-family: inherit; padding: 10px 11px;
        }
        .maplibregl-popup-tip { display: none; }
        .map-popup-title { font-size: 12px; font-weight: 700; }
        .map-popup-link { cursor: pointer; text-decoration: underline; text-decoration-color: transparent; transition: color 120ms ease, text-decoration-color 120ms ease; }
        .map-popup-link:hover { color: var(--accent); text-decoration-color: var(--accent); }
        .map-popup-sub { font-size: 10px; color: var(--text-secondary); margin-top: 1px; }
        .map-popup-stars { font-size: 15px; color: var(--difficulty-medium); margin-left: 10px;}
        .map-popup-review { font-size: 10.5px; margin-top: 5px; line-height: 1.4; max-width: 180px; }
      `}</style>
    </CustomScrollbar>
  );
}

export default MapCard;
