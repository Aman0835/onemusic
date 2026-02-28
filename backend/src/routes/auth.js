const express = require("express");
const authRouter = express.Router();
const User = require("../modles/user");
const bcrypt = require("bcrypt");
const { validateSingupData } = require("../helpers/validation");

authRouter.post("/signup", async (req, res) => {
  try {
    validateSingupData(req);
    const { password, firstName, lastName, email, gender } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      firstName,
      lastName,
      email,
      password: passwordHash,
      gender,
    });
    const findIdByemail = await User.findOne({ email: user.email });
    if (findIdByemail) {
      throw new Error("email already exists");
    }

    await user.save();
    res.send("User created successfully");
  } catch (err) {
    res.status(400).send("some thing went wrong " + err.message);
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error(" Invalid credentials");
    }
    const isPasswordMatch = await user.validatePassword(password);

    if (isPasswordMatch) {
      const token = await user.getJWT();

      res.cookie("token", token, {
        expires: new Date(Date.now() + 8 * 3600000),
      }); //8hr to expire cookie
      res.send(user);
    } else {
      throw new Error(" Invalid credentials");
    }
  } catch (err) {
    res.status(400).send("some thing went wrong " + err.message);
  }
});

authRouter.post("/logout", async (req, res) => {
  res.cookie("token", null, { expires: new Date(Date.now()) });
  res.send("logout successful");
});

module.exports = { authRouter };
