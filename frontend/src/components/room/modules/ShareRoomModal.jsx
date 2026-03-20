import React, { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { X, Copy, Check, Share2 } from "lucide-react";

export default function ShareRoomModal({ roomName, onClose }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = window.location.href;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-[32px] p-8 shadow-2xl animate-in zoom-in slide-in-from-bottom-4 duration-300">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-[#04A72E]/10 rounded-2xl flex items-center justify-center mb-6 border border-[#04A72E]/20">
            <Share2 className="text-[#04A72E]" size={24} />
          </div>

          <h3 className="text-xl font-black tracking-tight mb-2">Invite Friends</h3>
          <p className="text-zinc-500 text-sm mb-8">Scan to join the rhythm in <span className="text-white font-bold">#{roomName}</span></p>

          <div className="p-4 bg-white rounded-2xl mb-8 shadow-xl">
            <QRCodeCanvas 
              value={shareUrl} 
              size={180} 
              level="H"
              includeMargin={false}
              className="rounded-lg"
            />
          </div>

          <div className="w-full relative group">
            <input 
              readOnly
              value={shareUrl}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-4 pr-12 text-xs font-medium text-zinc-400 focus:outline-none"
            />
            <button 
              onClick={handleCopy}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all duration-300 ${
                copied ? "bg-[#04A72E] text-black" : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
          
          {copied && (
            <p className="text-[10px] font-black text-[#04A72E] uppercase tracking-widest mt-4 animate-in fade-in slide-in-from-top-1">
              Link Copied to Clipboard!
            </p>
          )}

          <button 
            onClick={onClose}
            className="w-full mt-6 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
