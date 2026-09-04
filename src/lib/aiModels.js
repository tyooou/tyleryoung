// The models offered in the panel's picker. Sizes are WebLLM's own
// vram_required_MB for each record (not guesses) — that's what the device
// needs free to run it, and tracks the download closely enough to be the
// honest number to show someone before they commit to it.
export const MODELS = [
  {
    id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    label: "Llama 3.2 1B",
    sizeGb: 0.9,
    pro: "Smallest download, quickest to start",
    lowResource: true,
  },
  {
    id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
    label: "Qwen2.5 1.5B",
    sizeGb: 1.6,
    pro: "Good balance of size and accuracy",
    lowResource: true,
  },
  {
    id: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
    label: "Llama 3.2 3B",
    sizeGb: 2.2,
    pro: "Stronger reasoning, still runs on modest GPUs",
    lowResource: true,
  },
  {
    id: "Phi-3.5-mini-instruct-q4f16_1-MLC",
    label: "Phi-3.5 mini",
    sizeGb: 3.7,
    pro: "Best at staying on-topic and following instructions",
    lowResource: false,
  },
];

// Smallest model by default: a first-time visitor shouldn't be met with a
// multi-gigabyte download before their first reply. Anyone who wants
// better answers can move up the list, and that choice is remembered.
export const DEFAULT_MODEL_ID = "Llama-3.2-1B-Instruct-q4f16_1-MLC";

export function findModel(id) {
  return (
    MODELS.find((m) => m.id === id) ||
    MODELS.find((m) => m.id === DEFAULT_MODEL_ID) ||
    MODELS[0]
  );
}

// A stored id from an older build may no longer be in the list — fall back
// rather than handing WebLLM a model it can't resolve.
export function resolveModelId(id) {
  return MODELS.some((m) => m.id === id) ? id : DEFAULT_MODEL_ID;
}
