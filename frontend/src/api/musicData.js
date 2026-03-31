import { API_BASE } from "./config";
const DATA_API_BASE = API_BASE + "/api/data";

async function getJson(path, options = {}) {
  try {
    const url = `${DATA_API_BASE}/${path}`;
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    });

    if (!res.ok) {
      throw new Error(`Request failed: ${res.status} ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("API Error:", error.message);
    throw error;
  }
}

export function getHomeData() {
  return getJson("home");
}

export function getLibraryData() {
  return getJson("library");
}

export function getArijitData() {
  return getJson("artist/arijit");
}

export function getAlbumData() {
  return getJson("album");
}

export function getRoomPlaylist() {
  return getJson("room-playlist");
}

export function searchSongs(query) {
  return getJson(`search?q=${encodeURIComponent(query)}`);
}
