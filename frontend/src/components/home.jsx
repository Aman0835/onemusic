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

const Home = () => {
  const [madeForYou, setMadeForYou] = useState([]);
  const [jumpBackIn, setJumpBackIn] = useState([]);
  const [topMixes, setTopMixes] = useState([]);
  const [popularAlbums, setPopularAlbums] = useState([]);
  const [newReleasesItems, setNewReleasesItems] = useState([]);
  const [popularArtists, setPopularArtists] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { setQueueAndPlay } = usePlayer();

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const data = await getHomeData();
        setMadeForYou(data.madeForYou || []);
        setJumpBackIn(data.jumpBackIn || []);
        setTopMixes(data.topMixes || []);
        setPopularAlbums(data.popularAlbums || []);
        setNewReleasesItems(data.newReleases || []);
        setPopularArtists(data.popularArtists || []);
      } catch (e) {
        console.error("Failed to fetch home data", e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  function AlbumCard({ item, onSelect, isArtist }) {
    return (
      <div
        onClick={() => onSelect(item)}
        className="bg-transparent hover:bg-white/5 p-2 sm:p-3 rounded-md transition-all duration-200 cursor-pointer flex flex-col group gap-2 h-full"
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
          <h3 className="font-semibold text-white text-sm truncate w-full">{item.title}</h3>
          <p className="text-xs text-zinc-400 line-clamp-2 w-full">{item.subtitle}</p>
        </div>
      </div>
    );
  }

  function Cards({ items = [], onSelect, isArtist = false }) {
    return (
      <div 
        className="flex overflow-x-auto gap-3 sm:gap-4 lg:gap-5 pb-4 scrollbar-hide snap-x"
      >
        {items.map((item) => (
          <div key={item.id} className="snap-start min-w-[140px] w-[140px] sm:min-w-[160px] sm:w-[160px] md:min-w-[180px] md:w-[180px] flex-shrink-0">
            <AlbumCard 
              item={item} 
              onSelect={(i) => onSelect(i)} 
              isArtist={isArtist}
            />
          </div>
        ))}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-[60dvh] flex items-center justify-center p-4 sm:p-6 bg-transparent">
        <Loader />
      </div>
    );
  }

  return (
    <div className="w-full p-4 sm:p-6 pb-8">
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

      {newReleasesItems.length > 0 && (
        <div className="mb-2">
          <h2 className="font-bold text-2xl text-white ml-2.5 mt-2">
            New Releases
          </h2>
          <Cards 
            items={newReleasesItems} 
            onSelect={(item) => {
              const index = newReleasesItems.findIndex((i) => i.id === item.id);
              setQueueAndPlay(newReleasesItems, index);
            }} 
          />
        </div>
      )}

      {jumpBackIn.length > 0 && (
        <div className="mb-2">
          <h2 className="font-bold text-2xl text-white ml-2.5 mt-2">
            Jump back in
          </h2>
          <Cards
            items={jumpBackIn}
            onSelect={(item) => {
              const index = jumpBackIn.findIndex((i) => i.id === item.id);
              setQueueAndPlay(jumpBackIn, index);
            }}
          />
        </div>
      )}

      {madeForYou.length > 0 && (
        <div className="mb-2">
          <h2 className="font-bold text-2xl text-white ml-2.5 mt-2">
            Made For You
          </h2>
          <Cards
            items={madeForYou}
            onSelect={(item) => {
              const index = madeForYou.findIndex((i) => i.id === item.id);
              setQueueAndPlay(madeForYou, index);
            }}
          />
        </div>
      )}

      {topMixes.length > 0 && (
        <div className="mb-2">
          <h2 className="font-bold text-2xl text-white ml-2.5 mt-2">
            Your top mixes
          </h2>
          <Cards
            items={topMixes}
            onSelect={(item) => {
              const index = topMixes.findIndex((i) => i.id === item.id);
              setQueueAndPlay(topMixes, index);
            }}
          />
        </div>
      )}

      {popularAlbums.length > 0 && (
        <div className="mb-2">
          <h2 className="font-bold text-2xl text-white ml-2.5 mt-2">
            Popular albums
          </h2>
          <Cards
            items={popularAlbums}
            onSelect={(item) => {
              const index = popularAlbums.findIndex((i) => i.id === item.id);
              setQueueAndPlay(popularAlbums, index);
            }}
          />
        </div>
      )}


      {popularArtists.length > 0 && (
        <div className="mb-8">
          <h2 className="font-bold text-2xl text-white ml-2.5 mt-2">
            Popular Artists
          </h2>
          <Cards 
            items={popularArtists} 
            isArtist={true}
            onSelect={(item) => {
              const index = popularArtists.findIndex((i) => i.id === item.id);
              setQueueAndPlay(popularArtists, index);
            }} 
          />
        </div>
      )}
    </div>
  );
};

export default Home;
