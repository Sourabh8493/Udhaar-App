// Central place for the API base URL so it's not hardcoded in every
// context file. Falls back to localhost so local dev keeps working
// exactly as before if no env var is set.
export const API_HOST = process.env.REACT_APP_API_URL || "http://localhost:5000";
// export const API_HOST = "http://10.224.237.164:5000";

const authHeaders = () => ({
  "Content-Type": "application/json",
  "auth-token": localStorage.getItem("token") || "",
});

// Thin wrapper around fetch that adds the auth header, parses JSON safely,
// and throws a normal Error with a readable message on non-2xx responses -
// so every call site can just try/catch instead of re-checking response.ok.
export const apiRequest = async (path, { method = "GET", body, auth = true } = {}) => {
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

  if (!response.ok) {
    const message =
      (json && (json.error || (json.errors && json.errors[0] && json.errors[0].msg))) ||
      "Something went wrong. Please try again.";
    const error = new Error(message);
    error.status = response.status;
    error.body = json;
    throw error;
  }

  return json;
};
