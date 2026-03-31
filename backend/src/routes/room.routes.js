const express = require("express");
const {
  createRoom,
  getMyRooms,
  joinRoom,
  deleteRoom,
  addMusicToQueue,
  getRoomDetails,
  deleteMusicFromQueue,
  castVote,
} = require("../controllers/room.controller");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/create", authMiddleware, createRoom);
router.get("/my-rooms", authMiddleware, getMyRooms);
router.post("/:id/queue", authMiddleware, addMusicToQueue);
router.delete("/:id/queue/:songId", authMiddleware, deleteMusicFromQueue);
router.post("/:id/vote", authMiddleware, castVote);
router.post("/join", authMiddleware, joinRoom);
router.delete("/:id", authMiddleware, deleteRoom);
router.get("/:id", authMiddleware, getRoomDetails);

module.exports = router;
