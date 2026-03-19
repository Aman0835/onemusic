const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = (process.env.JWT_SECRET || "secretkey").trim();

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      minlength: [2, "first name must be at least 2 characters"],
      maxlength: [20],
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      minlength: [2],
      maxlength: [20],
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      toLowerCase: true,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      validate: {
        validator: function (v) {
          return validator.isStrongPassword(v);
        },
      },
    },
    gender: {
      type: String,
      validate(value) {
        if (!["male", "female", "other", "Male", "Female"].includes(value)) {
          throw new Error("invalid gender");
        }
      },
    },
    photoUrl: {
      type: String,
      default: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    }
  },
  {
    timestamps: true,
  }
);

userSchema.index({ firstName: 1, lastName: 1 });

userSchema.methods.getJWT = async function () {
  const user = this;

  const token = await jwt.sign({ _id: user._id }, JWT_SECRET, {
    expiresIn: "7d",
  });
  return token;
};

userSchema.methods.validatePassword = async function (passwordByUser) {
  const user = this;
  const hashedPassword = user.password;
  return await bcrypt.compare(passwordByUser, hashedPassword);
};

const User = mongoose.model("user", userSchema);

module.exports = User;
