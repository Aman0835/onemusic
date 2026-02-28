import React, { useState } from "react";
import ListeningRoom from "./listeningRoom.jsx";
import { Trash2 } from "lucide-react";

const LS_KEY = "one_music_rooms";

const loadRooms = () => JSON.parse(localStorage.getItem(LS_KEY)) || [];
const saveRooms = (r) => localStorage.setItem(LS_KEY, JSON.stringify(r));

export default function RoomLobby() {
  const [rooms, setRooms] = useState(loadRooms());
  const [roomName, setRoomName] = useState("");
  const [joinName, setJoinName] = useState("");
  const [activeRoom, setActiveRoom] = useState("");
  const [error, setError] = useState("");

  const createRoom = () => {
    const name = roomName.trim();
    if (!name) return;

    const newRoom = {
      name,
      host: "Me",
      listeners: [],
      currentSong: null,
      queue: [],
    };
   

    const updated = [...rooms, newRoom];
    saveRooms(updated);
    setRooms(updated);
    setActiveRoom(name);
  };

  const joinRoom = () => {
    const name = joinName.trim();
    if (!name) return;

    const room = rooms.find((r) => r.name.toLowerCase() === name.toLowerCase());
    if (!room) return setError("Room not found. Check the name and try again.");

    const updated = rooms.map((r) =>
      r.name === room.name ? { ...r, listeners: [...r.listeners, "Me"] } : r,
    );

    saveRooms(updated);
    setRooms(updated);
    setActiveRoom(room.name);
  };

  if (activeRoom) {
    return (
      <ListeningRoom roomName={activeRoom} onExit={() => setActiveRoom("")} />
    );
  }

   const handleDeleteRoom = (roomName) => {
      setRooms((prev) => prev.filter((r) => r.name !== roomName));
    };

  return (
    <div className="w-full h-screen overflow-y-auto scrollbar-hide">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Rooms
          </h1>
          <p className="text-zinc-400 mt-2">
            Create a room to host a session, or join an existing one.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-1">Create Room</h2>
            <p className="text-sm text-zinc-400 mb-4">
              Start a private listening session and invite friends.
            </p>

            <label className="text-xs text-zinc-400">Room name</label>
            <input
              className="mt-2 w-full bg-black/40 border border-white/10 p-3 rounded-lg focus:ring-2 focus:ring-green-500/50"
              placeholder="e.g. Late Night Vibes"
              value={roomName}
              onChange={(e) => {
                setRoomName(e.target.value);
                setError("");
              }}
            />

            <button
              onClick={createRoom}
              disabled={!roomName.trim()}
              className="bg-green-500 text-black font-semibold w-full mt-4 p-3 rounded-lg disabled:opacity-50 hover:bg-green-400 transition-colors">
              Create Room
            </button>
          </section>

          <section className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-1">Join Room</h2>
            <p className="text-sm text-zinc-400 mb-4">
              Enter the exact room name to join the session.
            </p>

            <label className="text-xs text-zinc-400">Room name</label>
            <input
              className="mt-2 w-full bg-black/40 border border-white/10 p-3 rounded-lg focus:ring-2 focus:ring-blue-500/50"
              placeholder="Enter room name"
              value={joinName}
              onChange={(e) => {
                setJoinName(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && joinRoom()}
            />

            {error && <div className="text-red-400 text-xs mt-2">{error}</div>}

            <button
              onClick={joinRoom}
              disabled={!joinName.trim()}
              className="bg-blue-500 text-black font-semibold w-full mt-4 p-3 rounded-lg disabled:opacity-50 hover:bg-blue-400 transition-colors">
              Join Room
            </button>
          </section>
        </div>

        <section className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm uppercase tracking-widest text-zinc-400">
              Your Rooms
            </h3>
            <span className="text-xs text-zinc-500">{rooms.length} total</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            {rooms.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No rooms yet. Create one to get started.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {rooms.map((room) => (
                  <div
                    key={room.name}
                    className="flex items-center justify-between bg-black/30 border border-white/10 rounded-lg px-4 py-3 hover:bg-white/10 transition-colors">
                    {/* LEFT SIDE */}
                    <button
                      onClick={() => setActiveRoom(room.name)}
                      className="text-left flex-1">
                      <div className="font-semibold">{room.name}</div>
                      <div className="text-xs text-zinc-500">
                        Host: {room.host}
                      </div>
                    </button>

                    {/* RIGHT SIDE */}
                    <div className="flex items-center gap-3 shrink-0">
                      {/* Listeners Count */}
                      <span className="text-xs text-zinc-400">
                        {room.listeners.length} listeners
                      </span>

                      {/* DELETE BUTTON */}
                      <button
                        onClick={() => handleDeleteRoom(room.name)}
                        className="p-1.5 rounded-md hover:bg-red-600/20 transition">
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
