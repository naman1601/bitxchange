const mongoose = require("mongoose");

const verificationTokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

verificationTokenSchema.set("id", false);
verificationTokenSchema.methods.isExpired = function () {
  const creationDate = this._id.getTimestamp();
  const currentDate = Date.now();
  return creationDate.getTime() + 24 * 60 * 60 * 1000 < currentDate;
};

const VerificationToken = mongoose.model(
  "VerificationToken",
  verificationTokenSchema
);
module.exports = VerificationToken;
