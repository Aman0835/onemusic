const  mongoose =require("mongoose");

const ChatMessageSchema = new mongoose.Schema({
  senderId: String,
  senderName: String,
  senderPhotoUrl: String,
  text: String,
  createdAt: { type: Date, default: Date.now }
});

const ChatRoomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  messages: [ChatMessageSchema]
});

module.exports= mongoose.model("ChatRoom", ChatRoomSchema);