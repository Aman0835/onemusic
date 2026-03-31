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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  addMusicToQueueAPI,
  deleteMusicFromQueueAPI,
  getRoomDetailsAPI,
  castVoteAPI,
} from "../../api/room";
import { API_BASE, WS_BASE } from "../../api/config";
import { usePlayer } from "../../context/PlayerContext";
import Chat from "../chats/chat";
import PlayerBar from "../PlayerBar";
import SearchBar from "../SearchBar";
import RoomSidebar from "./modules/RoomSidebar";
import RoomTrackItem from "./modules/RoomTrackItem";
import { useRoomSocket } from "./modules/useRoomSocket";
import ShareRoomModal from "./modules/ShareRoomModal";

const ROOM_API_BASE = API_BASE + "/api/rooms";
const ROOM_WS_BASE = WS_BASE;

const ListeningRoom = ({ onExit: propOnExit }) => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const onExit = propOnExit || (() => navigate("/room"));

  const [roomDetails, setRoomDetails] = useState(null);
  const roomNameDisplay = roomDetails?.name || "Loading...";

  const containerRef = useRef(null);
  const orderedPlaylistRef = useRef([]);
  const roomHostIdRef = useRef(null);
  const activeTrackIdRef = useRef(null);
  const isPlayingRef = useRef(false);
  const lastAutoSyncAtRef = useRef(0);
  const clientIdRef = useRef(
    localStorage.getItem("one_music_room_client_id") ||
      `client_${Math.random().toString(36).slice(2, 10)}`,
  );
  const user = useSelector((state) => state.user);
  const userId = user?.id || user?._id;
  const roomWsUrl = `${ROOM_WS_BASE}/room/${encodeURIComponent(roomId)}?userId=${clientIdRef.current}`;

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
    volume,
    seekToSeconds,
    getCurrentTimeSeconds,
    enterRoomMode,
    exitRoomMode,
    setRoomTrack,
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
  const [showShareModal, setShowShareModal] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const isRoomHost = useMemo(() => {
    if (!roomHostId || !userId) return false;
    const hostId = typeof roomHostId === 'object' ? (roomHostId?._id || roomHostId?.id) : roomHostId;
    const currentUserId = typeof userId === 'object' ? (userId?._id || userId?.id) : userId;
    return String(hostId) === String(currentUserId);
  }, [roomHostId, userId]);

  const canControlTransport = activePermissions === "Everyone" || isRoomHost;
  
  const {
    setIsHost,
  } = usePlayer();

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
    setIsHost(isRoomHost);
  }, [isRoomHost, setIsHost]);

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

  useEffect(() => {
    orderedPlaylistRef.current = orderedPlaylist;
  }, [orderedPlaylist]);

  // Keep PlayerContext queue in sync with dynamic Room Playlist (Votes/Likes)
  const { updateQueueOnly } = usePlayer();
  useEffect(() => {
    if (!orderedPlaylist.length || !activeTrack?.id) return;
    const newIdx = orderedPlaylist.findIndex(t => t.id === activeTrack.id);
    if (newIdx !== -1) {
      updateQueueOnly(orderedPlaylist, newIdx);
    }
  }, [orderedPlaylist, activeTrack?.id, updateQueueOnly]);

  const handleSocketMessage = useCallback((payload) => {
    if (payload.type === "active_users") {
      setUserActive(payload.count);
      if (payload.activeUserIds) setActiveUserIds(payload.activeUserIds);
      return;
    }
    if (payload.type === "listeners_count" && typeof payload.count === "number") {
      setUserActive(payload.count);
      return;
    }
    if (payload.type === "track_select" && payload.trackId) {
      const now = Date.now();
      const serverNow = now + (payload.clockOffset || 0);
      const sentAt = payload.serverSentAt || payload.sentAt || now;
      const delay = Math.max(0, (serverNow - sentAt) / 1000);

      const syncedQueue = Array.isArray(payload.queue) && payload.queue.length ? payload.queue : orderedPlaylistRef.current;
      setPlaylist(syncedQueue);
      const index = syncedQueue.findIndex((track) => track.id === payload.trackId);
      if (index !== -1) {
        setRoomTrack(syncedQueue[index]);
        setQueueAndPlay(syncedQueue, index);
        // Compensate for message travel time if starting a new track
        if (delay > 0.1) {
          setTimeout(() => seekToSeconds(delay + 0.1), 800);
        }
      }
      return;
    }
    if (payload.type === "play_pause") {
      const shouldPlay = Boolean(payload.shouldPlay);
      const now = Date.now();
      const serverNow = now + (payload.clockOffset || 0);
      const sentAt = payload.serverSentAt || payload.sentAt || now;
      const delay = Math.max(0, (serverNow - sentAt) / 1000);

      if (shouldPlay && !isPlayingRef.current) {
        play();
        // If it was a play command, seek forward slightly to match host
        if (delay > 0.1) {
           const currentTime = getCurrentTimeSeconds();
           seekToSeconds(currentTime + delay + 0.1);
        }
      }
      if (!shouldPlay && isPlayingRef.current) pause();
      isPlayingRef.current = shouldPlay;
      return;
    }
    if (payload.type === "next") { playNext(); return; }
    if (payload.type === "prev") { playPrev(); return; }
    if (payload.type === "vote_cast" && payload.trackId && payload.voterId) {
      applyVote(payload.trackId, payload.voterId, Number(payload.value || 0));
      return;
    }
    if (payload.type === "sync_state") {
      if (payload.trackVotes) {
        setTrackVotes((prev) => ({ ...payload.trackVotes, ...prev }));
      }
      const payloadHostId = payload.hostId ? String(payload.hostId) : null;
      if (roomHostIdRef.current && payloadHostId && payloadHostId !== String(roomHostIdRef.current)) {
        console.warn("Sync rejected: Host ID mismatch", { payloadHostId, expected: roomHostIdRef.current });
        return;
      }
      const syncQueue = Array.isArray(payload.queue) && payload.queue.length ? payload.queue : orderedPlaylistRef.current;
      if (syncQueue.length && syncQueue.length !== playlist.length) {
        setPlaylist(syncQueue);
      }
      
      const now = Date.now();
      const serverNow = now + (payload.clockOffset || 0);
      const sentAt = payload.serverSentAt || payload.sentAt || now;
      
      // Calculate how long ago the message was sent according to the server's clock
      const delayInSeconds = Math.max(0, (serverNow - sentAt) / 1000);
      
      const rawTime = Number(payload.currentTime || 0);
      const shouldPlay = Boolean(payload.isPlaying);
      
      // targetTime = time at host + transport delay
      const targetTime = shouldPlay ? rawTime + delayInSeconds : rawTime;

      const seekWithGuard = (time) => {
        const now = Date.now();
        // Cooldown: Don't auto-seek more than once every 5 seconds to prevent "lagging" stutter
        if (now - lastAutoSyncAtRef.current < 5000) return;

        const localTime = Number(getCurrentTimeSeconds() || 0);
        const isMobile = window.innerWidth < 768;
        // Relax threshold for mobile (1.2s) vs desktop (0.4s) to prevent jitter
        const threshold = isMobile ? 1.2 : 0.4;
        
        if (Math.abs(time - localTime) > threshold) {
          console.log(`[Sync] Drift detected: ${Math.abs(time - localTime).toFixed(2)}s. Seeking...`);
          seekToSeconds(time + (isMobile ? 0.15 : 0.05));
          lastAutoSyncAtRef.current = now;
        }
      };

      if (payload.trackId) {
        if (activeTrackIdRef.current !== payload.trackId) {
          const idx = syncQueue.findIndex((t) => t.id === payload.trackId);
          if (idx !== -1) {
            setRoomTrack(syncQueue[idx]);
            setQueueAndPlay(syncQueue, idx);
            setTimeout(() => seekWithGuard(targetTime), 700);
          }
        } else {
          if (shouldPlay) seekWithGuard(targetTime);
          else {
            const drift = Math.abs(targetTime - getCurrentTimeSeconds());
            if (drift > 0.25 && Date.now() - lastPausedSeekAtRef.current > 1500) {
              seekToSeconds(targetTime);
              lastPausedSeekAtRef.current = Date.now();
            }
          }
        }
      }
      if (shouldPlay && !isPlayingRef.current) play();
      if (!shouldPlay && isPlayingRef.current) pause();
    }
  }, [roomId, getCurrentTimeSeconds, play, pause, playNext, playPrev, setQueueAndPlay, seekToSeconds]);

  const { sendRoomEvent, broadcastSyncState } = useRoomSocket({
    roomId, userId, roomWsUrl, clientId: clientIdRef.current,
    onMessage: handleSocketMessage, isHost: isRoomHost,
    activeTrackId: activeTrack?.id, getCurrentTimeSeconds, isPlaying,
    orderedPlaylist, trackVotes, roomHostId
  });

  useEffect(() => {
    roomHostIdRef.current = roomHostId;
  }, [roomHostId]);

  useEffect(() => {
    activeTrackIdRef.current = activeTrack?.id || null;
  }, [activeTrack?.id]);

  useEffect(() => {
    const loadRoom = async () => {
      try {
        const room = await getRoomDetailsAPI(roomId);
        console.log("Room loaded:", room.name, "Host ID:", room.host?._id || room.host);
        setRoomDetails(room);
        setPlaylist(room.queue || []);
        setRoomHostId(room.host?._id || room.host);
        setRoomListeners(room.activeMembers || []);
        if (room.votes) setTrackVotes((prev) => ({ ...room.votes, ...prev }));
      } catch (err) { console.error("Room load failed:", err); }
    };
    loadRoom();
  }, [roomId]);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const handleSelectTrack = (id, shouldSync = true, passedQueue = null) => {
    const selectedQueue = passedQueue || orderedPlaylist;
    if (shouldSync && !isRoomHost) {
      showToast("Only the host can select tracks.");
      return;
    }
    const index = selectedQueue.findIndex((t) => t.id === id);
    if (index !== -1) {
      setRoomTrack(selectedQueue[index]);
      setQueueAndPlay(selectedQueue, index);
    }
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
      const updatedRoom = await addMusicToQueueAPI(roomId, track);
      setPlaylist(updatedRoom.queue);
      sendRoomEvent({ type: "queue_replace", queue: updatedRoom.queue });

      const index = updatedRoom.queue.findIndex((t) => t.id === track.id);
      if (index !== -1) {
        setRoomTrack(updatedRoom.queue[index]);
        setQueueAndPlay(updatedRoom.queue, index);
      }
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
    if (!canControlTransport && !isRoomHost) {
      showToast("Only the host can remove tracks.");
      return;
    }
    try {
      const updatedRoom = await deleteMusicFromQueueAPI(roomId, songId);
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
        await castVoteAPI(roomId, trackId, nextVote);
      } catch (error) {
        console.error("Failed to persist vote:", error);
      }
    }
  };

  const handlePlayPauseSync = () => {
    console.log("[Room] Play/Pause clicked. Host:", isRoomHost, "Can Control:", canControlTransport);
    if (!canControlTransport) {
      showToast("Only the host can control playback.");
      return;
    }
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
    setRoomTrack(null);
    onExit();
  };

  return (
    <div ref={containerRef} className="flex h-full w-full bg-[#050505] text-white overflow-hidden relative">
      
      {/* Sidebar - Room Details (Hidden on mobile by default) */}
      <RoomSidebar
        roomName={roomNameDisplay}
        userActive={userActive}
        roomListeners={roomListeners}
        roomHostId={roomHostId}
        activeUserIds={activeUserIds}
        userId={userId}
        showMobileSettings={showMobileSettings}
        setShowMobileSettings={setShowMobileSettings}
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
        handleExit={handleExit}
        onShare={() => setShowShareModal(true)}
      />

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
           <h2 className="font-bold text-sm truncate px-4">#{roomNameDisplay}</h2>
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
                ) : orderedPlaylist.map((track, index) => (
                  <RoomTrackItem
                    key={`${track.id}-${index}`}
                    track={track}
                    index={index}
                    isActive={activeTrack?.id === track.id}
                    isPlaying={isPlaying}
                    score={getVoteScore(track.id)}
                    localVote={Number(trackVotes[track.id]?.[userId] || trackVotes[track.id]?.[clientIdRef.current] || 0)}
                    handleSelectTrack={handleSelectTrack}
                    handleVote={handleVote}
                    handleDeleteFromPlaylist={handleDeleteFromPlaylist}
                    isRoomHost={isRoomHost}
                    canControlTransport={canControlTransport}
                  />
                ))}
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
            volume={volume}
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
         <Chat roomName={roomNameDisplay} />
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
                <Chat roomName={roomNameDisplay} />
             </div>
          </div>
      </div>

      {/* Share Room Modal */}
      {showShareModal && (
        <ShareRoomModal 
          roomName={roomNameDisplay} 
          onClose={() => setShowShareModal(false)} 
        />
      )}
    </div>
  );
};

export default ListeningRoom;
