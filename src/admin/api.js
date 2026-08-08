export class ApiError extends Error {
  constructor(status, data) {
    super(data?.error || `Request failed (${status})`);
    this.status = status;
    this.data = data;
  }
}

async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;
  if (!res.ok) {
    throw new ApiError(res.status, data);
  }
  return data;
}

export function login(password) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}

export function logout() {
  return request("/auth/logout", { method: "POST" });
}

export function getSession() {
  return request("/auth/session");
}

export function getContent(type) {
  return request(`/content/${type}`);
}

export function putContent(type, body) {
  return request(`/content/${type}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}
