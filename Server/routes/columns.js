const express = require("express");
const auth = require("../middleware/auth");
const Board = require("../models/Board");
const Column = require("../models/Column");
const Card = require("../models/Card");

const router = express.Router();
router.use(auth);

// Helper: is this user a member of the board?
const getBoard = (boardId, userId) =>
  Board.findOne({ _id: boardId, members: userId });

// Get everything for one board (columns + cards)
router.get("/board/:boardId", async (req, res) => {
  try {
    const board = await getBoard(req.params.boardId, req.userId);
    if (!board) return res.status(404).json({ message: "Board not found" });
    const columns = await Column.find({ board: board._id }).sort("position");
    const cards = await Card.find({ board: board._id }).sort("position");
    res.json({ board, columns, cards });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Add a column
router.post("/board/:boardId", async (req, res) => {
  try {
    const board = await getBoard(req.params.boardId, req.userId);
    if (!board) return res.status(404).json({ message: "Board not found" });
    if (!req.body.title) return res.status(400).json({ message: "Title is required" });
    const count = await Column.countDocuments({ board: board._id });
    const column = await Column.create({
      title: req.body.title,
      board: board._id,
      position: count,
    });
    res.status(201).json(column);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Add a card to a column
router.post("/:columnId/cards", async (req, res) => {
  try {
    const column = await Column.findById(req.params.columnId);
    if (!column) return res.status(404).json({ message: "Column not found" });
    const board = await getBoard(column.board, req.userId);
    if (!board) return res.status(404).json({ message: "Board not found" });
    if (!req.body.title) return res.status(400).json({ message: "Title is required" });
    const count = await Card.countDocuments({ column: column._id });
    const card = await Card.create({
      title: req.body.title,
      description: req.body.description || "",
      column: column._id,
      board: board._id,
      position: count,
    });
    res.status(201).json(card);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;