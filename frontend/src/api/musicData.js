import { API_BASE } from "./config";
const DATA_API_BASE = API_BASE + "/api/data";

const cache = {};

async function getJson(path, options = {}) {
  // If we already fetched this exact path, return the cached promise/data immediately
  if (cache[path]) {
    return cache[path];
  }

  try {
    const url = `${DATA_API_BASE}/${path}`;
    
    // Store the promise in the cache so concurrent requests wait for the same fetch
    cache[path] = fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    }).then(async (res) => {
      if (!res.ok) {
        throw new Error(`Request failed: ${res.status} ${res.statusText}`);
      }
      return await res.json();
    }).catch((error) => {
      // If it fails, remove it from cache so we can try again later
      delete cache[path];
      throw error;
    });

    return await cache[path];
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
  // Search queries shouldn't be cached indefinitely in memory like static pages
  const path = `search?q=${encodeURIComponent(query)}`;
  const url = `${DATA_API_BASE}/${path}`;
  return fetch(url, { headers: { "Content-Type": "application/json" } }).then(res => res.json());
}
