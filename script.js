const API = "http://localhost:5000/cards";

let cards = [];
let showAnswer = null;

function showMessage(message, type = "success") {
  const box = document.getElementById("message");
  box.textContent = message;
  box.className = `message-box ${type}`;
  box.classList.remove("hidden");

  setTimeout(() => {
    box.classList.add("hidden");
  }, 2200);
}

async function fetchCards() {
  try {
    const res = await fetch(API);

    if (!res.ok) {
      throw new Error("Failed to fetch flashcards.");
    }

    cards = await res.json();
    showAnswer = null;
    render();
  } catch (error) {
    console.error("Error fetching cards:", error);
    showMessage("Could not load flashcards from the server.", "error");
  }
}

async function addCard() {
  const questionInput = document.getElementById("question");
  const answerInput = document.getElementById("answer");

  const question = questionInput.value.trim();
  const answer = answerInput.value.trim();

  if (!question || !answer) {
    showMessage("Please enter both question and answer.", "error");
    return;
  }

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question, answer }),
    });

    if (!res.ok) {
      throw new Error("Failed to add card.");
    }

    questionInput.value = "";
    answerInput.value = "";

    await fetchCards();
    showMessage("Flashcard added successfully.");
  } catch (error) {
    console.error("Error adding card:", error);
    showMessage("Failed to add flashcard.", "error");
  }
}

async function deleteCard(id) {
  try {
    const res = await fetch(`${API}/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error("Failed to delete card.");
    }

    cards = cards.filter((card) => card._id !== id);
    render();
    showMessage("Flashcard deleted.");
  } catch (error) {
    console.error("Error deleting card:", error);
    showMessage("Failed to delete flashcard.", "error");
  }
}

async function updateCard(id) {
  const card = cards.find((c) => c._id === id);

  const newQ = prompt("Edit question:", card?.question || "");
  if (newQ === null) return;

  const newA = prompt("Edit answer:", card?.answer || "");
  if (newA === null) return;

  if (!newQ.trim() || !newA.trim()) {
    showMessage("Question and answer cannot be empty.", "error");
    return;
  }

  try {
    const res = await fetch(`${API}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: newQ.trim(),
        answer: newA.trim(),
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to update card.");
    }

    await fetchCards();
    showMessage("Flashcard updated.");
  } catch (error) {
    console.error("Error updating card:", error);
    showMessage("Failed to update flashcard.", "error");
  }
}

function updateStats() {
  const stats = document.getElementById("stats");
  stats.textContent = `Cards remaining in this session: ${cards.length}`;
}

function render() {
  const container = document.getElementById("card-container");
  container.innerHTML = "";

  updateStats();

  if (cards.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No flashcards available</h3>
        <p>Add a new card above or reset the session.</p>
      </div>
    `;
    return;
  }

  cards.forEach((card) => {
    const div = document.createElement("div");
    div.className = "card";

    const isShowingAnswer = showAnswer === card._id;

    div.innerHTML = `
      <div class="card-content">
        <span class="card-label">${isShowingAnswer ? "Answer" : "Question"}</span>
        <p class="card-text">${isShowingAnswer ? card.answer : card.question}</p>
      </div>

      <div class="card-actions">
        <button class="delete-btn">Delete</button>
        <button class="edit-btn">Edit</button>
      </div>
    `;

    div.onclick = () => {
      if (showAnswer === card._id) return;

      showAnswer = card._id;
      render();

      setTimeout(() => {
        const currentCard = [...document.querySelectorAll(".card")].find(
          (_, index) => cards[index]?._id === card._id
        );

        if (currentCard) {
          currentCard.classList.add("fade-out");
        }

        setTimeout(() => {
          cards = cards.filter((c) => c._id !== card._id);
          if (showAnswer === card._id) showAnswer = null;
          render();
        }, 250);
      }, 1200);
    };

    div.querySelector(".delete-btn").onclick = (e) => {
      e.stopPropagation();
      deleteCard(card._id);
    };

    div.querySelector(".edit-btn").onclick = (e) => {
      e.stopPropagation();
      updateCard(card._id);
    };

    container.appendChild(div);
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const active = document.activeElement;
    if (active?.id === "question" || active?.id === "answer") {
      addCard();
    }
  }
});

fetchCards();