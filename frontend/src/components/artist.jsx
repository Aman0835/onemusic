import React, { useEffect, useState } from "react";
import { getArijitData } from "../api/musicData";
import Loader from "./loader";
import { usePlayer } from "../context/PlayerContext";

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
        setIsLoading(false);   // <-- FIX
      }
    })();
  }, []);

  if (isLoading) {
    return (
      <main className="w-full h-screen flex items-center justify-center">
        <Loader />
      </main>
    );
  }

  // Prevent crashes if artist = null
  if (!artist) {
    return (
      <main className="w-full h-screen flex items-center justify-center text-white">
        <p>Failed to load artist info.</p>
      </main>
    );
  }

  return (
    <div className="h-screen w-full overflow-y-auto scrollbar-hide">
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

        {artist.topSongs?.map((song, index) => (
          <div
            key={song.id}
            onClick={() => setQueueAndPlay(artist.topSongs, index)}
            className="flex items-center gap-4 p-3 hover:bg-white/10 rounded cursor-pointer"
          >
            <span className="w-6 text-gray-400">{index + 1}</span>

            <img
              src={song.imageUrl}
              alt={song.title}
              className="w-12 h-12 rounded"
            />

            <div>
              <p className="font-semibold">{song.title}</p>
              <p className="text-sm text-gray-400">{song.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="h-24"></div>
    </div>
  );
}