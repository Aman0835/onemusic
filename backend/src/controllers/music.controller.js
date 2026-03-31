const YTMusic = require("ytmusic-api");
const NodeCache = require("node-cache");

const ytmusic = new YTMusic();
const cache = new NodeCache({ stdTTL: 600 }); // Cache for 10 minutes

let initialized = false;

async function initYT() {
  if (!initialized) {
    await ytmusic.initialize();
    initialized = true;
    console.log("YTMusic initialized");
  }
}

// Fast search using YTMusic.search
async function searchSongsFast(query, limit = 40) {
  try {
    const results = await ytmusic.search(query, "songs");
    return results.slice(0, limit).filter((s) => s.videoId);
  } catch (err) {
    console.error("YT search failed:", query, err.message);
    return [];
  }
}

// Run multiple queries in parallel and merge + deduplicate results
async function searchMulti(queries, limitPerQuery = 20) {
  const allResults = await Promise.all(
    queries.map((q) => searchSongsFast(q, limitPerQuery))
  );
  const seen = new Set();
  const merged = [];
  for (const batch of allResults) {
    for (const s of batch) {
      if (!seen.has(s.videoId)) {
        seen.add(s.videoId);
        merged.push(s);
      }
    }
  }
  return merged;
}

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Format songs with instant mapping structures (no extra API calls necessary)
function formatSongsFast(songs) {
  return songs.map((song) => ({
    id: song.videoId,
    title: song.name,
    subtitle: song.artist?.name || song.artists?.[0]?.name || "Unknown Artist",
    duration:
      typeof song.duration === "number"
        ? formatDuration(song.duration)
        : song.duration || "0:00",
    imageUrl: song.thumbnails?.[song.thumbnails.length - 1]?.url,
    type: "Playlist",
  }));
}

// HOME API — 3 sections, each from 2 parallel queries (~40 songs each)
exports.home = async (req, res) => {
  if (cache.has("home")) return res.json(cache.get("home"));

  try {
    await initYT();

    const [newReleases, trending, globalHits] = await Promise.all([
      searchMulti(["latest hindi songs 2025", "new bollywood songs 2025"]),
      searchMulti(["trending songs india 2025", "viral hindi songs"]),
      searchMulti(["top global hits 2025", "best english songs 2025"]),
    ]);

    const result = {
      newReleases: formatSongsFast(newReleases),
      recentlyPlayed: formatSongsFast(trending),
      topArtists: formatSongsFast(globalHits),
    };

    cache.set("home", result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// LIBRARY API — 4 parallel queries merged (~80 songs)
exports.library = async (req, res) => {
  if (cache.has("library")) return res.json(cache.get("library"));

  try {
    await initYT();

    const songs = await searchMulti([
      "latest songs playlist 2025",
      "best hindi songs playlist",
      "top punjabi songs 2025",
      "best pop songs 2025",
    ]);
    const result = formatSongsFast(songs);

    cache.set("library", result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ARIJIT ARTIST PAGE — more songs from wider queries (~60 songs)
exports.artistArijit = async (req, res) => {
  if (cache.has("arijit")) return res.json(cache.get("arijit"));

  try {
    await initYT();

    const songs = await searchMulti([
      "Arijit Singh best songs",
      "Arijit Singh hits 2024 2025",
      "Arijit Singh romantic songs",
    ]);
    const topSongs = formatSongsFast(songs);

    const result = {
      name: "Arijit Singh",
      imageUrl: topSongs[0]?.imageUrl || "",
      monthlyListeners: "82,000,000",
      topSongs,
    };

    cache.set("arijit", result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ALBUM PAGE — richer tracklist from multiple queries (~60 songs)
exports.album = async (req, res) => {
  if (cache.has("album")) return res.json(cache.get("album"));

  try {
    await initYT();

    const albumSongs = await searchMulti([
      "best album songs india",
      "top bollywood album tracks 2025",
      "best hindi album songs all time",
    ]);
    const tracks = formatSongsFast(albumSongs);

    const result = {
      title: "Best Album Songs India",
      artist: tracks[0]?.subtitle || "Various Artists",
      year: new Date().getFullYear(),
      trackCount: tracks.length,
      coverImage: tracks[0]?.imageUrl || "",
      gradient:
        "linear-gradient(135deg, #1f2937 0%, #111827 50%, #000000 100%)",
      releaseDate: "Streaming Collection",
      label: "YouTube Music",
      tracks,
    };

    cache.set("album", result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ROOM PLAYLIST (static)
exports.roomPlaylist = (req, res) => {
  res.json([
    {
      id: "PMivT7MJ41M",
      title: "Bruno Mars - That's What I Like",
      duration: "03:26",
      imageUrl: "https://i.ytimg.com/vi/PMivT7MJ41M/hqdefault.jpg",
    },
  ]);
};

// SEARCH — up to 40 results
exports.search = async (req, res) => {
  try {
    await initYT();

    const q = req.query.q;
    if (!q) return res.status(400).json({ error: "Query required" });

    const results = await searchSongsFast(q, 40);
    res.json(formatSongsFast(results));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};