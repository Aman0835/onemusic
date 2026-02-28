import { Search } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Plus, Check } from "lucide-react";
import { searchSongs } from "../api/musicData";

export default function SearchBar({
  onSelectTrack,
  playlist = [],
  onResultsChange,
  showActionButton = true,
  placeholder = "Search for a song...",
}) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(() => {
      fetchSong(searchQuery);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    onResultsChange?.(searchResults);
  }, [searchResults, onResultsChange]);

  async function fetchSong(query) {
    const data = await searchSongs(query);

    const formatSongs = (songs = []) =>
      songs.slice(0, 10).map((song) => ({
        id: song.id || song.videoId,
        title: song.title || song.name,
        subtitle:
          song.subtitle ||
          song.artist?.name ||
          song.artists?.[0]?.name ||
          "Unknown Artist",
        imageUrl: song.imageUrl || song.thumbnails?.[0]?.url,
      }));

    setSearchResults(formatSongs(data));
    setOpen(true);
  }

  const isAddedToPlaylist = (trackId) => {
    return playlist.some((track) => track.id === trackId);
  };

  return (
    <div ref={ref} className="relative mb-8">
      <Search
        className="absolute z-1 left-4 top-3.5 text-white/70 drop-shadow-sm"
        size={17}
      />
      <input
        type="text"
        placeholder={placeholder}
        className="w-full py-3 pl-12 pr-4 text-sm rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-white placeholder-gray-300 shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40"
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => searchQuery.length > 0 && setOpen(true)}
      />

      {open && searchResults.length > 0 && (
        <div
          className="absolute w-full mt-2 p-3 rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-z-50 max-h-64 overflow-y-auto animate-dropdown">
          {searchResults.map((track) => (
            <button
  key={track.id}
  onClick={() => onSelectTrack(track)} 
  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 cursor-pointer text-left">
  <img
    src={track.imageUrl}
    alt={track.title}
    className="w-10 h-10 rounded"
  />

  <div className="flex-1">
    <span className="text-sm text-white">{track.title}</span>
    <p className="text-xs text-gray-500">{track.subtitle}</p>
  </div>

  {showActionButton && (
    <button
      onClick={(e) => {
        e.stopPropagation(); 
        onSelectTrack(track);
      }}
      className="ml-auto"
    >
      {isAddedToPlaylist(track.id) ? (
        <Check size={20} className="text-green-500" />
      ) : (
        <Plus size={20} className="text-white" />
      )}
    </button>
  )}
</button>
          ))}
        </div>
      )}

      {open && searchQuery && searchResults.length === 0 && (
        <div className="absolute w-full bg-[#1a1a1a] border border-gray-800 rounded-xl mt-2 shadow-lg p-3 z-50 text-gray-400">
          No results found
        </div>
      )}
    </div>
  );
}
