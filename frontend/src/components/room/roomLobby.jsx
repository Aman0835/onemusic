import React, { useEffect, useState } from "react";
import { Trash2, Plus, Users, Search, DoorOpen, LayoutGrid, List } from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  getMyRooms,
  createRoomAPI,
  joinRoomAPI,
  deleteRoomAPI,
} from "../../api/room.js";

export default function RoomLobby() {
  const user = useSelector((store) => store.user);
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [joinName, setJoinName] = useState("");
  const [error, setError] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // grid or list

  useEffect(() => {
    const userId = user?.id || user?._id;
    if (!userId) {
      setRooms([]);
      return;
    }

    (async () => {
      try {
        const data = await getMyRooms();
        setRooms(data);
      } catch (e) {
        if (e?.response?.status === 401) {
          setRooms([]);
          return;
        }
        console.log("Failed to fetch rooms:", e);
      }
    })();
  }, [user]);

  const createRoom = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (!roomName.trim()) return;
    setIsCreating(true);

    try {
      const newRoom = await createRoomAPI(roomName);
      setRooms((prev) => [...prev, newRoom]);
      setRoomName("");
      navigate(`/room/${newRoom._id}`);
    } catch (e) {
      const errorMsg = e?.response?.data?.error || e?.response?.data?.message || e.message || "Failed to create room";
      setError(errorMsg);
      console.error(e);
    } finally {
      setIsCreating(false);
    }
  };

  const joinRoom = async () => {
    if (!joinName.trim()) return;

    try {
      const room = await joinRoomAPI(joinName);
      setJoinName("");
      navigate(`/room/${room._id}`);
    } catch (e) {
      setError("Room not found. Check the name and try again.");
    }
  };

  const handleDeleteRoom = async (e, name) => {
    e.stopPropagation();
    try {
      await deleteRoomAPI(name);
      setRooms((prev) => prev.filter((r) => r.name !== name));
    } catch (e) {
      console.error("Delete failed:", e);
    }
  };

  return (
    <div className="w-full h-full bg-[#0a0a0a] text-white overflow-y-auto scrollbar-hide py-4 md:py-8 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        <header className="mb-8 animate-in fade-in slide-in-from-top duration-700">
          <div className="flex items-center gap-3 mb-2">
            <DoorOpen className="text-[#04A72E]" size={32} />
            <h1 className="text-3xl sm:text-5xl font-black bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
              ROOMS
            </h1>
          </div>
          <p className="text-zinc-500 text-sm sm:text-lg max-w-2xl">
            Host your own listening party or join a friend's room to enjoy music together in real-time.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Create Room Card */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-3xl p-6 md:p-8 hover:border-[#04A72E]/50 transition-all duration-300">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Plus size={80} className="text-[#04A72E]" />
            </div>
            
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <Plus className="text-[#04A72E]" size={20} />
              Create Room
            </h2>
            <p className="text-zinc-400 text-sm mb-6">
              Start a new session and be the DJ. Control permissions and invite others.
            </p>

            <div className="space-y-4">
              <div className="relative group">
                <input
                  className="w-full bg-black/40 border border-white/10 focus:border-[#04A72E]/50 focus:ring-1 focus:ring-[#04A72E]/50 p-4 rounded-2xl outline-none transition-all placeholder:text-zinc-600"
                  placeholder="Give your room a name..."
                  value={roomName}
                  onChange={(e) => {
                    setRoomName(e.target.value);
                    setError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && createRoom()}
                />
              </div>
              {error && <p className="text-red-500 text-xs mt-1 px-1">{error}</p>}
              <button
                onClick={createRoom}
                disabled={!roomName.trim() || isCreating}
                className="w-full bg-[#04A72E] hover:bg-[#05c436] disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-black py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(4,167,46,0.2)] hover:shadow-[0_0_30px_rgba(4,167,46,0.3)]"
              >
                {isCreating ? "Creating..." : "STRIKE UP THE ROOM"}
              </button>
            </div>
          </div>

          {/* Join Room Card */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-3xl p-6 md:p-8 hover:border-blue-500/50 transition-all duration-300">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Search size={80} className="text-blue-500" />
            </div>

            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <Search className="text-blue-500" size={20} />
              Join Room
            </h2>
            <p className="text-zinc-400 text-sm mb-6">
              Have a room name? Enter it below to dive straight into the session.
            </p>

            <div className="space-y-4">
              <div className="relative group">
                <input
                  className="w-full bg-black/40 border border-white/10 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 p-4 rounded-2xl outline-none transition-all placeholder:text-zinc-600"
                  placeholder="Enter exact room name..."
                  value={joinName}
                  onChange={(e) => {
                    setJoinName(e.target.value);
                    setError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && joinRoom()}
                />
              </div>

              {error && <p className="text-red-400 text-xs mt-1 px-1">{error}</p>}

              <button
                onClick={joinRoom}
                disabled={!joinName.trim()}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-black py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_30px_rgba(37,99,235,0.3)]"
              >
                JOIN SESSION
              </button>
            </div>
          </div>
        </div>

        {/* Your Rooms Section */}
        <section className="mt-12 animate-in fade-in slide-in-from-bottom duration-1000">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold tracking-tight">YOUR ROOMS</h3>
              <span className="bg-zinc-800 text-zinc-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                {rooms.length} Host
              </span>
            </div>
            
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
               <button 
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-zinc-500'}`}
               >
                 <LayoutGrid size={18} />
               </button>
               <button 
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-zinc-500'}`}
               >
                 <List size={18} />
               </button>
            </div>
          </div>

          {!user ? (
             <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-12 text-center">
                <Users className="mx-auto text-zinc-700 mb-4" size={48} />
                <p className="text-zinc-500 mb-6">Sign in to see and manage your active rooms.</p>
                <button 
                  onClick={() => navigate("/login")}
                  className="px-8 py-3 bg-white text-black font-bold rounded-2xl hover:bg-zinc-200 transition-colors"
                >
                  Login
                </button>
             </div>
          ) : rooms.length === 0 ? (
            <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-16 text-center">
              <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <DoorOpen className="text-zinc-600" size={32} />
              </div>
              <h4 className="text-xl font-bold mb-2">No Rooms Yet</h4>
              <p className="text-zinc-500 max-w-sm mx-auto">
                You haven't created any rooms yet. When you do, they'll appear here for quick access.
              </p>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" 
              : "space-y-3"
            }>
              {rooms.map((room) => (
                <div
                  key={room._id}
                  onClick={() => navigate(`/room/${room._id}`)}
                  className={`group relative overflow-hidden bg-white/5 border border-white/10 hover:border-white/30 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-black/50 ${
                    viewMode === 'list' ? 'flex items-center justify-between p-4' : 'p-6'
                  }`}
                >
                  <div className={viewMode === 'grid' ? 'mb-4' : ''}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#04A72E]/20 to-green-500/20 rounded-xl flex items-center justify-center border border-[#04A72E]/20 group-hover:scale-110 transition-transform">
                        <DoorOpen size={20} className="text-[#04A72E]" />
                      </div>
                      <div>
                        <div className="font-bold text-lg group-hover:text-[#04A72E] transition-colors">{room.name}</div>
                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Admin</div>
                      </div>
                    </div>
                  </div>

                  <div className={viewMode === 'grid' ? 'flex items-center justify-between mt-6' : 'flex items-center gap-6'}>
                    <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
                      <Users size={14} />
                      <span>{room.activeMembers?.length || 0} active</span>
                    </div>

                    <button
                      onClick={(e) => handleDeleteRoom(e, room.name)}
                      className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300"
                      title="Delete Room"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {showLoginModal &&
        createPortal(
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
            <div className="bg-[#111] border border-white/10 w-full max-w-sm p-8 rounded-3xl shadow-2xl text-center">
              <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-600/20 text-blue-500">
                <Users size={32} />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">
                AUTHENTICATION
              </h2>
              <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
                You must be part of the community to host a listening room. Please sign in or create an account.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate("/login")}
                  className="w-full py-4 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 transition-all active:scale-95"
                >
                  SIGN IN NOW
                </button>
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="w-full py-4 bg-transparent text-zinc-500 font-bold hover:text-white transition-all"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
