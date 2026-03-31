const API = "http://localhost:5000/cards";

let cards = [];
let showAnswer = null;

// READ
async function fetchCards() {
  try {
    const res = await fetch(API);
    cards = await res.json();
    showAnswer = null;
    render();
  } catch (error) {
    console.error("Error fetching cards:", error);
  }
}

// CREATE
async function addCard() {
  const questionInput = document.getElementById("question");
  const answerInput = document.getElementById("answer");

  const question = questionInput.value.trim();
  const answer = answerInput.value.trim();

  if (!question || !answer) {
    alert("Please enter both question and answer.");
    return;
  }

  try {
    await fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question, answer }),
    });

    questionInput.value = "";
    answerInput.value = "";

    fetchCards();
  } catch (error) {
    console.error("Error adding card:", error);
  }
}

// DELETE
async function deleteCard(id) {
  try {
    await fetch(`${API}/${id}`, {
      method: "DELETE",
    });

    cards = cards.filter((card) => card._id !== id);
    render();
  } catch (error) {
    console.error("Error deleting card:", error);
  }
}

// UPDATE
async function updateCard(id) {
  const card = cards.find((c) => c._id === id);
  const newQ = prompt("Edit question:", card?.question || "");
  if (newQ === null) return;

  const newA = prompt("Edit answer:", card?.answer || "");
  if (newA === null) return;

  if (!newQ.trim() || !newA.trim()) {
    alert("Question and answer cannot be empty.");
    return;
  }

  try {
    await fetch(`${API}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question: newQ.trim(), answer: newA.trim() }),
    });

    fetchCards();
  } catch (error) {
    console.error("Error updating card:", error);
  }
}

function updateStats() {
  const stats = document.getElementById("stats");
  stats.textContent = `Cards remaining in this session: ${cards.length}`;
}

// RENDER
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

// Initial load
fetchCards();