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

const Home = () => {
  const [newReleasesItems, setNewReleasesItems] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  const { setQueueAndPlay } = usePlayer();

  useEffect(() => {
    (async () => {
      try {
        const data = await getHomeData();
        setNewReleasesItems(data.newReleases || []);
        setRecentlyPlayed(data.recentlyPlayed || []);
        setTopArtists(data.topArtists || []);
      } catch (e) {
        console.error("Failed to fetch home data", e);
      }
    })();
  }, []);

  function AlbumCard({ item, onSelect }) {
    return (
      <div
        onClick={() => onSelect(item)}
        className="bg-white/5 p-4 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="w-full aspect-square object-cover rounded-md mb-4"
        />
        <h3 className="font-bold text-white truncate">{item.title}</h3>
        <p className="text-sm text-zinc-400 truncate">{item.subtitle}</p>
      </div>
    );
  }

  function Cards({ items = [], onSelect }) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
        {items.map((item) => (
          <AlbumCard key={item.id} item={item} onSelect={onSelect} />
        ))}
      </div>
    );
  }

  return (
    <main className="w-full h-screen overflow-y-auto scrollbar-hide p-4 sm:p-6">
      <SearchBar
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-6">
            {newReleasesItems.map((item) => (
              <div key={item.id} className="block">
                <AlbumCard
                  item={item}
                  onSelect={(item) => {
                    const index = newReleasesItems.findIndex(
                      (i) => i.id === item.id,
                    );
                    setQueueAndPlay(newReleasesItems, index);
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-zinc-500">No new releases available.</p>
          </div>
        )}
      </div>

      {topArtists.length > 0 && (
        <div className="mb-2">
          <h2 className="font-bold text-2xl text-white ml-2.5">Artists</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {topArtists.map((item) => (
              <div key={item.id} className="block">
                <AlbumCard
                  item={item}
                  onSelect={(item) => {
                    const index = topArtists.findIndex((i) => i.id === item.id);
                    setQueueAndPlay(topArtists, index);
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
};

export default Home;
