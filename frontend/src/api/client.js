const SESSION_KEY = "assethub.session";

export function getStoredSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

export function saveSession(session) {
  const saved = {
    ...session,
    activeOrganizationId:
      session.activeOrganizationId || session.organizations?.[0]?.id || "",
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(saved));
  return saved;
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export async function api(path, options = {}) {
  const session = getStoredSession();
  const headers = new Headers(options.headers || {});
  if (session?.token) headers.set("Authorization", `Bearer ${session.token}`);
  if (session?.activeOrganizationId)
    headers.set("X-Organization-Id", session.activeOrganizationId);
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  let response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers,
      body:
        options.body &&
        typeof options.body !== "string" &&
        !(options.body instanceof FormData)
          ? JSON.stringify(options.body)
          : options.body,
    });
  } catch {
    throw new Error(
      "Could not reach AssetHub. Check your connection and try again.",
    );
  }
  const body =
    response.status === 204 ? null : await response.json().catch(() => null);
  if (
    response.status === 401 &&
    path !== "/auth/login" &&
    path !== "/auth/demo" &&
    path !== "/auth/register" &&
    path !== "/auth/accept-invite"
  ) {
    clearSession();
    window.dispatchEvent(new CustomEvent("assethub:session-expired"));
  }
  if (!response.ok) {
    const error = new Error(
      body?.error || `Request failed (${response.status}). Please try again.`,
    );
    error.status = response.status;
    throw error;
  }
  return body;
}

export const get = (path) => api(path);
export const post = (path, body = {}) => api(path, { method: "POST", body });
export const patch = (path, body) => api(path, { method: "PATCH", body });
