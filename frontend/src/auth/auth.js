export const saveToken = (token) => {
  if (token.access_token) {
    localStorage.setItem("spotify_access_token", token.access_token);
  }
  if (token.refresh_token) {
    localStorage.setItem("spotify_refresh_token", token.refresh_token);
  }
  if (token.expires_in) {
    localStorage.setItem("spotify_expires_at", String(Date.now() + token.expires_in * 1000));
  }
};

export const refreshToken = async (refreshToken) => {
  const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: SPOTIFY_CLIENT_ID,
  });

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) throw new Error("Failed to refresh token");
  return res.json();
};

export const buildAuthUrl = () => {
  const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const SPOTIFY_REDIRECT_URI = window.location.origin + "/callback";
  const SPOTIFY_SCOPE = "user-read-email user-read-private user-read-playback-state user-modify-playback-state playlist-read-private user-top-read user-read-recently-played";

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: "token",
    redirect_uri: SPOTIFY_REDIRECT_URI,
    scope: SPOTIFY_SCOPE,
    show_dialog: "true",
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
};
