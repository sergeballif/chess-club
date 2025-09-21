import React, { useState } from "react";
import { Chess } from "chess.js";

/**
 * FENPanel
 * - Shows current FEN
 * - Allows editing FEN and loading it to the board
 * - Dropdown for saved FENs
 * - Alerts on invalid FEN
 *
 * Props:
 *   fen: current FEN string
 *   onLoadFEN: function(newFEN) => void
 *   savedFENs: array of { name, fen }
 *   onSaveFEN: function(name, fen) => void
 */
export default function FENPanel({ fen, onLoadFEN, savedFENs = [], onSaveFEN }) {
  const [fenInput, setFenInput] = useState(fen);
  const [alert, setAlert] = useState("");
  const [saveName, setSaveName] = useState("");

  // Update FEN input when prop changes
  React.useEffect(() => {
    setFenInput(fen);
  }, [fen]);

  function handleLoadClick(fenToLoad) {
    const targetFen = fenToLoad !== undefined ? fenToLoad : fenInput;
    if (!targetFen || typeof targetFen !== 'string' || targetFen.trim() === '') {
      setAlert("FEN string is empty.");
      return;
    }
    try {
      const chess = new Chess();
      chess.load(targetFen.trim());
      setAlert("");
      onLoadFEN(targetFen.trim());
    } catch (e) {
      setAlert("Invalid FEN: " + e.message);
    }
  }

  function handleSaveClick() {
    if (!saveName.trim()) {
      setAlert("Please enter a name for the saved FEN.");
      return;
    }
    onSaveFEN(saveName.trim(), fenInput);
    setSaveName("");
    setAlert("");
  }

  function handleDropdownChange(e) {
    const selectedFen = e.target.value;
    setFenInput(selectedFen);
    setAlert("");
    if (selectedFen) {
      handleLoadClick(selectedFen);
    }
  }

  return (
    <div>
      <div style={{ fontWeight: 'bold', marginBottom: 4 }}>FEN Management</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
        <button onClick={() => handleLoadClick()} style={{ whiteSpace: 'nowrap', border: '1px solid #ccc' }}>Load FEN</button>
        <textarea
          value={fenInput}
          onChange={e => setFenInput(e.target.value)}
          rows={3}
          style={{ width: '100%', fontFamily: 'monospace', fontSize: 13, marginBottom: 0, resize: 'vertical' }}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
        <button onClick={handleSaveClick} style={{ whiteSpace: 'nowrap', border: '1px solid #ccc' }}>Save FEN</button>
        <input
          type="text"
          placeholder="Save as..."
          value={saveName}
          onChange={e => setSaveName(e.target.value)}
          style={{ flex: 1 }}
        />
      </div>
      {savedFENs.length > 0 && (
        <select value={fenInput} onChange={handleDropdownChange} style={{ width: '100%', marginBottom: 6 }}>
          <option value="">-- Load saved FEN --</option>
          {savedFENs.map(({ name, fen }) => (
            <option key={name + fen} value={fen}>{name}</option>
          ))}
        </select>
      )}
      {alert && <div style={{ color: 'red', marginTop: 4 }}>{alert}</div>}
    </div>
  );
}
