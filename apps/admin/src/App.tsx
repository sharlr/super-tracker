import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import LiveMap from './pages/LiveMap';
import RouteReplay from './pages/RouteReplay';
import EmployeeManagement from './pages/EmployeeManagement';
import TaskManagement from './pages/TaskManagement';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import ClientManagement from './pages/ClientManagement';
import UserAccess from './pages/UserAccess';
import Sidebar from './components/Sidebar';
import './App.css';

export default function App() {
  const { token, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!token) {
    return <LoginPage />;
  }

  return (
    <Router>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/live-map" element={<LiveMap />} />
            <Route path="/route-replay" element={<RouteReplay />} />
            <Route path="/employees" element={<EmployeeManagement />} />
            <Route path="/tasks" element={<TaskManagement />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/clients" element={<ClientManagement />} />
            <Route path="/access-control" element={<UserAccess />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
