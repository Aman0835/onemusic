import React from 'react';
import { Play, Minus, ThumbsUp, ThumbsDown } from 'lucide-react';

const RoomTrackItem = ({
  track,
  index,
  isActive,
  isPlaying,
  score,
  localVote,
  handleSelectTrack,
  handleVote,
  handleDeleteFromPlaylist,
  isRoomHost,
  canControlTransport
}) => {
  return (
    <div
      onClick={() => handleSelectTrack(track.id, true)}
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
};

export default React.memo(RoomTrackItem);
