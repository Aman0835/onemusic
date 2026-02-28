import { LogIn } from "lucide-react";
import { buildAuthUrl } from "../auth/auth";
import { useSpotifyAuth } from "../auth/spotify.jsx";

export default function Login() {
  const { startLogin, profile } = useSpotifyAuth();

  return (
    <div className="w-full h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-xl p-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Sign in to Spotify</h1>
        <p className="text-zinc-400 mb-6">
          Connect your Spotify account to browse your music and control
          playback.
        </p>
        {!profile ? (
          <button
            onClick={startLogin}
            className="w-full flex items-center justify-center gap-2 bg-green-500 text-black px-4 py-3 rounded-lg hover:bg-green-400 font-semibold">
            <LogIn size={18} />
            Connect Spotify
          </button>
        ) : (
          <div className="bg-white/10 p-4 rounded-lg">
            <div className="flex items-center gap-3 justify-center">
              <img
                src={profile?.images?.[0]?.url || "/profile.png"}
                alt="pfp"
                className="w-8 h-8 rounded-full"
              />
              <div className="text-left">
                <div className="font-semibold">
                  {profile.display_name || profile.id}
                </div>
                <div className="text-xs text-zinc-400">You're connected</div>
              </div>
            </div>
            <p className="text-zinc-400 text-sm mt-4">
              You can now visit Home or Room to see your Spotify data.
            </p>
          </div>
        )}
        <div className="text-xs text-zinc-500 mt-6">
          If you see an “invalid redirect URI” error, make sure it exactly
          matches your current app URL.
        </div>
        
        {!profile && (
          <div className="mt-3 text-center">
            <a
              href={buildAuthUrl()}
              className="text-sm text-green-400 underline">
              Quick Connect (implicit)
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
