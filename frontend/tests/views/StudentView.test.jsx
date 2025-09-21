import React from 'react';
import { render, screen, act } from '@testing-library/react';
import StudentView from '../../src/views/StudentView';

jest.mock('../../src/lib/socket', () => {
  const listeners = {};

  function addListener(event, handler) {
    if (!listeners[event]) listeners[event] = new Set();
    listeners[event].add(handler);
  }

  function removeListener(event, handler) {
    if (!listeners[event]) return;
    if (handler) {
      listeners[event].delete(handler);
    } else {
      listeners[event].clear();
    }
    if (listeners[event] && listeners[event].size === 0) {
      delete listeners[event];
    }
  }

  const socketMock = {
    emit: jest.fn(),
    on: jest.fn((event, handler) => addListener(event, handler)),
    off: jest.fn((event, handler) => removeListener(event, handler)),
  };

  return {
    joinGame: jest.fn(),
    submitVote: jest.fn(),
    initStudentListeners: jest.fn(({ onBoardUpdate, onVoteTally, onModeUpdate }) => {
      if (onBoardUpdate) addListener('board_update', onBoardUpdate);
      if (onVoteTally) addListener('vote_tally', onVoteTally);
      if (onModeUpdate) addListener('mode_update', onModeUpdate);
    }),
    removeStudentListeners: jest.fn(() => {
      removeListener('board_update');
      removeListener('vote_tally');
      removeListener('mode_update');
    }),
    retractVote: jest.fn(),
    socket: socketMock,
    __emitSocketEvent: (event, payload) => {
      if (!listeners[event]) return;
      for (const handler of Array.from(listeners[event])) {
        handler(payload);
      }
    },
    __resetSocketListeners: () => {
      Object.keys(listeners).forEach(key => delete listeners[key]);
    }
  };
});

import { __emitSocketEvent, __resetSocketListeners } from '../../src/lib/socket';

describe('StudentView', () => {
  beforeEach(() => {
    __resetSocketListeners();
  });

  it('renders default instructions and vote placeholder', async () => {
    render(<StudentView />);

    await screen.findByText('What to play. Find best move.');

    act(() => {
      __emitSocketEvent('board_update', { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', moveHistory: [] });
    });

    const voteText = screen.getByText(/Your Vote:/).textContent || '';
    expect(voteText.trim()).toMatch(/^Your Vote:\s*(—)?$/);
  });

  it('updates instructions when the teacher sends new text', async () => {
    render(<StudentView />);

    act(() => {
      __emitSocketEvent('instructions_update', { instructions: 'Focus on knight tactics.' });
    });

    await screen.findByText('Focus on knight tactics.');
  });
});
