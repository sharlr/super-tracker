import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Map,
  Users,
  CheckSquare,
  AlertCircle,
  FileText,
  Building2,
  Lock,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export default function Sidebar() {
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);

  const navigationItems = [
    {
      label: 'OPERATIONS',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: Home },
        { name: 'Live Map', path: '/live-map', icon: Map },
        { name: 'Route Replay', path: '/route-replay', icon: Map },
        { name: 'Tasks', path: '/tasks', icon: CheckSquare, badge: 3 },
        { name: 'Client Visits', path: '/visits', icon: Building2 },
      ],
    },
    {
      label: 'MANAGEMENT',
      items: [
        { name: 'Employees', path: '/employees', icon: Users },
        { name: 'Alerts', path: '/alerts', icon: AlertCircle, badge: 2 },
        { name: 'Reports', path: '/reports', icon: FileText },
        { name: 'Clients', path: '/clients', icon: Building2 },
        { name: 'User Access', path: '/access-control', icon: Lock },
      ],
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white rounded-full p-2">
            <Building2 size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg">Super Tracker</h1>
            <p className="text-xs text-gray-400">SaaS Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        {navigationItems.map((section, idx) => (
          <div key={idx} className="mb-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
              {section.label}
            </h3>
            <div className="space-y-2">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                      isActive(item.path)
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <span className="bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={() => {
            logout();
            window.location.href = '/login';
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 transition"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
