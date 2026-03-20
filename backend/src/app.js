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
  "http://localhost:5174",
]);

app.set("trust proxy", 1);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) {
        callback(null, true);
      } else {
        console.log("CORS Rejected for origin:", origin);
        callback(null, false); // Don't throw, just block origin
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "One Music Backend Live ",
  });
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

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    console.log("MongoDB Connected ");

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    try {
      startWebSocketServer(server);
    } catch (err) {
      console.error("WebSocket Error:", err);
    }
  })
  .catch((err) => {
    console.error("DB Connection Failed:", err);
  });

(async () => {
  try {
    await ytmusic.initialize();
    console.log("YT Music Ready ");
  } catch (err) {
    console.error("YTMusic Init Error:", err);
  }
})();