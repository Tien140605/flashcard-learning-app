import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const CARD_API = "http://localhost:5000/cards";
const AUTH_API = "http://localhost:5000/api/auth";
const HISTORY_API = "http://localhost:5000/api/history";
const ADMIN_API = "http://localhost:5000/api/admin";

function App() {
  const [cards, setCards] = useState([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [search, setSearch] = useState("");

  const [authMode, setAuthMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [sessions, setSessions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  const [learningMode, setLearningMode] = useState(false);
  const [learningCards, setLearningCards] = useState([]);
  const [learningIndex, setLearningIndex] = useState(0);
  const [learningFlipped, setLearningFlipped] = useState(false);
  const [learningResults, setLearningResults] = useState([]);
  const [learningCompleted, setLearningCompleted] = useState(false);
  const [lastSavedSession, setLastSavedSession] = useState(null);

  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [selectedAdminUser, setSelectedAdminUser] = useState(null);
  const [adminCards, setAdminCards] = useState([]);
  const [adminUserHistory, setAdminUserHistory] = useState([]);
  const [selectedAdminSession, setSelectedAdminSession] = useState(null);
  const [adminQuestion, setAdminQuestion] = useState("");
  const [adminAnswer, setAdminAnswer] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminOpenSection, setAdminOpenSection] = useState(null);
  const [adminCardSearch, setAdminCardSearch] = useState("");

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
    setSessions([]);
    setShowHistory(false);
    setSelectedSession(null);

    setLearningMode(false);
    setLearningCards([]);
    setLearningIndex(0);
    setLearningFlipped(false);
    setLearningResults([]);
    setLearningCompleted(false);
    setLastSavedSession(null);

    setShowAdminPanel(false);
    setAdminUsers([]);
    setSelectedAdminUser(null);
    setAdminCards([]);
    setAdminUserHistory([]);
    setSelectedAdminSession(null);
    setAdminQuestion("");
    setAdminAnswer("");
    setAdminPassword("");
    setAdminOpenSection(null);
    setAdminCardSearch("");
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
    } catch (err) {
      console.error("Error updating card:", err);
      alert(err.response?.data?.message || "Failed to update card.");
    }
  };

  const shuffleCards = (cardList) => {
    const shuffled = [...cardList];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const randomIndex = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[randomIndex]] = [
        shuffled[randomIndex],
        shuffled[i],
      ];
    }

    return shuffled;
  };

  const startLearning = () => {
    if (cards.length === 0) {
      alert("Please add at least one flashcard before starting learning mode.");
      return;
    }

    const randomCards = shuffleCards(cards);

    setLearningCards(randomCards);
    setLearningMode(true);
    setLearningIndex(0);
    setLearningFlipped(false);
    setLearningResults([]);
    setLearningCompleted(false);
    setLastSavedSession(null);
  };

  const markLearningCard = async (isCorrect) => {
    const currentCard = learningCards[learningIndex];

    const updatedResults = [
      ...learningResults,
      {
        flashcardId: currentCard._id,
        question: currentCard.question,
        answer: currentCard.answer,
        isCorrect,
      },
    ];

    setLearningResults(updatedResults);

    if (learningIndex < learningCards.length - 1) {
      setLearningIndex(learningIndex + 1);
      setLearningFlipped(false);
      return;
    }

    await saveStudySession(updatedResults);
  };

  const saveStudySession = async (results) => {
    try {
      const correctCount = results.filter((item) => item.isCorrect).length;
      const wrongCards = results
        .filter((item) => !item.isCorrect)
        .map((item) => ({
          flashcardId: item.flashcardId,
          question: item.question,
          answer: item.answer,
        }));

      const res = await axios.post(
        `${HISTORY_API}/session`,
        {
          totalCards: results.length,
          correctCount,
          wrongCards,
        },
        getAuthHeader()
      );

      setLastSavedSession(res.data);
      setLearningCompleted(true);
      setLearningFlipped(false);
    } catch (err) {
      console.error("Error saving study session:", err);
      alert(err.response?.data?.message || "Failed to save study session.");
    }
  };

  const closeLearningMode = async () => {
    setLearningMode(false);
    setLearningCards([]);
    setLearningIndex(0);
    setLearningFlipped(false);
    setLearningResults([]);
    setLearningCompleted(false);
    setLastSavedSession(null);
    await fetchMyHistory(false);
  };

  const cancelLearningMode = () => {
    const confirmClose = window.confirm(
      "Are you sure you want to exit this learning session? Progress will not be saved."
    );

    if (!confirmClose) return;

    setLearningMode(false);
    setLearningCards([]);
    setLearningIndex(0);
    setLearningFlipped(false);
    setLearningResults([]);
    setLearningCompleted(false);
    setLastSavedSession(null);
  };

  const fetchMyHistory = async (openDrawer = true) => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first.");
      return;
    }

    try {
      const res = await axios.get(`${HISTORY_API}/my-sessions`, getAuthHeader());

      setSessions(res.data);
      setSelectedSession(null);

      if (openDrawer) {
        setShowHistory(true);
      }
    } catch (err) {
      console.error("Error fetching my study sessions:", err);
      alert("Failed to load study sessions.");
    }
  };

  const openAdminPanel = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first.");
      return;
    }

    try {
      const res = await axios.get(`${ADMIN_API}/users`, getAuthHeader());

      setAdminUsers(res.data);
      setSelectedAdminUser(null);
      setAdminCards([]);
      setAdminUserHistory([]);
      setSelectedAdminSession(null);
      setAdminQuestion("");
      setAdminAnswer("");
      setAdminPassword("");
      setAdminOpenSection(null);
      setAdminCardSearch("");
      setShowAdminPanel(true);
    } catch (err) {
      console.error("Error opening admin panel:", err);
      alert(err.response?.data?.message || "Admin only. Failed to open panel.");
    }
  };

  const fetchAdminUserData = async (targetUser) => {
    try {
      const targetUserId = targetUser.id || targetUser._id;

      const [cardsRes, historyRes] = await Promise.all([
        axios.get(`${ADMIN_API}/users/${targetUserId}/cards`, getAuthHeader()),
        axios.get(`${HISTORY_API}/user/${targetUserId}`, getAuthHeader()),
      ]);

      setSelectedAdminUser(targetUser);
      setAdminCards(cardsRes.data);
      setAdminUserHistory(historyRes.data.sessions || []);
      setSelectedAdminSession(null);
      setAdminQuestion("");
      setAdminAnswer("");
      setAdminPassword("");
      setAdminOpenSection(null);
      setAdminCardSearch("");
    } catch (err) {
      console.error("Error fetching admin user data:", err);
      alert(err.response?.data?.message || "Failed to load user data.");
    }
  };

  const adminAddCardForUser = async () => {
    if (!selectedAdminUser) {
      alert("Please select a user first.");
      return;
    }

    if (!adminQuestion || !adminAnswer) {
      alert("Please enter question and answer.");
      return;
    }

    try {
      const targetUserId = selectedAdminUser.id || selectedAdminUser._id;

      const res = await axios.post(
        `${ADMIN_API}/users/${targetUserId}/cards`,
        {
          question: adminQuestion,
          answer: adminAnswer,
        },
        getAuthHeader()
      );

      setAdminCards([res.data, ...adminCards]);
      setAdminQuestion("");
      setAdminAnswer("");
      setAdminOpenSection("cards");
      setAdminCardSearch("");

      if (String(targetUserId) === String(user.id)) {
        setCards([res.data, ...cards]);
      }

      alert("Card added for selected user.");
    } catch (err) {
      console.error("Admin add card error:", err);
      alert(err.response?.data?.message || "Failed to add card for user.");
    }
  };

  const adminEditCard = async (card) => {
    const newQ = prompt("Edit question:", card.question || "");
    const newA = prompt("Edit answer:", card.answer || "");

    if (!newQ || !newA) return;

    try {
      const res = await axios.put(
        `${ADMIN_API}/cards/${card._id}`,
        {
          question: newQ,
          answer: newA,
        },
        getAuthHeader()
      );

      setAdminCards(
        adminCards.map((item) => (item._id === card._id ? res.data : item))
      );

      setCards(cards.map((item) => (item._id === card._id ? res.data : item)));

      alert("Card updated by admin.");
    } catch (err) {
      console.error("Admin edit card error:", err);
      alert(err.response?.data?.message || "Failed to update card.");
    }
  };

  const adminDeleteCard = async (cardId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this user's card?"
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(`${ADMIN_API}/cards/${cardId}`, getAuthHeader());

      setAdminCards(adminCards.filter((card) => card._id !== cardId));
      setCards(cards.filter((card) => card._id !== cardId));

      alert("Card deleted by admin.");
    } catch (err) {
      console.error("Admin delete card error:", err);
      alert(err.response?.data?.message || "Failed to delete card.");
    }
  };

  const adminChangePassword = async () => {
    if (!selectedAdminUser) {
      alert("Please select a user first.");
      return;
    }

    if (!adminPassword) {
      alert("Please enter a new password.");
      return;
    }

    try {
      const targetUserId = selectedAdminUser.id || selectedAdminUser._id;

      await axios.put(
        `${ADMIN_API}/users/${targetUserId}/password`,
        {
          newPassword: adminPassword,
        },
        getAuthHeader()
      );

      setAdminPassword("");
      alert("Password updated successfully.");
    } catch (err) {
      console.error("Admin change password error:", err);
      alert(err.response?.data?.message || "Failed to update password.");
    }
  };

  const backToAdminUserList = () => {
    setSelectedAdminUser(null);
    setAdminCards([]);
    setAdminUserHistory([]);
    setSelectedAdminSession(null);
    setAdminPassword("");
    setAdminQuestion("");
    setAdminAnswer("");
    setAdminOpenSection(null);
    setAdminCardSearch("");
  };

  const filteredCards = cards.filter((card) => {
    const keyword = search.toLowerCase();

    return (
      card.question.toLowerCase().includes(keyword) ||
      card.answer.toLowerCase().includes(keyword)
    );
  });

  const filteredAdminCards = adminCards.filter((card) => {
    const keyword = adminCardSearch.toLowerCase();

    return (
      card.question.toLowerCase().includes(keyword) ||
      card.answer.toLowerCase().includes(keyword)
    );
  });

  const currentLearningCard = learningCards[learningIndex];
  const currentCorrectCount = learningResults.filter(
    (item) => item.isCorrect
  ).length;

  return (
    <div className="app">
      {!user ? (
        <div className="auth-page">
          <div className="auth-intro">
            <span className="badge">Study smarter</span>
            <h1>Flashcard Learning App</h1>
            <p>
              Create flashcards, review theory, complete learning sessions, and
              track wrong answers.
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
              <span className="badge">Theory Library</span>
              <h1>Flashcard Learning App</h1>
              <p>
                Logged in as <strong>{user.username}</strong>
                {user.role === "admin" && <strong> · Admin</strong>}
              </p>
            </div>

            <div className="header-actions">
              <button className="primary-btn" onClick={startLearning}>
                Start Learning
              </button>

              <button className="secondary-btn" onClick={() => fetchMyHistory()}>
                My History
              </button>

              {user?.role === "admin" && (
                <button className="secondary-btn" onClick={openAdminPanel}>
                  Admin Panel
                </button>
              )}

              <button className="logout-btn" onClick={logout}>
                Logout
              </button>
            </div>
          </header>

          <section className="stats-grid">
            <div className="stat-card">
              <span>Total Theory Cards</span>
              <strong>{cards.length}</strong>
            </div>

            <div className="stat-card">
              <span>Showing</span>
              <strong>{filteredCards.length}</strong>
            </div>

            <div className="stat-card">
              <span>Study Sessions</span>
              <strong>{sessions.length}</strong>
            </div>
          </section>

          <section className="form-card">
            <div>
              <h2>Create a new theory card</h2>
              <p>Add a question and answer to your theory library.</p>
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
            placeholder="Search theory cards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <section className="card-grid">
            {filteredCards.length === 0 ? (
              <div className="empty-card">
                <h3>No theory cards found</h3>
                <p>This account does not have theory cards yet.</p>
              </div>
            ) : (
              filteredCards.map((card) => (
                <div className="card theory-card" key={card._id}>
                  <div className="card-top">
                    <span>Theory Card</span>
                  </div>

                  <h3>{card.question}</h3>

                  <p className="answer theory-answer">{card.answer}</p>

                  <div className="card-actions">
                    <button
                      className="edit-btn"
                      onClick={() => updateCard(card._id)}
                    >
                      Edit
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() => deleteCard(card._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>

          {learningMode && (
            <div className="learning-overlay">
              <div className="learning-modal">
                {!learningCompleted ? (
                  <>
                    <div className="learning-header">
                      <div>
                        <span className="badge">Learning Mode</span>
                        <h2>
                          Card {learningIndex + 1} of {learningCards.length}
                        </h2>
                      </div>

                      <button className="close-btn" onClick={cancelLearningMode}>
                        ×
                      </button>
                    </div>

                    <div
                      className={`learning-card ${
                        learningFlipped ? "flipped" : ""
                      }`}
                      onClick={() => setLearningFlipped(true)}
                    >
                      {!learningFlipped ? (
                        <>
                          <span>Question</span>
                          <h3>{currentLearningCard?.question}</h3>
                          <p>Click this card to reveal the answer.</p>
                        </>
                      ) : (
                        <>
                          <span>Answer</span>
                          <h3>{currentLearningCard?.question}</h3>
                          <p>{currentLearningCard?.answer}</p>
                        </>
                      )}
                    </div>

                    {learningFlipped && (
                      <div className="learning-actions">
                        <button
                          className="wrong-btn"
                          onClick={() => markLearningCard(false)}
                        >
                          Wrong
                        </button>

                        <button
                          className="correct-btn"
                          onClick={() => markLearningCard(true)}
                        >
                          Correct
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="learning-header">
                      <div>
                        <span className="badge">Completed</span>
                        <h2>Study Session Finished</h2>
                      </div>

                      <button className="close-btn" onClick={closeLearningMode}>
                        ×
                      </button>
                    </div>

                    <div className="learning-summary">
                      <h3>
                        Result:{" "}
                        {lastSavedSession?.correctCount ?? currentCorrectCount} /{" "}
                        {lastSavedSession?.totalCards ?? learningResults.length}{" "}
                        correct
                      </h3>

                      <p>
                        Wrong answers:{" "}
                        {lastSavedSession?.wrongCount ??
                          learningResults.filter((item) => !item.isCorrect)
                            .length}
                      </p>

                      <button className="primary-btn full" onClick={closeLearningMode}>
                        Save and Close
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

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
                  {selectedSession ? "Wrong Answers" : "My Learning History"}
                </h2>
                <p>
                  {selectedSession
                    ? "Review the questions you marked as wrong."
                    : "Each item is one completed study session."}
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
              {selectedSession ? (
                <>
                  <button
                    className="back-user-btn"
                    onClick={() => setSelectedSession(null)}
                  >
                    ← Back to sessions
                  </button>

                  {selectedSession.wrongCards.length === 0 ? (
                    <div className="empty-history">
                      <h3>No wrong answers</h3>
                      <p>You answered all cards correctly in this session.</p>
                    </div>
                  ) : (
                    selectedSession.wrongCards.map((card, index) => (
                      <div
                        className="history-item"
                        key={`${card.flashcardId}-${index}`}
                      >
                        <strong>
                          #{index + 1} {card.question}
                        </strong>
                        <p>{card.answer}</p>
                      </div>
                    ))
                  )}
                </>
              ) : sessions.length === 0 ? (
                <div className="empty-history">
                  <h3>No study sessions yet</h3>
                  <p>Start Learning and complete a session to save history.</p>
                </div>
              ) : (
                sessions.map((session, index) => (
                  <button
                    className="session-card"
                    key={session._id}
                    onClick={() => setSelectedSession(session)}
                  >
                    <strong>Study Session #{sessions.length - index}</strong>
                    <p>
                      Result: {session.correctCount} / {session.totalCards}{" "}
                      correct
                      <br />
                      Wrong: {session.wrongCount}
                      <br />
                      Completed:{" "}
                      {session.completedAt
                        ? new Date(session.completedAt).toLocaleString()
                        : "Not available"}
                    </p>
                  </button>
                ))
              )}
            </div>
          </aside>

          {showAdminPanel && (
            <div
              className="admin-overlay"
              onClick={() => setShowAdminPanel(false)}
            ></div>
          )}

          <aside className={`admin-drawer ${showAdminPanel ? "open" : ""}`}>
            <div className="history-header">
              <div>
                <h2>Admin Management Panel</h2>
                <p>
                  Select a user to manage their flashcards, password, and
                  learning history.
                </p>
              </div>

              <button
                className="close-btn"
                onClick={() => setShowAdminPanel(false)}
              >
                ×
              </button>
            </div>

            {!selectedAdminUser ? (
              <div className="admin-panel-list">
                {adminUsers.length === 0 ? (
                  <div className="empty-history">
                    <h3>No users found</h3>
                    <p>No users are available in the system.</p>
                  </div>
                ) : (
                  adminUsers.map((adminUser) => (
                    <button
                      className="admin-panel-user-card"
                      key={adminUser._id || adminUser.id}
                      onClick={() => fetchAdminUserData(adminUser)}
                    >
                      <div>
                        <strong>{adminUser.username}</strong>
                        <span>{adminUser.role}</span>
                      </div>

                      <p>
                        Click to manage this user's flashcards, password, and
                        history.
                      </p>
                    </button>
                  ))
                )}
              </div>
            ) : (
              <div className="admin-card-manager">
                <button className="back-user-btn" onClick={backToAdminUserList}>
                  ← Back to users
                </button>

                <div className="selected-user-box">
                  <h3>{selectedAdminUser.username}</h3>
                  <p>Role: {selectedAdminUser.role}</p>
                </div>

                <div className="admin-section">
                  <h3>Add card for this user</h3>

                  <input
                    placeholder="Question"
                    value={adminQuestion}
                    onChange={(e) => setAdminQuestion(e.target.value)}
                  />

                  <input
                    placeholder="Answer"
                    value={adminAnswer}
                    onChange={(e) => setAdminAnswer(e.target.value)}
                  />

                  <button
                    className="primary-btn full"
                    onClick={adminAddCardForUser}
                  >
                    + Add Card For User
                  </button>
                </div>

                <div className="admin-section">
                  <h3>Change user password</h3>

                  <input
                    type="password"
                    placeholder="New password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                  />

                  <button
                    className="secondary-btn full"
                    onClick={adminChangePassword}
                  >
                    Change Password
                  </button>
                </div>

                <div className="admin-section">
                  <button
                    className="admin-toggle-btn"
                    onClick={() => {
                      setSelectedAdminSession(null);
                      setAdminOpenSection(
                        adminOpenSection === "history" ? null : "history"
                      );
                    }}
                  >
                    <span>Learning History</span>
                    <span>{adminOpenSection === "history" ? "−" : "+"}</span>
                  </button>

                  {adminOpenSection === "history" && (
                    <>
                      {selectedAdminSession ? (
                        <>
                          <button
                            className="back-user-btn"
                            onClick={() => setSelectedAdminSession(null)}
                          >
                            ← Back to sessions
                          </button>

                          {selectedAdminSession.wrongCards.length === 0 ? (
                            <div className="empty-history">
                              <h3>No wrong answers</h3>
                              <p>This user got all cards correct.</p>
                            </div>
                          ) : (
                            selectedAdminSession.wrongCards.map(
                              (card, index) => (
                                <div
                                  className="admin-history-item"
                                  key={`${card.flashcardId}-${index}`}
                                >
                                  <strong>
                                    #{index + 1} {card.question}
                                  </strong>
                                  <p>{card.answer}</p>
                                </div>
                              )
                            )
                          )}
                        </>
                      ) : adminUserHistory.length === 0 ? (
                        <div className="empty-history">
                          <h3>No history yet</h3>
                          <p>
                            This user has not completed any study sessions yet.
                          </p>
                        </div>
                      ) : (
                        <div className="admin-history-list">
                          {adminUserHistory.map((session, index) => (
                            <button
                              className="session-card"
                              key={session._id}
                              onClick={() => setSelectedAdminSession(session)}
                            >
                              <strong>
                                Study Session #{adminUserHistory.length - index}
                              </strong>
                              <p>
                                Result: {session.correctCount} /{" "}
                                {session.totalCards} correct
                                <br />
                                Wrong: {session.wrongCount}
                                <br />
                                Completed:{" "}
                                {session.completedAt
                                  ? new Date(
                                      session.completedAt
                                    ).toLocaleString()
                                  : "Not available"}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="admin-section">
                  <button
                    className="admin-toggle-btn"
                    onClick={() =>
                      setAdminOpenSection(
                        adminOpenSection === "cards" ? null : "cards"
                      )
                    }
                  >
                    <span>User's Flashcards</span>
                    <span>{adminOpenSection === "cards" ? "−" : "+"}</span>
                  </button>

                  {adminOpenSection === "cards" && (
                    <>
                      <input
                        className="admin-search"
                        placeholder="Search this user's flashcards..."
                        value={adminCardSearch}
                        onChange={(e) => setAdminCardSearch(e.target.value)}
                      />

                      {filteredAdminCards.length === 0 ? (
                        <div className="empty-history">
                          <h3>No cards found</h3>
                          <p>No flashcards match your search.</p>
                        </div>
                      ) : (
                        filteredAdminCards.map((card) => (
                          <div className="admin-card-item" key={card._id}>
                            <div>
                              <strong>{card.question}</strong>
                              <p>{card.answer}</p>
                            </div>

                            <div className="admin-card-actions">
                              <button
                                className="edit-btn"
                                onClick={() => adminEditCard(card)}
                              >
                                Edit
                              </button>

                              <button
                                className="delete-btn"
                                onClick={() => adminDeleteCard(card._id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

export default App;