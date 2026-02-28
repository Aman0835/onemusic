import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// --- Spotify Auth Utilities (PKCE) ---
const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || "";
// Use current origin so it matches how you opened the app (localhost vs 127.0.0.1). Add the same URI in Spotify Dashboard.
const SPOTIFY_REDIRECT_URI =
  (typeof window !== "undefined" ? window.location.origin + "/callback" : null) ||
  import.meta.env.VITE_SPOTIFY_REDIRECT_URI ||
  "";
const SPOTIFY_SCOPE =
  "user-read-email user-read-private user-read-playback-state user-modify-playback-state playlist-read-private user-top-read user-read-recently-played";
const CODE_VERIFIER_KEY = "spotify_pkce_code_verifier_v1";

async function generateCodeVerifier() {
  const array = new Uint8Array(64);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(digest);
}

function base64UrlEncode(arrayBuffer) {
  let str = String.fromCharCode(...arrayBuffer);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function createCodeChallenge(codeVerifier) {
  const hashed = await sha256(codeVerifier);
  return base64UrlEncode(hashed);
}

function getRedirectUri() {
  if (typeof window !== "undefined") return window.location.origin + "/callback";
  return import.meta.env.VITE_SPOTIFY_REDIRECT_URI || SPOTIFY_REDIRECT_URI || "";
}

function buildAuthUrl(codeChallenge) {
  const redirectUri = getRedirectUri();
  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: redirectUri,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
    scope: SPOTIFY_SCOPE,
  });
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

async function exchangeToken(code) {
  const codeVerifier = localStorage.getItem(CODE_VERIFIER_KEY) || "";
  const body = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    grant_type: "authorization_code",
    code,
    redirect_uri: getRedirectUri(),
    code_verifier: codeVerifier,
  });
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error("Failed to exchange token");
  return res.json();
}

async function refreshAccessToken(refreshToken) {
  const apiBase = import.meta.env.VITE_API_BASE || "";
  if (apiBase) {
    const resp = await fetch(`${apiBase}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!resp.ok) throw new Error("Failed to refresh token (backend)");
    return resp.json();
  }

  const body = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error("Failed to refresh token");
  return res.json();
}

// --- Auth Context ---
const SpotifyAuthContext = createContext(null);

export function SpotifyAuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem("spotify_access_token") || "",
  );
  const [refreshTokenState, setRefreshTokenState] = useState(
    localStorage.getItem("spotify_refresh_token") || "",
  );
  const [expiresAt, setExpiresAt] = useState(
    parseInt(localStorage.getItem("spotify_expires_at") || "0", 10),
  );
  const [profile, setProfile] = useState(null);

  // If an access token was returned in the URL hash (implicit grant), parse and store it
  useEffect(() => {
    try {
      const hash = window.location.hash.substring(1);
      if (!hash) return;
      const params = new URLSearchParams(hash);
      const access_token = params.get("access_token");
      const expires_in = params.get("expires_in");
      if (access_token) {
        const expiresAtCalc =
          Date.now() + (expires_in ? Number(expires_in) * 1000 : 3600 * 1000);
        setAccessToken(access_token);
        setExpiresAt(expiresAtCalc);
        localStorage.setItem("spotify_access_token", access_token);
        localStorage.setItem("spotify_expires_at", String(expiresAtCalc));
        // Remove token from URL for cleanliness
        const cleanUrl =
          window.location.origin +
          window.location.pathname +
          window.location.search;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    } catch (e) {
      // ignore parse errors
    }
  }, []);

  const isExpired = expiresAt && Date.now() > expiresAt - 60_000;
  const logout = useCallback(() => {
    try {
      localStorage.removeItem("spotify_access_token");
      localStorage.removeItem("spotify_refresh_token");
      localStorage.removeItem("spotify_expires_at");
    } catch {}
    setAccessToken("");
    setRefreshTokenState("");
    setExpiresAt(0);
    setProfile(null);
  }, []);

  const ensureFreshToken = useCallback(async () => {
    if (!accessToken || !isExpired || !refreshTokenState) return;
    try {
      const refreshed = await refreshAccessToken(refreshTokenState);
      const newAccess = refreshed.access_token;
      const newExpiresAt = Date.now() + (refreshed.expires_in || 3600) * 1000;
      setAccessToken(newAccess);
      setExpiresAt(newExpiresAt);
      localStorage.setItem("spotify_access_token", newAccess);
      localStorage.setItem("spotify_expires_at", String(newExpiresAt));
      if (refreshed.refresh_token) {
        setRefreshTokenState(refreshed.refresh_token);
        localStorage.setItem("spotify_refresh_token", refreshed.refresh_token);
      }
    } catch {
      // Auto-clear invalid/expired refresh token
      logout();
    }
  }, [accessToken, isExpired, refreshTokenState, logout]);

  useEffect(() => {
    if (!accessToken) return;
    fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(async (r) => {
        if (r.ok) return r.json();
        if (r.status === 401 || r.status === 403) logout();
        return null;
      })
      .then((u) => u && setProfile(u))
      .catch(() => {});
  }, [accessToken]);

  useEffect(() => {
    if (accessToken || !refreshTokenState) return;
    (async () => {
      try {
        const refreshed = await refreshAccessToken(refreshTokenState);
        const newAccess = refreshed.access_token;
        const newExpiresAt = Date.now() + (refreshed.expires_in || 3600) * 1000;
        setAccessToken(newAccess);
        setExpiresAt(newExpiresAt);
        localStorage.setItem("spotify_access_token", newAccess);
        localStorage.setItem("spotify_expires_at", String(newExpiresAt));
        if (refreshed.refresh_token) {
          setRefreshTokenState(refreshed.refresh_token);
          localStorage.setItem(
            "spotify_refresh_token",
            refreshed.refresh_token,
          );
        }
      } catch {
        logout();
      }
    })();
  }, [accessToken, refreshTokenState]);

  useEffect(() => {
    if (!accessToken || !expiresAt || !refreshTokenState) return;
    const msUntilRefresh = Math.max(0, expiresAt - Date.now() - 60_000);
    const id = setTimeout(() => {
      ensureFreshToken().catch(() => {});
    }, msUntilRefresh);
    return () => clearTimeout(id);
  }, [accessToken, expiresAt, refreshTokenState, ensureFreshToken]);

  // If there's an access token with an expiry but no refresh token, auto-logout when it expires
  useEffect(() => {
    if (!accessToken || !expiresAt) return;
    // If refresh token exists, refresh flow will manage expiry
    if (refreshTokenState) return;

    const msUntilExpiry = expiresAt - Date.now();
    if (msUntilExpiry <= 0) {
      logout();
      try {
        window.location.replace("/login");
      } catch {}
      return;
    }

    const id = setTimeout(() => {
      logout();
      try {
        window.location.replace("/login");
      } catch {}
    }, msUntilExpiry);
    return () => clearTimeout(id);
  }, [accessToken, expiresAt, refreshTokenState, logout]);

  const startLogin = useCallback(async () => {
    const redirectUri =
      typeof window !== "undefined"
        ? window.location.origin + "/callback"
        : import.meta.env.VITE_SPOTIFY_REDIRECT_URI || "";
    if (!SPOTIFY_CLIENT_ID || !redirectUri) {
      console.error("Spotify: missing VITE_SPOTIFY_CLIENT_ID or redirect URI");
      return;
    }
    try {
      const codeVerifier = await generateCodeVerifier();
      const codeChallenge = await createCodeChallenge(codeVerifier);
      localStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);
      const url = buildAuthUrl(codeChallenge);
      window.location.assign(url);
    } catch (err) {
      console.warn("PKCE failed, redirecting with implicit flow", err);
      const { buildAuthUrl: buildImplicitAuthUrl } = await import("./auth");
      window.location.assign(buildImplicitAuthUrl());
    }
  }, []);

  const handleCallback = useCallback(async () => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    if (!code) return false;
    const token = await exchangeToken(code);
    const expiresAtCalc = Date.now() + (token.expires_in || 3600) * 1000;
    setAccessToken(token.access_token);
    setExpiresAt(expiresAtCalc);
    setRefreshTokenState(token.refresh_token || refreshTokenState);
    localStorage.setItem("spotify_access_token", token.access_token);
    localStorage.setItem("spotify_expires_at", String(expiresAtCalc));
    if (token.refresh_token)
      localStorage.setItem("spotify_refresh_token", token.refresh_token);
    url.searchParams.delete("code");
    url.searchParams.delete("state");
    window.history.replaceState({}, document.title, url.pathname);
    return true;
  }, [refreshTokenState]);

  // Cross-tab sync: reflect token changes across tabs/devices
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "spotify_access_token" && e.storageArea === localStorage) {
        const tok = localStorage.getItem("spotify_access_token") || "";
        setAccessToken(tok);
      }
      if (e.key === "spotify_refresh_token" && e.storageArea === localStorage) {
        const rt = localStorage.getItem("spotify_refresh_token") || "";
        setRefreshTokenState(rt);
      }
      if (e.key === "spotify_expires_at" && e.storageArea === localStorage) {
        const ea = parseInt(
          localStorage.getItem("spotify_expires_at") || "0",
          10,
        );
        setExpiresAt(ea);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = {
    accessToken,
    profile,
    startLogin,
    handleCallback,
    ensureFreshToken,
    logout,
  };

  // expose expiresAt so UI can show countdowns/warnings
  value.expiresAt = expiresAt;

  return (
    <SpotifyAuthContext.Provider value={value}>
      {children}
    </SpotifyAuthContext.Provider>
  );
}

export function useSpotifyAuth() {
  return useContext(SpotifyAuthContext);
}

export function AuthCallbackHandler() {
  const { handleCallback } = useSpotifyAuth() || {};
  useEffect(() => {
    if (handleCallback) handleCallback();
  }, [handleCallback]);
  return null;
}

// Re-export client refresh helper and implicit auth URL for fallback
export { refreshToken, buildAuthUrl as buildImplicitAuthUrl } from "./auth";
