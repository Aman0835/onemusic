import React, { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import ListeningRoom from "./listeningRoom.jsx";
import {
  getMyRooms,
  createRoomAPI,
  joinRoomAPI,
  deleteRoomAPI,
} from "../../api/room.js";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

export default function RoomLobby() {
  const user = useSelector((store) => store.user); 
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [joinName, setJoinName] = useState("");
  const [activeRoom, setActiveRoom] = useState(null);
  const [error, setError] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);

  // -------------------------
  // FETCH ROOMS ON LOAD
  // -------------------------
  useEffect(() => {
    (async () => {
      try {
        const data = await getMyRooms();
        setRooms(data);
      } catch (e) {
        console.log("Failed to fetch rooms:", e);
      }
    })();
  }, []);

  // -------------------------
  // CREATE ROOM
  // -------------------------
  const createRoom = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (!roomName.trim()) return;

    try {
      const newRoom = await createRoomAPI(roomName);
      setRooms((prev) => [...prev, newRoom]);
      setActiveRoom(newRoom.name);
      setRoomName("");
    } catch (e) {
      console.error(e);
    }
  };

  // -------------------------
  // JOIN ROOM
  // -------------------------
  const joinRoom = async () => {
    if (!joinName.trim()) return;

    try {
      const room = await joinRoomAPI(joinName);
      setActiveRoom(room.name);
      setJoinName("");
    } catch (e) {
      setError("Room not found");
    }
  };

  // -------------------------
  // DELETE ROOM
  // -------------------------
  const handleDeleteRoom = async (name) => {
    try {
      await deleteRoomAPI(name);
      setRooms((prev) => prev.filter((r) => r.name !== name));
    } catch (e) {
      console.error("Delete failed:", e);
    }
  };

  // -------------------------
  // OPEN LISTENING ROOM
  // -------------------------
  if (activeRoom) {
    return (
      <ListeningRoom
        roomName={activeRoom}
        onExit={() => setActiveRoom(null)}
      />
    );
  }

  return (
    <div className="w-full h-screen overflow-y-auto scrollbar-hide">
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* HEADER */}
        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Rooms
          </h1>
          <p className="text-zinc-400 mt-2">
            Create a room to host a session, or join an existing one.
          </p>
        </header>

        {/* CREATE + JOIN SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* CREATE ROOM */}
          <section className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-1">Create Room</h2>
            <p className="text-sm text-zinc-400 mb-4">
              Start a private listening session and invite friends.
            </p>

            <label className="text-xs text-zinc-400">Room name</label>
            <input
              className="mt-2 w-full bg-black/40 border border-white/10 p-3 rounded-lg"
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
              className="bg-green-500 text-black font-semibold w-full mt-4 p-3 rounded-lg disabled:opacity-50 hover:bg-green-400 transition-colors"
            >
              Create Room
            </button>
          </section>

          {/* JOIN ROOM */}
          <section className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-1">Join Room</h2>
            <p className="text-sm text-zinc-400 mb-4">
              Enter the exact room name to join the session.
            </p>

            <label className="text-xs text-zinc-400">Room name</label>
            <input
              className="mt-2 w-full bg-black/40 border border-white/10 p-3 rounded-lg"
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
              className="bg-blue-500 text-black font-semibold w-full mt-4 p-3 rounded-lg disabled:opacity-50 hover:bg-blue-400 transition-colors"
            >
              Join Room
            </button>
          </section>

        </div>

        {/* USER ROOMS */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm uppercase tracking-widest text-zinc-400">
              Your Rooms
            </h3>
            <span className="text-xs text-zinc-500">{rooms.length} total</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            {rooms.length === 0 ? (
              <p className="text-sm text-zinc-500">No rooms yet. Create one to get started.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {rooms.map((room) => (
                  <div
                    key={room._id}
                    className="flex items-center justify-between bg-black/30 border border-white/10 rounded-lg px-4 py-3 hover:bg-white/10 transition-colors"
                  >
                    <button
                      onClick={() => setActiveRoom(room.name)}
                      className="text-left flex-1"
                    >
                      <div className="font-semibold">{room.name}</div>
                      <div className="text-xs text-zinc-500">Host: You</div>
                    </button>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-400">
                        {room.listeners.length} listeners
                      </span>

                      <button
                        onClick={() => handleDeleteRoom(room.name)}
                        className="p-1.5 rounded-md hover:bg-red-600/20 transition"
                      >
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

     
      {showLoginModal &&
        createPortal(
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]">
            <div className="bg-white w-80 p-6 rounded-xl shadow-xl text-center">

              <h2 className="text-xl font-semibold text-gray-800">
                Login Required
              </h2>
              <p className="text-gray-600 mt-2">
                You must be logged in to create a room.
              </p>

              <div className="flex justify-center gap-4 mt-6">
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>

                <button
                  onClick={() => navigate("/login")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Login
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}