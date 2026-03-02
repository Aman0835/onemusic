const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  listeners: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  queue: {
    type: Array,
    
    default: [],
  },
  currentSong: {
    type: Object,
    default: null,
  },
});

const Room = mongoose.model("Room", roomSchema);

module.exports = Room;
