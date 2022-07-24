const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  isVerified: {
    type: Boolean,
    required: true,
    default: false,
  },

  password: {
    type: String,
    required: true,
    minLength: 5,
  },
});
userSchema.set("id", false);

const User = mongoose.model("User", userSchema);
module.exports = User;
