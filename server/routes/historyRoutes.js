const express = require("express");
const mongoose = require("mongoose");
const ViewHistory = require("../models/ViewHistory");
const StudySession = require("../models/StudySession");
const User = require("../models/User");
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

/* Old simple card-view history route. Kept for compatibility. */
router.post("/", verifyToken, async (req, res) => {
  try {
    const { flashcardId, question } = req.body;

    if (!flashcardId || !question) {
      return res.status(400).json({
        message: "flashcardId and question are required.",
      });
    }

    const newHistory = new ViewHistory({
      userId: req.user._id,
      flashcardId: new mongoose.Types.ObjectId(flashcardId),
      question,
      viewedAt: new Date(),
    });

    await newHistory.save();

    res.status(201).json(newHistory);
  } catch (err) {
    console.error("Error recording history:", err);
    res.status(500).json({
      message: "Failed to record history.",
      error: err.message,
    });
  }
});

/* Save one completed learning session */
router.post("/session", verifyToken, async (req, res) => {
  try {
    const { totalCards, correctCount, wrongCards } = req.body;

    if (totalCards === undefined || correctCount === undefined) {
      return res.status(400).json({
        message: "totalCards and correctCount are required.",
      });
    }

    const safeWrongCards = Array.isArray(wrongCards) ? wrongCards : [];
    const wrongCount = safeWrongCards.length;

    const newSession = new StudySession({
      userId: req.user._id,
      totalCards,
      correctCount,
      wrongCount,
      wrongCards: safeWrongCards.map((card) => ({
        flashcardId: card.flashcardId
          ? new mongoose.Types.ObjectId(card.flashcardId)
          : undefined,
        question: card.question,
        answer: card.answer,
      })),
      completedAt: new Date(),
    });

    await newSession.save();

    res.status(201).json(newSession);
  } catch (err) {
    console.error("Error saving study session:", err);
    res.status(500).json({
      message: "Failed to save study session.",
      error: err.message,
    });
  }
});

/* Normal user: get their study sessions */
router.get("/my-sessions", verifyToken, async (req, res) => {
  try {
    const sessions = await StudySession.find({ userId: req.user._id })
      .sort({ completedAt: -1 })
      .select("totalCards correctCount wrongCount wrongCards completedAt createdAt");

    res.json(sessions);
  } catch (err) {
    console.error("Error loading my study sessions:", err);
    res.status(500).json({
      message: "Failed to load study sessions.",
    });
  }
});

/* Normal user/admin: get one session detail */
router.get("/session/:sessionId", verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await StudySession.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        message: "Study session not found.",
      });
    }

    const isOwner = String(session.userId) === String(req.user._id);
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "You do not have permission to view this session.",
      });
    }

    res.json(session);
  } catch (err) {
    console.error("Error loading session detail:", err);
    res.status(500).json({
      message: "Failed to load session detail.",
    });
  }
});

/* Admin: view selected user's study sessions */
router.get("/user/:userId", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const targetUser = await User.findById(userId).select("username role");

    if (!targetUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const sessions = await StudySession.find({ userId })
      .sort({ completedAt: -1 })
      .select("totalCards correctCount wrongCount wrongCards completedAt createdAt");

    res.json({
      user: {
        id: targetUser._id,
        username: targetUser.username,
        role: targetUser.role,
      },
      sessions,
    });
  } catch (err) {
    console.error("Error loading selected user sessions:", err);
    res.status(500).json({
      message: "Failed to load selected user's study sessions.",
    });
  }
});

/* Old route: normal user card-view history. Kept for backup compatibility. */
router.get("/my-history", verifyToken, async (req, res) => {
  try {
    const history = await ViewHistory.aggregate([
      {
        $match: {
          userId: req.user._id,
        },
      },
      {
        $group: {
          _id: "$flashcardId",
          flashcardId: { $first: "$flashcardId" },
          question: { $first: "$question" },
          count: { $sum: 1 },
          viewedAt: { $max: "$viewedAt" },
        },
      },
      {
        $sort: {
          count: -1,
          viewedAt: -1,
        },
      },
    ]);

    res.json(history);
  } catch (err) {
    console.error("Error loading my history:", err);
    res.status(500).json({
      message: "Failed to load history.",
    });
  }
});

module.exports = router;