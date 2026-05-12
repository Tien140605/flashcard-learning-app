const express = require("express");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const User = require("../models/User");
const Card = require("../models/Card");
const ViewHistory = require("../models/ViewHistory");
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

/* Admin: view all users */
router.get("/users", verifyToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (err) {
    console.error("Admin get users error:", err);
    res.status(500).json({ message: "Failed to load users." });
  }
});

/* Admin: view one user's cards */
router.get("/users/:userId/cards", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const cards = await Card.find({ userId }).sort({ createdAt: -1 });

    res.json(cards);
  } catch (err) {
    console.error("Admin get user cards error:", err);
    res.status(500).json({ message: "Failed to load user cards." });
  }
});

/* Admin: add card for selected user */
router.post("/users/:userId/cards", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).json({
        message: "Question and answer are required.",
      });
    }

    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const newCard = new Card({
      userId,
      question,
      answer,
    });

    const savedCard = await newCard.save();

    res.status(201).json(savedCard);
  } catch (err) {
    console.error("Admin add card error:", err);
    res.status(500).json({ message: "Failed to add card for user." });
  }
});

/* Admin: edit any user's card */
router.put("/cards/:cardId", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { cardId } = req.params;
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).json({
        message: "Question and answer are required.",
      });
    }

    const oldCard = await Card.findById(cardId);

    if (!oldCard) {
      return res.status(404).json({
        message: "Card not found.",
      });
    }

    const updatedCard = await Card.findByIdAndUpdate(
      cardId,
      { question, answer },
      { new: true, runValidators: true }
    );

    await ViewHistory.updateMany(
      {
        $or: [
          { flashcardId: cardId },
          { flashcardId: new mongoose.Types.ObjectId(cardId) },
          { question: oldCard.question },
        ],
      },
      {
        $set: {
          question: updatedCard.question,
        },
      }
    );

    res.json(updatedCard);
  } catch (err) {
    console.error("Admin edit card error:", err);
    res.status(500).json({ message: "Failed to update card." });
  }
});

/* Admin: delete any user's card */
router.delete("/cards/:cardId", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { cardId } = req.params;

    const deletedCard = await Card.findByIdAndDelete(cardId);

    if (!deletedCard) {
      return res.status(404).json({
        message: "Card not found.",
      });
    }

    await ViewHistory.deleteMany({
      $or: [
        { flashcardId: cardId },
        { flashcardId: new mongoose.Types.ObjectId(cardId) },
      ],
    });

    res.json({ message: "Card deleted successfully by admin." });
  } catch (err) {
    console.error("Admin delete card error:", err);
    res.status(500).json({ message: "Failed to delete card." });
  }
});

/* Admin: change user's password */
router.put("/users/:userId/password", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        message: "New password is required.",
      });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({
        message: "Password must be at least 4 characters.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    res.json({
      message: "Password updated successfully.",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Admin change password error:", err);
    res.status(500).json({ message: "Failed to update password." });
  }
});

module.exports = router;