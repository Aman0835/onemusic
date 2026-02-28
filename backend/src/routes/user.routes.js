const express = require("express");
const app = express();
const { getWebSocketServer } = require("../webSocket/chats");



app.get("/user-connected", (req, res) => {
  const wss = getWebSocketServer();
  res.json({
    message: "User connected successfully",
    online: wss ? wss.clients.size : 0,
  });
});

module.exports = app;
