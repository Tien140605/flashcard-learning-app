const mongoose = require("mongoose");

const wrongCardSchema = new mongoose.Schema(
  {
    flashcardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Card",
    },

    question: {
      type: String,
      required: true,
    },

    answer: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const studySessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    totalCards: {
      type: Number,
      required: true,
    },

    correctCount: {
      type: Number,
      required: true,
    },

    wrongCount: {
      type: Number,
      required: true,
    },

    wrongCards: [wrongCardSchema],

    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StudySession", studySessionSchema);