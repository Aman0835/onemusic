const jwt = require("jsonwebtoken");
const User = require("../modules/user");

const JWT_SECRET = (process.env.JWT_SECRET || "secretkey").trim();

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      console.log("Auth Error: Missing token cookie. Origin:", req.get('origin'));
      return res.status(401).json({ error: "Not logged in" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded?._id || decoded?.id;
    if (!userId) return res.status(401).json({ error: "Invalid token" });

    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ error: "User not found" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid session" });
  }
};

module.exports = authMiddleware;
