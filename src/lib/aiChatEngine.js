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
// AiChatPanel and Terminal can both be mid-download of the same model at
// once (their model selection is synced — see aiModels.js), but only
// whichever of them called getEngine() first actually creates the
// CreateWebWorkerMLCEngine call, so its initProgressCallback is the only
// one WebLLM ever invokes. Fan progress out to every caller instead, keyed
// by model id, so a caller that shows up mid-download still sees it move.
const progressListeners = new Map(); // modelId -> Set<onProgress>
const lastProgress = new Map(); // modelId -> most recent report, for late subscribers

function notifyProgress(modelId, report) {
  lastProgress.set(modelId, report);
  progressListeners.get(modelId)?.forEach((listener) => listener(report));
}

function clearProgress(modelId) {
  progressListeners.delete(modelId);
  lastProgress.delete(modelId);
}

export function isWebGpuSupported() {
  return typeof navigator !== "undefined" && !!navigator.gpu;
}

export function isEngineReady(modelId) {
  return enginePromises.has(modelId);
}

export function getEngine(modelId, onProgress) {
  if (onProgress) {
    if (!progressListeners.has(modelId)) progressListeners.set(modelId, new Set());
    progressListeners.get(modelId).add(onProgress);
    // Replay the latest report immediately so a caller that starts
    // watching mid-download doesn't sit on "Starting…" until the next chunk.
    const last = lastProgress.get(modelId);
    if (last) onProgress(last);
  }

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
          { initProgressCallback: (report) => notifyProgress(modelId, report) },
        ),
      )
      .then((engine) => {
        clearProgress(modelId);
        return engine;
      })
      .catch((err) => {
        // Let the next call retry instead of permanently caching a failure.
        enginePromises.delete(modelId);
        clearProgress(modelId);
        throw err;
      });
    enginePromises.set(modelId, promise);
  }
  return enginePromises.get(modelId);
}
