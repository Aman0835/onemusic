const Room = require("../modules/room");

const createRoom = async (req, res) => {
  const userId = req.user._id;
  const { name } = req.body;

  try {
    const existing = await Room.findOne({ name });
    if (existing) return res.status(400).json({ error: "Room already exists" });

    const room = await Room.create({
      name,
      host: userId,
      listeners: [],
      queue: [],
      currentSong: null,
    });

    return res.json(room);
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
};

const getMyRooms = async (req, res) => {
  const userId = req.user._id;

  try {
    const rooms = await Room.find({ host: userId });
    return res.json(rooms);
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
};

const joinRoom = async (req, res) => {
  const { name } = req.body;
  const userId = req.user._id;

  try {
    const room = await Room.findOne({ name });
    if (!room) return res.status(404).json({ error: "Room not found" });

    if (!room.listeners.some((id) => id.toString() === userId.toString())) {
      room.listeners.push(userId);
      await room.save();
    }

    return res.json(room);
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
};

const deleteRoom = async (req, res) => {
  const { name } = req.params;
  const userId = req.user._id;

  try {
    const room = await Room.findOne({ name });
    if (!room) return res.status(404).json({ error: "Room not found" });

    if (room.host.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Only host can delete room" });
    }

    await Room.deleteOne({ name });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
};

const addMusicToQueue = async (req, res) => {
  const { name } = req.params;
  const { song } = req.body;
  const userId = req.user._id;

  try {
    const room = await Room.findOne({ name });
    if (!room) return res.status(404).json({ error: "Room not found" });
    const exists = room.queue.some((s) => s.id === song.id);

    if (exists) {
      return res.json(room); 
    }

    if (room.host.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ error: "Only host can add music to queue" });
    }

    room.queue.push(song);
    await room.save();

    return res.json(room);
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
};

const deleteMusicFromQueue = async (req, res) => {
  const { name, songId } = req.params;
  const userId = req.user._id;

  try {
    const room = await Room.findOne({ name });
    if (!room) return res.status(404).json({ error: "Room not found" });

    if (room.host.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ error: "Only host can delete music from queue" });
    }

    room.queue = room.queue.filter((s) => s.id !== songId);
    await room.save();

    return res.json(room);
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
};

const getRoomDetails = async (req, res) => {
  const { name } = req.params;

  try {
    const room = await Room.findOne({ name });
    if (!room) return res.status(404).json({ error: "Room not found" });

    res.json(room);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  createRoom,
  getMyRooms,
  joinRoom,
  deleteRoom,
  addMusicToQueue,
  getRoomDetails,
  deleteMusicFromQueue,
};
