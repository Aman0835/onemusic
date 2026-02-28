import { createContext, useContext, useEffect, useRef, useState } from "react";

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
        if (unstartedAttemptsRef.current <= 3) {
          playerRef.current.playVideo();
          return;
        }
        unstartedAttemptsRef.current = 0;
        if (repeatModeRef.current !== "one") playNext();
      }
    }, 900);
  };

  useEffect(() => {
    if (!activeTrack || !playerReady) return;
    unstartedAttemptsRef.current = 0;

    playerRef.current.loadVideoById(activeTrack.id);

    setTimeout(() => {
      try {
        playerRef.current.playVideo();
      } catch (e) {
        console.warn("Autoplay blocked, waiting for user interaction");
      }
    }, 400);
  }, [activeTrack, playerReady]);

  const togglePlayPause = () => {
    if (!playerRef.current || !window.YT) return;

    const state = playerRef.current.getPlayerState();
    if (state === window.YT.PlayerState.PLAYING) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  };

  const setVolume = (v) => {
    if (!playerRef.current) return;
    playerRef.current.unMute();
    playerRef.current.setVolume(v);
  };

  const setActiveTrack = (track) => {
    setQueue([track]);
    setCurrentIndex(0);
  };

  const setQueueAndPlay = (tracks, index) => {
    if (!Array.isArray(tracks) || tracks.length === 0) return;

    const selected = tracks[index];
    const filtered = tracks.filter((track) => track?.id);
    if (!filtered.length) return;

    const nextIndex = filtered.findIndex((track) => track.id === selected?.id);
    const safeIndex = nextIndex >= 0 ? nextIndex : 0;
    const targetTrack = filtered[safeIndex];

    // Try to start immediately on user click to avoid autoplay-policy timing issues.
    if (playerReady && playerRef.current && targetTrack?.id) {
      try {
        playerRef.current.loadVideoById(targetTrack.id);
        playerRef.current.playVideo();
      } catch (e) {
        console.warn("Immediate play failed, fallback to state-driven play");
      }
    }

    setQueue(filtered);
    setCurrentIndex(safeIndex);
  };

  const playNext = () => {
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
  };

  const playPrev = () => {
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
  };

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

  const seekToPercent = (percent) => {
    if (!playerRef.current || !duration) return;
    playerRef.current.seekTo(duration * percent, true);
  };

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
        playNext,
        playPrev,
        setVolume,
        setActiveTrack,
        setQueueAndPlay,
        shuffle,
        setShuffle,
        repeatMode,
        setRepeatMode,
      }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => useContext(PlayerContext);
