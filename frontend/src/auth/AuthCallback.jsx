import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { saveToken } from "./auth";
import { useSpotifyAuth } from "./spotify.jsx";

function parseHashOrQuery() {
  const hash = window.location.hash.substring(1);
  const search = window.location.search.substring(1);
  const params = new URLSearchParams(hash || search);
  const access_token = params.get("access_token");
  const expires_in = params.get("expires_in")
    ? Number(params.get("expires_in"))
    : null;
  const code = params.get("code");
  return { access_token, expires_in, code };
}

export default function AuthCallback({ onAuthenticated }) {
  const navigate = useNavigate();
  const { handleCallback } = useSpotifyAuth() || {};

  useEffect(() => {
    const { access_token, expires_in, code } = parseHashOrQuery();
    if (access_token) {
      saveToken({ access_token, expires_in });
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      if (onAuthenticated) onAuthenticated(access_token);
      navigate("/home", { replace: true });
    } else if (code) {
      
      (async () => {
        if (handleCallback) {
          try {
            const ok = await handleCallback();
            if (ok && onAuthenticated) onAuthenticated();
            if (ok) navigate("/home", { replace: true });
          } catch (err) {
            console.error("Token exchange failed:", err);
          }
        } else {
          
          try {
            const resp = await fetch(
              `${import.meta.env.VITE_API_BASE || ""}/auth/exchange`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code }),
              },
            );
            const data = await resp.json();
            if (!resp.ok) {
              console.error("Token exchange failed", data);
              return;
            }
            saveToken({
              access_token: data.access_token,
              expires_in: data.expires_in,
              refresh_token: data.refresh_token,
            });
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
            if (onAuthenticated) onAuthenticated(data.access_token);
            navigate("/home", { replace: true });
          } catch (err) {
            console.error("Error exchanging code:", err);
          }
        }
      })();
    } else {
      console.error("No token or code found in URL");
    }
  }, [onAuthenticated, handleCallback]);

  return <div>Processing login...</div>;
}
