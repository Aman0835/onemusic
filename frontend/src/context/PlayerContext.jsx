import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const PlayerContext = createContext();

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
  const activeTrack = queue[currentIndex] || null;

  const [isRoomMode, setIsRoomMode] = useState(false);
  const isRoomModeRef = useRef(false);
  
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
    }, 150);
  };

  useEffect(() => {
    if (!playerReady) return;

    if (!activeTrack) {
      if (playerRef.current && window.YT) {
        try {
          // If queue is completely empty, forcefully kill the active feed
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
    if (!playerRef.current) return;
    playerRef.current.unMute();
    playerRef.current.setVolume(v);
  }, [playerReady]);

  const setActiveTrack = useCallback((track) => {
    setQueue([track]);
    setCurrentIndex(0);
  }, []);

  const setQueueAndPlay = useCallback((tracks, index) => {
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
        playerRef.current.loadVideoById(targetTrack.id);
        playerRef.current.playVideo();
      } catch (e) {
        console.warn("Immediate play failed", e);
      }
    }
    setQueue(filtered);
    setCurrentIndex(safeIndex);
  }, [playerReady]);

  const enterRoomMode = useCallback(() => {
    if (isRoomModeRef.current) return;
    autoPlaySuppressRef.current = true;
    setTimeout(() => { autoPlaySuppressRef.current = false; }, 500);
    unstartedAttemptsRef.current = 0;
    if (playerReady && playerRef.current && window.YT) {
      try {
        const state = playerRef.current.getPlayerState();
        if (state === window.YT.PlayerState.PLAYING || state === window.YT.PlayerState.BUFFERING) {
          playerRef.current.stopVideo();
        }
      } catch (e) {}
    }
    setIsPlaying(false);
    setGlobalQueue(queueRef.current);
    globalQueueRef.current = queueRef.current;
    setGlobalCurrentIndex(currentIndexRef.current);
    globalCurrentIndexRef.current = currentIndexRef.current;
    setQueue([]);
    setCurrentIndex(-1);
    setIsRoomMode(true);
    isRoomModeRef.current = true;
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
      return;
    }

    if (index < list.length - 1) {
      setCurrentIndex(index + 1);
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
      return;
    }

    if (index > 0) {
      setCurrentIndex(index - 1);
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
      }}>
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
        dangerouslySetInnerHTML={{ __html: '<div id="yt-player"></div>' }}
      />
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => useContext(PlayerContext);
