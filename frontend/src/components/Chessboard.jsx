import React, { useEffect, useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard as ReactChessboard } from 'react-chessboard';

export default function Chessboard({ fen, onMove, orientation: propsOrientation = 'white', boardWidth = 400, allowDrag = true, allowMove = true, voteArrows = [], onFlip }) {
  const [game, setGame] = useState(new Chess(fen || undefined));
  const [currentFen, setCurrentFen] = useState(game.fen());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [orientation, setOrientation] = useState(
    typeof propsOrientation === 'string' ? propsOrientation : 'white'
  );

  // Sync board with FEN prop from parent (for move history navigation)
  useEffect(() => {
    if (fen && fen !== currentFen) {
      const newGame = new Chess(fen);
      setGame(newGame);
      setCurrentFen(newGame.fen());
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [fen]);

  // Allow parent to control orientation
  useEffect(() => {
    if (typeof propsOrientation === 'string') setOrientation(propsOrientation);
  }, [propsOrientation]);

  // Helper: get legal moves for a square
  function getLegalMoves(square) {
    return game.moves({ square, verbose: true }).map(m => m.to);
  }

  // Handle drag-and-drop and promotion modal
  function onDrop(sourceSquare, targetSquare, piece) {
    if (!allowMove) return false;
    const moves = game.moves({ square: sourceSquare, verbose: true });
    const move = moves.find(m => m.to === targetSquare);
    if (!move) return false;
    // Use only the last character for promotion (chess.js expects 'q', 'r', 'b', or 'n')
    const moveObj = { from: sourceSquare, to: targetSquare };
    if (move.flags.includes('p')) {
      moveObj.promotion = piece ? piece.at(-1).toLowerCase() : 'q';
    }
    return doMove(moveObj);
  }

  // Click-to-move logic
  function onSquareClick(square) {
    if (!allowMove) return;
    if (selectedSquare) {
      // Try move
      const moves = game.moves({ square: selectedSquare, verbose: true });
      const move = moves.find(m => m.to === square);
      if (move) {
        const moveObj = { from: selectedSquare, to: square };
        if (move.flags.includes('p')) {
          moveObj.promotion = 'q'; // fallback for click-to-move
        }
        doMove(moveObj);
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      } else if (square === selectedSquare) {
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }
    }
    // Select new piece
    const moves = game.moves({ square, verbose: true });
    if (moves.length > 0 && (allowDrag || game.turn() === (orientation[0] === 'w' ? 'w' : 'b'))) {
      setSelectedSquare(square);
      setLegalMoves(moves.map(m => m.to));
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }

  function doMove(move) {
    const gameCopy = new Chess(currentFen);
    const result = gameCopy.move(move);
    if (result) {
      setGame(gameCopy);
      setCurrentFen(gameCopy.fen());
      setSelectedSquare(null);
      setLegalMoves([]);
      if (onMove) onMove(move, gameCopy.fen());
      return true;
    }
    return false;
  }

  // Handler for flipping the board
  function handleFlipBoard(e) {
    e.stopPropagation();
    setOrientation(o => (o === 'white' ? 'black' : 'white'));
    if (onFlip) onFlip(o => (o === 'white' ? 'black' : 'white'));
  }

  // Build customSquareStyles object
  const customSquareStyles = {};
  if (selectedSquare) {
    customSquareStyles[selectedSquare] = {
      background: 'rgba(255, 255, 0, 0.2)'
    };
    for (const sq of legalMoves) {
      customSquareStyles[sq] = {
        background: 'rgba(0, 255, 0, 0.15)'
      };
    }
  }

  // --- ARROW OVERLAY SUPPORT ---
  // Helper: draw SVG arrows for moves
  function ArrowOverlay({ arrows, boardWidth }) {
    // arrows: [{ from: 'e2', to: 'e4', color: '#27ae60', opacity: 1 }]
    // Board is 8x8, squares are boardWidth/8 px
    const sqSize = boardWidth / 8;
    function squareToXY(square) {
      const file = square.charCodeAt(0) - 97; // 'a' = 0
      const rank = 8 - parseInt(square[1]); // rank 8 at top
      return [file * sqSize + sqSize / 2, rank * sqSize + sqSize / 2];
    }
    return (
      <svg width={boardWidth} height={boardWidth} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', zIndex: 10 }}>
        {arrows.map((a, i) => {
          const [x1, y1] = squareToXY(a.from);
          const [x2, y2] = squareToXY(a.to);
          const dx = x2 - x1, dy = y2 - y1;
          const len = Math.sqrt(dx*dx + dy*dy);
          const nx = dx / len, ny = dy / len;
          // Arrowhead
          // Use smaller arrows for responsive boards
          const baseStroke = 16;
          const baseHead = 24;
          // Shrink arrows if board is < 350px
          const scale = boardWidth < 350 ? boardWidth / 400 : 1;
          const arrowStrokeWidth = Math.max(6, baseStroke * scale * 0.6); // never smaller than 6
          const ah = baseHead * scale * 0.7;
          const aw = baseHead * scale * 0.7;
          const ax = x2 - nx * ah, ay = y2 - ny * ah;
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={ax} y2={ay} stroke={a.color} strokeWidth={arrowStrokeWidth} opacity={a.opacity} strokeLinecap="round" />
              <polygon points={`
                ${x2},${y2}
                ${ax + ny*aw},${ay - nx*aw}
                ${ax - ny*aw},${ay + nx*aw}
              `} fill={a.color} opacity={a.opacity} />
            </g>
          );
        })}
      </svg>
    );
  }

  return (
    <div style={{ maxWidth: boardWidth, margin: '0 auto', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* ARROW OVERLAY */}
      {voteArrows.length > 0 && (
        <ArrowOverlay arrows={voteArrows} boardWidth={boardWidth} />
      )}
      <ReactChessboard
        position={currentFen}
        onPieceDrop={onDrop}
        onSquareClick={onSquareClick}
        boardOrientation={orientation}
        arePiecesDraggable={allowDrag && allowMove}
        isDraggablePiece={() => allowDrag && allowMove}
        boardWidth={boardWidth}
        customBoardStyle={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
        customDarkSquareStyle={{ backgroundColor: '#b58863' }}
        customLightSquareStyle={{ backgroundColor: '#f0d9b5' }}
        customSquareStyles={customSquareStyles}
      />
    </div>
  );
}
