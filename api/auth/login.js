import { verifyPassword, createSessionCookie } from "../_lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const { password } = req.body || {};
  const valid = await verifyPassword(password);
  if (!valid) {
    return res.status(401).json({ error: "invalid_credentials" });
  }

  res.setHeader("Set-Cookie", await createSessionCookie());
  return res.status(200).json({ ok: true });
}
