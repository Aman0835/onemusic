import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getHomeData } from "../api/musicData";
import { usePlayer } from "../context/PlayerContext";

import SearchBar from "../components/SearchBar";
import "../index.css";

const Card = (props) => <div {...props} />;
const CardContent = (props) => <div {...props} />;

const currentYear = new Date().getFullYear();
const lastYear = currentYear - 1;

import Loader from "../components/loader";
import { useScrollGrab } from "../hooks/useScrollGrab";

const Home = () => {
  const [newReleasesItems, setNewReleasesItems] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { setQueueAndPlay } = usePlayer();

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const data = await getHomeData();
        setNewReleasesItems(data.newReleases || []);
        setRecentlyPlayed(data.recentlyPlayed || []);
        setTopArtists(data.topArtists || []);
      } catch (e) {
        console.error("Failed to fetch home data", e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  function AlbumCard({ item, onSelect }) {
    return (
      <div
        onClick={() => onSelect(item)}
        className="bg-transparent hover:bg-white/5 p-2 sm:p-3 rounded-md transition-all duration-200 cursor-pointer flex flex-col group gap-2"
      >
        <div className="relative w-full aspect-square overflow-hidden rounded-md shadow-lg">
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <div className="flex flex-col gap-0.5 w-full text-left mt-1">
          <h3 className="font-semibold text-white text-sm truncate w-full">{item.title}</h3>
          <p className="text-xs text-zinc-400 truncate w-full">{item.subtitle}</p>
        </div>
      </div>
    );
  }

  function Cards({ items = [], onSelect }) {
    const { ref, isDragging } = useScrollGrab();

    return (
      <div 
        ref={ref}
        className="flex overflow-x-auto scrollbar-hide gap-4 sm:gap-5 pb-4 cursor-grab active:cursor-grabbing touch-pan-x"
      >
        {items.map((item) => (
          <div key={item.id} className="min-w-[120px] sm:min-w-[140px] max-w-[160px]">
            <AlbumCard 
              item={item} 
              onSelect={(i) => {
                if (!isDragging) onSelect(i);
              }} 
            />
          </div>
        ))}
      </div>
    );
  }

  if (isLoading) {
    return (
      <main className="w-full h-[calc(100vh-100px)] flex items-center justify-center p-4 sm:p-6 bg-transparent">
        <Loader />
      </main>
    );
  }

  return (
    <main className="w-full h-full overflow-y-auto scrollbar-hide p-4 sm:p-6 pb-8">
      <SearchBar
        showPlusIcon={false}
        onResultsChange={setSearchResults}
        onSelectTrack={(track) => {
          const index = searchResults.findIndex((i) => i.id === track.id);
          setQueueAndPlay(searchResults, index);
        }}
      />

      <section className="mb-8">
        <Card className="bg-gradient-to-r from-primary/20 to-music-secondary/20 border-primary/30">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2 text-gradient">
              Listen together in Rooms
            </h2>
            <p className="text-muted-foreground mb-6">
              Create or join a room to sync music with friends in real-time
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/room">
                <button className="relative px-6 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 transition-all group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-[#04A72E]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <span className="relative z-10 text-white font-bold">
                    Create Room
                  </span>
                </button>
              </Link>
              <Link to="/room">
                <button className="relative px-7 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 transition-all group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-[#04A72E]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <span className="relative z-10 text-white font-bold">
                    Join Room
                  </span>
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {recentlyPlayed.length > 0 && (
        <div className="mb-2">
          <h2 className="font-bold text-2xl text-white ml-2.5 mt-2">
            Recently Played
          </h2>
          <Cards
            items={recentlyPlayed}
            onSelect={(item) => {
              const index = recentlyPlayed.findIndex((i) => i.id === item.id);
              setQueueAndPlay(recentlyPlayed, index);
            }}
          />
        </div>
      )}

      <div className="mb-2">
        <h2 className="font-bold text-2xl text-white ml-2.5 mt-2">
          New Releases ({currentYear} / {lastYear})
        </h2>
        {newReleasesItems.length > 0 ? (
          <Cards 
            items={newReleasesItems} 
            onSelect={(item) => {
              const index = newReleasesItems.findIndex((i) => i.id === item.id);
              setQueueAndPlay(newReleasesItems, index);
            }} 
          />
        ) : (
          <div className="text-center py-10">
            <p className="text-zinc-500">No new releases available.</p>
          </div>
        )}
      </div>

      {topArtists.length > 0 && (
        <div className="mb-2">
          <h2 className="font-bold text-2xl text-white ml-2.5 mt-8 mb-4">Artists</h2>
          <Cards 
            items={topArtists} 
            onSelect={(item) => {
              const index = topArtists.findIndex((i) => i.id === item.id);
              setQueueAndPlay(topArtists, index);
            }} 
          />
        </div>
      )}
    </main>
  );
};

export default Home;
