import React, { useState } from 'react';

export const TEACHER_PW_SESSION_KEY = 'chess-club-teacher-pw';

export default function PasswordGate({ children }) {
  const enabled = window.CHESS_CLUB_CONFIG?.teacherPasswordEnabled || false;

  const [authenticated, setAuthenticated] = useState(
    !enabled || sessionStorage.getItem(TEACHER_PW_SESSION_KEY) !== null
  );
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  if (authenticated) return children;

  function handleSubmit(e) {
    e.preventDefault();
    if (input.trim() === '') {
      setError(true);
      return;
    }
    sessionStorage.setItem(TEACHER_PW_SESSION_KEY, input.trim());
    setAuthenticated(true);
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#181c24' }}>
      <form onSubmit={handleSubmit} style={{ background: '#23272f', borderRadius: 10, padding: '36px 40px', display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.4)', minWidth: 280 }}>
        <div style={{ fontSize: 22, fontWeight: 'bold', color: '#f8f9fa', textAlign: 'center' }}>Teacher Access</div>
        <input
          type="password"
          value={input}
          onChange={e => { setInput(e.target.value); setError(false); }}
          placeholder="Enter password"
          autoFocus
          style={{ fontSize: 16, padding: '8px 12px', borderRadius: 6, border: error ? '2px solid #e74c3c' : '1px solid #555', background: '#181c24', color: '#f8f9fa', outline: 'none' }}
        />
        {error && <div style={{ color: '#e74c3c', fontSize: 13, textAlign: 'center' }}>Please enter a password</div>}
        <button type="submit" style={{ fontSize: 16, padding: '8px 0', borderRadius: 6, background: '#2ecc71', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
          Enter
        </button>
      </form>
    </div>
  );
}
