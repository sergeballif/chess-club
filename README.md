# Chess Club App

A full-stack web application for running interactive chess club sessions with real-time voting and game management for both teachers and students.

## 🎯 Features

- Interactive chess board with real-time gameplay
- Student voting system for chess moves
- Teacher/instructor control panel
- Real-time synchronization between all participants
- Poll mode for collecting student votes
- Game mode with timer and vote reveal functionality

## 🏗️ Architecture

This is a monorepo containing both frontend and backend:

- **Frontend**: React + Vite application with TypeScript support
- **Backend**: Node.js + Express server with Socket.io for real-time communication

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd chess-club
   ```

2. **Install dependencies for both frontend and backend**
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Start the development servers**

   **Backend** (in one terminal):
   ```bash
   cd backend
   npm start
   ```
   Server runs on `http://localhost:10000`

   **Frontend** (in another terminal):
   ```bash
   cd frontend
   npm run dev
   ```
   App runs on `http://localhost:5173`

## 📁 Project Structure

```
chess-club/
├── backend/           # Node.js/Express backend
│   ├── index.js      # Main server file
│   ├── package.json  # Backend dependencies
│   └── ...
├── frontend/         # React frontend
│   ├── src/         # Source code
│   ├── public/      # Static assets
│   ├── package.json # Frontend dependencies
│   └── ...
└── README.md        # This file
```

## 🛠️ Technology Stack

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **chess.js** - Chess game logic and move validation
- **react-chessboard** - Interactive chessboard component
- **socket.io-client** - Real-time communication
- **react-router-dom** - Routing

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Socket.io** - Real-time bidirectional communication
- **chess.js** - Chess game logic
- **CORS** - Cross-origin resource sharing

## 🔧 Available Scripts

### Frontend Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

### Backend Scripts
```bash
npm start        # Start the server
```

## 🚀 Deployment

### Frontend
The frontend can be deployed to any static hosting service:
1. Build the app: `npm run build`
2. Deploy the `dist/` folder to your hosting service

### Backend
The backend can be deployed to services like Render, Heroku, or any Node.js hosting platform.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).