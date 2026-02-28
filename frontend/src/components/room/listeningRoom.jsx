import { Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePlayer } from "../../context/PlayerContext";
import PlayerBar from "../PlayerBar";
import Chat from "../chats/chat";
import SearchBar from "../SearchBar";

const ListeningRoom = ({ roomName = "Global Room", onExit }) => {
  const wsRef = useRef(null);

  const {
    setQueueAndPlay,
    playNext,
    playPrev,
    togglePlayPause,
    activeTrack,
    isPlaying,
    shuffle,
    setShuffle,
    repeatMode,
    setRepeatMode,
    setVolume,
  } = usePlayer();

  const [playlist, setPlaylist] = useState([]);
  const [activePermissions, setActivePermissions] = useState("Admin");
  const [userActive, setUserActive] = useState(0);

  useEffect(() => {
    const ws = new WebSocket(
      `ws://localhost:5001/room/${encodeURIComponent(roomName)}`,
    );
    wsRef.current = ws;

    ws.onopen = () => console.log("WS Connected:", roomName);
    ws.onmessage = (msg) => console.log("WS Message:", msg.data);
    ws.onclose = () => console.log("WS Closed");
    ws.onerror = (err) => console.error("Room WS Error:", err);

    return () => {
      console.log("Leaving room -> Closing WebSocket");
      if (
        ws.readyState === WebSocket.CONNECTING ||
        ws.readyState === WebSocket.OPEN
      ) {
        ws.close();
      }
    };
  }, [roomName]);

  useEffect(() => {
    fetch("http://localhost:5000/api/data/room-playlist")
      .then((res) => res.json())
      .then((data) => setPlaylist(data))
      .catch((err) => console.error("Failed to load playlist", err));
  }, []);

  useEffect(() => {
    fetch("http://localhost:5000/api/user/user-connected")
      .then((res) => res.json())
      .then((data) => setUserActive(data?.online ?? 0))
      .catch((err) => console.error("Failed to check user connection", err));
  }, []);

  const handleSelectTrack = (id) => {
    const index = playlist.findIndex((t) => t.id === id);
    if (index !== -1) {
      setQueueAndPlay(playlist, index);
    }
  };

  const handleSelectFromSearch = (track) => {
    const exists = playlist.some((item) => item.id === track.id);
    if (exists) {
      handleSelectTrack(track.id);
      return;
    }

    setPlaylist((prev) => {
      const updated = [...prev, track];
      const index = updated.findIndex((t) => t.id === track.id);
      if (index !== -1) {
        setQueueAndPlay(updated, index);
      }
      return updated;
    });
  };

  return (
    <div className="flex h-full w-full text-gray-300 overflow-hidden">
      <aside className="w-64 border-r border-gray-800 p-4 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-sm font-bold truncate pr-2">
              #Room : {roomName}
            </h2>

            <button
              onClick={() => {
                if (
                  wsRef.current &&
                  (wsRef.current.readyState === WebSocket.CONNECTING ||
                    wsRef.current.readyState === WebSocket.OPEN)
                ) {
                  wsRef.current.close();
                }
                onExit();
              }}
              className="text-[10px] text-zinc-600 hover:text-red-400 font-black transition-colors">
              EXIT
            </button>
          </div>

          <section className="mb-8">
            <h3 className="text-[10px] uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
              <Play size={10} fill="currentColor" /> Permissions
              <p className="text-zinc-400 normal-case">{userActive} online</p>
            </h3>
            <div className="flex bg-[#1a1a1a] rounded-lg p-1 text-[11px] font-bold">
              <button
                className={
                  activePermissions === "Everyone"
                    ? "flex-1 py-1.5 rounded-md bg-[#eeb000] text-black"
                    : "flex-1 py-1.5 rounded-md text-zinc-500"
                }
                onClick={() => setActivePermissions("Everyone")}>
                Everyone
              </button>
              <button
                className={
                  activePermissions === "Admin"
                    ? "flex-1 py-1.5 rounded-md bg-[#eeb000] text-black"
                    : "flex-1 py-1.5 rounded-md text-zinc-500"
                }
                onClick={() => setActivePermissions("Admin")}>
                Admins
              </button>
            </div>
          </section>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <div className="p-6 max-w-4xl mx-auto w-full flex-1 overflow-y-auto scrollbar-hide">
          <SearchBar
            onSelectTrack={handleSelectFromSearch}
            playlist={playlist}
          />

          <div className="space-y-1">
            {playlist.map((track, index) => {
              const isActive = activeTrack?.id === track.id;

              return (
                <div
                  key={track.id}
                  onClick={() => handleSelectTrack(track.id)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    isActive
                      ? "bg-[#1db954]/10 border border-[#1db954]/30"
                      : "hover:bg-white/5 border border-transparent"
                  }`}>
                  <div className="flex items-center gap-4">
                    <span className="w-5 text-xs text-zinc-500">
                      {isActive ? (
                        <Play
                          size={12}
                          fill="#1db954"
                          className="text-[#1db954]"
                        />
                      ) : (
                        index + 1
                      )}
                    </span>

                    <img
                      src={track.imageUrl}
                      alt={track.title}
                      className="w-10 h-10 rounded"
                    />

                    <span
                      className={`text-sm ${isActive ? "text-[#1db954] font-semibold" : ""}`}>
                      {track.title}
                    </span>
                  </div>

                  <span className="text-xs text-zinc-500">
                    {isActive ? "PLAYING" : track.duration}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <PlayerBar
          activeTrack={activeTrack}
          onNext={playNext}
          onPrev={playPrev}
          onPlayPause={togglePlayPause}
          isPlaying={isPlaying}
          shuffle={shuffle}
          setShuffle={setShuffle}
          repeatMode={repeatMode}
          setRepeatMode={setRepeatMode}
          onVolumeChange={setVolume}
        />
      </main>
      <Chat />
    </div>
  );
};

export default ListeningRoom;
