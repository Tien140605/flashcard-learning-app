# Flashcard Learning App

## Project Description

This is a single-page flashcard learning application built with React, Node.js, Express, and MongoDB. Users can register, log in, create their own flashcards, edit them, delete them, search cards, reveal answers, and track their learning history. Admin users can view all registered users and inspect the learning history of each user.

## Main Features

- User registration and login
- User-specific flashcard sets
- Create, read, update, and delete flashcards
- Search flashcards
- Click-to-reveal answer interaction
- Learning history tracking
- Admin view for checking each user's learning history
- Single-page React interface

## Technologies Used

- React
- Vite
- Node.js
- Express.js
- MongoDB
- Mongoose
- Axios
- JWT authentication
- CSS

## CRUD Operations

| Operation | Feature |
|---|---|
| Create | Add new flashcards |
| Read | Display flashcards from MongoDB |
| Update | Edit existing flashcards |
| Delete | Delete flashcards |

## Single Page Application

The application behaves as a single-page application. It uses one main HTML file and dynamically updates the page using React state without loading separate HTML pages from the server.

## User Accounts

Each user has their own flashcard set. Flashcards are connected to the logged-in user's account, so different users do not share the same cards.

## Admin Feature

Admin users can open the View All History panel, see all registered users, select a user, and view that user's learning history.

## Project Structure

```txt
flashcard-app/
├── client/
├── server/
├── database/
├── README.md
├── package.json
└── package-lock.json
```

## How to Run the Project

### Server

```bash
cd server
npm install
node server.js
```

### Client

```bash
cd client
npm install
npm run dev
```

## Environment Variables

Create a `.env` file inside the `server` folder:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=5000
```

A sample environment file is provided as:

```txt
server/.env.example
```

## Database Export

The database export files are included in the `database` folder:

- cards.json
- users.json
- viewhistories.json

## Demo

The demo video shows the frontend interface and demonstrates login, flashcard CRUD operations, learning history, and admin history viewing.