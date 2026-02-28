const mongoose = require("mongoose");

const playlistSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    songs: [{ type: String }],
    description: { type: String, default: "" },
    coverImage: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Playlist", playlistSchema);
