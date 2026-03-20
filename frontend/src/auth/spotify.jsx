import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// --- Spotify Auth Utilities (PKCE) ---
const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || "";
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
  return import.meta.env.VITE_SPOTIFY_REDIRECT_URI || "";
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
  const body = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    grant_type: "authorization_code",
    code,
    redirect_uri: getRedirectUri(),
    code_verifier: localStorage.getItem(CODE_VERIFIER_KEY) || "",
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

const SpotifyAuthContext = createContext(null);

export function SpotifyAuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(localStorage.getItem("spotify_access_token") || "");
  const [refreshTokenState, setRefreshTokenState] = useState(localStorage.getItem("spotify_refresh_token") || "");
  const [expiresAt, setExpiresAt] = useState(parseInt(localStorage.getItem("spotify_expires_at") || "0", 10));
  const [profile, setProfile] = useState(null);

  const logout = useCallback(() => {
    localStorage.removeItem("spotify_access_token");
    localStorage.removeItem("spotify_refresh_token");
    localStorage.removeItem("spotify_expires_at");
    setAccessToken("");
    setRefreshTokenState("");
    setExpiresAt(0);
    setProfile(null);
  }, []);

  const ensureFreshToken = useCallback(async () => {
    if (!accessToken || !refreshTokenState || Date.now() < expiresAt - 60000) return;
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
      logout();
    }
  }, [accessToken, expiresAt, refreshTokenState, logout]);

  useEffect(() => {
    if (!accessToken) return;
    fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.ok ? r.json() : (logout(), null))
      .then((u) => u && setProfile(u))
      .catch(() => {});
  }, [accessToken, logout]);

  const startLogin = useCallback(async () => {
    const codeVerifier = await generateCodeVerifier();
    const codeChallenge = await createCodeChallenge(codeVerifier);
    localStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);
    window.location.assign(buildAuthUrl(codeChallenge));
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
    if (token.refresh_token) localStorage.setItem("spotify_refresh_token", token.refresh_token);
    window.history.replaceState({}, document.title, url.pathname);
    return true;
  }, [refreshTokenState]);

  return (
    <SpotifyAuthContext.Provider value={{ accessToken, profile, startLogin, handleCallback, ensureFreshToken, logout, expiresAt }}>
      {children}
    </SpotifyAuthContext.Provider>
  );
}

export const useSpotifyAuth = () => useContext(SpotifyAuthContext);
