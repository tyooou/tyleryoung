import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { serialize, parse } from "cookie";

const COOKIE_NAME = "cms_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("Missing SESSION_SECRET env var");
  return new TextEncoder().encode(secret);
}

export async function verifyPassword(password) {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash || typeof password !== "string" || password.length === 0) return false;
  return bcrypt.compare(password, hash);
}

export async function createSessionCookie() {
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .sign(getSecretKey());

  return serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export function clearSessionCookie() {
  return serialize(COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export async function getSession(req) {
  const cookies = parse(req.headers.cookie || "");
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload;
  } catch {
    return null;
  }
}

// Call at the top of any protected route. Writes a 401 and returns false if
// the caller isn't authenticated; returns true otherwise.
export async function requireAuth(req, res) {
  const session = await getSession(req);
  if (!session) {
    res.status(401).json({ error: "unauthorized" });
    return false;
  }
  return true;
}
