import { Download, LayoutGrid, List, Plus, Search, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getLibraryData } from "../api/musicData";
import { usePlayer } from "../context/PlayerContext";
import Loader from "./loader";
import SearchBar from "./SearchBar";
import { useScrollGrab } from "../hooks/useScrollGrab";

const FILTERS = ["Playlists", "Albums", "Artists", "Downloaded"];

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

  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("Playlists");
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
    if (activeFilter === "Downloaded") {
      const downloaded = libraryItems.filter((item) => item.isDownloaded);
      return downloaded.length ? downloaded : libraryItems;
    }

    const type = activeFilter.slice(0, -1);
    const match = libraryItems.filter((item) => item.type === type);
    return match.length ? match : libraryItems;
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
      <main className="w-full h-screen flex items-center justify-center">
        <Loader />
      </main>
    );

  if (error)
    return (
      <main className="w-full h-screen flex items-center justify-center text-white">
        <p className="text-red-500 font-semibold">{error}</p>
      </main>
    );

  return (
    <div className="text-white h-full overflow-hidden p-4 sm:p-6 font-sans flex flex-col pb-8">
      <Header onToggleSearch={() => setShowSearch((v) => !v)} />

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

      <div className="mt-8 flex-1 min-h-0 overflow-y-auto scrollbar-hide pr-1">
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
              ref={gridScrollRef}
              className="flex overflow-x-auto scrollbar-hide gap-4 sm:gap-5 pb-6 cursor-grab active:cursor-grabbing touch-pan-x"
            >
              {filteredItems.map((item) => (
                <div key={item.id} className="min-w-[120px] sm:min-w-[140px] max-w-[160px]">
                  <LibraryItemCard
                    item={item}
                    onClick={() => {
                      if (!isGridDragging) handlePlayLibraryItem(item);
                    }}
                  />
                </div>
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

const Header = ({ onToggleSearch }) => (
  <header className="flex justify-between items-center">
    <div className="flex items-center gap-4">
      <div className="bg-purple-600 p-2 rounded-full">
        <User size={24} />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold">Your Library</h1>
    </div>

    <div className="flex items-center gap-4 text-zinc-400">
      <button
        onClick={onToggleSearch}
        className="hover:text-white transition-colors">
        <Search size={24} />
      </button>
      <button className="hover:text-white transition-colors">
        <Plus size={28} />
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

const LibraryItemCard = ({ item, onClick }) => (
  <div
    onClick={onClick}
    className="bg-transparent hover:bg-white/5 p-2 sm:p-3 rounded-md transition-all duration-200 cursor-pointer flex flex-col group gap-2"
  >
    <div className="relative w-full aspect-square overflow-hidden rounded-md shadow-lg">
      <img
        src={item.imageUrl}
        alt={item.title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      {item.isDownloaded && (
        <div className="absolute bottom-2 right-2 bg-green-500 p-1.5 rounded-full shadow-lg z-10">
          <Download size={14} className="text-black" />
        </div>
      )}
    </div>

    <div className="flex flex-col gap-0.5 w-full text-left mt-1">
      <h3 className="font-semibold text-white text-sm truncate w-full">{item.title}</h3>
      <p className="text-xs text-zinc-400 truncate w-full">
        {item.type} - {item.creator}
      </p>
    </div>
  </div>
);

const LibraryListItem = ({ item, onClick }) => (
  <div
    onClick={onClick}
    className="flex items-center gap-4 p-2 rounded-md hover:bg-zinc-800/80 cursor-pointer"
  >
    <img
      src={item.imageUrl}
      alt={item.title}
      className="w-12 h-12 object-cover rounded-md"
    />

    <div className="flex-grow">
      <h3 className="font-semibold truncate">{item.title}</h3>
      <p className="text-sm text-zinc-400 truncate">
        {item.type} - {item.creator}
      </p>
    </div>

    {item.isDownloaded && <Download size={18} className="text-green-500" />}
  </div>
);