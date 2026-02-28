export const TOKEN_KEY = "spotify_access_token_v1";

export function saveToken({ access_token, expires_in, refresh_token }) {
  const expiresAt = expires_in ? Date.now() + expires_in * 1000 : null;
  const tokenObj = { access_token, expiresAt };
  if (refresh_token) tokenObj.refresh_token = refresh_token;
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokenObj));
  
  localStorage.setItem("spotify_access_token", access_token);
  if (expiresAt) localStorage.setItem("spotify_expires_at", String(expiresAt));
  if (refresh_token)
    localStorage.setItem("spotify_refresh_token", refresh_token);
}

export function getToken() {
  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;
  try {
    const { access_token, expiresAt } = JSON.parse(raw);
    if (expiresAt && Date.now() > expiresAt) {
      clearToken();
      return null;
    }
    return access_token;
  } catch (e) {
    clearToken();
    return null;
  }
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("spotify_access_token");
  localStorage.removeItem("spotify_expires_at");
  localStorage.removeItem("spotify_refresh_token");
}

export function getRefreshToken() {
  const raw = localStorage.getItem("spotify_refresh_token");
  if (raw) return raw;
  const stored = localStorage.getItem(TOKEN_KEY);
  if (!stored) return null;
  try {
    const { refresh_token } = JSON.parse(stored);
    return refresh_token || null;
  } catch (e) {
    return null;
  }
}

export async function refreshToken() {
  const refresh_token = getRefreshToken();
  if (!refresh_token) return null;
  const apiBase = import.meta.env.VITE_API_BASE || "";
  try {
    if (apiBase) {
      const resp = await fetch(`${apiBase}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error("refresh failed");
      saveToken({
        access_token: data.access_token,
        expires_in: data.expires_in,
        refresh_token: data.refresh_token,
      });
      return data;
    }
    // No API base configured: let the client call Spotify directly (PKCE-compatible)
    const params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token,
      client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
    });
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error("refresh failed");
    saveToken({
      access_token: data.access_token,
      expires_in: data.expires_in,
      refresh_token: data.refresh_token,
    });
    return data;
  } catch (err) {
    console.error("Failed to refresh token", err);
    clearToken();
    return null;
  }
}

export function buildAuthUrl() {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const redirectUri =
    (typeof window !== "undefined" ? window.location.origin + "/callback" : null) ||
    import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
  const scopes = ["user-read-private", "user-read-email"].join(" ");
  const params = new URLSearchParams({
    response_type: "token",
    client_id: clientId,
    scope: scopes,
    redirect_uri: redirectUri,
  });
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}
