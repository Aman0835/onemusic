import React from 'react';
import { Users, X, Minimize2, Maximize2 } from 'lucide-react';

const RoomSidebar = ({
  roomName,
  userActive,
  roomListeners,
  roomHostId,
  activeUserIds,
  userId,
  showMobileSettings,
  setShowMobileSettings,
  isFullscreen,
  toggleFullscreen,
  handleExit,
  onShare,
}) => {
  return (
    <aside className={`
      fixed inset-0 z-50 bg-[#0a0a0a] transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:w-64 md:border-r md:border-white/5 md:bg-transparent
      ${showMobileSettings ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    `}>
      <div className="flex flex-col h-full p-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-black tracking-tighter truncate text-[#04A72E]">
            #{roomName}
          </h2>
          <button onClick={() => setShowMobileSettings(false)} className="md:hidden text-zinc-500">
             <X size={20} />
          </button>
        </div>

        <div className="space-y-8 flex-1 overflow-y-auto scrollbar-hide text-left">
           <section>
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-bold mb-4 flex items-center gap-2">
              <Users size={12} /> Status
            </h3>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 transition-all hover:bg-white/10">
              <p className="text-2xl font-black mb-1">{userActive}</p>
              <p className="text-zinc-500 text-xs uppercase font-bold tracking-widest">Live Listeners</p>
            </div>
          </section>

          <section>
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-bold mb-4 flex items-center gap-2">
              <Users size={12} /> Listeners
            </h3>
            <div className="flex flex-col gap-3">
              {roomListeners.length === 0 ? (
                <p className="text-zinc-500 text-xs italic">No listeners yet.</p>
              ) : (
                [...roomListeners].sort((a, b) => {
                  const isHostA = String(a._id) === String(roomHostId);
                  const isHostB = String(b._id) === String(roomHostId);
                  if (isHostA) return -1;
                  if (isHostB) return 1;
                  const isOnlineA = activeUserIds.includes(String(a._id));
                  const isOnlineB = activeUserIds.includes(String(b._id));
                  if (isOnlineA && !isOnlineB) return -1;
                  if (!isOnlineA && isOnlineB) return 1;
                  return 0;
                }).map((listener) => {
                  const isOnline = activeUserIds.includes(String(listener._id));
                  const isHost = String(listener._id) === String(roomHostId);
                  const isMe = String(listener._id) === String(userId);
                  
                  return (
                    <div 
                      key={listener._id} 
                      className={`flex items-center justify-between p-2.5 rounded-2xl transition-all duration-300 group ${
                        isHost 
                          ? "bg-[#04A72E]/20 border border-[#04A72E]/40 shadow-[0_0_15px_rgba(4,167,46,0.1)]" 
                          : isMe
                            ? "bg-blue-500/10 border border-blue-500/20"
                            : "border border-transparent hover:bg-white/5"
                      } ${isOnline ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img 
                            src={listener.photoUrl || `https://ui-avatars.com/api/?name=${listener.firstName}+${listener.lastName}&background=random`} 
                            alt={listener.firstName} 
                            className={`w-8 h-8 rounded-full object-cover border-2 transition-transform duration-300 group-hover:scale-110 ${isOnline ? 'border-[#04A72E]' : 'border-zinc-700'}`}
                          />
                          {isOnline && (
                             <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#04A72E] rounded-full border-2 border-[#0a0a0a] animate-pulse"></div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate max-w-[80px]">
                            {listener.firstName} {isMe && <span className="text-blue-400 ml-1 text-[10px]">(You)</span>}
                          </p>
                          {isHost && (
                            <span className="text-[8px] text-[#04A72E] font-black uppercase tracking-tighter">Room Host</span>
                          )}
                        </div>
                      </div>
                      {isOnline ? (
                        <span className="text-[10px] text-[#04A72E] font-bold">Online</span>
                      ) : (
                        <span className="text-[10px] text-zinc-600 font-medium">Offline</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        <div className="pt-6 border-t border-white/5 flex flex-col gap-3">
            <button
              onClick={toggleFullscreen}
              className="hidden md:flex w-full py-3 bg-white/5 border border-white/5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white items-center justify-center gap-2 transition-all hover:bg-white/10"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen player"}>
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              {isFullscreen ? "Window Mode" : "Fullscreen Mode"}
            </button>

            <button
              onClick={onShare}
              className="w-full py-3 bg-[#04A72E]/10 border border-[#04A72E]/10 text-[#04A72E] rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#04A72E] hover:text-black transition-all">
              SHARE ROOM
            </button>
            
            <button
              onClick={handleExit}
              className="w-full py-3 bg-red-500/10 border border-red-500/10 text-red-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/5 hover:shadow-red-500/20">
              LEAVE ROOM
            </button>
        </div>
      </div>
    </aside>
  );
};

export default React.memo(RoomSidebar);
