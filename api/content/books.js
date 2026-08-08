import { createJsonFileHandler } from "../_lib/jsonRoute.js";

export default createJsonFileHandler({ path: "public/books.json", label: "books" });
