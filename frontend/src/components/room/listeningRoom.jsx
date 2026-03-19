import {
  Maximize2,
  Minimize2,
  Minus,
  Play,
  Pause,
  Music,
  ThumbsDown,
  ThumbsUp,
  Users,
  Settings,
  MessageSquare,
  X,
  ChevronLeft
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  addMusicToQueueAPI,
  deleteMusicFromQueueAPI,
  getRoomDetailsAPI,
  castVoteAPI,
} from "../../api/room";
import { usePlayer } from "../../context/PlayerContext";
import Chat from "../chats/chat";
import PlayerBar from "../PlayerBar";
import SearchBar from "../SearchBar";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const ROOM_WS_BASE = API_BASE.replace(/^http/, "ws");

const ListeningRoom = ({ roomName: propRoomName, onExit: propOnExit }) => {
  const { roomName: paramRoomName } = useParams();
  const navigate = useNavigate();
  const roomName = propRoomName || paramRoomName || "Global Room";
  const onExit = propOnExit || (() => navigate("/room"));

  const wsRef = useRef(null);
  const containerRef = useRef(null);
  const orderedPlaylistRef = useRef([]);
  const roomHostIdRef = useRef(null);
  const activeTrackIdRef = useRef(null);
  const isPlayingRef = useRef(false);
  const lastPausedSeekAtRef = useRef(0);
  const clientIdRef = useRef(
    localStorage.getItem("one_music_room_client_id") ||
      `client_${Math.random().toString(36).slice(2, 10)}`,
  );
  const user = useSelector((state) => state.user);
  const userId = user?.id || user?._id;
  const roomWsUrl = `${ROOM_WS_BASE}/room/${encodeURIComponent(roomName)}${userId ? `?userId=${userId}` : ""}`;

  const {
    setQueueAndPlay,
    playNext,
    playPrev,
    play,
    pause,
    togglePlayPause,
    activeTrack,
    isPlaying,
    shuffle,
    setShuffle,
    repeatMode,
    setRepeatMode,
    setVolume,
    seekToSeconds,
    getCurrentTimeSeconds,
    enterRoomMode,
    exitRoomMode,
  } = usePlayer();

  const [playlist, setPlaylist] = useState([]);
  const [activePermissions, setActivePermissions] = useState("Admin");
  const [userActive, setUserActive] = useState(0);
  const [trackVotes, setTrackVotes] = useState({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [roomHostId, setRoomHostId] = useState(null);
  const [activeUserIds, setActiveUserIds] = useState([]);
  const [roomListeners, setRoomListeners] = useState([]);
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const isRoomHost = Boolean(
    roomHostId && userId && String(roomHostId) === String(userId),
  );
  const canControlTransport = activePermissions === "Everyone" || isRoomHost;

  useEffect(() => {
    localStorage.setItem("one_music_room_client_id", clientIdRef.current);
    enterRoomMode();
    return () => {
      exitRoomMode();
    };
  }, []);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const sendRoomEvent = (payload) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(
      JSON.stringify({
        roomName,
        senderId: clientIdRef.current,
        sentAt: Date.now(),
        ...payload,
      }),
    );
  };

  const broadcastSyncState = (override = {}) => {
    sendRoomEvent({
      type: "sync_state",
      hostId: roomHostId || userId,
      trackId: activeTrackIdRef.current,
      currentTime: getCurrentTimeSeconds(),
      isPlaying: isPlayingRef.current,
      queue: orderedPlaylistRef.current,
      trackVotes, // Add back for real-time consistency
      ...override,
    });
  };

  const applyVote = (trackId, voterId, value) => {
    setTrackVotes((prev) => ({
      ...prev,
      [trackId]: {
        ...(prev[trackId] || {}),
        [voterId]: value,
      },
    }));
  };

  const getVoteScore = (trackId) => {
    const votes = trackVotes[trackId];
    if (!votes || typeof votes !== "object") return 0;
    return Object.values(votes).reduce(
      (sum, vote) => sum + Number(vote || 0),
      0,
    );
  };

  const orderedPlaylist = useMemo(() => {
    const list = [...playlist];
    list.sort((a, b) => getVoteScore(b.id) - getVoteScore(a.id));
    return list;
  }, [playlist, trackVotes, activeTrack?.id]);

  useEffect(() => {
    orderedPlaylistRef.current = orderedPlaylist;
  }, [orderedPlaylist]);

  useEffect(() => {
    roomHostIdRef.current = roomHostId;
  }, [roomHostId]);

  useEffect(() => {
    activeTrackIdRef.current = activeTrack?.id || null;
  }, [activeTrack?.id]);

  useEffect(() => {
    const ws = new WebSocket(roomWsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WS Connected:", roomName);
    };

    ws.onmessage = (msg) => {
      let payload = null;
      try {
        payload = JSON.parse(msg.data);
      } catch {
        return;
      }

      if (!payload || payload.roomName !== roomName) return;
      if (payload.senderId === clientIdRef.current) return;

      if (payload.type === "active_users") {
        setUserActive(payload.count);
        if (payload.activeUserIds) {
          setActiveUserIds(payload.activeUserIds);
        }
        return;
      }

      if (payload.type === "listeners_count" && typeof payload.count === "number") {
        setUserActive(payload.count);
        return;
      }

      if (payload.type === "track_select" && payload.trackId) {
        const syncedQueue =
          Array.isArray(payload.queue) && payload.queue.length
            ? payload.queue
            : orderedPlaylistRef.current;
        setPlaylist(syncedQueue);
        const index = syncedQueue.findIndex((track) => track.id === payload.trackId);
        if (index !== -1) setQueueAndPlay(syncedQueue, index);
        return;
      }

      if (payload.type === "play_pause") {
        const shouldPlay = Boolean(payload.shouldPlay);
        if (shouldPlay && !isPlayingRef.current) play();
        if (!shouldPlay && isPlayingRef.current) pause();
        isPlayingRef.current = shouldPlay;
        return;
      }

      if (payload.type === "next") {
        playNext();
        return;
      }

      if (payload.type === "prev") {
        playPrev();
        return;
      }

      if (payload.type === "vote_cast" && payload.trackId && payload.voterId) {
        applyVote(payload.trackId, payload.voterId, Number(payload.value || 0));
        return;
      }

      if (payload.type === "sync_state") {
        if (payload.trackVotes) {
          setTrackVotes((prev) => ({
            ...payload.trackVotes,
            ...prev,
          }));
        }
        const payloadHostId = payload.hostId ? String(payload.hostId) : null;
        if (
          roomHostIdRef.current &&
          payloadHostId &&
          payloadHostId !== String(roomHostIdRef.current)
        ) {
          return;
        }

        const syncQueue =
          Array.isArray(payload.queue) && payload.queue.length
            ? payload.queue
            : orderedPlaylistRef.current;

        if (syncQueue.length) {
          setPlaylist(syncQueue);
        }

        const now = Date.now();
        const sentAt = Number(payload.sentAt || 0);
        const networkDelay = sentAt > 0 ? Math.max(0, (now - sentAt) / 1000) : 0;
        const rawTime = Number(payload.currentTime || 0);
        const shouldPlay = Boolean(payload.isPlaying);
        const targetTime = shouldPlay
          ? rawTime + networkDelay
          : rawTime;

        const seekWithGuard = (time) => {
          const localTime = Number(getCurrentTimeSeconds() || 0);
          const drift = Math.abs(time - localTime);
          if (drift > 0.15) {
            seekToSeconds(time + 0.05); // slightly lookahead
          }
        };

        if (payload.trackId) {
          const localTrackId = activeTrackIdRef.current;
          if (localTrackId !== payload.trackId) {
            const idx = syncQueue.findIndex((track) => track.id === payload.trackId);
            if (idx !== -1) {
              setQueueAndPlay(syncQueue, idx);
              setTimeout(() => seekWithGuard(targetTime), 700);
              if (shouldPlay) {
                setTimeout(() => seekWithGuard(targetTime + 0.6), 1400);
              }
            }
          } else {
            if (shouldPlay) {
              seekWithGuard(targetTime);
            } else {
              const localTime = Number(getCurrentTimeSeconds() || 0);
              const drift = Math.abs(targetTime - localTime);
              const nowMs = Date.now();
              if (drift > 0.25 && nowMs - lastPausedSeekAtRef.current > 1500) {
                seekToSeconds(targetTime);
                lastPausedSeekAtRef.current = nowMs;
              }
            }
          }
        }

        if (shouldPlay && !isPlayingRef.current) play();
        if (!shouldPlay && isPlayingRef.current) pause();
      }
    };

    ws.onclose = () => console.log("WS Closed");
    ws.onerror = (err) => console.error("Room WS Error:", err);

    return () => {
      if (
        ws.readyState === WebSocket.CONNECTING ||
        ws.readyState === WebSocket.OPEN
      ) {
        ws.close();
      }
    };
  }, [roomName, roomWsUrl]);

  useEffect(() => {
    const loadRoom = async () => {
      try {
        const room = await getRoomDetailsAPI(roomName);
        setPlaylist(room.queue || []);
        
        // room.host is now populated as an object
        const hostId = room.host?._id || room.host;
        setRoomHostId(hostId);
        setRoomListeners(room.listeners || []);

        if (room.votes) {
          setTrackVotes((prev) => ({
            ...room.votes,
            ...prev,
          }));
        }
      } catch (err) {
        console.error("Room load failed:", err);
      }
    };
    loadRoom();
  }, [roomName]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    if (!isRoomHost || !activeTrack?.id) return;
    const heartbeatId = setInterval(() => {
      broadcastSyncState();
    }, 450);
    return () => clearInterval(heartbeatId);
  }, [activeTrack?.id, isRoomHost, roomHostId, userId]);

  const handleSelectTrack = (id, shouldSync = true, selectedQueue = orderedPlaylist) => {
    if (shouldSync && !isRoomHost) {
      showToast("Only the host can select tracks.");
      return;
    }
    const index = selectedQueue.findIndex((t) => t.id === id);
    if (index !== -1) setQueueAndPlay(selectedQueue, index);
    if (shouldSync) {
      sendRoomEvent({ type: "track_select", trackId: id, queue: selectedQueue });
      if (isRoomHost) {
        broadcastSyncState({
          trackId: id,
          currentTime: 0,
          isPlaying: true,
          queue: selectedQueue,
        });
      }
    }
  };

  const handleSelectFromSearch = async (track) => {
    if (!isRoomHost) {
      showToast("Only the host can add or play tracks from search.");
      return;
    }
    const alreadyExists = playlist.some((item) => item.id === track.id);
    if (alreadyExists) {
      handleSelectTrack(track.id);
      return;
    }

    try {
      const updatedRoom = await addMusicToQueueAPI(roomName, track);
      setPlaylist(updatedRoom.queue);
      sendRoomEvent({ type: "queue_replace", queue: updatedRoom.queue });

      const index = updatedRoom.queue.findIndex((t) => t.id === track.id);
      if (index !== -1) setQueueAndPlay(updatedRoom.queue, index);
      sendRoomEvent({
        type: "track_select",
        trackId: track.id,
        queue: updatedRoom.queue,
      });
      if (isRoomHost) {
        broadcastSyncState({
          trackId: track.id,
          currentTime: 0,
          isPlaying: true,
          queue: updatedRoom.queue,
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteFromPlaylist = async (songId) => {
    try {
      const updatedRoom = await deleteMusicFromQueueAPI(roomName, songId);
      setPlaylist(updatedRoom.queue);
      sendRoomEvent({ type: "queue_replace", queue: updatedRoom.queue });
      setTrackVotes((prev) => {
        const next = { ...prev };
        delete next[songId];
        return next;
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleVote = async (trackId, value) => {
    const voterId = userId || clientIdRef.current;
    if (!voterId) return;

    const currentVote = Number(trackVotes[trackId]?.[voterId] || 0);
    const nextVote = currentVote === value ? 0 : value;
    
    // Optimistic Update locally
    applyVote(trackId, voterId, nextVote);

    // WS broadcast
    sendRoomEvent({
      type: "vote_cast",
      trackId,
      voterId: voterId,
      value: nextVote,
    });

    // DB Persistence (only if logged in)
    if (userId) {
      try {
        await castVoteAPI(roomName, trackId, nextVote);
      } catch (error) {
        console.error("Failed to persist vote:", error);
      }
    }
  };

  const handlePlayPauseSync = () => {
    if (!canControlTransport) return;
    const targetPlayState = !isPlayingRef.current;
    togglePlayPause();
    sendRoomEvent({ type: "play_pause", shouldPlay: targetPlayState });
    if (isRoomHost) {
      broadcastSyncState({
        isPlaying: targetPlayState,
      });
    }
  };

  const handleNextSync = () => {
    if (!canControlTransport) return;
    playNext();
    sendRoomEvent({ type: "next" });
    if (isRoomHost) {
      broadcastSyncState();
    }
  };

  const handlePrevSync = () => {
    if (!canControlTransport) return;
    playPrev();
    sendRoomEvent({ type: "prev" });
    if (isRoomHost) {
      broadcastSyncState();
    }
  };

  const handleSeekSync = () => {
    if (!canControlTransport || !isRoomHost) return;
    broadcastSyncState();
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch (err) {
      console.error("Fullscreen failed:", err);
    }
  };

  const handleExit = () => {
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.CONNECTING ||
        wsRef.current.readyState === WebSocket.OPEN)
    ) {
      wsRef.current.close();
    }
    onExit();
  };

  return (
    <div ref={containerRef} className="flex h-full w-full bg-[#050505] text-white overflow-hidden relative">
      
      {/* Sidebar - Room Details (Hidden on mobile by default) */}
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

          <div className="space-y-8 flex-1 overflow-y-auto scrollbar-hide">
             <section>
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-bold mb-4 flex items-center gap-2">
                <Users size={12} /> Status
              </h3>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
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
                        className={`flex items-center justify-between p-2.5 rounded-2xl transition-all duration-300 ${
                          isHost 
                            ? "bg-[#04A72E]/20 border border-[#04A72E]/40" 
                            : isMe
                              ? "bg-blue-500/10 border border-blue-500/20"
                              : "border border-transparent"
                        } ${isOnline ? 'opacity-100' : 'opacity-40'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img 
                              src={listener.photoUrl || `https://ui-avatars.com/api/?name=${listener.firstName}+${listener.lastName}&background=random`} 
                              alt={listener.firstName} 
                              className={`w-8 h-8 rounded-full object-cover border-2 ${isOnline ? 'border-[#04A72E]' : 'border-zinc-700'}`}
                            />
                            {isOnline && (
                               <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#04A72E] rounded-full border-2 border-[#0a0a0a] animate-pulse"></div>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">
                              {listener.firstName} {listener.lastName} {isMe && <span className="text-blue-400 ml-1 text-[10px]">(You)</span>}
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
                className="hidden md:flex w-full py-3 bg-white/5 border border-white/5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white items-center justify-center gap-2 transition-colors"
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen player"}>
                {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                {isFullscreen ? "Window Mode" : "Fullscreen Mode"}
              </button>
              
              <button
                onClick={handleExit}
                className="w-full py-3 bg-red-500/10 border border-red-500/10 text-red-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/5">
                LEAVE ROOM
              </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-gradient-to-b from-[#0a0a0a] to-[#050505]">
        
        {/* Responsive Header for Mobile */}
        <header className="md:hidden flex items-center justify-between p-4 bg-black/40 backdrop-blur-md border-b border-white/5 sticky top-0 z-40">
           <button 
            onClick={onExit}
            className="p-2 text-zinc-400"
           >
             <ChevronLeft size={24} />
           </button>
           <h2 className="font-bold text-sm truncate px-4">#{roomName}</h2>
           <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowMobileSettings(true)}
                className="p-2 bg-white/5 rounded-full text-zinc-400"
              >
                <Settings size={20} />
              </button>
              <button 
                onClick={() => setShowMobileChat(true)}
                className="p-2 bg-white/5 rounded-full text-zinc-400 relative"
              >
                <MessageSquare size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#04A72E] rounded-full border border-black animate-pulse"></span>
              </button>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-hide p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Custom Search Integration */}
            <div className="relative group">
               <div className="absolute -inset-1 bg-gradient-to-r from-[#04A72E]/20 to-blue-500/20 rounded-3xl blur opacity-25 group-hover:opacity-100 transition duration-1000"></div>
               <div className="relative">
                  <SearchBar
                    onSelectTrack={handleSelectFromSearch}
                    playlist={playlist}
                  />
               </div>
            </div>

            {/* Playlist Section */}
            <section className="animate-in fade-in slide-in-from-bottom duration-700">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-500">Live Playlist</h3>
                 <span className="text-[10px] text-zinc-600 bg-white/5 px-2 py-0.5 rounded-full font-bold">{orderedPlaylist.length} Track{orderedPlaylist.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="space-y-2">
                {orderedPlaylist.length === 0 ? (
                   <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                      <Play size={40} className="mx-auto text-zinc-800 mb-4" />
                      <p className="text-zinc-600 font-medium">Add some music to start the party</p>
                   </div>
                ) : orderedPlaylist.map((track, index) => {
                  const isActive = activeTrack?.id === track.id;
                  const score = getVoteScore(track.id);
                  const localVote = Number(trackVotes[track.id]?.[userId] || trackVotes[track.id]?.[clientIdRef.current] || 0);

                  return (
                    <div
                      key={`${track.id}-${index}`}
                      onClick={() => handleSelectTrack(track.id, true, orderedPlaylist)}
                      className={`group relative flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-all duration-300 border ${
                        isActive
                          ? "bg-white/10 border-white/10 shadow-xl"
                          : "hover:bg-white/5 border-transparent"
                      }`}>
                      
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <img
                          src={track.imageUrl}
                          alt={track.title}
                          className={`w-full h-full rounded-xl object-cover transition-transform duration-500 ${isActive ? 'scale-90 rotate-3 shadow-[0_0_20px_rgba(4,167,46,0.3)]' : 'group-hover:scale-105'}`}
                        />
                        {isActive && (
                          <div className="absolute inset-0 bg-[#04A72E]/40 rounded-xl flex items-center justify-center">
                            {isPlaying ? (
                              <div className="flex gap-0.5 items-end h-3">
                                <div className="w-0.5 bg-white h-full animate-[bounce_0.6s_ease-in-out_infinite]"></div>
                                <div className="w-0.5 bg-white h-2/3 animate-[bounce_0.8s_ease-in-out_infinite]"></div>
                                <div className="w-0.5 bg-white h-full animate-[bounce_0.7s_ease-in-out_infinite]"></div>
                              </div>
                            ) : (
                              <Play size={16} fill="white" className="text-white" />
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-bold truncate ${isActive ? "text-[#04A72E]" : "text-white"}`}>
                          {track.title}
                        </h4>
                        <p className="text-[10px] text-zinc-500 tracking-wider font-bold uppercase truncate">
                          {track.artist || "Unknown Artist"}
                        </p>
                      </div>

                      <div className="hidden sm:block text-[10px] font-black text-zinc-700 tracking-widest bg-black/20 px-2 py-1 rounded-lg">
                        {isActive ? "PLAYING" : track.duration}
                      </div>

                      <div className="flex items-center bg-black/40 rounded-xl p-1 gap-1 border border-white/5 shadow-inner">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVote(track.id, 1);
                          }}
                          className={`p-1.5 rounded-lg transition-all ${
                            localVote === 1
                              ? "bg-[#04A72E] text-black shadow-lg shadow-[#04A72E]/20"
                              : "text-zinc-500 hover:text-white"
                          }`}>
                          <ThumbsUp size={14} />
                        </button>
                        
                        <span className={`text-[10px] font-black w-6 text-center ${score > 0 ? 'text-green-500' : score < 0 ? 'text-red-500' : 'text-zinc-600'}`}>
                          {score >= 0 ? `+${score}` : score}
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVote(track.id, -1);
                          }}
                          className={`p-1.5 rounded-lg transition-all ${
                            localVote === -1
                              ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                              : "text-zinc-500 hover:text-white"
                          }`}>
                          <ThumbsDown size={14} />
                        </button>
                      </div>

                      {(isRoomHost || canControlTransport) && (
                         <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFromPlaylist(track.id);
                          }} className="p-2 text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                          <Minus size={16} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>

        {/* Global Player Integration */}
        <div className="relative z-30">
           <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
           <PlayerBar
            activeTrack={activeTrack}
            onNext={handleNextSync}
            onPrev={handlePrevSync}
            onPlayPause={handlePlayPauseSync}
            onSeek={handleSeekSync}
            isPlaying={isPlaying}
            shuffle={shuffle}
            setShuffle={setShuffle}
            repeatMode={repeatMode}
            setRepeatMode={setRepeatMode}
            onVolumeChange={setVolume}
            isHost={isRoomHost}
            isRoomMode={true}
          />

          {toast && (
            <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-[#04A72E] text-black px-4 py-2 rounded-full font-bold text-xs shadow-2xl border border-white/20 whitespace-nowrap">
                {toast}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Desktop Chat (Sidebar) */}
      <aside className="hidden lg:block w-80 h-full border-l border-white/5 bg-[#050505]">
         <Chat roomName={roomName} />
      </aside>

      {/* Mobile Chat Slider */}
      <div className={`
        fixed inset-0 z-[60] transform transition-transform duration-300 ease-in-out md:hidden
        ${showMobileChat ? 'translate-x-0' : 'translate-x-full'}
      `}>
          <div className="h-full w-full bg-[#0a0a0a] flex flex-col shadow-2xl">
             <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <MessageSquare size={18} className="text-[#04A72E]" />
                   <h3 className="font-bold">Room Chat</h3>
                </div>
                <button onClick={() => setShowMobileChat(false)} className="p-2 text-zinc-500">
                   <X size={20} />
                </button>
             </div>
             <div className="flex-1 overflow-hidden">
                <Chat roomName={roomName} />
             </div>
          </div>
      </div>

    </div>
  );
};

export default ListeningRoom;
