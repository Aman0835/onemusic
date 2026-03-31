const express = require("express");
const authRouter = express.Router();
const User = require("../modules/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validateSingupData } = require("../helpers/validation");

const JWT_SECRET = (process.env.JWT_SECRET || "secretkey").trim();

function serializeUser(user) {
  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    gender: user.gender,
    photoUrl: user.photoUrl,
  };
}

async function signupHandler(req, res) {
  try {
    validateSingupData(req);
    const { password, firstName, lastName, email, gender, photoUrl } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      firstName,
      lastName,
      email,
      password: passwordHash,
      gender,
      photoUrl,
    });

    const findIdByemail = await User.findOne({ email: user.email });
    if (findIdByemail) {
      throw new Error("email already exists");
    }

    await user.save();
    const token = await user.getJWT();

    // Return token in response body — client stores in localStorage
    res.status(201).json({
      message: "User created successfully",
      token,
      user: serializeUser(user),
    });
  } catch (err) {
    res.status(400).json({ error: "Something went wrong: " + err.message });
  }
}

authRouter.post("/signup", signupHandler);
authRouter.post("/register", signupHandler);

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isPasswordMatch = await user.validatePassword(password);

    if (isPasswordMatch) {
      const token = await user.getJWT();
      // Return token in response body — client stores in localStorage
      res.status(200).json({
        message: "login successful",
        token,
        user: serializeUser(user),
      });
    } else {
      throw new Error("Invalid credentials");
    }
  } catch (err) {
    res.status(400).json({ error: "Something went wrong: " + err.message });
  }
});

// /me reads from Authorization: Bearer <token> header
authRouter.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded?._id || decoded?.id;
    if (!userId) return res.status(401).json({ error: "Invalid token" });

    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ error: "User not found" });

    return res.status(200).json({ user: serializeUser(user) });
  } catch (err) {
    return res.status(401).json({ error: "Invalid session" });
  }
});

authRouter.post("/logout", async (req, res) => {
  // With Bearer tokens, logout is handled on the client side (remove from localStorage)
  res.json({ message: "Logout successful" });
});

module.exports = { authRouter };
