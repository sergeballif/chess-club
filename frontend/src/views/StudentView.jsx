import React, { useState, useEffect, useRef } from 'react';
import Chessboard from '../components/Chessboard';
import { joinGame, submitVote, initStudentListeners, removeStudentListeners, retractVote, socket } from '../lib/socket';

const GAME_ID = 'default-game';

export default function StudentView({ timer, revealTime }) {
  const [fen, setFen] = useState('');
  const [moveHistory, setMoveHistory] = useState([]);
  const [mode, setMode] = useState({ mode: 'poll', reveal: false });
  const [name, setName] = useState('');
  const [userId, setUserId] = useState(() => {
    // Generate a random user id on mount
    return 'u' + Math.random().toString(36).slice(2, 10);
  });
  const [joined, setJoined] = useState(false);
  const [studentVote, setStudentVote] = useState('');
  const [voteTally, setVoteTally] = useState({ votes: {} });
  const [status, setStatus] = useState('');
  const [lastVotedFen, setLastVotedFen] = useState('');
  const [showVotes, setShowVotes] = useState(false);
  const [instructions, setInstructions] = useState('What to play. Find best move.');
  const fenRef = useRef('');

  // Responsive board width state
  const [boardWidth, setBoardWidth] = useState(() => Math.min(400, Math.floor(window.innerWidth * 0.28)));

  // Update boardWidth on resize
  useEffect(() => {
    document.title = 'Chess Club';
    function handleResize() {
      setBoardWidth(Math.min(400, Math.floor(window.innerWidth * 0.28)));
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Join game or re-join with new name
  function handleJoin() {
    // Name is optional; allow join regardless
    console.log('[StudentView] Attempting to join game:', GAME_ID, userId, name);
    try {
      joinGame(GAME_ID, userId, name);
      console.log('[StudentView] Called joinGame');
    } catch (e) {
      console.error('[StudentView] Error calling joinGame:', e);
    }
    setJoined(true);
    setStatus('Joined as ' + (name || userId));
  }

  // Listen for board/mode/tally updates
  useEffect(() => {
    function handleBoardUpdate({ fen: newFen, moveHistory: newHistory }) {
      console.log('[StudentView] Received board_update:', { fen: newFen, moveHistory: newHistory });
      setFen(newFen);
      setMoveHistory(newHistory || []);
      fenRef.current = newFen;
      setStudentVote(''); // Reset vote on board update
      setLastVotedFen(''); // Allow voting again on new position
    }
    function handleVoteTally(tally) {
      console.log('[StudentView] Received vote_tally:', tally);
      setVoteTally(tally);
      if (typeof tally.showVotes === 'boolean') {
        setShowVotes(tally.showVotes);
      }
    }
    function handleModeUpdate(newMode) {
      console.log('[StudentView] Received mode_update:', newMode);
      setMode(newMode);
    }
    console.log('[StudentView] Initializing socket listeners');
    initStudentListeners({
      onBoardUpdate: handleBoardUpdate,
      onVoteTally: handleVoteTally,
      onModeUpdate: handleModeUpdate,
    });
    // Immediately join game on mount
    if (!joined) {
      joinGame(GAME_ID, userId, name);
      setJoined(true);
      setStatus('Joined as ' + (name || userId));
    }
    console.log('[StudentView] socket:', socket);
    if (socket) {
      socket.on('connect', () => console.log('[StudentView] Socket connected:', socket.id));
      socket.on('disconnect', () => console.log('[StudentView] Socket disconnected'));
      socket.on('error', (e) => console.error('[StudentView] Socket error:', e));
    } else {
      console.warn('[StudentView] Could not find socket instance for debug listeners');
    }
    return () => removeStudentListeners();
  }, []);

  useEffect(() => {
    function handleInstructionsUpdate({ instructions }) {
      setInstructions(instructions || 'White to play. Find best move.');
    }
    socket.on('instructions_update', handleInstructionsUpdate);
    return () => {
      socket.off('instructions_update', handleInstructionsUpdate);
    };
  }, []);

  // Listen for timer_update events and sync timer state
  useEffect(() => {
    function handleTimerUpdate({ timer: t, revealTime: r }) {
      setLocalTimer(t);
      if (typeof r === 'number') {
        setRevealTime(r);
      }
    }
    socket.on('timer_update', handleTimerUpdate);
    return () => {
      socket.off('timer_update', handleTimerUpdate);
    };
  }, []);

  // Local timer state for Game Mode
  const [localTimer, setLocalTimer] = useState(timer);
  // Local revealTime state, fallback to prop if not set
  const [localRevealTime, setRevealTime] = useState(revealTime);

  // Only allow voting if not in Observation Mode
  const allowVoting = mode.mode !== 'observe';
  // Only allow moves if student hasn't voted for this FEN yet
  const hasVoted = lastVotedFen === fen && !!studentVote;
  const allowDrag = allowVoting && joined && !hasVoted;
  const allowMove = allowVoting && joined && !hasVoted;

  // Determine which side is to move from the current FEN
  function getTeacherSide() {
    // Teacher always controls the side to move in the FEN
    return fen.split(' ')[1] === 'w' ? 'w' : 'b';
  }
  function getStudentSide() {
    // Students always vote for the side to move (matching teacher's turn)
    return fen.split(' ')[1];
  }

  // --- Helper: build voteArrows prop for Chessboard ---
  function getVoteArrows() {
    const tally = showVotes
      ? Object.fromEntries(Object.entries(voteTally.votes || {}).filter(([_, count]) => count > 0))
      : {};
    const maxVotes = Math.max(1, ...Object.values(tally));
    const arrows = [];
    // Draw all aggregate arrows as orange only if showVotes is true
    if (showVotes) {
      for (const [move, count] of Object.entries(tally)) {
        if (move.length < 4) continue;
        const from = move.slice(0,2);
        const to = move.slice(2,4);
        arrows.push({ from, to, color: '#f39c12', opacity: Math.min(0.8, 0.8 * (0.2 + count/maxVotes)), width: 7 });
      }
    }
    // Always draw student's own vote arrow (green) on top if present
    if (studentVote && studentVote.length >= 4) {
      const from = studentVote.slice(0,2);
      const to = studentVote.slice(2,4);
      arrows.push({ from, to, color: '#27ae60', opacity: 0.8, width: 7 });
    }
    return arrows;
  }

  // Add state for board orientation
  const [boardOrientation, setBoardOrientation] = useState('white');

  // Handle a move (vote)
  function handleMove(moveObj, _fenAfterMove) {
    if (!allowVoting || !joined) return false;
    if (lastVotedFen === fen && !!studentVote) return false;
    const moveStr = moveObj.from + moveObj.to + (moveObj.promotion || '');
    setStudentVote(moveStr);
    setLastVotedFen(fen);
    submitVote(GAME_ID, moveStr, userId, name); // include name
    setStatus('Voted: ' + moveStr);
    console.log('[StudentView] Submitted vote:', moveStr);
    return false;
  }

  // Board always mirrors backend; never allow local state to override

  // --- Helper: control bar/arrow toggles by mode ---
  // Only the teacher controls reveal/arrows; students get settings from mode/reveal props
  function renderVoteControls() {
    return null;
  }

  // Listen for reset_reveal event from socket and setShowVotes(false) when received
  useEffect(() => {
    if (!socket) return;
    function handleResetReveal() {
      setShowVotes(false);
      // Also clear any locally cached vote tally arrows
      setVoteTally(vt => ({ ...vt, votes: {} }));
    }
    socket.on('reset_reveal', handleResetReveal);
    return () => socket.off('reset_reveal', handleResetReveal);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'row', width: '100vw', minHeight: '100vh', background: '#181c24', color: '#f8f9fa' }}>
      {/* Left blank 35% (desktop only) */}
      <div
        className="student-filler-col"
        style={{
          width: window.innerWidth < 700 ? 0 : '35vw',
          minWidth: 0,
          maxWidth: window.innerWidth < 700 ? 0 : '35vw',
          display: window.innerWidth < 700 ? 'none' : undefined,
          transition: 'width 0.2s',
        }}
      />
      {/* Main content 30% or 100% on mobile */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          maxWidth: '100vw',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: window.innerWidth < 700 ? 6 : 24,
          boxSizing: 'border-box',
        }}
      >
        {/* Header for teacher instructions */}
        <h2 style={{
          color: '#fff',
          fontWeight: 'bold',
          fontSize: 24,
          marginBottom: 18,
          textAlign: 'center',
          width: '100%'
        }}>
          {instructions}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 16, marginBottom: 8, gap: 10 }}>
          <button
            onClick={() => setBoardOrientation(o => (o === 'white' ? 'black' : 'white'))}
            title="Flip board"
            style={{
              background: '#111',
              color: '#fff',
              border: '1px solid #aaa',
              borderRadius: '50%',
              width: 28,
              height: 28,
              fontSize: 16,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(0,0,0,0.09)'
            }}
            aria-label="Flip board"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" style={{ display: 'block' }}><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M20 9V7a2 2 0 0 0-2-2h-6"/><path d="m15 2l-3 3l3 3m5 5v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2"/></g></svg>
          </button>
          <label>
            Name: <input value={name} onChange={e => setName(e.target.value)} placeholder="" />
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: window.innerWidth < 700 ? '100%' : undefined }}>
            <Chessboard
              key={fen + '-' + studentVote}
              fen={fen.trim()}
              onMove={handleMove}
              orientation={boardOrientation}
              allowDrag={allowDrag}
              allowMove={allowMove}
              voteArrows={getVoteArrows()}
              boardWidth={window.innerWidth < 700 ? Math.min(window.innerWidth - 24, 400) : boardWidth}
            />
          </div>
        </div>
        {/* Big timer for Game Mode, below board */}
        {mode.mode === 'game' && (
          <div style={{
            fontSize: 24,
            fontWeight: 'bold',
            background: fen.split(' ')[1] === 'w' ? '#ebebeb' : '#222',
            color: fen.split(' ')[1] === 'w' ? '#222' : '#fff',
            borderRadius: 8,
            padding: '12px 32px',
            margin: '18px 0 12px 0',
            border: fen.split(' ')[1] === 'w' ? '3px solid #b8b8b8' : '3px solid #444',
            letterSpacing: 2,
            display: 'inline-block',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
          }}>
            {localTimer}
          </div>
        )}
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
          <b>Your Vote:</b> {studentVote || '—'}
          <button
            disabled={!hasVoted}
            style={{
              marginLeft: 12,
              backgroundColor: `#444444`,
              opacity: hasVoted ? 1 : 0.5,
              cursor: hasVoted ? 'pointer' : 'not-allowed',
            }}
            onClick={() => {
              if (!hasVoted) return;
              retractVote(GAME_ID, studentVote, userId);
              setStudentVote('');
              setLastVotedFen('');
              setStatus('Vote retracted');
            }}
          >
            Retract Vote
          </button>
        </div>
      </div>
      {/* Right blank 35% (desktop only) */}
      <div
        className="student-filler-col"
        style={{
          width: window.innerWidth < 700 ? 0 : '35vw',
          minWidth: 0,
          maxWidth: window.innerWidth < 700 ? 0 : '35vw',
          display: window.innerWidth < 700 ? 'none' : undefined,
          transition: 'width 0.2s',
        }}
      />
    </div>
  );
}
