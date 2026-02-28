const express = require("express");
const router = express.Router();

const {
  home,
  library,
  artistArijit,
  album,
  roomPlaylist,
  search,
} = require("../controllers/music.controller");

router.get("/home", home);
router.get("/library", library);
router.get("/artist/arijit", artistArijit);
router.get("/album", album);
router.get("/room-playlist", roomPlaylist);
router.get("/search", search);

module.exports = router;
