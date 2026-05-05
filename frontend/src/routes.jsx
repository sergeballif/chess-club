import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TeacherView from './views/TeacherView';
import StudentView from './views/StudentView';
import PasswordGate from './components/PasswordGate';

export default function AppRoutes() {
  return (
    <BrowserRouter basename="/chess-club">
      <Routes>
        <Route path="/teacher" element={<PasswordGate><TeacherView /></PasswordGate>} />
        <Route path="/" element={<StudentView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
