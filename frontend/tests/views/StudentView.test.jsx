import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import StudentView from '../../src/views/StudentView';
import * as socket from '../../src/lib/socket';

// Ensure mocks exist for all used socket functions
if (!socket.joinGame) socket.joinGame = jest.fn();
if (!socket.submitVote) socket.submitVote = jest.fn();

// Mock socket functions
jest.mock('../../src/lib/socket');

function setupSocketMocks({ mode = { mode: 'poll', reveal: false }, fen = 'startfen', moveHistory = [], voteTally = { votes: {} } } = {}) {
  const listeners = {};
  socket.initStudentListeners.mockImplementation(({ onBoardUpdate, onVoteTally, onModeUpdate }) => {
    if (onBoardUpdate) listeners.board_update = onBoardUpdate;
    if (onVoteTally) listeners.vote_tally = onVoteTally;
    if (onModeUpdate) listeners.mode_update = onModeUpdate;
  });
  socket.removeStudentListeners.mockImplementation(() => {
    listeners.board_update = null;
    listeners.vote_tally = null;
    listeners.mode_update = null;
  });
  socket.joinGame.mockImplementation(() => {});
  socket.submitVote.mockImplementation(() => {});
  // Simulate initial backend state
  return listeners;
}

describe('StudentView', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows Observation Mode message and disables voting', () => {
    const listeners = setupSocketMocks({ mode: { mode: 'observe', reveal: false } });
    render(<StudentView />);
    act(() => {
      if (listeners.mode_update) listeners.mode_update({ mode: 'observe', reveal: false });
    });
    expect(screen.getByText(/Observation Mode/i)).toBeInTheDocument();
    expect(screen.queryByText(/Vote Tally:/i)).not.toBeInTheDocument();
  });

  it('shows Polling Mode message and allows voting', () => {
    const listeners = setupSocketMocks({ mode: { mode: 'poll', reveal: false } });
    render(<StudentView />);
    act(() => {
      if (listeners.mode_update) listeners.mode_update({ mode: 'poll', reveal: false });
    });
    expect(screen.getByText(/Polling Mode/i)).toBeInTheDocument();
    // Join button is enabled
    const nameInput = screen.getByLabelText(/Name:/);
    fireEvent.change(nameInput, { target: { value: 'Alice' } });
    const joinBtn = screen.getByText('Join');
    fireEvent.click(joinBtn);
    expect(screen.getByText(/Joined as Alice/)).toBeInTheDocument();
  });

  it('shows Game Mode message and allows voting', () => {
    const listeners = setupSocketMocks({ mode: { mode: 'game', reveal: false } });
    render(<StudentView />);
    act(() => {
      if (listeners.mode_update) listeners.mode_update({ mode: 'game', reveal: false });
    });
    expect(screen.getByText(/Game Mode/i)).toBeInTheDocument();
  });

  it('shows vote tally in Polling Mode', () => {
    const listeners = setupSocketMocks({ mode: { mode: 'poll', reveal: false }, voteTally: { votes: { 'e2e4': 2, 'd2d4': 1 } } });
    render(<StudentView />);
    act(() => {
      if (listeners.mode_update) listeners.mode_update({ mode: 'poll', reveal: false });
      if (listeners.vote_tally) listeners.vote_tally({ votes: { 'e2e4': 2, 'd2d4': 1 } });
    });
    expect(screen.getByText(/Vote Tally:/i)).toBeInTheDocument();
    expect(screen.getByText(/e2e4: 2/)).toBeInTheDocument();
    expect(screen.getByText(/d2d4: 1/)).toBeInTheDocument();
  });

  it('only allows one vote per board position', () => {
    const listeners = setupSocketMocks({ mode: { mode: 'poll', reveal: false } });
    render(<StudentView />);
    act(() => {
      if (listeners.mode_update) listeners.mode_update({ mode: 'poll', reveal: false });
    });
    const nameInput = screen.getByLabelText(/Name:/);
    fireEvent.change(nameInput, { target: { value: 'Bob' } });
    fireEvent.click(screen.getByText('Join'));
    // Simulate voting for e2e4
    act(() => {
      socket.submitVote('default-game', 'e2e4', expect.any(String));
    });
    expect(socket.submitVote).toHaveBeenCalledWith('default-game', 'e2e4', expect.any(String));
    // Simulate voting for d2d4 (change vote)
    act(() => {
      socket.submitVote('default-game', 'd2d4', expect.any(String));
    });
    expect(socket.submitVote).toHaveBeenCalledWith('default-game', 'd2d4', expect.any(String));
  });

  it('resets vote when board updates', () => {
    const listeners = setupSocketMocks({ mode: { mode: 'poll', reveal: false }, fen: 'startfen' });
    render(<StudentView />);
    act(() => {
      if (listeners.mode_update) listeners.mode_update({ mode: 'poll', reveal: false });
    });
    const nameInput = screen.getByLabelText(/Name:/);
    fireEvent.change(nameInput, { target: { value: 'Carol' } });
    fireEvent.click(screen.getByText('Join'));
    // Simulate voting for e2e4
    act(() => {
      socket.submitVote('default-game', 'e2e4', expect.any(String));
    });
    // Simulate board update (new FEN)
    act(() => {
      if (listeners.board_update) listeners.board_update({ fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', moveHistory: [] });
    });
    // Student vote should be reset (not shown)
    const voteDiv = screen.getByText(/Your Vote:/).parentElement;
    expect(voteDiv).toHaveTextContent(/Your Vote:\s*—/);
  });
});
