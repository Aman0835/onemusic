const express =require("express") ;
const { getMessages, addMessage } = require("../controllers/chats.controller.js");

const router = express.Router();

router.get("/:roomId", getMessages);
router.post("/send", addMessage);
router.post("/add", addMessage);

module.exports = router;
