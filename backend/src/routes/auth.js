const express = require("express");
const authRouter = express.Router();
const User = require("../modules/user");
const bcrypt = require("bcryptjs");          // ✅ FIXED
const { validateSingupData } = require("../helpers/validation");
const { registerUser, loginUser } = require("../controllers/user.controller");

authRouter.post("/register", registerUser);
authRouter.post("/login", loginUser);

authRouter.post("/signup", async (req, res) => {
  try {
    validateSingupData(req);

    const { password, firstName, lastName, email, gender } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).send("Email already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      firstName,
      lastName,
      email,
      password: passwordHash,
      gender,
    });

    await user.save();
    res.send("User created successfully");
  } catch (err) {
    res.status(400).send("Something went wrong: " + err.message);
  }
});

authRouter.post("/logout", (req, res) => {
  res.cookie("token", null, { expires: new Date(Date.now()) });
  res.send("Logout successful");
});

module.exports = {authRouter};