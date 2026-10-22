const express = require("express");
const auth = require("../middleware/auth");
const Board = require("../models/Board");
const Card = require("../models/Card");

const router = express.Router();
router.use(auth);

const getOwnCard = async (cardId, userId) => {
  const card = await Card.findById(cardId);
  if (!card) return null;
  const board = await Board.findOne({ _id: card.board, members: userId });
  return board ? card : null;
};

// Edit title/description, or move to another column/position
router.patch("/:id", async (req, res) => {
  try {
    const card = await getOwnCard(req.params.id, req.userId);
    if (!card) return res.status(404).json({ message: "Card not found" });
    const { title, description, column, position } = req.body;
    if (title !== undefined) card.title = title;
    if (description !== undefined) card.description = description;
    if (column !== undefined) card.column = column;
    if (position !== undefined) card.position = position;
    await card.save();
    res.json(card);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const card = await getOwnCard(req.params.id, req.userId);
    if (!card) return res.status(404).json({ message: "Card not found" });
    await card.deleteOne();
    res.json({ message: "Card deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;