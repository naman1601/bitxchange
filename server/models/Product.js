const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  type: {
    type: String,
    enum: ["cycle", "smartphone"],
    required: true,
  },

  price: {
    type: Number,
    required: true,
  },

  description: {
    type: String,
    required: true,
  },

  photos: [
    {
      type: String,
    },
  ],
});

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
