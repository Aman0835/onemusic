// @refresh reset
import { createContext, useCallback, useContext, useEffect, useRef, useState, memo } from "react";

const PlayerContext = createContext();

const YouTubePlayerContainer = memo(() => (
  <div
    style={{
      position: "fixed",
      top: "-9999px",
      left: "-9999px",
      width: "1px",
      height: "1px",
      opacity: 0.01,
      pointerEvents: "none",
    }}
  >
    <div id="yt-player"></div>
  </div>
));

export const PlayerProvider = ({ children }) => {
  const playerRef = useRef(null);
  const queueRef = useRef([]);
  const currentIndexRef = useRef(-1);
  const repeatModeRef = useRef("off");
  const shuffleRef = useRef(false);
  const unstartedAttemptsRef = useRef(0);
  const [playerReady, setPlayerReady] = useState(false);

  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isRoomMode, setIsRoomMode] = useState(false);
  const isRoomModeRef = useRef(false);
  const [roomTrack, setRoomTrack] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const isHostRef = useRef(false);
  
  const rawActiveTrack = isRoomMode ? roomTrack : (queue[currentIndex] || null);
  const activeTrack = rawActiveTrack;
  
  // Suppress immediate autoplay behaviors when migrating states
  const autoPlaySuppressRef = useRef(false);

  const [globalQueue, setGlobalQueue] = useState([]);
  const globalQueueRef = useRef([]);

  const [globalCurrentIndex, setGlobalCurrentIndex] = useState(-1);
  const globalCurrentIndexRef = useRef(-1);

  const [isPlaying, setIsPlaying] = useState(false);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolumeState] = useState(66);
  const volumeRef = useRef(66);

  const [repeatMode, setRepeatMode] = useState("off"); // off | one | all
  const [shuffle, setShuffle] = useState(false);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

  useEffect(() => {
    shuffleRef.current = shuffle;
  }, [shuffle]);

  const formatTime = (sec) => {
    if (!sec || isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }

    const waitForYT = () => {
      if (window.YT && window.YT.Player) createPlayer();
      else setTimeout(waitForYT, 100);
    };

    waitForYT();
  }, []);

  const createPlayer = () => {
    if (playerRef.current) return;

    playerRef.current = new window.YT.Player("yt-player", {
      height: "0",
      width: "0",
      videoId: "",
      events: {
        onReady: () => {
          setPlayerReady(true);
          playerRef.current.setVolume(66);
        },
        onStateChange: handleStateChange,
      },
    });
  };

  const handleStateChange = (event) => {
    if (!window.YT || !playerRef.current) return;

    const state = event.data;

    switch (state) {
      case window.YT.PlayerState.ENDED:
        if (repeatModeRef.current === "one") {
          playerRef.current.seekTo(0);
          playerRef.current.playVideo();
          return;
        }
        // In Room Mode, only the host triggers autoplay. 
        // Listeners wait for the host's sync message.
        if (isRoomModeRef.current && !isHostRef.current) {
          console.log("[PlayerContext] Song ended. Waiting for host to trigger next...");
          setIsPlaying(false); // Make sure we show play button
          return;
        }
        playNext();
        break;

      case window.YT.PlayerState.PLAYING:
        try { playerRef.current.unMute(); } catch(e) {}
        setIsPlaying(true);
        break;

      case window.YT.PlayerState.PAUSED:
        setIsPlaying(false);
        break;

      case window.YT.PlayerState.UNSTARTED:
        handleUnstarted();
        break;

      default:
        break;
    }
  };

  const handleUnstarted = () => {
    setTimeout(() => {
      const list = queueRef.current;
      const idx = currentIndexRef.current;
      const current = list[idx];
      if (!current?.id) return;

      const d = playerRef.current?.getDuration?.();

      if (!d) {
        unstartedAttemptsRef.current += 1;
        playerRef.current.playVideo();
        return;
      }

      if (d > 0) {
        unstartedAttemptsRef.current = 0;
        playerRef.current.playVideo();
        return;
      }

      // Some tracks report 0 briefly before metadata settles.
      if (d === 0) {
        unstartedAttemptsRef.current += 1;
        if (unstartedAttemptsRef.current <= 15) {
          playerRef.current.playVideo();
          return;
        }
        unstartedAttemptsRef.current = 0;
        if (repeatModeRef.current !== "one") playNext();
      }
    }, 350); // Increased buffer for mobile metadata settling
  };

  useEffect(() => {
    if (!playerReady) return;

    if (!activeTrack) {
      if (playerRef.current && window.YT) {
        try {
          // If in transition to/from Room Mode, don't stop immediately
          if (autoPlaySuppressRef.current) return;
          // If in Room Mode but waiting for initial track sync, don't stop
          if (isRoomModeRef.current && !roomTrack) return;

          playerRef.current.stopVideo();
        } catch (e) {
          console.warn("Failed to stop video on empty queue", e);
        }
      }
      return;
    }

    if (autoPlaySuppressRef.current) {
      console.log("Suppressed autoplay for track transition:", activeTrack.id);
      return;
    }

    const currentUrl = playerRef.current?.getVideoUrl?.() || "";
    const isNewTrack = !currentUrl.includes(activeTrack.id);

    unstartedAttemptsRef.current = 0;

    // Only load and auto-play if the track actually changed.
    if (isNewTrack) {
      playerRef.current.loadVideoById(activeTrack.id);
      try {
        playerRef.current.playVideo();
      } catch (e) {
        console.warn("Autoplay blocked, waiting for user interaction");
      }
    }
  }, [activeTrack, playerReady]);

  const togglePlayPause = useCallback(() => {
    if (!playerRef.current || !window.YT) return;
    const state = playerRef.current.getPlayerState();
    if (state === window.YT.PlayerState.PLAYING) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  }, [playerReady]);

  const play = useCallback(() => {
    if (!playerRef.current || !window.YT) return;
    try { playerRef.current.unMute(); } catch(e) {}
    playerRef.current.playVideo();
  }, [playerReady]);

  const pause = useCallback(() => {
    if (!playerRef.current || !window.YT) return;
    playerRef.current.pauseVideo();
  }, [playerReady]);

  const setVolume = useCallback((v) => {
    const val = Math.max(0, Math.min(100, v));
    setVolumeState(val);
    volumeRef.current = val;
    if (!playerRef.current) return;
    try {
      playerRef.current.unMute();
      playerRef.current.setVolume(val);
    } catch (e) {}
  }, [playerReady]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in an input/textarea
      if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;

      if (e.key === "ArrowUp" || e.key === "AudioVolumeUp") {
        e.preventDefault();
        setVolume(volumeRef.current + 5);
      } else if (e.key === "ArrowDown" || e.key === "AudioVolumeDown") {
        e.preventDefault();
        setVolume(volumeRef.current - 5);
      } else if (e.key.toLowerCase() === "m") {
        // Toggle Mute
        if (volumeRef.current > 0) {
          window._oldVol = volumeRef.current;
          setVolume(0);
        } else {
          setVolume(window._oldVol || 66);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setVolume]);

  const setActiveTrack = useCallback((track) => {
    setQueue([track]);
    setCurrentIndex(0);
  }, []);

  const setQueueAndPlay = useCallback((tracks, index, startSeconds = 0) => {
    if (!Array.isArray(tracks) || tracks.length === 0) return;
    const selected = tracks[index];
    const filtered = tracks.filter((track) => track?.id);
    if (!filtered.length) return;
    const nextIndex = filtered.findIndex((track) => track.id === selected?.id);
    const safeIndex = nextIndex >= 0 ? nextIndex : 0;
    const targetTrack = filtered[safeIndex];

    if (playerReady && playerRef.current && targetTrack?.id) {
      try {
        playerRef.current.unMute();
        if (startSeconds > 0) {
          playerRef.current.loadVideoById({ videoId: targetTrack.id, startSeconds });
        } else {
          playerRef.current.loadVideoById(targetTrack.id);
        }
        playerRef.current.playVideo();
      } catch (e) {
        console.warn("Immediate play failed", e);
      }
    }
    setQueue(filtered);
    setCurrentIndex(safeIndex);
  }, [playerReady]);

  const updateQueueOnly = useCallback((newQueue, newIndex) => {
    const filtered = (newQueue || []).filter(t => t?.id);
    setQueue(filtered);
    currentIndexRef.current = newIndex;
    setCurrentIndex(newIndex);
  }, []);

  const enterRoomMode = useCallback(() => {
    if (isRoomModeRef.current) return;
    setIsRoomMode(true);
    isRoomModeRef.current = true;
    
    autoPlaySuppressRef.current = true;
    setTimeout(() => { autoPlaySuppressRef.current = false; }, 800);
    unstartedAttemptsRef.current = 0;

    if (playerReady && playerRef.current && window.YT) {
      try {
        const state = playerRef.current.getPlayerState();
        if (state === window.YT.PlayerState.PLAYING || state === window.YT.PlayerState.BUFFERING) {
          playerRef.current.stopVideo();
        }
      } catch (e) {}
    }

    const state = playerRef.current?.getPlayerState?.();
    if (state !== window.YT?.PlayerState?.PLAYING && state !== window.YT?.PlayerState?.BUFFERING) {
      setIsPlaying(false);
    }

    setGlobalQueue(queueRef.current);
    globalQueueRef.current = queueRef.current;
    setGlobalCurrentIndex(currentIndexRef.current);
    globalCurrentIndexRef.current = currentIndexRef.current;
    setQueue([]);
    setCurrentIndex(-1);
  }, [playerReady]);

  const exitRoomMode = useCallback(() => {
    if (!isRoomModeRef.current) return;
    autoPlaySuppressRef.current = true;
    setTimeout(() => { autoPlaySuppressRef.current = false; }, 500);
    unstartedAttemptsRef.current = 0;
    const restoredQueue = globalQueueRef.current;
    if (!restoredQueue || restoredQueue.length === 0) {
      if (playerReady && playerRef.current) playerRef.current.stopVideo();
    }
    const restoredIndex = globalCurrentIndexRef.current;
    setQueue(restoredQueue);
    setCurrentIndex(restoredIndex);
    setIsRoomMode(false);
    isRoomModeRef.current = false;
    const resumedTrack = restoredQueue[restoredIndex];
    if (playerReady && playerRef.current && resumedTrack?.id) {
      setTimeout(() => {
        try { playerRef.current.cueVideoById(resumedTrack.id); } catch (e) {}
      }, 50);
    }
  }, [playerReady]);

  const playNext = useCallback(() => {
    const list = queueRef.current;
    const index = currentIndexRef.current;
    const mode = repeatModeRef.current;
    const isShuffle = shuffleRef.current;

    if (!list.length) return;

    if (mode === "one") {
      playerRef.current?.seekTo(0);
      playerRef.current?.playVideo();
      return;
    }

    if (isShuffle) {
      let next = Math.floor(Math.random() * list.length);
      if (next === index) next = (next + 1) % list.length;
      setCurrentIndex(next);
      if (isRoomModeRef.current) setRoomTrack(list[next]);
      return;
    }

    if (index < list.length - 1) {
      const nextIdx = index + 1;
      setCurrentIndex(nextIdx);
      if (isRoomModeRef.current) setRoomTrack(list[nextIdx]);
      return;
    }

    if (mode === "all") {
      setCurrentIndex(0);
    }
  }, []);

  const playPrev = useCallback(() => {
    const list = queueRef.current;
    const index = currentIndexRef.current;
    const mode = repeatModeRef.current;
    const isShuffle = shuffleRef.current;

    if (!list.length) return;

    if (mode === "one") {
      playerRef.current?.seekTo(0);
      playerRef.current?.playVideo();
      return;
    }

    if (isShuffle) {
      let prev = Math.floor(Math.random() * list.length);
      if (prev === index) prev = (prev + 1) % list.length;
      setCurrentIndex(prev);
      if (isRoomModeRef.current) setRoomTrack(list[prev]);
      return;
    }

    if (index > 0) {
      const prevIdx = index - 1;
      setCurrentIndex(prevIdx);
      if (isRoomModeRef.current) setRoomTrack(list[prevIdx]);
      return;
    }

    if (mode === "all") {
      setCurrentIndex(list.length - 1);
    }
  }, []);

  useEffect(() => {
    if (!playerReady) return;

    const interval = setInterval(() => {
      if (!playerRef.current) return;

      const c = playerRef.current.getCurrentTime?.() || 0;
      const d = playerRef.current.getDuration?.() || 0;

      setCurrentTime(c);
      setDuration(d);
      setProgress(d ? c / d : 0);
    }, 300);

    return () => clearInterval(interval);
  }, [playerReady]);

  const seekToPercent = useCallback((percent) => {
    if (!playerRef.current || !duration) return;
    playerRef.current.seekTo(duration * percent, true);
  }, [duration]);

  const seekToSeconds = useCallback((seconds) => {
    if (!playerRef.current) return;
    const safeSeconds = Math.max(0, Number(seconds) || 0);
    playerRef.current.seekTo(safeSeconds, true);
  }, []);

  const getCurrentTimeSeconds = useCallback(() => {
    if (!playerRef.current) return 0;
    return Number(playerRef.current.getCurrentTime?.() || 0);
  }, []);

  useEffect(() => {
    if (!navigator.mediaSession || !activeTrack) return;

    try {
      // 1. Update Metadata
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: activeTrack.title || "Unknown Title",
        artist: activeTrack.subtitle || "One Music Artist",
        album: activeTrack.album || "One Music",
        artwork: [
          { src: activeTrack.imageUrl || "/logo.png", sizes: "96x96", type: "image/png" },
          { src: activeTrack.imageUrl || "/logo.png", sizes: "128x128", type: "image/png" },
          { src: activeTrack.imageUrl || "/logo.png", sizes: "192x192", type: "image/png" },
          { src: activeTrack.imageUrl || "/logo.png", sizes: "256x256", type: "image/png" },
          { src: activeTrack.imageUrl || "/logo.png", sizes: "384x384", type: "image/png" },
          { src: activeTrack.imageUrl || "/logo.png", sizes: "512x512", type: "image/png" },
        ],
      });

      // 2. Set Action Handlers
      const actionHandlers = [
        ['play', play],
        ['pause', pause],
        ['previoustrack', playPrev],
        ['nexttrack', playNext],
        ['seekto', (details) => {
          if (details.seekTime !== undefined) seekToSeconds(details.seekTime);
        }],
      ];

      for (const [action, handler] of actionHandlers) {
        try {
          navigator.mediaSession.setActionHandler(action, handler);
        } catch (error) {
          console.warn(`The media session action "${action}" is not supported yet.`);
        }
      }

      // 3. Update Playback State
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";

    } catch (e) {
      console.error("MediaSession error:", e);
    }
  }, [activeTrack, isPlaying, play, pause, playNext, playPrev, seekToSeconds]);

  return (
    <PlayerContext.Provider
      value={{
        activeTrack: activeTrack
          ? {
              ...activeTrack,
              currentTime: formatTime(currentTime),
              duration: formatTime(duration),
              progress,
              onSeek: seekToPercent,
            }
          : null,
        isPlaying,
        togglePlayPause,
        play,
        pause,
        playNext,
        playPrev,
        volume,
        setVolume,
        setActiveTrack,
        setQueueAndPlay,
        seekToSeconds,
        getCurrentTimeSeconds,
        shuffle,
        setShuffle,
        repeatMode,
        setRepeatMode,
        isRoomMode,
        enterRoomMode,
        exitRoomMode,
        setRoomTrack,
        isHost,
        setIsHost: (val) => {
          setIsHost(val);
          isHostRef.current = val;
        },
        updateQueueOnly,
      }}>
      <YouTubePlayerContainer />
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => useContext(PlayerContext);
