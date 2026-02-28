import { Download, Heart, MoreHorizontal, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { getAlbumData } from "../api/musicData";
import { usePlayer } from "../context/PlayerContext";
import Loader from "./loader";

export default function AlbumPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [album, setAlbum] = useState(null);
  const { setQueueAndPlay } = usePlayer();

  useEffect(() => {
    (async () => {
      try {
        const data = await getAlbumData();
        setAlbum(data);
      } catch (e) {
        console.error("Failed to fetch album data", e);
      } finally {
        setIsLoading(false);
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

  if (!album) {
    return <div className="h-screen w-full p-6 text-white">No album data.</div>;
  }

  const tracks = Array.isArray(album.tracks) ? album.tracks : [];

  return (
    <>
      <div
        style={{ background: album.gradient }}
        className="fixed inset-0 -z-10"
      />

      <div className="h-screen overflow-y-auto scrollbar-hide text-white font-sans">
        <div className="p-4 sm:p-6 lg:p-8">
          <header className="flex flex-col sm:flex-row items-center gap-6 pt-12">
            <img
              src={album.coverImage}
              alt="Album Cover"
              className="w-48 h-48 sm:w-56 sm:h-56 object-cover rounded-md shadow-2xl shadow-black/50"
            />
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
              <span className="text-xs font-bold uppercase">Album</span>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tighter mt-2">
                {album.title}
              </h1>
              <p className="text-zinc-300 mt-4">
                <span className="font-bold hover:underline cursor-pointer">
                  {album.artist}
                </span>{" "}
                - {album.year} - {album.trackCount} song
                {album.trackCount === 1 ? "" : "s"}
              </p>
            </div>
          </header>

          <div className="mt-8 flex items-center gap-6 relative">
            <button className="text-zinc-400 hover:text-white transition-colors">
              <Heart size={32} />
            </button>
            <button className="text-zinc-400 hover:text-white transition-colors">
              <Download size={32} />
            </button>
            <button className="text-zinc-400 hover:text-white transition-colors">
              <MoreHorizontal size={32} />
            </button>
            <button
              onClick={() => {
                if (tracks.length) setQueueAndPlay(tracks, 0);
              }}
              disabled={!tracks.length}
              className="absolute right-0 bg-green-500 text-black p-4 rounded-full shadow-lg shadow-black/40 transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
              <Play size={32} className="fill-current" />
            </button>
          </div>

          <div className="mt-10">
            {tracks.map((track, index) => (
              <div
                key={track.id}
                onClick={() => setQueueAndPlay(tracks, index)}
                className="grid grid-cols-[auto,auto,1fr,auto] items-center gap-4 p-3 rounded-md hover:bg-white/10 cursor-pointer group">
                <div className="w-6 text-center text-zinc-400 font-medium">
                  <span className="group-hover:hidden">{index + 1}</span>
                  <Play
                    size={20}
                    className="text-white fill-current hidden group-hover:block"
                  />
                </div>
                <img
                  src={track.imageUrl || album.coverImage}
                  alt={track.title}
                  className="w-12 h-12 rounded-md object-cover"
                />
                <div>
                  <p className="font-semibold truncate text-white">
                    {track.title}
                  </p>
                </div>
                <div className="text-zinc-400">
                  <MoreHorizontal size={20} />
                </div>
              </div>
            ))}
          </div>

          <footer className="mt-8 text-xs text-zinc-400">
            <p>{album.releaseDate}</p>
            <p>(c) {album.label}</p>
          </footer>
          <div className="h-24"></div>
        </div>
      </div>
    </>
  );
}
