const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    column: { type: mongoose.Schema.Types.ObjectId, ref: "Column", required: true },
    board: { type: mongoose.Schema.Types.ObjectId, ref: "Board", required: true },
    position: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Card", cardSchema);