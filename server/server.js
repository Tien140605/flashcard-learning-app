const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const historyRoutes = require("./routes/historyRoutes");
const ViewHistory = require("./models/ViewHistory");
const { verifyToken } = require("./middleware/authMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/history", historyRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

const cardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    question: {
      type: String,
      required: true,
      trim: true,
    },

    answer: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const Card = mongoose.model("Card", cardSchema);

app.get("/", (req, res) => {
  res.send("API is running...");
});

/* Get only current user's cards */
app.get("/cards", verifyToken, async (req, res) => {
  try {
    const cards = await Card.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });

    res.json(cards);
  } catch (error) {
    console.error("Get cards error:", error);
    res.status(500).json({ message: error.message });
  }
});

/* Add card for current user only */
app.post("/cards", verifyToken, async (req, res) => {
  try {
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).json({
        message: "Question and answer are required",
      });
    }

    const newCard = new Card({
      userId: req.user._id,
      question,
      answer,
    });

    const savedCard = await newCard.save();
    res.status(201).json(savedCard);
  } catch (error) {
    console.error("Add card error:", error);
    res.status(400).json({ message: error.message });
  }
});

/* Update only current user's card */
app.put("/cards/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer } = req.body;

    const oldCard = await Card.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!oldCard) {
      return res.status(404).json({
        message: "Card not found or you do not have permission.",
      });
    }

    const updatedCard = await Card.findOneAndUpdate(
      {
        _id: id,
        userId: req.user._id,
      },
      {
        question,
        answer,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    await ViewHistory.updateMany(
      {
        userId: req.user._id,
        $or: [
          { flashcardId: id },
          { flashcardId: new mongoose.Types.ObjectId(id) },
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
  } catch (error) {
    console.error("Update card error:", error);
    res.status(400).json({ message: error.message });
  }
});

/* Delete only current user's card */
app.delete("/cards/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCard = await Card.findOneAndDelete({
      _id: id,
      userId: req.user._id,
    });

    if (!deletedCard) {
      return res.status(404).json({
        message: "Card not found or you do not have permission.",
      });
    }

    await ViewHistory.deleteMany({
      userId: req.user._id,
      $or: [
        { flashcardId: id },
        { flashcardId: new mongoose.Types.ObjectId(id) },
      ],
    });

    res.json({ message: "Card deleted successfully" });
  } catch (error) {
    console.error("Delete card error:", error);
    res.status(500).json({ message: error.message });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});