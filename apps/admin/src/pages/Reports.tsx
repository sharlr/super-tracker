import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, FileText } from 'lucide-react';

interface ReportData {
  id: string;
  name: string;
  branch: string;
  department: string;
  shift_start: string;
  hours: number;
  km: number;
  visits: number;
  status: 'Completed' | 'Active' | 'Alert';
}

export default function Reports() {
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [branch, setBranch] = useState('');
  const [department, setDepartment] = useState('');
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [totals, setTotals] = useState({ employees: 0, kmTravelled: 0, hoursWorked: 0, visits: 0 });

  useEffect(() => {
    fetchReport();
  }, [reportDate, branch, department]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/v1/reports/daily', {
        params: {
          date: reportDate,
          branch: branch || undefined,
          department: department || undefined,
        },
      });
      setReportData(response.data.report);
      
      // Calculate totals
      const total = response.data.report.reduce(
        (acc: any, emp: any) => ({
          employees: acc.employees + 1,
          kmTravelled: acc.kmTravelled + (emp.km_travelled || 0),
          hoursWorked: acc.hoursWorked + (emp.hours_worked || 0),
          visits: acc.visits + (emp.visits || 0),
        }),
        { employees: 0, kmTravelled: 0, hoursWorked: 0, visits: 0 }
      );
      setTotals(total);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch report:', error);
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-8 bg-gray-50 overflow-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Daily Reports</h1>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
              <Download size={20} />
              PDF
            </button>
            <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
              <Download size={20} />
              CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All branches</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Chennai">Chennai</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All departments</option>
                <option value="Sales">Sales</option>
                <option value="Service">Service</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchReport}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Loading...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Employees Shown</p>
            <p className="text-3xl font-bold text-gray-900">{totals.employees}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Total Distance</p>
            <p className="text-3xl font-bold text-gray-900">{totals.kmTravelled.toFixed(1)} km</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Total Hours</p>
            <p className="text-3xl font-bold text-gray-900">{Math.round(totals.hoursWorked)}h {Math.round((totals.hoursWorked % 1) * 60)}m</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Total Visits</p>
            <p className="text-3xl font-bold text-gray-900">{totals.visits}</p>
          </div>
        </div>

        {/* Report Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Employee</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Branch</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Department</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Shift Start</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Hours</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">KM</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Visits</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reportData.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{emp.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{emp.branch}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{emp.department}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{emp.shift_start}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{emp.hours.toFixed(1)}h</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{emp.km.toFixed(1)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{emp.visits}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-block px-3 py-1 rounded text-white text-xs font-semibold ${
                        emp.status === 'Completed'
                          ? 'bg-green-600'
                          : emp.status === 'Active'
                          ? 'bg-blue-600'
                          : 'bg-red-600'
                      }`}
                    >
                      {emp.status}
                    </span>
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
