const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  savedAnime: [
    {
      animeId: String,
      title: String,
      image: String
    }
  ],

  watchlist: [
    {
      animeId: String,
      title: String,
      image: String
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
