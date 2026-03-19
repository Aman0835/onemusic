const { WebSocketServer } = require("ws");

function startWebSocketServer(server) {

  const roomWSS = new WebSocketServer({ noServer: true });
  const chatWSS = new WebSocketServer({ noServer: true });

  // ROOM
  const roomClients = new Map();

  roomWSS.on("connection", (socket, req) => {
    console.log("Connected to Room:", req.url);

    const url = new URL(req.url, "http://localhost");
    const urlParts = url.pathname.split("/");
    const roomName = decodeURIComponent(urlParts[urlParts.length - 1]);
    const userId = url.searchParams.get("userId");

    if (!roomClients.has(roomName)) {
      roomClients.set(roomName, new Set());
    }
    const clientsSet = roomClients.get(roomName);
    
    // Store userId on the socket for tracking
    if (userId) socket.userId = userId;
    clientsSet.add(socket);

    const broadcastActiveUsers = () => {
      const activeUserIds = Array.from(clientsSet)
        .map(c => c.userId)
        .filter(Boolean);
      
      // Get unique IDs
      const uniqueActiveIds = [...new Set(activeUserIds)];
      
      const msg = JSON.stringify({ 
        type: "active_users", 
        roomName, 
        count: clientsSet.size,
        activeUserIds: uniqueActiveIds 
      });
      
      clientsSet.forEach((c) => {
        if (c.readyState === 1) c.send(msg);
      });
    };

    broadcastActiveUsers();

    socket.on("message", (msg) => {
      clientsSet.forEach((c) => {
        if (c.readyState === 1) c.send(msg.toString());
      });
    });

    socket.on("close", () => {
      clientsSet.delete(socket);
      if (clientsSet.size === 0) {
        roomClients.delete(roomName);
      } else {
        broadcastActiveUsers();
      }
    });
  });

  // CHAT
  chatWSS.on("connection", (socket) => {
    console.log("Connected to Chat");
    socket.on("message", (msg) => {
      chatWSS.clients.forEach((c) => c.readyState === 1 && c.send(msg.toString()));
    });
  });

  // Route WebSocket upgrades
  server.on("upgrade", (req, socket, head) => {
    if (req.url.startsWith("/room")) {
      roomWSS.handleUpgrade(req, socket, head, (ws) =>
        roomWSS.emit("connection", ws, req)
      );
    } else if (req.url.startsWith("/ws/chat")) {
      chatWSS.handleUpgrade(req, socket, head, (ws) =>
        chatWSS.emit("connection", ws, req)
      );
    } else {
      socket.destroy();
    }
  });

  console.log("WebSocket Server Attached to Express Server");
}

module.exports = { startWebSocketServer };