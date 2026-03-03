const express = require("express");
const {
  createRoom,
  getMyRooms,
  joinRoom,
  deleteRoom,
  addMusicToQueue,
  getRoomDetails,
  deleteMusicFromQueue,
} = require("../controllers/room.controller");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/create", authMiddleware, createRoom);
router.get("/my-rooms", authMiddleware, getMyRooms);
router.post("/:name/queue", authMiddleware, addMusicToQueue);
router.delete("/:name/queue/:songId", authMiddleware, deleteMusicFromQueue);
router.post("/join", authMiddleware, joinRoom);
router.delete("/:name", authMiddleware, deleteRoom);
router.get("/:name", authMiddleware, getRoomDetails);

module.exports = router;
