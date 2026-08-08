import { getSession } from "../_lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const session = await getSession(req);
  return res.status(200).json({ authenticated: !!session });
}
