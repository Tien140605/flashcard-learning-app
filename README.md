# Flashcard Learning App

## Project Description

This project is a single-page flashcard learning application built with React, Node.js, Express, and MongoDB. The app allows users to register, log in, create their own theory flashcards, edit and delete cards, complete learning sessions, and review their learning history.

The app also includes an admin role. Admin users have a dedicated management panel where they can view all users, manage each user's flashcards, change user passwords, and review each user's learning history.

## Main Features

- User registration and login
- Role-based access control for normal users and admin users
- User-specific flashcard sets
- Create, read, update, and delete theory cards
- Search theory cards
- Learning mode with randomised card order
- Flip-card interaction during learning
- Correct / Wrong self-assessment
- Study session result summary
- Learning history based on completed study sessions
- Wrong answer review for each study session
- Admin panel for managing users' flashcards and passwords
- Admin view of each user's learning history
- Single-page React interface

## Technologies Used

- React
- Vite
- Node.js
- Express.js
- MongoDB
- Mongoose
- Axios
- JSON Web Token authentication
- CSS

## CRUD Operations

| Operation | Feature |
|---|---|
| Create | Users can create new theory flashcards |
| Read | Users can view their own flashcards and study history |
| Update | Users can edit their existing flashcards |
| Delete | Users can delete flashcards |

Admin users also have additional CRUD-style management features. Admins can select a user, view that user's flashcards, add new flashcards for that user, edit existing flashcards, delete flashcards, and update the user's password.

## Single Page Application

The application behaves as a single-page application. It uses one main HTML file in the React frontend and dynamically updates the interface using React state. The user can log in, manage cards, start learning sessions, view history, and access admin features without loading separate HTML pages from the server.

## User Accounts

Each user has their own flashcard set. Flashcards are connected to the logged-in user's account, so different users do not share the same cards.

Normal users can:

- Create their own flashcards
- View their own flashcards
- Edit their own flashcards
- Delete their own flashcards
- Complete learning sessions
- View their own learning history

## Learning Mode

The dashboard works as a theory library where users can see both the question and answer for each card.

When users click **Start Learning**, the app starts a learning session. The cards are shown one at a time in random order. Users click the card to reveal the answer, then select either **Correct** or **Wrong**. At the end of the session, the app displays the result as:

```txt
Correct answers / Total cards
```

The completed session is saved to the database.

## Learning History

The **My History** section stores completed study sessions. Each history item shows:

- Study session number
- Number of correct answers
- Total number of cards studied
- Number of wrong answers
- Completion date and time

Users can click a study session to review the cards they answered incorrectly.

## Admin Feature

Admin users have access to an **Admin Panel**. In this panel, the admin can:

- View all registered users
- Select a user
- Add flashcards for the selected user
- Edit the selected user's flashcards
- Delete the selected user's flashcards
- Change the selected user's password
- View the selected user's learning history
- Review wrong answers from each study session

This creates a clear separation between normal user functionality and admin management functionality.

## Project Structure

```txt
flashcard-app/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── Card.js
│   │   ├── StudySession.js
│   │   ├── User.js
│   │   └── ViewHistory.js
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   └── historyRoutes.js
│   ├── .env.example
│   └── server.js
│
├── database/
│   ├── cards.json
│   ├── users.json
│   └── viewhistories.json
│
├── README.md
├── package.json
└── package-lock.json
```

## How to Run the Project

### Server

Open a terminal in the project folder and run:

```bash
cd server
npm install
node server.js
```

The server should run on:

```txt
http://localhost:5000
```

### Client

Open another terminal in the project folder and run:

```bash
cd client
npm install
npm run dev
```

The client should run on:

```txt
http://localhost:5173
```

## Environment Variables

Create a `.env` file inside the `server` folder.

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=5000
```

A sample environment file is provided as:

```txt
server/.env.example
```

The real `.env` file is not included in the GitHub repository for security reasons.

## Database Export

The database export files are included in the `database` folder:

- cards.json
- users.json
- viewhistories.json

These files provide sample exported data from the MongoDB database.



## Demo Video

The demo video should focus on the frontend interface in the browser. It demonstrates the main business logic of the application, including:

- User login
- Creating a theory flashcard
- Editing and deleting a flashcard
- Searching flashcards
- Starting a learning session
- Flipping cards to reveal answers
- Marking answers as correct or wrong
- Viewing the study session result
- Opening My History
- Reviewing wrong answers from a previous session
- Logging in as admin
- Using the Admin Panel to manage a selected user's flashcards and history

The recording should not show the running environment, source code, or database, as these are checked separately through the GitHub repository.