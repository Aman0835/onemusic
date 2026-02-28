const YTMusic = require("ytmusic-api");
const NodeCache = require("node-cache");

const ytmusic = new YTMusic();
const cache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes

let initialized = false;

async function initYT() {
  if (!initialized) {
    await ytmusic.initialize();
    initialized = true;
    console.log("YTMusic initialized");
  }
}

// Fast search using YTMusic.search (better than searchSongs)
async function searchSongsFast(query) {
  try {
    const results = await ytmusic.search(query, "songs");
    return results.slice(0, 20).filter((s) => s.videoId);
  } catch (err) {
    console.error("YT search failed:", query, err.message);
    return [];
  }
}

// Fetch duration in parallel
async function getDurationsParallel(songs) {
  return await Promise.all(
    songs.map(async (song) => {
      try {
        const info = await ytmusic.getSong(song.videoId);
        return info.duration || "0:00";
      } catch {
        return "0:00";
      }
    })
  );
}

// Format songs with optimized structure
async function formatSongsFast(songs) {
  const durations = await getDurationsParallel(songs);

  return songs.map((song, i) => ({
    id: song.videoId,
    title: song.name,
    subtitle: song.artist?.name || song.artists?.[0]?.name || "Unknown Artist",
    duration: durations[i],
    imageUrl: song.thumbnails?.[song.thumbnails.length - 1]?.url,
    type: "Playlist",
  }));
}

// HOME API — optimized + cached
exports.home = async (req, res) => {
  if (cache.has("home")) return res.json(cache.get("home"));

  try {
    await initYT();

    const [newReleases, trending, globalHits] = await Promise.all([
      searchSongsFast("latest hindi songs 2025"),
      searchSongsFast("trending songs india"),
      searchSongsFast("top global hits"),
    ]);

    const result = {
      newReleases: await formatSongsFast(newReleases),
      recentlyPlayed: await formatSongsFast(trending),
      topArtists: await formatSongsFast(globalHits),
    };

    cache.set("home", result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// LIBRARY API — optimized + cached
exports.library = async (req, res) => {
  if (cache.has("library")) return res.json(cache.get("library"));

  try {
    await initYT();

    const playlist = await searchSongsFast("latest songs playlist 2025");
    const result = await formatSongsFast(playlist);

    cache.set("library", result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ARIJIT ARTIST PAGE — fast + cached
exports.artistArijit = async (req, res) => {
  if (cache.has("arijit")) return res.json(cache.get("arijit"));

  try {
    await initYT();

    const songs = await searchSongsFast("Arijit Singh");
    const topSongs = await formatSongsFast(songs);

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

// ALBUM PAGE — fast + cached
exports.album = async (req, res) => {
  if (cache.has("album")) return res.json(cache.get("album"));

  try {
    await initYT();

    const albumSongs = await searchSongsFast("best album songs india");
    const tracks = await formatSongsFast(albumSongs);

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

// SEARCH — optimized
exports.search = async (req, res) => {
  try {
    await initYT();

    const q = req.query.q;
    if (!q) return res.status(400).json({ error: "Query required" });

    const results = await searchSongsFast(q);
    res.json(await formatSongsFast(results));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};