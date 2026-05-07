import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const CARD_API = "http://localhost:5000/cards";
const AUTH_API = "http://localhost:5000/api/auth";
const HISTORY_API = "http://localhost:5000/api/history";

function App() {
  const [cards, setCards] = useState([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [search, setSearch] = useState("");

  const [authMode, setAuthMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyMode, setHistoryMode] = useState("my");

  const [adminUsers, setAdminUsers] = useState([]);
  const [selectedHistoryUser, setSelectedHistoryUser] = useState(null);

  const [revealedCardId, setRevealedCardId] = useState(null);

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    if (user) {
      fetchCards();
    } else {
      setCards([]);
    }
  }, [user]);

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const fetchCards = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setCards([]);
      return;
    }

    try {
      const res = await axios.get(CARD_API, getAuthHeader());
      setCards(res.data);
    } catch (err) {
      console.error("Error fetching cards:", err);
      setCards([]);
    }
  };

  const register = async () => {
    if (!username || !password) {
      alert("Please enter username and password.");
      return;
    }

    try {
      await axios.post(`${AUTH_API}/register`, { username, password });
      alert("Register successful. Please login.");
      setAuthMode("login");
      setUsername("");
      setPassword("");
    } catch (err) {
      alert(err.response?.data?.message || "Register failed.");
    }
  };

  const login = async () => {
    if (!username || !password) {
      alert("Please enter username and password.");
      return;
    }

    try {
      const res = await axios.post(`${AUTH_API}/login`, {
        username,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setUser(res.data.user);
      setUsername("");
      setPassword("");
    } catch (err) {
      alert(err.response?.data?.message || "Login failed.");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setCards([]);
    setHistory([]);
    setAdminUsers([]);
    setSelectedHistoryUser(null);
    setShowHistory(false);
    setHistoryMode("my");
    setRevealedCardId(null);
  };

  const addCard = async () => {
    if (!question || !answer) {
      alert("Please enter question and answer.");
      return;
    }

    try {
      const res = await axios.post(
        CARD_API,
        { question, answer },
        getAuthHeader()
      );

      setCards([res.data, ...cards]);
      setQuestion("");
      setAnswer("");
    } catch (err) {
      console.error("Error adding card:", err);
      alert(err.response?.data?.message || "Failed to add card.");
    }
  };

  const deleteCard = async (id) => {
    try {
      await axios.delete(`${CARD_API}/${id}`, getAuthHeader());

      setCards(cards.filter((card) => card._id !== id));

      if (revealedCardId === id) {
        setRevealedCardId(null);
      }
    } catch (err) {
      console.error("Error deleting card:", err);
      alert(err.response?.data?.message || "Failed to delete card.");
    }
  };

  const updateCard = async (id) => {
    const currentCard = cards.find((card) => card._id === id);

    const newQ = prompt("Edit question:", currentCard?.question || "");
    const newA = prompt("Edit answer:", currentCard?.answer || "");

    if (!newQ || !newA) return;

    try {
      const res = await axios.put(
        `${CARD_API}/${id}`,
        {
          question: newQ,
          answer: newA,
        },
        getAuthHeader()
      );

      setCards(cards.map((card) => (card._id === id ? res.data : card)));

      setHistory(
        history.map((item) =>
          String(item.flashcardId) === id || String(item._id) === id
            ? { ...item, question: res.data.question }
            : item
        )
      );
    } catch (err) {
      console.error("Error updating card:", err);
      alert(err.response?.data?.message || "Failed to update card.");
    }
  };

  const recordHistory = async (card) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await axios.post(
        HISTORY_API,
        {
          flashcardId: card._id,
          question: card.question,
        },
        getAuthHeader()
      );
    } catch (err) {
      console.error("Error recording history:", err);
    }
  };

  const handleCardClick = async (card) => {
    if (revealedCardId === card._id) {
      setRevealedCardId(null);
      return;
    }

    setRevealedCardId(card._id);
    await recordHistory(card);
  };

  const fetchMyHistory = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first.");
      return;
    }

    try {
      const res = await axios.get(`${HISTORY_API}/my-history`, getAuthHeader());

      setHistory(res.data);
      setAdminUsers([]);
      setSelectedHistoryUser(null);
      setHistoryMode("my");
      setShowHistory(true);
    } catch (err) {
      console.error("Error fetching my history:", err);
      alert("Failed to load history.");
    }
  };

  const fetchAllHistory = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first.");
      return;
    }

    try {
      const res = await axios.get(`${HISTORY_API}/users`, getAuthHeader());

      setAdminUsers(res.data);
      setHistory([]);
      setSelectedHistoryUser(null);
      setHistoryMode("all");
      setShowHistory(true);
    } catch (err) {
      console.error("Error fetching users:", err);
      alert(err.response?.data?.message || "Admin only. Failed to load users.");
    }
  };

  const fetchHistoryForUser = async (targetUser) => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first.");
      return;
    }

    try {
      const targetUserId = targetUser.id || targetUser._id;

      const res = await axios.get(
        `${HISTORY_API}/user/${targetUserId}`,
        getAuthHeader()
      );

      setSelectedHistoryUser(res.data.user);
      setHistory(res.data.history);
      setHistoryMode("all");
      setShowHistory(true);
    } catch (err) {
      console.error("Error fetching selected user history:", err);
      alert(
        err.response?.data?.message || "Failed to load selected user history."
      );
    }
  };

  const filteredCards = cards.filter((card) =>
    card.question.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="app">
      {!user ? (
        <div className="auth-page">
          <div className="auth-intro">
            <span className="badge">Study smarter</span>
            <h1>Flashcard Learning App</h1>
            <p>
              Create flashcards, reveal answers, and track your most studied
              cards in one simple dashboard.
            </p>
          </div>

          <div className="auth-card">
            <h2>{authMode === "login" ? "Welcome back" : "Create account"}</h2>

            <p className="muted-text">
              {authMode === "login"
                ? "Login to continue your study session."
                : "Register first, then login to start learning."}
            </p>

            <input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {authMode === "login" ? (
              <button className="primary-btn full" onClick={login}>
                Login
              </button>
            ) : (
              <button className="primary-btn full" onClick={register}>
                Register
              </button>
            )}

            <p className="switch-text">
              {authMode === "login"
                ? "No account yet?"
                : "Already have an account?"}{" "}
              <button
                className="link-btn"
                onClick={() =>
                  setAuthMode(authMode === "login" ? "register" : "login")
                }
              >
                {authMode === "login" ? "Register here" : "Login here"}
              </button>
            </p>
          </div>
        </div>
      ) : (
        <div className="dashboard">
          <header className="dashboard-header">
            <div>
              <span className="badge">Flashcard Dashboard</span>
              <h1>Flashcard Learning App</h1>
              <p>
                Logged in as <strong>{user.username}</strong>
                {user.role === "admin" && <strong> · Admin</strong>}
              </p>
            </div>

            <div className="header-actions">
              <button className="secondary-btn" onClick={fetchMyHistory}>
                My History
              </button>

              {user?.role === "admin" && (
                <button className="secondary-btn" onClick={fetchAllHistory}>
                  View All History
                </button>
              )}

              <button className="logout-btn" onClick={logout}>
                Logout
              </button>
            </div>
          </header>

          <section className="stats-grid">
            <div className="stat-card">
              <span>Total Cards</span>
              <strong>{cards.length}</strong>
            </div>

            <div className="stat-card">
              <span>Showing</span>
              <strong>{filteredCards.length}</strong>
            </div>

            <div className="stat-card">
              <span>History Items</span>
              <strong>{history.length}</strong>
            </div>
          </section>

          <section className="form-card">
            <div>
              <h2>Create a new flashcard</h2>
              <p>Add a question and answer for your study set.</p>
            </div>

            <div className="form-row pretty-form-row">
              <div className="input-field">
                <label>Question</label>
                <input
                  placeholder="Enter your flashcard question..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
              </div>

              <div className="input-field">
                <label>Answer</label>
                <input
                  placeholder="Enter the answer..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                />
              </div>

              <button className="primary-btn add-card-btn" onClick={addCard}>
                + Add Card
              </button>
            </div>
          </section>

          <input
            className="search"
            placeholder="Search flashcards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <section className="card-grid">
            {filteredCards.length === 0 ? (
              <div className="empty-card">
                <h3>No flashcards found</h3>
                <p>This account does not have flashcards yet.</p>
              </div>
            ) : (
              filteredCards.map((card) => (
                <div
                  className={`card ${
                    revealedCardId === card._id ? "revealed" : ""
                  }`}
                  key={card._id}
                  onClick={() => handleCardClick(card)}
                >
                  <div className="card-top">
                    <span>Question</span>
                  </div>

                  <h3>{card.question}</h3>

                  {revealedCardId === card._id ? (
                    <p className="answer">{card.answer}</p>
                  ) : (
                    <p className="hint">Click card to reveal answer</p>
                  )}

                  <div className="card-actions">
                    <button
                      className="edit-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateCard(card._id);
                      }}
                    >
                      Edit
                    </button>

                    <button
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCard(card._id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>

          {showHistory && (
            <div
              className="history-overlay"
              onClick={() => setShowHistory(false)}
            ></div>
          )}

          <aside className={`history-drawer ${showHistory ? "open" : ""}`}>
            <div className="history-header">
              <div>
                <h2>
                  {historyMode === "all"
                    ? selectedHistoryUser
                      ? `${selectedHistoryUser.username}'s History`
                      : "Select a User"
                    : "My Learning History"}
                </h2>

                <p>
                  {historyMode === "all"
                    ? selectedHistoryUser
                      ? "Admin view: selected user's studied flashcards."
                      : "Choose a user to view their learning history."
                    : "Cards are sorted by how many times you studied them."}
                </p>
              </div>

              <button
                className="close-btn"
                onClick={() => setShowHistory(false)}
              >
                ×
              </button>
            </div>

            <div className="history-list">
              {historyMode === "all" && !selectedHistoryUser ? (
                adminUsers.length === 0 ? (
                  <div className="empty-history">
                    <h3>No users found</h3>
                    <p>No users are available in the system.</p>
                  </div>
                ) : (
                  <div className="admin-user-list">
                    {adminUsers.map((adminUser) => (
                      <button
                        className="admin-user-card"
                        key={adminUser.id || adminUser._id}
                        onClick={() => fetchHistoryForUser(adminUser)}
                      >
                        <div>
                          <strong>{adminUser.username}</strong>
                          <span>{adminUser.role}</span>
                        </div>

                        <p>
                          {adminUser.totalViews} total views ·{" "}
                          {adminUser.uniqueCards} cards studied
                        </p>
                      </button>
                    ))}
                  </div>
                )
              ) : (
                <>
                  {historyMode === "all" && selectedHistoryUser && (
                    <button
                      className="back-user-btn"
                      onClick={() => {
                        setSelectedHistoryUser(null);
                        setHistory([]);
                      }}
                    >
                      ← Back to user list
                    </button>
                  )}

                  {history.length === 0 ? (
                    <div className="empty-history">
                      <h3>No history yet</h3>
                      <p>
                        {historyMode === "all"
                          ? "This user has not studied any flashcards yet."
                          : "Click a flashcard to reveal the answer and save history."}
                      </p>
                    </div>
                  ) : (
                    history.map((item, index) => (
                      <div
                        className="history-item"
                        key={`${
                          item.userId ||
                          selectedHistoryUser?.id ||
                          selectedHistoryUser?._id ||
                          user?.id ||
                          "user"
                        }-${item.flashcardId || item._id || "card"}-${index}`}
                      >
                        <strong>
                          #{index + 1} {item.question}
                        </strong>

                        <p>
                          Viewed {item.count || 1} times
                          <br />
                          Last viewed:{" "}
                          {item.viewedAt
                            ? new Date(item.viewedAt).toLocaleString()
                            : "Not available"}
                        </p>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

export default App;