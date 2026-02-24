const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword
    });

    await newUser.save();

    res.json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET PROFILE
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// SAVE ANIME
router.post("/save", auth, async (req, res) => {
  const { animeId, title, image } = req.body;

  try {
    const user = await User.findById(req.user.id);
    user.savedAnime.push({ animeId, title, image });
    await user.save();
    res.json({ message: "Anime saved" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// ADD WATCHLIST
router.post("/watchlist", auth, async (req, res) => {
  const { animeId, title, image } = req.body;

  try {
    const user = await User.findById(req.user.id);
    user.watchlist.push({ animeId, title, image });
    await user.save();
    res.json({ message: "Added to watchlist" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
