const User = require("../modules/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey123";
const COOKIE_TIME = 7 * 24 * 60 * 60 * 1000;

exports.registerUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, gender } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Email & Password required" });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ error: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashed,
      firstName,
      lastName,
      gender,
    });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      maxAge: COOKIE_TIME,
    });

    res.json({
      message: "Signup successful",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        gender: user.gender,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Signup failed" });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ error: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      maxAge: COOKIE_TIME,
    });

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        gender: user.gender,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
};

exports.logoutUser = async (req, res) => {
  res.cookie("token", "", { maxAge: 1 });
  res.json({ message: "Logged out successfully" });
};