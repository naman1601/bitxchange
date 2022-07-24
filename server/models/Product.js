const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    required: true,
  },

  photos: {
    type: [String],
    validate: (v) => Array.isArray(v) && v.length > 0,
  },

  status: {
    type: String,
    enum: ["private", "public", "sold"],
    required: true,
  },

  price: {
    type: Number,
    min: 0,
    required: true,
  },

  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  tags: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],
    validate: (v) => Array.isArray(v) && v.length > 0,
  },
});
productSchema.set("id", false);

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
