const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const { startWebSocketServer } = require("./webSocket/chats");
const YTMusic = require("ytmusic-api");
const dataRoutes = require("./routes/data.routes");
const userRoutes = require("./routes/user.routes");
const { authRouter } = require("./routes/auth");
const roomRoutes = require("./routes/room.routes");
const chatRooms = require("./routes/chats.routes");




const app = express();
const ytmusic = new YTMusic();

const envOrigins = (process.env.CLIENT_ORIGIN || "")
.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

  const allowedOrigins = new Set([
    ...envOrigins,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://192.168.0.103:5173",
  ]);
  
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.has(origin)) {
          callback(null, true);
        } else {
          console.log("CORS Rejected for origin:", origin);
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    }),
  );
  app.use(express.json());
app.use(cookieParser());

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.get("/", (req, res) => {
  res.send("One Music Backend is Running ");
});

app.use("/api/data", dataRoutes);
app.use("/api/user", userRoutes);
app.use("/api/auth", authRouter);
app.use("/api/rooms", roomRoutes);
app.use("/api/chat", chatRooms);




app.get("/search", async (req, res) => {
  try {
    const query = req.query.q;

    const results = await ytmusic.search(query);

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

(async () => {
  await ytmusic.initialize();
  console.log("YT Music Ready");
})();

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});

try {
  startWebSocketServer(server);
} catch (err) {
  console.error("Failed to start WebSocket server:", err);
}

console.log("Starting Database Connection...");
connectDB()
  .then(() => {
    console.log("Database Connection Success");
  })
  .catch((err) => {
    console.error("Failed to connect to the database:", err);
  });
