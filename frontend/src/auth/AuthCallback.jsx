import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { saveToken } from "./auth";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hash.get("access_token");
      const expiresIn = hash.get("expires_in");
      const refreshToken = hash.get("refresh_token");

      if (accessToken) {
        saveToken({
          access_token: accessToken,
          expires_in: expiresIn ? Number(expiresIn) : undefined,
          refresh_token: refreshToken || undefined,
        });
      }
    } catch (err) {
      console.error("Auth callback parsing failed", err);
    } finally {
      navigate("/home", { replace: true });
    }
  }, [navigate]);

  return null;
}
