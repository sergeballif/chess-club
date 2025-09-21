import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { Chess } from 'chess.js';
import TeacherView from '../../src/views/TeacherView';

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
    updateBoard: jest.fn(),
    setMode: jest.fn(),
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

import { socket, updateBoard, __emitSocketEvent, __resetSocketListeners } from '../../src/lib/socket';

describe('TeacherView move navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetSocketListeners();
    window.socket = socket;
  });

  afterEach(() => {
    delete window.socket;
  });

  it('replays moves using the initial FEN when jumping within history', async () => {
    const startFen = '8/8/8/8/8/3K4/8/3k4 w - - 0 1';
    const chess = new Chess(startFen);
    const firstSan = chess.move('Kd4').san;
    const afterFirstFen = chess.fen();
    const secondSan = chess.move('Kd2').san;
    const finalFen = chess.fen();
    const history = [firstSan, secondSan];

    render(<TeacherView />);

    act(() => {
      __emitSocketEvent('board_update', {
        fen: finalFen,
        moveHistory: history,
        initialFen: startFen
      });
    });

    updateBoard.mockClear();

    const firstMoveCell = await screen.findByText(firstSan);
    act(() => {
      fireEvent.click(firstMoveCell);
    });

    await waitFor(() => {
      expect(updateBoard).toHaveBeenCalledWith('default-game', afterFirstFen, history, startFen);
    });

    updateBoard.mockClear();

    const backButton = screen.getByRole('button', { name: /</ });
    act(() => {
      fireEvent.click(backButton);
    });

    await waitFor(() => {
      expect(updateBoard).toHaveBeenCalledWith('default-game', startFen, history, startFen);
    });
  });
});
