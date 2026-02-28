const { WebSocketServer } = require("ws");

let wssInstance = null;

function startWebSocketServer(port = 5001) {
  if (wssInstance) {
    return wssInstance;
  }

  const wss = new WebSocketServer({ port });

  wss.on("connection", (socket) => {
    const userOnline = wss.clients.size;

    console.log("Client connected", "Total users:", userOnline);

    socket.on("message", (message) => {
      const text = message.toString();
      
      wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(text);
        }
      });
    });

    socket.on("close", () => {
      console.log("Client disconnected", "Users left:", wss.clients.size);
    });
  });

  console.log("WebSocket Server running on ws://localhost:" + port);
  wssInstance = wss;
  return wssInstance;
}

function getWebSocketServer() {
  return wssInstance;
}

module.exports = { startWebSocketServer, getWebSocketServer };
