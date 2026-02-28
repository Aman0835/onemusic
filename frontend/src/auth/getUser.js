import { getToken } from "./auth";

export async function fetchSpotifyUser() {
  const token = getToken();
  if (!token) throw new Error("No token available");
  const res = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Token invalid or expired");
    }
    throw new Error("Failed to fetch user");
  }
  return res.json();
}
