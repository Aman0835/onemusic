/**
 * Smart API Base URL detection.
 * Automatically switches between local and production based on the current window location.
 */
export const getApiBase = () => {
    // 1. Use the environment variable if available (Vite handles .env vs .env.production)
    if (import.meta.env.VITE_API_BASE) {
        return import.meta.env.VITE_API_BASE;
    }

    // 2. Smart Fallback: If we're on localhost but env var is missing, use local backend
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        return "http://localhost:5000";
    }

    // 3. Last resort fallback
    return "https://onemusic-ak80.onrender.com";
};

/**
 * Smart WebSocket Base URL detection.
 * Logic:
 * 1. Get the API base.
 * 2. Convert http to ws and https to wss.
 */
export const getWsBase = () => {
    const apiBase = getApiBase().replace(/\/$/, "");
    return apiBase.replace(/^http/, "ws");
};

export const API_BASE = getApiBase().replace(/\/$/, "");
export const WS_BASE = getWsBase();
