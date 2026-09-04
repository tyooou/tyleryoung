// Runs entirely in the visitor's browser via WebGPU (@mlc-ai/web-llm) — no
// API key, no server, no rate limit, genuinely free. Trade-off is a
// one-time model download (cached by the browser after) and lower
// quality/speed than a hosted model.
//
// @mlc-ai/web-llm is dynamically imported (not a top-level import) so its
// JS is its own chunk, fetched only once a visitor actually opens the chat
// — everyone else's initial page load stays unaffected by it.

// Keyed by model id so switching models in the picker doesn't throw away
// one that's already loaded — switching back to it is then instant.
const enginePromises = new Map();

export function isWebGpuSupported() {
  return typeof navigator !== "undefined" && !!navigator.gpu;
}

export function isEngineReady(modelId) {
  return enginePromises.has(modelId);
}

export function getEngine(modelId, onProgress) {
  if (!enginePromises.has(modelId)) {
    const promise = import("@mlc-ai/web-llm")
      .then(({ CreateWebWorkerMLCEngine }) =>
        // Worker-hosted (see aiChatWorker.js) so generation never blocks
        // the main thread — that's what makes Stop/Esc actually land.
        CreateWebWorkerMLCEngine(
          new Worker(new URL("./aiChatWorker.js", import.meta.url), {
            type: "module",
          }),
          modelId,
          { initProgressCallback: onProgress },
        ),
      )
      .catch((err) => {
        // Let the next call retry instead of permanently caching a failure.
        enginePromises.delete(modelId);
        throw err;
      });
    enginePromises.set(modelId, promise);
  }
  return enginePromises.get(modelId);
}
