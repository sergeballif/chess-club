import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { socket, submitVote } from "../lib/socket";

/**
 * MoveVoting
 * - Displays voting arrows for each legal move
 * - Shows student's vote as a green arrow, others as orange (when revealed)
 * - Shows aggregate vote counts as bars when appropriate
 * - Handles voting, reveal logic, and real-time updates
 *
 * Props:
 *   legalMoves: array of SAN strings
 *   currentMove: index in move history
 *   gameId: string
 *   userId: string
 *   userName: string
 *   mode: "poll" | "game"
 *   reveal: boolean (if votes are revealed)
 *   voteTally: { [move]: count }
 *   votesByMove: { [move]: [studentName] }
 *   studentVote: string (the move this user voted for)
 *   onVote: function(move) => void (optional, for local state)
 *   timer: number (optional, seconds left in game mode)
 *   revealTime: number (optional, seconds left in game mode to reveal votes)
 */
export default function MoveVoting({
  legalMoves = [],
  currentMove,
  gameId,
  userId,
  userName,
  mode,
  reveal,
  voteTally = {},
  votesByMove = {},
  studentVote,
  onVote,
  timer,
  revealTime,
}) {
  const [selected, setSelected] = useState(studentVote || "");
  const [hoveredMove, setHoveredMove] = useState(null);

  useEffect(() => {
    setSelected(studentVote || "");
  }, [studentVote, currentMove]);

  function handleVote(move) {
    setSelected(move);
    submitVote(gameId, move, userId);
    if (onVote) onVote(move);
  }

  // --- Color palette for bars ---
  const BAR_COLORS = [
    '#e74c3c', '#8e44ad', '#3498db', '#16a085', '#f39c12',
    '#2ecc71', '#e67e22', '#1abc9c', '#d35400', '#2980b9',
    '#439b00', '#6f009e', '#0e75ba', '#1f7e6b', '#f3128e',
    '#42a069', '#cd6408', '#d83be3'
  ];
  function getBarColor(move) {
    // Simple hash to get a color from move string
    let hash = 0;
    for (let i = 0; i < move.length; i++) {
      hash = (hash * 31 + move.charCodeAt(i)) % BAR_COLORS.length;
    }
    return BAR_COLORS[hash];
  }

  // Only show bars for moves that have at least one vote
  const bars = Object.entries(voteTally || {})
    .filter(([move, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([move, count]) => {
      const maxVotes = Math.max(...Object.values(voteTally || {}), 1);
      const percent = (count / maxVotes) * 100;
      const barColor = getBarColor(move);
      const voters = (votesByMove && votesByMove[move]) || [];
      // Only show move label if revealed, but always show tooltip
      const showMove = (mode === "game" && timer <= revealTime) || (mode === "poll" && reveal);
      return (
        <div
          key={move}
          className="vote-bar-wrapper"
          style={{ position: 'relative', marginBottom: 8 }}
          onMouseEnter={() => setHoveredMove(move)}
          onMouseLeave={() => setHoveredMove(null)}
        >
          <div
            className="vote-bar"
            style={{
              width: percent + '%',
              height: 24,
              background: barColor,
              borderRadius: 5,
              opacity: count > 0 ? 0.8 : 0.4,
              transition: 'width 0.3s',
              position: 'relative',
              cursor: voters.length > 0 ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 10,
            }}
          >
            {showMove && (
              <span style={{ fontWeight: 700, color: '#fff', textShadow: '0 1px 2px #222', fontSize: 15 }}>{move}</span>
            )}
            {/* Tooltip for voter names: always show on hover */}
            {hoveredMove === move && voters.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: -32,
                  left: 0,
                  background: '#222',
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: 14,
                  zIndex: 10,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                  pointerEvents: 'auto',
                  minWidth: 60,
                  textAlign: 'center',
                }}
              >
                {voters.filter(Boolean).length > 0 ? voters.filter(Boolean).join(', ') : <span style={{ color: '#aaa' }}>(No names)</span>}
              </div>
            )}
          </div>
        </div>
      );
    });

  return (
    <div className="move-voting-panel">
      {bars}
    </div>
  );
}

MoveVoting.propTypes = {
  legalMoves: PropTypes.arrayOf(PropTypes.string),
  currentMove: PropTypes.number,
  gameId: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
  userName: PropTypes.string,
  mode: PropTypes.oneOf(["poll", "game"]).isRequired,
  reveal: PropTypes.bool.isRequired,
  voteTally: PropTypes.object,
  votesByMove: PropTypes.object,
  studentVote: PropTypes.string,
  onVote: PropTypes.func,
  timer: PropTypes.number,
  revealTime: PropTypes.number,
};
