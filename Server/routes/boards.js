const express = require("express");
const auth = require("../middleware/auth");
const Board = require("../models/Board");

const router = express.Router();
router.use(auth); // every route below requires login

router.post("/", async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ message: "Title is required" });
    const board = await Board.create({
      title,
      owner: req.userId,
      members: [req.userId],
    });
    res.status(201).json(board);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const boards = await Board.find({ members: req.userId }).sort({ createdAt: -1 });
    res.json(boards);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const board = await Board.findOne({ _id: req.params.id, members: req.userId });
    if (!board) return res.status(404).json({ message: "Board not found" });
    res.json(board);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;