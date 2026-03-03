const ChatRoom = require("../modules/chatRoom.js");

// ---------- Get all messages of a room ----------
exports.getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;

    let room = await ChatRoom.findOne({ roomId });

    if (!room) {
      return res.json([]); // Room not created yet
    }

    res.json(room.messages);

  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// ---------- Add a new message ----------
exports.addMessage = async (req, res) => {
  try {
    const { roomId, senderId, senderName, text } = req.body;

    let room = await ChatRoom.findOne({ roomId });

    if (!room) {
      // If room does not exist → create new
      room = await ChatRoom.create({
        roomId,
        messages: [{ senderId, senderName, text }],
      });
    } else {
      // Push new message to existing room
      room.messages.push({ senderId, senderName, text });
      await room.save();
    }

    res.json({ success: true, room });

  } catch (error) {
    console.error("Error adding message:", error);
    res.status(500).json({ error: "Server error" });
  }
};
