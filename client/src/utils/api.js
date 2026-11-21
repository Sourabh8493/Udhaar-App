// Central place for the API base URL so it's not hardcoded in every
// context file. Falls back to localhost so local dev keeps working
// exactly as before if no env var is set.
export const API_HOST = process.env.REACT_APP_API_URL || "http://localhost:5000";
// export const API_HOST = "http://10.224.237.164:5000";

// 10 consecutive days in milliseconds
export const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

export const isTokenExpired = (token) => {
  if (!token || typeof token !== "string") return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const decoded = JSON.parse(jsonPayload);
    if (!decoded.exp) return false;
    return Date.now() >= decoded.exp * 1000;
  } catch {
    return true;
  }
};

export const clearAuthSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("lastActive");
  localStorage.removeItem("user");
};

export const updateLastActive = () => {
  localStorage.setItem("lastActive", Date.now().toString());
};

export const setAuthSession = (token, user) => {
  if (token) {
    localStorage.setItem("token", token);
    updateLastActive();
  }
  if (user) {
    localStorage.setItem(
      "user",
      JSON.stringify({
        _id: user._id,
        name: user.name,
        email: user.email,
      })
    );
  }
};

export const isSessionValid = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    clearAuthSession();
    return false;
  }

  if (isTokenExpired(token)) {
    clearAuthSession();
    return false;
  }

  const lastActive = localStorage.getItem("lastActive");
  if (lastActive) {
    const inactiveDuration = Date.now() - Number(lastActive);
    if (inactiveDuration >= TEN_DAYS_MS) {
      clearAuthSession();
      return false;
    }
  }

  updateLastActive();
  return true;
};

const redirectToLoginIfNeeded = () => {
  if (typeof window !== "undefined" && window.location) {
    const path = window.location.pathname;
    const publicPaths = ["/login", "/signup", "/verify-email", "/forgot-password", "/reset-password"];
    if (!publicPaths.includes(path)) {
      window.location.href = "/login";
    }
  }
};

const authHeaders = () => ({
  "Content-Type": "application/json",
  "auth-token": localStorage.getItem("token") || "",
});

// Thin wrapper around fetch that adds the auth header, parses JSON safely,
// and throws a normal Error with a readable message on non-2xx responses -
// so every call site can just try/catch instead of re-checking response.ok.
export const apiRequest = async (path, { method = "GET", body, auth = true } = {}) => {
  if (auth && !isSessionValid()) {
    clearAuthSession();
    redirectToLoginIfNeeded();
    const error = new Error("Session expired. Please log in again.");
    error.status = 401;
    throw error;
  }

  const headers = auth ? authHeaders() : { "Content-Type": "application/json" };

  let response;
  try {
    response = await fetch(`${API_HOST}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkError) {
    throw new Error("Could not reach the server. Please check your connection.");
  }

  let json = null;
  try {
    json = await response.json();
  } catch (parseError) {
    json = null;
  }

  if (response.status === 401 && auth) {
    clearAuthSession();
    redirectToLoginIfNeeded();
  }

  if (!response.ok) {
    const message =
      (json && (json.error || (json.errors && json.errors[0] && json.errors[0].msg))) ||
      "Something went wrong. Please try again.";
    const error = new Error(message);
    error.status = response.status;
    error.body = json;
    throw error;
  }

  if (auth) {
    updateLastActive();
  }

  return json;
};
