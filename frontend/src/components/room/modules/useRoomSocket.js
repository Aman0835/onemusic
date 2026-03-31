import { useEffect, useRef, useCallback } from 'react';

export const useRoomSocket = ({
  roomId,
  userId,
  roomWsUrl,
  clientId,
  onMessage,
  isHost,
  activeTrackId,
  getCurrentTimeSeconds,
  isPlaying,
  orderedPlaylist,
  trackVotes,
  roomHostId
}) => {
  const wsRef = useRef(null);
  const clockOffsetRef = useRef(0); // ServerTime - LocalTime
  const rttRef = useRef(0);

  const sendRoomEvent = useCallback((payload) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(
      JSON.stringify({
        roomId,
        senderId: clientId,
        sentAt: Date.now(),
        ...payload,
      }),
    );
  }, [roomId, clientId]);

  const broadcastSyncState = useCallback((override = {}) => {
    sendRoomEvent({
      type: "sync_state",
      hostId: roomHostId || userId,
      trackId: activeTrackId,
      currentTime: getCurrentTimeSeconds(),
      isPlaying: isPlaying,
      queue: orderedPlaylist,
      trackVotes,
      ...override,
    });
  }, [sendRoomEvent, roomHostId, userId, activeTrackId, getCurrentTimeSeconds, isPlaying, orderedPlaylist, trackVotes]);

  useEffect(() => {
    const ws = new WebSocket(roomWsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WS Connected:", roomId);
      // Perform initial clock sync
      ws.send(JSON.stringify({ type: "ping", clientTime: Date.now() }));
    };
    ws.onmessage = (msg) => {
      let payload = null;
      try {
        payload = JSON.parse(msg.data);
      } catch {
        return;
      }
      if (!payload || (payload.roomId !== roomId && payload.roomName !== roomId)) return;
      if (payload.senderId === clientId) return;

      // Handle clock sync pong
      if (payload.type === "pong") {
        const now = Date.now();
        const rtt = now - payload.clientTime;
        const offset = payload.serverTime - (payload.clientTime + rtt / 2);
        
        rttRef.current = rtt;
        clockOffsetRef.current = offset;
        // console.log(`Clock Synced. RTT: ${rtt}ms, Offset: ${offset}ms`);
        return;
      }

      onMessage({
        ...payload,
        clockOffset: clockOffsetRef.current
      });
    };
    ws.onclose = () => console.log("WS Closed");
    ws.onerror = (err) => console.error("Room WS Error:", err);

    return () => {
      if (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [roomId, roomWsUrl, clientId, onMessage]);

  useEffect(() => {
    if (!isHost || !activeTrackId) return;
    const heartbeatId = setInterval(() => {
      // Reduced frequency to 2000ms to avoid jitter and overhead
      broadcastSyncState();
    }, 2000);
    return () => clearInterval(heartbeatId);
  }, [isHost, activeTrackId, broadcastSyncState]);

  return {
    sendRoomEvent,
    broadcastSyncState
  };
};
