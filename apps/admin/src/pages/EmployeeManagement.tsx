import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Edit2, Trash2, Plus, Search } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  email: string;
  branch: string;
  department: string;
  role: string;
  tracking_enabled: boolean;
  visit_logging_enabled: boolean;
  task_access_enabled: boolean;
  geofence_alerts_enabled: boolean;
}

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [branch, setBranch] = useState('');
  const [department, setDepartment] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, [branch, department]);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/api/v1/employees', {
        params: { branch: branch || undefined, department: department || undefined }
      });
      setEmployees(response.data.employees);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      setLoading(false);
    }
  };

  const toggleFeature = async (employeeId: string, feature: string, enabled: boolean) => {
    try {
      await axios.patch(`/api/v1/employees/${employeeId}`, {
        [feature]: !enabled
      });
      fetchEmployees();
    } catch (error) {
      console.error('Failed to update employee:', error);
    }
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 p-8 bg-gray-50 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
            <Plus size={20} />
            Add Employee
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="col-span-2 relative">
              <Search size={20} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Employee List */}
          <div className="col-span-2 bg-white rounded-lg shadow p-6">
            <div className="space-y-3">
              {filteredEmployees.map((emp) => (
                <div
                  key={emp.id}
                  onClick={() => setSelectedEmployee(emp)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                    selectedEmployee?.id === emp.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                        {emp.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{emp.name}</p>
                        <p className="text-sm text-gray-500">{emp.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-gray-200 rounded">
                        <Edit2 size={18} className="text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-200 rounded">
                        <Trash2 size={18} className="text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Employee Details */}
          {selectedEmployee && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{selectedEmployee.name}</h3>
              
              <div className="space-y-4 mb-6 text-sm">
                <div>
                  <label className="text-gray-600 block mb-1">Email</label>
                  <p className="font-semibold text-gray-900">{selectedEmployee.email}</p>
                </div>
                <div>
                  <label className="text-gray-600 block mb-1">Branch</label>
                  <p className="font-semibold text-gray-900">{selectedEmployee.branch}</p>
                </div>
                <div>
                  <label className="text-gray-600 block mb-1">Department</label>
                  <p className="font-semibold text-gray-900">{selectedEmployee.department}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-bold text-gray-900 mb-3">Feature Access</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedEmployee.tracking_enabled}
                      onChange={() =>
                        toggleFeature(
                          selectedEmployee.id,
                          'tracking_enabled',
                          selectedEmployee.tracking_enabled
                        )
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-gray-700">GPS tracking enabled</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedEmployee.visit_logging_enabled}
                      onChange={() =>
                        toggleFeature(
                          selectedEmployee.id,
                          'visit_logging_enabled',
                          selectedEmployee.visit_logging_enabled
                        )
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-gray-700">Can log client visits</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedEmployee.task_access_enabled}
                      onChange={() =>
                        toggleFeature(
                          selectedEmployee.id,
                          'task_access_enabled',
                          selectedEmployee.task_access_enabled
                        )
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-gray-700">Receives task assignments</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedEmployee.geofence_alerts_enabled}
                      onChange={() =>
                        toggleFeature(
                          selectedEmployee.id,
                          'geofence_alerts_enabled',
                          selectedEmployee.geofence_alerts_enabled
                        )
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-gray-700">Geofence alerts enabled</span>
                  </label>
                </div>
              </div>

              <button className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                Edit Employee
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
