import { useEffect, useRef, useCallback } from 'react';

export const useRoomSocket = ({
  roomName,
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

  const sendRoomEvent = useCallback((payload) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(
      JSON.stringify({
        roomName,
        senderId: clientId,
        sentAt: Date.now(),
        ...payload,
      }),
    );
  }, [roomName, clientId]);

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

    ws.onopen = () => console.log("WS Connected:", roomName);
    ws.onmessage = (msg) => {
      let payload = null;
      try {
        payload = JSON.parse(msg.data);
      } catch {
        return;
      }
      if (!payload || payload.roomName !== roomName) return;
      if (payload.senderId === clientId) return;
      onMessage(payload);
    };
    ws.onclose = () => console.log("WS Closed");
    ws.onerror = (err) => console.error("Room WS Error:", err);

    return () => {
      if (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [roomName, roomWsUrl, clientId, onMessage]);

  useEffect(() => {
    if (!isHost || !activeTrackId) return;
    const heartbeatId = setInterval(() => {
      // console.log("Broadcasting Sync State:", roomName);
      broadcastSyncState();
    }, 350);
    return () => clearInterval(heartbeatId);
  }, [isHost, activeTrackId, broadcastSyncState]);

  return {
    sendRoomEvent,
    broadcastSyncState
  };
};
