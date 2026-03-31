import React, { useEffect, useState } from "react";
import { getArijitData } from "../api/musicData";
import Loader from "./loader";
import { usePlayer } from "../context/PlayerContext";
import { Play, MoreHorizontal } from "lucide-react";

export default function ArtistPage() {
  const [artist, setArtist] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const { setQueueAndPlay } = usePlayer();

  useEffect(() => {
    (async () => {
      try {
        const data = await getArijitData();
        console.log("ARTIST DATA:", data);
        setArtist(data);
      } catch (e) {
        console.error("Failed to fetch artist data", e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-[60dvh] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  // Prevent crashes if artist = null
  if (!artist) {
    return (
      <div className="w-full h-[60dvh] flex items-center justify-center text-white">
        <p>Failed to load artist info.</p>
      </div>
    );
  }

  return (
    <div className="w-full pb-12">
      {/* HERO */}
      <div className="relative h-[40vh] sm:h-[50vh] text-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${artist.imageUrl})` }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

        <div className="relative z-10 flex flex-col justify-end h-full px-6 pb-8">
          <h1 className="text-6xl font-extrabold my-2">{artist.name}</h1>

          <div className="flex items-center gap-6 mt-4">
            <span className="font-medium">
              {artist.monthlyListeners} monthly listeners
            </span>
          </div>
        </div>
      </div>

      {/* SONG LIST */}
      <div className="px-6 mt-8">
        <h2 className="text-2xl font-bold mb-4">Popular</h2>

        <div className="mt-4 mb-8 pt-4">
          {artist.topSongs?.map((song, index) => (
            <div
              key={song.id}
              onClick={() => setQueueAndPlay(artist.topSongs, index)}
              className="grid grid-cols-[36px_40px_1fr_36px] items-center gap-3 sm:gap-4 py-2 px-2 sm:px-3 rounded-md hover:bg-white/10 cursor-pointer group transition-colors"
            >
              <div className="text-center text-zinc-400 font-medium text-sm">
                <span className="group-hover:hidden">{index + 1}</span>
                <div className="hidden group-hover:flex justify-center">
                  <Play size={16} className="text-white fill-current" />
                </div>
              </div>

              <img
                src={song.imageUrl}
                alt={song.title}
                className="w-10 h-10 rounded object-cover shadow-sm bg-zinc-800"
              />

              <div className="flex flex-col min-w-0 pr-4">
                <p className="font-medium text-white text-sm truncate leading-snug">{song.title}</p>
                <p className="text-xs text-zinc-400 truncate mt-0.5">{song.subtitle}</p>
              </div>

              <div className="text-zinc-400 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal size={18} className="hover:text-white" />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}