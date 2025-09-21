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

  it('retains future moves while browsing and only truncates when the history branches', async () => {
    const startFen = new Chess().fen();
    const chess = new Chess();
    const firstSan = chess.move('e4').san;
    const afterFirstFen = chess.fen();
    const secondSan = chess.move('e5').san;
    const afterSecondFen = chess.fen();
    const thirdSan = chess.move('Nf3').san;
    const finalFen = chess.fen();
    const history = [firstSan, secondSan, thirdSan];

    render(<TeacherView />);

    act(() => {
      __emitSocketEvent('board_update', {
        fen: finalFen,
        moveHistory: history,
        initialFen: startFen
      });
    });

    await screen.findByText(thirdSan);
    updateBoard.mockClear();
    expect(screen.getByText('3/3')).toBeInTheDocument();

    const backButton = screen.getByRole('button', { name: /</ });
    act(() => {
      fireEvent.click(backButton);
    });

    await waitFor(() => {
      expect(updateBoard).toHaveBeenLastCalledWith('default-game', afterSecondFen, history, startFen);
    });

    act(() => {
      __emitSocketEvent('board_update', {
        fen: afterSecondFen,
        moveHistory: history,
        initialFen: startFen
      });
    });

    expect(screen.getByText('2/3')).toBeInTheDocument();
    expect(screen.getByText(thirdSan)).toBeInTheDocument();

    updateBoard.mockClear();
    const branchChess = new Chess();
    branchChess.move('e4');
    branchChess.move('e5');
    const branchSan = branchChess.move('Nc3').san;
    const branchFen = branchChess.fen();
    const branchedHistory = [firstSan, secondSan, branchSan];

    act(() => {
      __emitSocketEvent('board_update', {
        fen: branchFen,
        moveHistory: branchedHistory,
        initialFen: startFen
      });
    });

    expect(screen.getByText('3/3')).toBeInTheDocument();
    expect(screen.getByText(branchSan)).toBeInTheDocument();
    expect(screen.queryByText(thirdSan)).not.toBeInTheDocument();
  });
});
