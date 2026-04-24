import { LayoutGrid, List, Plus, Search, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { getLibraryData } from "../api/musicData";
import { usePlayer } from "../context/PlayerContext";
import Loader from "./loader";
import SearchBar from "./SearchBar";
import { useScrollGrab } from "../hooks/useScrollGrab";

const FILTERS = ["All", "Playlists", "Albums", "Artists"];

function normalizeLibraryItems(payload) {
  const rawItems = Array.isArray(payload) ? payload : payload?.items || [];

  return rawItems.map((item, index) => {
    const bucket = index % 3;
    const fallbackType =
      bucket === 0 ? "Playlist" : bucket === 1 ? "Album" : "Artist";

    return {
      id: item.id || `lib-${index}`,
      title: item.title || "Untitled",
      creator: item.creator || item.subtitle || "Unknown Artist",
      imageUrl:
        item.imageUrl ||  
        "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop",
      type: item.type || fallbackType,
      isDownloaded: Boolean(item.isDownloaded),
      isPinned: item.isPinned ?? index < 6,
    };
  });
}

function toLibraryItem(track) {
  return {
    id: track.id,
    title: track.title || "Untitled",
    creator: track.creator || track.subtitle || "Unknown Artist",
    imageUrl:
      track.imageUrl ||
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop",
    type: "Playlist",
    isDownloaded: false,
    isPinned: false,
  };
}

export default function LibraryPage() {
  const { setQueueAndPlay } = usePlayer();
  const user = useSelector((store) => store.user);

  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [viewMode, setViewMode] = useState("grid");
  const [libraryItems, setLibraryItems] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [error, setError] = useState(null);

  const { ref: gridScrollRef, isDragging: isGridDragging } = useScrollGrab();

  
  useEffect(() => {
    const controller = new AbortController();

    const cached = localStorage.getItem("libraryCache");
    if (cached) {
      setLibraryItems(JSON.parse(cached));
      setIsLoading(false);
    }

    (async () => {
      try {
        setError(null);


        const data = await getLibraryData(controller.signal);
        const normalized = normalizeLibraryItems(data);

        setLibraryItems(normalized);
        localStorage.setItem("libraryCache", JSON.stringify(normalized));
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error("Failed to fetch library data", e);
          setError("Failed to load library. Backend may be unreachable.");
        }
      } finally {
        setIsLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  const filteredItems = useMemo(() => {
    if (activeFilter === "All") return libraryItems;
    const type = activeFilter.slice(0, -1);
    return libraryItems.filter((item) => item.type === type);
  }, [activeFilter, libraryItems]);

  const handleSelectFromSearch = (track) => {
    const nextItem = toLibraryItem(track);

    setLibraryItems((prev) => {
      if (prev.some((i) => i.id === nextItem.id)) return prev;
      const updated = [nextItem, ...prev];
      localStorage.setItem("libraryCache", JSON.stringify(updated));
      return updated;
    });
  };

  const handlePlayLibraryItem = (item) => {
    const queue = filteredItems.length ? filteredItems : libraryItems;
    const index = queue.findIndex((t) => t.id === item.id);
    setQueueAndPlay(queue, index >= 0 ? index : 0);
  };

  if (isLoading)
    return (
      <div className="w-full h-[60dvh] flex items-center justify-center">
        <Loader />
      </div>
    );

  if (error)
    return (
      <div className="w-full h-[60dvh] flex items-center justify-center text-white">
        <p className="text-red-500 font-semibold">{error}</p>
      </div>
    );

  return (
    <div className="text-white p-4 sm:p-6 font-sans flex flex-col pb-8">
      <Header onToggleSearch={() => setShowSearch((v) => !v)} user={user} />

      <div className="mt-6">
        <FilterPills
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
        />
      </div>

      {showSearch && (
        <div className="mt-4">
          <SearchBar
            onSelectTrack={handleSelectFromSearch}
            playlist={libraryItems}
          />
        </div>
      )}

      <div className="mt-8 flex-1">
        <div>
          <div className="flex justify-end items-center mb-4">
            <button
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="p-2 text-zinc-400 hover:text-white transition-colors">
              {viewMode === "grid" ? (
                <List size={20} />
              ) : (
                <LayoutGrid size={20} />
              )}
            </button>
          </div>

          {viewMode === "grid" ? (
            <div 
              className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4 lg:gap-5 pb-6"
            >
              {filteredItems.map((item) => (
                <LibraryItemCard
                  key={item.id}
                  item={item}
                  onClick={() => handlePlayLibraryItem(item)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredItems.map((item) => (
                <LibraryListItem
                  key={item.id}
                  item={item}
                  onClick={() => handlePlayLibraryItem(item)}
                />
              ))}
            </div>
          )}

          {!filteredItems.length && (
            <div className="text-zinc-400 text-sm py-10 text-center">
              No items available for this tab.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const Header = ({ onToggleSearch, user }) => (
  <header className="flex justify-between items-center sticky top-0 bg-black/80 backdrop-blur-xl z-20 py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 mb-2 border-b border-white/5">
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg overflow-hidden border border-white/10 flex-shrink-0 ${!user?.photoUrl ? 'bg-gradient-to-br from-[#F9C97C] to-[#f7b733]' : 'bg-black'}`}>
        {user?.photoUrl ? (
          <img src={user.photoUrl} referrerPolicy="no-referrer" alt="User" className="w-full h-full object-cover" />
        ) : (
          <span className="text-black font-black text-sm">
            {user?.firstName?.[0]?.toUpperCase() || <User size={18} className="text-black" />}
          </span>
        )}
      </div>
      <h1 className="text-[22px] sm:text-2xl font-bold tracking-tight text-white">Your Library</h1>
    </div>

    <div className="flex items-center gap-3 sm:gap-4 text-zinc-300">
      <button
        onClick={onToggleSearch}
        className="hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10"
      >
        <Search size={22} />
      </button>
      <button className="hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10">
        <Plus size={26} />
      </button>
    </div>
  </header>
);

const FilterPills = ({ activeFilter, setActiveFilter }) => (
  <div className="flex items-center gap-3 overflow-x-auto pb-2">
    {FILTERS.map((filter) => (
      <button
        key={filter}
        onClick={() => setActiveFilter(filter)}
        className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
          activeFilter === filter
            ? "bg-white text-black"
            : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
        }`}>
        {filter}
      </button>
    ))}
  </div>
);

const LibraryItemCard = ({ item, onClick }) => {
  const isArtist = item.type === "Artist";
  return (
    <div
      onClick={onClick}
      className="bg-transparent hover:bg-white/5 p-2 sm:p-3 rounded-md transition-all duration-200 cursor-pointer flex flex-col group gap-2 w-full"
    >
      <div className={`relative w-full aspect-square overflow-hidden shadow-lg ${isArtist ? 'rounded-full' : 'rounded-md'}`}>
        <img
          src={item.imageUrl}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="flex flex-col gap-0.5 w-full text-left mt-1">
        <h3 className={`font-semibold text-white text-[15px] truncate w-full ${isArtist ? 'text-center' : ''}`}>{item.title}</h3>
        <p className={`text-[13px] text-zinc-400 truncate w-full ${isArtist ? 'text-center' : ''}`}>
          {item.type} {item.creator !== "Unknown Artist" && !isArtist ? `• ${item.creator}` : ""}
        </p>
      </div>
    </div>
  );
};

const LibraryListItem = ({ item, onClick }) => {
  const isArtist = item.type === "Artist";
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 p-2.5 mx-1 rounded-md hover:bg-white/5 cursor-pointer transition-colors"
    >
      <img
        src={item.imageUrl}
        alt={item.title}
        className={`w-14 h-14 object-cover shadow-md flex-shrink-0 ${isArtist ? 'rounded-full' : 'rounded-md'}`}
      />

      <div className="flex flex-col min-w-0 flex-grow">
        <h3 className="font-semibold text-[16px] text-white truncate">{item.title}</h3>
        <p className="text-[13px] text-zinc-400 truncate mt-0.5">
          {item.type} {item.creator !== "Unknown Artist" && !isArtist ? `• ${item.creator}` : ""}
        </p>
      </div>
    </div>
  );
};