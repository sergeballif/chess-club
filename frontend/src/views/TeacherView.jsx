import React, { useState, useEffect, useRef } from 'react';
import Chessboard from '../components/Chessboard';
import MoveHistory from '../components/MoveHistory';
import FENPanel from '../components/FENPanel';
import MoveVoting from '../components/MoveVoting';
import { Chess } from 'chess.js';
import { joinGame, updateBoard, setMode, socket } from '../lib/socket';

export default function TeacherView() {
  // Teacher always joins the game room on mount
  useEffect(() => {
    document.title = 'Chess Club';
    const teacherId = 'teacher-' + Math.random().toString(36).slice(2, 10);
    joinGame('default-game', teacherId, 'Teacher');
  }, []);

  // Game state
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [moveHistory, setMoveHistory] = useState([]); // SAN strings
  const [currentMove, setCurrentMove] = useState(0); // 0 = start position
  const [savedFENs, setSavedFENs] = useState(() => [
    { name: 'Restart', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' }
  ]);
  const [gameId] = useState('default-game'); // TODO: support multiple games
  const isInitialMount = useRef(true);
  const [mode, setModeState] = useState('poll');
  const [reveal, setReveal] = useState(false);
  const [timerLength, setTimerLength] = useState(10); // seconds
  const [revealTime, setRevealTime] = useState(3); // seconds
  const [timer, setTimer] = useState(10);
  const timerRef = useRef();
  const [instructions, setInstructions] = useState('White to play. Find best move.');
  const [boardWidth, setBoardWidth] = useState(() => Math.min(520, Math.floor(document.documentElement.clientWidth * 0.36)));
  const [boardAnchor, setBoardAnchor] = useState({ left: null, top: null, width: null });
  const boardRef = useRef();
  const timerAnchorRef = useRef();
  const [boardOrientation, setBoardOrientation] = useState('white');

  // Update boardWidth on resize
  useEffect(() => {
    function handleResize() {
      setBoardWidth(Math.min(520, Math.floor(document.documentElement.clientWidth * 0.36)));
      if (boardRef.current) {
        const rect = boardRef.current.getBoundingClientRect();
        setBoardAnchor({ left: rect.left + rect.width / 2, top: rect.top, width: rect.width });
      }
    }
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update boardAnchor after every render (board size may change independently)
  useEffect(() => {
    if (boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect();
      setBoardAnchor({ left: rect.left + rect.width / 2, top: rect.top, width: rect.width });
    }
  }, [boardWidth]);

  // --- Helper: listen for vote_tally events and update window.__lastVoteTally ---
  useEffect(() => {
    function handleVoteTally(tally) {
      console.log('[TeacherView] Received vote_tally:', tally);
      window.__lastVoteTally = tally;
      // Force update to re-render MoveVoting
      setForceUpdate(f => f + 1);
    }
    // Listen directly to socket events
    if (window.socket) {
      window.socket.on('vote_tally', handleVoteTally);
    }
    return () => {
      if (window.socket) {
        window.socket.off('vote_tally', handleVoteTally);
      }
    };
  }, []);

  // --- Helper: force update for tally changes ---
  const [, setForceUpdate] = useState(0);

  // --- Timer logic for Game Mode ---
  useEffect(() => {
    if (mode !== 'game') {
      clearInterval(timerRef.current);
      setTimer(timerLength);
      return;
    }
    setTimer(timerLength);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          // TODO: trigger move application here
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [mode, timerLength]);

  // --- Listen for board_update events to sync teacher board with backend ---
  useEffect(() => {
    function handleBoardUpdate({ fen: newFen, moveHistory: newHistory }) {
      setFen(newFen);
      setMoveHistory(newHistory || []);
      setGame(new Chess(newFen));
      setCurrentMove((newHistory || []).length);
      setReveal(false); // Reset reveal if needed
    }
    if (window.socket) {
      window.socket.on('board_update', handleBoardUpdate);
    }
    return () => {
      if (window.socket) {
        window.socket.off('board_update', handleBoardUpdate);
      }
    };
  }, []);

  // Handle a move from Chessboard
  function handleMove(moveObj, newFen) {
    // Create game state from current position
    const gameCopy = new Chess();
    for (let i = 0; i < currentMove; i++) {
      gameCopy.move(moveHistory[i]);
    }
    
    // Make the new move
    const move = gameCopy.move(moveObj);
    if (move) {
      // Always truncate at current position and add new move
      // This ensures we only show the current branch
      const newHistory = [...moveHistory.slice(0, currentMove), move.san];
      
      setGame(gameCopy);
      setFen(gameCopy.fen());
      setMoveHistory(newHistory);
      setCurrentMove(currentMove + 1);
      setReveal(false); // Reset reveal
      if (window.socket) window.socket.emit('reset_reveal', { gameId });
      setTimer(timerLength); // Reset timer
      // Broadcast board update
      updateBoard(gameId, gameCopy.fen(), newHistory);
    }
  }

  // Jump to a specific move in history
  function jumpToMove(idx) {
    const gameCopy = new Chess();
    // Play moves up to and including the clicked move
    for (let i = 0; i < idx; i++) {
      gameCopy.move(moveHistory[i]);
    }
    setGame(gameCopy);
    setFen(gameCopy.fen());
    setCurrentMove(idx);
    // Broadcast board update with full history but current position
    updateBoard(gameId, gameCopy.fen(), moveHistory);
  }

  // Go back one move
  function goBack() {
    if (currentMove > 0) {
      jumpToMove(currentMove - 1);
    }
  }

  // Go forward one move
  function goForward() {
    if (currentMove < moveHistory.length) {
      jumpToMove(currentMove + 1);
    }
  }

  // FEN Management handlers
  function handleLoadFEN(newFEN) {
    const chess = new Chess();
    try {
      chess.load(newFEN);
      setGame(chess);
      setFen(chess.fen());
      setMoveHistory([]);
      setCurrentMove(0);
      setReveal(false); // Reset reveal
      if (window.socket) window.socket.emit('reset_reveal', { gameId });
      // Broadcast board update
      updateBoard(gameId, chess.fen(), []);
    } catch (e) {
      // Defensive: error should be caught in FENPanel
    }
  }

  function handleSaveFEN(name, fenToSave) {
    setSavedFENs(fens => {
      const filtered = fens.filter(f => f.name !== name && f.name !== 'Restart');
      return [
        { name, fen: fenToSave },
        { name: 'Restart', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' },
        ...filtered
      ];
    });
  }

  // On mount, broadcast initial board state
  useEffect(() => {
    if (isInitialMount.current) {
      updateBoard(gameId, fen, moveHistory);
      setMode(gameId, mode, reveal);
      isInitialMount.current = false;
    }
    // eslint-disable-next-line
  }, []);

  // Handler: change mode or reveal
  function handleModeChange(newMode) {
    setModeState(newMode);
    if (newMode === 'game') {
      // Always use the latest timerLength and revealTime state
      setMode(gameId, newMode, false, timerLength, revealTime);
    } else {
      setMode(gameId, newMode, false);
    }
  }
  function handleRevealChange(e) {
    setReveal(e.target.checked);
    setMode(gameId, mode, e.target.checked, timerLength, revealTime);
  }

  // --- Helper: get legal moves for MoveVoting ---
  function getAllLegalMoves() {
    // Use current position to get all legal moves for the side to move
    try {
      const chess = new Chess(fen);
      return chess.moves({ verbose: true }).map(m => m.from + m.to + (m.promotion || ''));
    } catch {
      return [];
    }
  }

  // --- Helper: global showVotes logic ---
  function getShowVotes() {
    if (mode === 'poll') return reveal === true;
    if (mode === 'game') return typeof timer === 'number' && typeof revealTime === 'number' && timer <= revealTime;
    return false;
  }
  const showVotes = getShowVotes();

  // --- Helper: build voteArrows prop for Chessboard ---
  function getVoteArrows() {
    const tally = Object.fromEntries(Object.entries((window.__lastVoteTally && window.__lastVoteTally.votes) || {}).filter(([_, count]) => count > 0));
    const maxVotes = Math.max(1, ...Object.values(tally));
    const arrows = [];
    // Only show aggregate arrows if allowed by mode/reveal
    if (showVotes) {
      for (const [move, count] of Object.entries(tally)) {
        if (move.length < 4) continue;
        const from = move.slice(0,2);
        const to = move.slice(2,4);
        arrows.push({ from, to, color: '#f39c12', opacity: Math.min(0.8, 0.8 * (0.2 + count/maxVotes)), width: 7 });
      }
    }
    return arrows;
  }

  // --- Helper: get vote tally for MoveVoting ---
  function getVoteTally() {
    return (window.__lastVoteTally && window.__lastVoteTally.votes) || {};
  }

  // --- Helper: determine if teacher can move pieces ---
  function canTeacherMove() {
    // Teacher can always move in poll and observe mode
    if (mode === 'poll' || mode === 'observe') return true;
    // In game mode, allow moves if timer > 0 (i.e., voting/move phase)
    if (mode === 'game') return timer > 0;
    return false;
  }

  // Listen for timer_update events and sync timer state
  useEffect(() => {
    function handleTimerUpdate({ timer: t }) {
      setTimer(t);
    }
    if (window.socket) {
      window.socket.on('timer_update', handleTimerUpdate);
    }
    return () => {
      if (window.socket) {
        window.socket.off('timer_update', handleTimerUpdate);
      }
    };
  }, []);

  // --- Controls for timerLength and revealTime ---
  function renderGameSettings() {
    return (
      <div style={{ marginBottom: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <div style={{ marginBottom: 2 }}>
          <label>
            <input
              type="number"
              min={5}
              max={120}
              value={timerLength}
              onChange={e => setTimerLength(Number(e.target.value))}
              style={{ width: 60, marginRight: 6 }}
            />
            <button
              style={{ marginLeft: 4, border: '1px solid #ccc' }}
              onClick={() => setMode(gameId, 'game', false, timerLength, revealTime)}
            >
              Set Countdown Timer
            </button>
          </label>
        </div>
        <div>
          <label>
            <input
              type="number"
              min={1}
              max={timerLength}
              value={revealTime}
              onChange={e => setRevealTime(Number(e.target.value))}
              style={{ width: 60, marginRight: 6 }}
            />
            <button
              style={{ marginLeft: 4, border: '1px solid #ccc' }}
              onClick={() => setMode(gameId, 'game', false, timerLength, revealTime)}
            >
              Set Reveal Time
            </button>
          </label>
        </div>
      </div>
    );
  }

  // Emit instructions to backend and students
  function handleInstructionsChange(e) {
    const value = e.target.value;
    setInstructions(value);
    // Always emit using the singleton socket instance
    socket.emit('instructions_update', { gameId, instructions: value });
  }

  // --- Layout per design: 10% | 16% | 36% | 28% | 10% ---
  const showTimerControls = mode === 'game';
  function renderVoteControls() {
    if (mode === 'poll') {
      return (
        <button
          onClick={() => handleRevealChange({ target: { checked: !reveal } })}
          style={{
            marginLeft: 8,
            background: reveal ? '#444' : '#222',
            color: '#fff',
            border: '1px solid #ccc',
            padding: '6px 18px',
            fontSize: 16,
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'background 0.2s',
            boxShadow: reveal ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
            outline: 'none',
            position: 'relative',
            zIndex: 1
          }}
          onMouseDown={e => e.currentTarget.style.background = '#666'}
          onMouseUp={e => e.currentTarget.style.background = reveal ? '#444' : '#000'}
          onMouseLeave={e => e.currentTarget.style.background = reveal ? '#444' : '#000'}
        >
          {reveal ? 'Hide Vote' : 'Reveal Vote'}
        </button>
      );
    }
    // No controls in game mode
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#181c24', color: '#f8f9fa' }}>
      <div style={{ height: 100, position: 'relative' }}>
        {/* Dynamically anchor timer above chessboard */}
        {mode === 'game' && boardAnchor.left !== null && (
          <div
            style={{
              position: 'fixed',
              left: boardAnchor.left,
              top: boardAnchor.top - 46, // 36px above the top of the board
              transform: 'translateX(-50%)',
              zIndex: 10,
              pointerEvents: 'none'
            }}
          >
            <div style={{
              fontSize: 24,
              fontWeight: 'bold',
              background: fen.split(' ')[1] === 'w' ? '#ebebeb' : '#222',
              color: fen.split(' ')[1] === 'w' ? '#222' : '#fff',
              borderRadius: 8,
              padding: '4px 24px',
              border: fen.split(' ')[1] === 'w' ? '3px solid#b8b8b8' : '3px solid #444',
              letterSpacing: 2,
              display: 'inline-block',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
            }}>
              {timer}
            </div>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'row', width: '100vw', flex: 1, alignItems: 'flex-start' }}>
        {/* Left blank 10% */}
        <div style={{ width: '10vw', minWidth: 0, maxWidth: '10vw' }} />
        {/* Move history 16% */}
        <div style={{ width: '16vw', minWidth: 180, maxWidth: 360, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-start', padding: 12 }}>
          <MoveHistory
            moves={moveHistory}
            currentMove={currentMove}
            onJump={jumpToMove}
            onBack={goBack}
            onForward={goForward}
          />
        </div>
        {/* Board 36% */}
        <div ref={boardRef} style={{ width: '36vw', minWidth: 260, maxWidth: 520, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: 8 }}>
          <div style={{ width: '100%', maxWidth: '100%', aspectRatio: '1 / 1', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <Chessboard
              fen={fen}
              onMove={canTeacherMove() ? handleMove : undefined}
              orientation={boardOrientation}
              allowDrag={canTeacherMove()}
              allowMove={canTeacherMove()}
              voteArrows={getVoteArrows()}
              boardWidth={boardWidth}
            />
          </div>
        </div>
        {/* Controls 28% */}
        <div style={{ width: '28vw', minWidth: 180, maxWidth: 360, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'stretch', padding: 12 }}>
          <div style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 0 }}>
              Mode:
              <select
                value={mode}
                onChange={e => handleModeChange(e.target.value)}
                style={{ marginLeft: 8 }}
              >
                <option value="poll">Poll</option>
                <option value="game">Game</option>
                <option value="observe">Observe</option>
              </select>
            </label>
            {/* Reveal Vote button (poll mode only) and Flip Board button */}
            {renderVoteControls()}
            {/* Flip Board button, now to the right of Reveal Vote */}
            <button
              onClick={() => setBoardOrientation(o => (o === 'white' ? 'black' : 'white'))}
              title="Flip board"
              style={{
                marginLeft: 8,
                background: '#111',
                color: '#fff',
                border: '1px solid #aaa',
                borderRadius: '50%',
                width: 32,
                height: 32,
                fontSize: 18,
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 1px 4px rgba(0,0,0,0.09)'
              }}
              aria-label="Flip board"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" style={{ display: 'block' }}><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M20 9V7a2 2 0 0 0-2-2h-6"/><path d="m15 2l-3 3l3 3m5 5v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2"/></g></svg>
            </button>
          </div>
          {/* Timer/reveal inputs for Game Mode */}
          {mode === 'game' && (
            <div style={{ marginBottom: 2 }}>
              {renderGameSettings()}
            </div>
          )}
          <div style={{
            background: '#292929',
            color: '#fff',
            borderRadius: 8,
            padding: '4px 4px',
            margin: '4px 0 2px 0',
            border: '3px solid #444',
            letterSpacing: 2,
            display: 'inline-block',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
          }}>
            <FENPanel
              fen={fen}
              onLoadFEN={handleLoadFEN}
              savedFENs={[
                { name: 'Restart', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' },
                ...savedFENs.filter(f => f.name !== 'Restart')
              ]}
              onSaveFEN={handleSaveFEN}
            />
          </div>
          {/* Instructions input below FEN entry */}
          <div style={{ margin: '4px 0', width: '100%' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 0 }}>Instructions for Students:</label>
            <textarea
              value={instructions}
              onChange={handleInstructionsChange}
              style={{ width: '100%', minHeight: 32, fontSize: 14, borderRadius: 4, border: '1px solid #888', padding: 6, marginTop: 2 }}
            />
          </div>
          {/* MoveVoting bars below FEN and instructions, full width */}
          <div style={{ margin: '18px 0 0 0', width: '100%' }}>
            <MoveVoting
              legalMoves={getAllLegalMoves()}
              currentMove={currentMove}
              gameId={gameId}
              userId={"teacher"}
              userName={"Teacher"}
              mode={mode}
              reveal={mode === 'poll' ? reveal : (typeof timer === 'number' && typeof revealTime === 'number' && timer <= revealTime)}
              voteTally={getVoteTally()}
              votesByMove={(window.__lastVoteTally && window.__lastVoteTally.votesByMove) || {}}
              studentVote={null}
              onVote={null}
              timer={timer}
              revealTime={revealTime}
              alwaysShowBars={true}
            />
          </div>
        </div>
        {/* Right blank 10% */}
        <div style={{ width: '10vw', minWidth: 0, maxWidth: '10vw' }} />
      </div>
    </div>
  );
}
