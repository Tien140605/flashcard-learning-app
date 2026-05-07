const express = require("express");
const mongoose = require("mongoose");
const ViewHistory = require("../models/ViewHistory");
const User = require("../models/User");
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

/* Save learning history when user reveals a flashcard */
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

/* Normal user: view their own history */
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

/* Admin: get all users list */
router.get("/users", verifyToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .select("username role createdAt")
      .sort({ username: 1 });

    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const totalViews = await ViewHistory.countDocuments({
          userId: user._id,
        });

        const uniqueCards = await ViewHistory.distinct("flashcardId", {
          userId: user._id,
        });

        return {
          id: user._id,
          username: user.username,
          role: user.role,
          totalViews,
          uniqueCards: uniqueCards.length,
        };
      })
    );

    res.json(usersWithStats);
  } catch (err) {
    console.error("Error loading users:", err);
    res.status(500).json({
      message: "Failed to load users.",
    });
  }
});

/* Admin: view one selected user's history */
router.get("/user/:userId", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const targetUser = await User.findById(userId).select("username role");

    if (!targetUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const history = await ViewHistory.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
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

    res.json({
      user: {
        id: targetUser._id,
        username: targetUser.username,
        role: targetUser.role,
      },
      history,
    });
  } catch (err) {
    console.error("Error loading selected user history:", err);
    res.status(500).json({
      message: "Failed to load selected user history.",
    });
  }
});

/* Optional old route: admin views everything */
router.get("/view_history", verifyToken, requireAdmin, async (req, res) => {
  try {
    const history = await ViewHistory.aggregate([
      {
        $group: {
          _id: {
            userId: "$userId",
            flashcardId: "$flashcardId",
          },
          userId: { $first: "$userId" },
          flashcardId: { $first: "$flashcardId" },
          question: { $first: "$question" },
          count: { $sum: 1 },
          viewedAt: { $max: "$viewedAt" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          flashcardId: 1,
          question: 1,
          count: 1,
          viewedAt: 1,
          username: "$user.username",
          role: "$user.role",
        },
      },
      {
        $sort: {
          username: 1,
          count: -1,
          viewedAt: -1,
        },
      },
    ]);

    res.json(history);
  } catch (err) {
    console.error("Error loading all users history:", err);
    res.status(500).json({
      message: "Failed to load all users history.",
    });
  }
});

module.exports = router;