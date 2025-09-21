import React from "react";
// import PropTypes from "prop-types";
import styles from "../styles/chessboard.module.css";

/**
 * MoveHistory Panel
 * - Displays moves in two columns (white/black)
 * - Clickable moves to jump to that position
 * - Back/forward buttons
 * - Truncates if new moves are made after going back
 *
 * Props:
 *   moves: Array of SAN strings (e.g. ["e4", "e5", ...])
 *   currentMove: Index of the current move (0 = start position)
 *   onJump: Function(newIndex) to jump to a move
 *   onBack: Go to previous move
 *   onForward: Go to next move
 */
export default function MoveHistory({ moves, currentMove, onJump, onBack, onForward }) {
  // Create pairs ensuring white moves are always in left column, black in right
  const pairs = [];
  for (let i = 0; i < moves.length; i += 2) {
    const whiteMove = moves[i];
    const blackMove = moves[i + 1];
    pairs.push([whiteMove, blackMove]);
  }

  return (
    <div className={styles.moveHistoryPanel}>
      <div className={styles.moveHistoryHeader}>Move History</div>
      <div className={styles.moveHistoryTable}>
        <div className={styles.moveHistoryColHeader}>#</div>
        <div className={styles.moveHistoryColHeader}>White</div>
        <div className={styles.moveHistoryColHeader}>Black</div>
        {pairs.map(([whiteMove, blackMove], pairIdx) => (
          <React.Fragment key={pairIdx}>
            <div className={styles.moveHistoryRowNum}>{pairIdx + 1}</div>
            <div
              className={
                styles.moveHistoryMove +
                (currentMove === pairIdx * 2 + 1 ? ' ' + styles.moveHistoryCurrent : '')
              }
              onClick={() => whiteMove && onJump(pairIdx * 2 + 1)}
              role="button"
              tabIndex={0}
            >
              {whiteMove || ''}
            </div>
            <div
              className={
                styles.moveHistoryMove +
                (currentMove === pairIdx * 2 + 2 ? ' ' + styles.moveHistoryCurrent : '')
              }
              onClick={() => blackMove && onJump(pairIdx * 2 + 2)}
              role="button"
              tabIndex={0}
            >
              {blackMove || ''}
            </div>
          </React.Fragment>
        ))}
      </div>
      <div className={styles.moveHistoryNav}>
        <button onClick={onBack} disabled={currentMove === 0}>&lt;</button>
        <span>
          {currentMove}/{moves.length}
        </span>
        <button onClick={onForward} disabled={currentMove >= moves.length}>&gt;</button>
      </div>
    </div>
  );
}

// MoveHistory.propTypes = {
//   moves: PropTypes.arrayOf(PropTypes.string).isRequired,
//   currentMove: PropTypes.number.isRequired,
//   onJump: PropTypes.func.isRequired,
//   onBack: PropTypes.func.isRequired,
//   onForward: PropTypes.func.isRequired,
// };
