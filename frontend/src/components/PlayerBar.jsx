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
  isPlaying,
  onVolumeChange,
  shuffle,
  setShuffle,
  repeatMode,
  setRepeatMode,
}) => {
  const [volume, setVolumeLocal] = useState(66);
  const [oldVolume, setOldVolume] = useState(66);

  const toggleMute = () => {
    if (volume > 0) {
      setOldVolume(volume);
      setVolumeLocal(0);
      onVolumeChange?.(0);
    } else {
      setVolumeLocal(oldVolume);
      onVolumeChange?.(oldVolume);
    }
  };

  return (
    <footer className="fixed bottom-0 left-16 md:left-60 right-0 h-24 bg-black/30 backdrop-blur-md border-t border-white/10">
      <div className="h-full grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-2 sm:px-4 md:px-6">
      <div className="min-w-0 flex items-center gap-2 md:gap-3">
        {activeTrack && (
          <>
            <img
              src={activeTrack.imageUrl}
              alt={activeTrack.title}
              className="w-10 h-10 md:w-14 md:h-14 rounded-md object-cover shadow-md"
            />

            <div className="hidden sm:flex flex-col min-w-0">
              <p className="text-white font-semibold truncate max-w-[160px] md:max-w-[220px]">
                {activeTrack.title}
              </p>
              <p className="text-xs text-gray-400 truncate max-w-[160px] md:max-w-[220px]">
                {activeTrack.subtitle || "Unknown Artist"}
              </p>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-3 md:gap-6">
          <Shuffle
            size={16}
            onClick={() => setShuffle(!shuffle)}
            className={`cursor-pointer ${
              shuffle ? "text-green-500" : "text-zinc-500"
            }`}
          />

          <SkipBack
            size={18}
            onClick={onPrev}
            className="cursor-pointer hover:text-white"
          />

          <button
            onClick={onPlayPause}
            className="bg-white text-black rounded-full p-2 md:p-2.5 hover:scale-110">
            {isPlaying ? <Pause /> : <Play />}
          </button>

          <SkipForward
            size={18}
            onClick={onNext}
            className="cursor-pointer hover:text-white"
          />

          <button
            onClick={() => {
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
          <div className="hidden sm:flex items-center gap-2 w-[280px] md:w-[420px] text-xs text-zinc-400">
            <span>{activeTrack.currentTime}</span>

            <div
              className="relative w-full h-1 bg-zinc-700 rounded-full group cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                activeTrack.onSeek(percent);
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
        {/* Mute / Unmute Button */}
        <button
          onClick={toggleMute}
          className="p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 transition">
          {volume === 0 ? (
            <VolumeX className="text-red-400" />
          ) : (
            <Volume2 className="text-green-400" />
          )}
        </button>

        {/* Themed Volume Slider */}
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => {
            const v = Number(e.target.value);
            setVolumeLocal(v);
            onVolumeChange?.(v);
          }}
          className="hidden md:block w-28 h-1 appearance-none cursor-pointer bg-white/10 rounded-full accent-[#04A72E]"
          style={{
            background: `linear-gradient(to right, #04A72E ${volume}%, rgba(255,255,255,0.2) ${volume}%)`,
          }}
        />
      </div>
      </div>
    </footer>
  );
};

export default PlayerBar;
