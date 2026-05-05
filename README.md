# Chess Club App

A full-stack web application for running interactive chess club sessions with real-time voting and game management for both teachers and students.

## Features

- Interactive chess board with real-time gameplay
- Student voting system for chess moves
- Teacher/instructor control panel with password protection
- Real-time synchronization between all participants
- Poll mode for collecting student votes
- Game mode with countdown timer and vote reveal
- Pawn promotion piece selector (drag or click)

## Architecture

This is a monorepo containing both frontend and backend:

- **Frontend**: React + Vite static site, configured via `public/config.js`
- **Backend**: Node.js + Express server with Socket.io for real-time communication

For sharing with others, the backend is deployed separately to Render.com and the built frontend is distributed as a standalone repo. See:
- [chess-club-backend](https://github.com/sergeballif/chess-club-backend)
- [chess-club-frontend](https://github.com/sergeballif/chess-club-frontend)

## Quick Start (local development)

### Prerequisites

- Node.js (v16 or higher)
- npm

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd chess-club
   ```

2. **Install dependencies**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. **Start the servers**

   Backend (in one terminal):
   ```bash
   cd backend
   npm start
   ```
   Runs on `http://localhost:10000`

   Frontend (in another terminal):
   ```bash
   cd frontend
   npm run dev
   ```
   Runs on `http://localhost:5173`

## Environment Variables

### Backend

Set these in Render's Environment tab (or in a local `.env` file for development):

| Variable | Description | Required? |
|----------|-------------|-----------|
| `FRONTEND_ORIGINS` | Comma-separated list of allowed frontend URLs | Yes in production |
| `TEACHER_PASSWORD` | Password required for teacher controls | Recommended |

### Frontend

`frontend/public/config.js` is the runtime configuration file. Edit it before building or deploying:

```js
window.CHESS_CLUB_CONFIG = {
  socketUrl: 'https://your-backend.onrender.com',
  teacherPasswordEnabled: false  // set to true if TEACHER_PASSWORD is set on the backend
};
```

## Building for production

```bash
cd frontend
npm run build
```

Then edit `dist/config.js` with your backend URL and password settings, and upload `dist/` to your web host.

## Available Scripts

### Frontend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

### Backend
```bash
npm start        # Start the server
```

## Technology Stack

### Frontend
- **React 19** — UI framework
- **Vite** — build tool
- **chess.js** — chess game logic and move validation
- **react-chessboard** — interactive chessboard component
- **socket.io-client** — real-time communication
- **react-router-dom** — routing

### Backend
- **Node.js / Express** — server
- **Socket.io** — real-time bidirectional communication
- **chess.js** — chess game logic
