// src/lib/socket.js
// DEBUG: Log when this module is loaded
console.log('[socket.js] Module loaded');

import { io } from 'socket.io-client';

// Set this to your deployed backend
const SOCKET_URL = 'https://chess-club-backend-0mbw.onrender.com';

// Singleton socket instance
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['polling'], // Force polling, disables websocket
  withCredentials: true,
});
console.log('[socket.js] Socket instance created:', socket);

// Ensure listeners are not duplicated
let listenersInitialized = false;

export function initStudentListeners({ onBoardUpdate, onVoteTally, onModeUpdate }) {
  if (listenersInitialized) return;
  if (onBoardUpdate) socket.on('board_update', onBoardUpdate);
  if (onVoteTally) socket.on('vote_tally', onVoteTally);
  if (onModeUpdate) socket.on('mode_update', onModeUpdate);
  listenersInitialized = true;
}

export function removeStudentListeners() {
  socket.off('board_update');
  socket.off('vote_tally');
  socket.off('mode_update');
  listenersInitialized = false;
}

export function joinGame(gameId, userId, name) {
  console.log('[socket.js] joinGame called:', { gameId, userId, name });
  socket.connect();
  console.log('[socket.js] socket.connect() called');
  socket.emit('join_game', { gameId, userId, name });
  console.log('[socket.js] join_game emitted');
}

export function disconnectFromGame() {
  console.log('[socket.js] disconnectFromGame called');
  socket.disconnect();
  console.log('[socket.js] socket.disconnect() called');
}

// Accepts name as an optional argument and emits it to the backend
export function submitVote(gameId, move, userId, name) {
  console.log('[socket.js] submitVote called:', { gameId, move, userId, name });
  socket.emit('submit_vote', { gameId, move, userId, name });
  console.log('[socket.js] submit_vote emitted');
}

export function retractVote(gameId, move, userId) {
  console.log('[socket.js] retractVote called:', { gameId, move, userId });
  socket.emit('retract_vote', { gameId, move, userId });
}

export function updateBoard(gameId, fen, moveHistory, initialFen) {
  const payload = { gameId, fen, moveHistory };
  if (initialFen) payload.initialFen = initialFen;
  console.log('[socket.js] updateBoard called:', payload);
  socket.emit('update_board', payload);
  console.log('[socket.js] update_board emitted');
}

export function setMode(gameId, mode, reveal = false, timerLength, revealTime) {
  const payload = { gameId, mode, reveal };
  if (mode === 'game') {
    if (typeof timerLength === 'number') payload.timerLength = timerLength;
    if (typeof revealTime === 'number') payload.revealTime = revealTime;
  }
  console.log('[socket.js] setMode emitted', payload);
  socket.emit('set_mode', payload);
}

// For debugging in browser console
if (typeof window !== 'undefined') {
  window.socket = socket;
}
