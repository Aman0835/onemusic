import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSpotifyAuth } from "../auth/spotify.jsx";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { handleCallback: spotifyHandleCallback } = useSpotifyAuth() || {};
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const runCallback = async () => {
      try {
        const search = window.location.search.substring(1);
        const queryParams = new URLSearchParams(search);
        const code = queryParams.get("code");
        if (!code) {
          throw new Error("No authorization code found");
        }
        if (!spotifyHandleCallback) {
          throw new Error("Spotify callback handler not available");
        }
        const ok = await spotifyHandleCallback();
        if (!ok) {
          throw new Error("Spotify token exchange failed");
        }
        navigate("/home", { replace: true });
      } catch (err) {
        console.error("Auth callback error:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    runCallback();
  }, [spotifyHandleCallback, navigate]);

  return (
    <div className="w-full h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-xl p-8 text-center">
        {loading && (
          <>
            <div className="mb-4">
              <div className="w-12 h-12 rounded-full border-4 border-orange-500/30 border-t-orange-500 animate-spin mx-auto"></div>
            </div>
            <h1 className="text-2xl font-bold mb-2">
              Connecting to Spotify
            </h1>
            <p className="text-zinc-400">
              Please wait while we authenticate you...
            </p>
          </>
        )}

        {error && (
          <>
            <h1 className="text-2xl font-bold mb-2 text-red-400">
              Authentication Failed
            </h1>
            <p className="text-zinc-400 mb-4">{error}</p>
            <button
              onClick={() => (window.location.href = "/login")}
              className="w-full bg-orange-500 text-white px-4 py-3 rounded-lg hover:bg-orange-600 font-semibold">
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
