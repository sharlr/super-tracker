import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Toggle2, Trash2 } from 'lucide-react';

interface RolePermission {
  view_all_employees: boolean;
  live_map_all: boolean;
  create_tasks: boolean;
  export_reports: boolean;
  manage_clients: boolean;
  manage_access: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'manager' | 'supervisor' | 'employee';
  supervisor_id?: string;
  gps_enabled: boolean;
  tasks_enabled: boolean;
  visits_enabled: boolean;
}

export default function UserAccess() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const rolePermissions: { [key: string]: RolePermission } = {
    manager: {
      view_all_employees: true,
      live_map_all: true,
      create_tasks: true,
      export_reports: true,
      manage_clients: true,
      manage_access: true,
    },
    supervisor: {
      view_all_employees: true,
      live_map_all: true,
      create_tasks: true,
      export_reports: true,
      manage_clients: true,
      manage_access: false,
    },
    employee: {
      view_all_employees: false,
      live_map_all: false,
      create_tasks: false,
      export_reports: false,
      manage_clients: false,
      manage_access: false,
    },
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/v1/users');
      setUsers(response.data.users);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setLoading(false);
    }
  };

  const toggleFeature = async (userId: string, feature: string) => {
    try {
      await axios.patch(`/api/v1/users/${userId}`, {
        [feature]: !users.find((u) => u.id === userId)?.[feature as keyof User],
      });
      fetchUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  return (
    <div className="flex-1 p-8 bg-gray-50 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Access & Roles</h1>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
            <Plus size={20} />
            Add User
          </button>
        </div>

        {/* Role Permission Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {Object.entries(rolePermissions).map(([role, permissions]) => (
            <div key={role} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 capitalize">
                {role === 'employee' ? 'Field Employee' : role}
              </h3>
              <div className="space-y-3">
                {Object.entries(permissions).map(([perm, allowed]) => (
                  <div
                    key={perm}
                    className={`flex items-center p-2 rounded ${
                      allowed ? 'bg-green-50' : 'bg-gray-50'
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded mr-2 ${
                        allowed ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    ></div>
                    <span className="text-sm text-gray-700">
                      {perm.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Employee</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Supervisor</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">GPS</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tasks</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Visits</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-block px-3 py-1 rounded text-xs font-semibold capitalize bg-blue-100 text-blue-700">
                      {user.role === 'employee' ? 'Field Employee' : user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {user.supervisor_id ? 'Assigned' : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleFeature(user.id, 'gps_enabled')}
                      className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${
                        user.gps_enabled ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform bg-white rounded-full transition-transform ${
                          user.gps_enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleFeature(user.id, 'tasks_enabled')}
                      className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${
                        user.tasks_enabled ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform bg-white rounded-full transition-transform ${
                          user.tasks_enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleFeature(user.id, 'visits_enabled')}
                      className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${
                        user.visits_enabled ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform bg-white rounded-full transition-transform ${
                          user.visits_enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-red-600 hover:text-red-700">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
