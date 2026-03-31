import {
  Pause,
  Play,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useState } from "react";

const PlayerBar = ({
  activeTrack,
  onNext,
  onPrev,
  onPlayPause,
  onSeek,
  isPlaying,
  onVolumeChange,
  shuffle,
  setShuffle,
  repeatMode,
  setRepeatMode,
  isRoomMode,
  isHost,
  volume,
}) => {
  const [oldVolume, setOldVolume] = useState(66);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const checkPermission = (action) => {
    if (isRoomMode && !isHost) {
      showToast("Only the host can control the room playback.");
      return false;
    }
    return true;
  };

  const toggleMute = () => {
    if (volume > 0) {
      setOldVolume(volume);
      onVolumeChange?.(0);
    } else {
      onVolumeChange?.(oldVolume);
    }
  };

  return (
    <footer className="w-full h-20 bg-black/40 backdrop-blur-xl border-t border-white/10 px-4 py-1.5 relative">
      <div className="h-full grid grid-cols-[auto_1fr_auto] items-center md:gap-8 gap-1">
      <div className="min-w-0 flex items-center gap-2 md:gap-3">
        {activeTrack && (
          <>
            <img
              src={activeTrack.imageUrl}
              alt={activeTrack.title}
              className="w-10 h-10 md:w-14 md:h-14 rounded-md object-cover shadow-md"
            />

            <div className="hidden md:flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-white font-semibold truncate max-w-[100px] sm:max-w-[140px] md:max-w-[200px]">
                  {activeTrack.title}
                </p>
                {isRoomMode && (
                  <span className="px-1.5 py-0.5 text-[9px] font-black bg-red-500/20 text-red-400 rounded-sm border border-red-500/30 uppercase tracking-wider shrink-0">
                    Live
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 truncate max-w-[120px] sm:max-w-[160px] md:max-w-[220px]">
                {activeTrack.subtitle || "Unknown Artist"}
              </p>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col items-center gap-1 w-full md:max-w-[700px] md:justify-self-center px-1 md:px-2">
        <div className="flex items-center justify-between md:justify-center w-full md:gap-6 px-2 md:px-0">
          <Shuffle
            size={16}
            onClick={() => {
              if (checkPermission("shuffle")) setShuffle(!shuffle);
            }}
            className={`cursor-pointer ${
              shuffle ? "text-green-500" : "text-zinc-500"
            }`}
          />

          <SkipBack
            size={18}
            onClick={() => {
              if (checkPermission("prev")) onPrev();
            }}
            className="cursor-pointer hover:text-white"
          />

          <button
            onClick={() => {
              if (checkPermission("play_pause")) onPlayPause();
            }}
            className="bg-white text-black rounded-full p-2 md:p-2.5 hover:scale-110">
            {isPlaying ? <Pause /> : <Play />}
          </button>

          <SkipForward
            size={18}
            onClick={() => {
              if (checkPermission("next")) onNext();
            }}
            className="cursor-pointer hover:text-white"
          />

          <button
            onClick={() => {
              if (!checkPermission("repeat")) return;
              if (repeatMode === "off") setRepeatMode("one");
              else if (repeatMode === "one") setRepeatMode("all");
              else setRepeatMode("off");
            }}
            className="relative cursor-pointer">
            {repeatMode === "off" && (
              <Repeat size={18} className="text-zinc-500" />
            )}

            {repeatMode === "one" && (
              <div className="relative">
                <Repeat size={18} className="text-green-500" />
                <span className="absolute -top-1 -right-1 text-[10px] font-bold bg-green-500 text-black rounded-full w-3 h-3 flex items-center justify-center">
                  1
                </span>
              </div>
            )}

            {repeatMode === "all" && (
              <Repeat size={18} className="text-blue-400" />
            )}
          </button>
        </div>

        {activeTrack && (
          <div className="flex items-center gap-2 w-full text-[10px] sm:text-xs text-zinc-400 px-1">
            <span>{activeTrack.currentTime}</span>

            <div
              className="relative w-full h-1 bg-zinc-700 rounded-full group cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                activeTrack.onSeek(percent);
                onSeek?.(percent);
              }}>
              <div
                className="absolute h-full bg-green-500 rounded-full"
                style={{ width: `${activeTrack.progress * 100}%` }}
              />

              <div
                className="absolute w-3 h-3 bg-white rounded-full -top-[5px] opacity-0 group-hover:opacity-100 transition"
                style={{ left: `calc(${activeTrack.progress * 100}% - 6px)` }}
              />
            </div>

            <span>{activeTrack.duration}</span>
          </div>
        )}
      </div>

      <div className="flex justify-end items-center gap-2 md:gap-4">
        {/* Mobile: Vertical Popup Slider */}
        <div className="relative group md:hidden flex items-center justify-center">
          <button
            onClick={toggleMute}
            className="p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 transition active:scale-95"
          >
            {volume === 0 ? (
              <VolumeX className="text-red-400" size={20} />
            ) : (
              <Volume2 className="text-green-400" size={20} />
            )}
          </button>

          {/* Vertical Volume Slider Popup */}
          <div className="absolute bottom-[120%] right-0 w-10 h-32 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50">
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => {
                const v = Number(e.target.value);
                onVolumeChange?.(v);
              }}
              className="w-24 h-1 absolute appearance-none cursor-pointer bg-white/10 rounded-full accent-[#04A72E]"
              style={{
                transform: "rotate(-90deg)",
                background: `linear-gradient(to right, #04A72E ${volume ?? 0}%, rgba(255,255,255,0.2) ${volume ?? 0}%)`,
              }}
            />
          </div>
        </div>

        {/* Desktop: Horizontal Slider */}
        <div className="hidden md:flex items-center justify-center gap-2">
          <button
            onClick={toggleMute}
            className="p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 transition active:scale-95"
          >
            {volume === 0 ? (
              <VolumeX className="text-red-400" size={20} />
            ) : (
              <Volume2 className="text-green-400" size={20} />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => {
              const v = Number(e.target.value);
              onVolumeChange?.(v);
            }}
            className="w-28 h-1 appearance-none cursor-pointer bg-white/10 rounded-full accent-[#04A72E]"
            style={{
              background: `linear-gradient(to right, #04A72E ${volume ?? 0}%, rgba(255,255,255,0.2) ${volume ?? 0}%)`,
            }}
          />
        </div>
      </div>
      </div>
      {toast && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-[#04A72E] text-black px-4 py-2 rounded-full font-bold text-xs shadow-2xl border border-white/20 whitespace-nowrap">
            {toast}
          </div>
        </div>
      )}
    </footer>
  );
};

export default PlayerBar;
