import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin, Battery, Wifi, Navigation } from 'lucide-react';
import io from 'socket.io-client';

interface Employee {
  id: string;
  name: string;
  branch: string;
  department: string;
  last_location?: {
    latitude: number;
    longitude: number;
    battery: number;
    gps_status: string;
    recorded_at: string;
  };
}

export default function LiveMap() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [branch, setBranch] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch live employees
    const fetchEmployees = async () => {
      try {
        const response = await axios.get('/api/v1/employees/live', {
          params: { branch: branch || undefined, department: department || undefined }
        });
        setEmployees(response.data.employees);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch employees:', error);
        setLoading(false);
      }
    };

    fetchEmployees();
    const interval = setInterval(fetchEmployees, 10000); // Refresh every 10 seconds

    // WebSocket for real-time updates
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:4010');
    socket.emit('join-map', localStorage.getItem('tenantId'));

    socket.on('location:update', (data) => {
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === data.employeeId
            ? {
                ...emp,
                last_location: {
                  latitude: data.location.latitude,
                  longitude: data.location.longitude,
                  battery: data.battery,
                  gps_status: 'Active',
                  recorded_at: data.timestamp
                }
              }
            : emp
        )
      );
    });

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [branch, department]);

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  return (
    <div className="flex-1 p-8 bg-gray-50 flex gap-6">
      {/* Map Area */}
      <div className="flex-1">
        <div className="bg-white rounded-lg shadow h-full p-6 flex flex-col">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Live Map</h1>

          {/* Filters */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All branches</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Chennai">Chennai</option>
            </select>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All departments</option>
              <option value="Sales">Sales</option>
              <option value="Service">Service</option>
            </select>
            <div className="flex gap-2">
              <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Route Replay
              </button>
              <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                New Task
              </button>
            </div>
          </div>

          {/* Map placeholder - would use Leaflet in production */}
          <div className="flex-1 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
            <div className="text-center">
              <MapPin size={48} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">OpenStreetMap Integration</p>
              <p className="text-sm text-gray-500 mt-1">Showing {employees.length} active employees</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar - Employee List */}
      <div className="w-80 bg-white rounded-lg shadow p-6 flex flex-col">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Field Employees <span className="text-green-600 text-sm">({employees.length})</span>
        </h2>

        <div className="space-y-3 flex-1 overflow-y-auto">
          {employees.map((emp) => (
            <div
              key={emp.id}
              onClick={() => setSelectedEmployee(emp)}
              className={`p-3 rounded-lg cursor-pointer transition ${
                selectedEmployee?.id === emp.id
                  ? 'bg-blue-50 border-2 border-blue-500'
                  : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {emp.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{emp.name}</p>
                  {emp.last_location && (
                    <div className="flex gap-2 mt-1">
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Battery size={12} />
                        {emp.last_location.battery}%
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Wifi size={12} />
                        {emp.last_location.gps_status}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Employee Details */}
        {selectedEmployee && selectedEmployee.last_location && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-bold text-gray-900 mb-3">{selectedEmployee.name}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Location:</span>
                <span className="font-semibold text-gray-900">
                  {selectedEmployee.last_location.latitude.toFixed(4)}, {selectedEmployee.last_location.longitude.toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Battery:</span>
                <span className="font-semibold text-gray-900">{selectedEmployee.last_location.battery}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">GPS:</span>
                <span className="font-semibold text-green-600">{selectedEmployee.last_location.gps_status}</span>
              </div>
              <div className="pt-3 flex gap-2">
                <button className="flex-1 bg-blue-600 text-white text-sm py-2 rounded hover:bg-blue-700">
                  Assign Task
                </button>
                <button className="flex-1 bg-gray-200 text-gray-900 text-sm py-2 rounded hover:bg-gray-300">
                  Message
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
