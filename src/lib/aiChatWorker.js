// Hosts the model in a Web Worker so token generation doesn't occupy the
// main thread. Running it inline meant the UI froze mid-reply, which in
// turn meant Stop/Esc couldn't be processed until generation had already
// finished — the interrupt only lands if the main thread is free to send
// it and the worker is free to receive it.
import { WebWorkerMLCEngineHandler } from "@mlc-ai/web-llm";

const handler = new WebWorkerMLCEngineHandler();
self.onmessage = (msg) => handler.onmessage(msg);
