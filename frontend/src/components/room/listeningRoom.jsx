import {
  Maximize2,
  Minimize2,
  Minus,
  Play,
  ThumbsDown,
  ThumbsUp,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  addMusicToQueueAPI,
  deleteMusicFromQueueAPI,
  getRoomDetailsAPI,
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
  const roomWsUrl = `${ROOM_WS_BASE}/room/${encodeURIComponent(roomName)}`;

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
  const user = useSelector((state) => state.user);
  const userId = user?.id || user?._id;

  const [playlist, setPlaylist] = useState([]);
  const [activePermissions, setActivePermissions] = useState("Admin");
  const [userActive, setUserActive] = useState(0);
  const [trackVotes, setTrackVotes] = useState({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [roomHostId, setRoomHostId] = useState(null);
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

  // Live listener count is now managed by backend WebSocket 'listeners_count' events

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

  const getVoteScore = (trackId) =>
    Object.values(trackVotes[trackId] || {}).reduce(
      (sum, vote) => sum + Number(vote || 0),
      0,
    );

  const orderedPlaylist = useMemo(() => {
    const list = [...playlist];
    list.sort((a, b) => {
      if (a.id === activeTrack?.id) return -1;
      if (b.id === activeTrack?.id) return 1;
      return getVoteScore(b.id) - getVoteScore(a.id);
    });
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

      if (payload.type === "listeners_count" && typeof payload.count === "number") {
        setUserActive(payload.count);
        return;
      }

      if (payload.type === "queue_replace" && Array.isArray(payload.queue)) {
        setPlaylist(payload.queue);
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
              // Avoid a jitter loop when paused near the end of a track.
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
      console.log("Leaving room -> Closing WebSocket");
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
        setRoomHostId(room.host || null);
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
    if (shouldSync && !canControlTransport) return;
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
    const alreadyExists = playlist.some((item) => item.id === track.id);

    if (alreadyExists) {
      // Just play the song instead of adding again
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

  const handleVote = (trackId, value) => {
    const currentVote = Number(trackVotes[trackId]?.[clientIdRef.current] || 0);
    const nextVote = currentVote === value ? 0 : value;
    applyVote(trackId, clientIdRef.current, nextVote);
    sendRoomEvent({
      type: "vote_cast",
      trackId,
      voterId: clientIdRef.current,
      value: nextVote,
    });
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

  return (
    <div ref={containerRef} className="flex h-full w-full text-gray-300 overflow-hidden">
      <aside className="w-64 border-r border-gray-800 p-4 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-sm font-bold truncate pr-2">
              #Room : {roomName}
            </h2>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleFullscreen}
                className="text-zinc-400 hover:text-white transition-colors"
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen player"}>
                {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>

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
          </div>

          <section className="mb-8">
            <h3 className="text-[10px] uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
              <Play size={10} fill="currentColor" /> Permissions
            </h3>
            <p className="text-xs text-zinc-400 normal-case mb-3 flex items-center gap-1">
              <Users size={12} /> {userActive} live listeners
            </p>
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
            {orderedPlaylist.map((track, index) => {
              const isActive = activeTrack?.id === track.id;
              const score = getVoteScore(track.id);
              const localVote = Number(trackVotes[track.id]?.[clientIdRef.current] || 0);

              return (
                <div
                  key={`${track.id}-${index}`}
                  onClick={() => handleSelectTrack(track.id, true, orderedPlaylist)}
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

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVote(track.id, 1);
                      }}
                      className={`p-1 rounded-full transition-colors ${
                        localVote === 1
                          ? "bg-green-500/20 text-green-400"
                          : "hover:bg-white/10 text-zinc-400"
                      }`}>
                      <ThumbsUp size={14} />
                    </button>
                    <span className="text-xs w-6 text-center">{score}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVote(track.id, -1);
                      }}
                      className={`p-1 rounded-full transition-colors ${
                        localVote === -1
                          ? "bg-red-500/20 text-red-400"
                          : "hover:bg-white/10 text-zinc-400"
                      }`}>
                      <ThumbsDown size={14} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFromPlaylist(track.id);
                      }} className="  hover:bg-red-50  transition-colors rounded-full p-1 cursor-pointer">
                      <Minus size={16} className="text-red-400 hover:text-[#1db954]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

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
        />
      </main>
      <Chat roomName={roomName} />
    </div>
  );
};

export default ListeningRoom;
