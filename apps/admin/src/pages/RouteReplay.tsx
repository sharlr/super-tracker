import React, { useState } from 'react';
import axios from 'axios';
import { MapPin, Clock, Navigation } from 'lucide-react';

export default function RouteReplay() {
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [route, setRoute] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleLoadRoute = async () => {
    if (!selectedEmployee || !selectedDate) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`/api/v1/routes/${selectedEmployee}/${selectedDate}`);
      setRoute(response.data.route);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to load route:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-8 bg-gray-50 overflow-auto">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Route Replay</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Employee</label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select employee</option>
                <option value="emp-001">Amit Mehta</option>
                <option value="emp-002">Rajan Kumar</option>
                <option value="emp-003">Priya Sharma</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleLoadRoute}
                disabled={loading || !selectedEmployee}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Loading...' : 'Load Route'}
              </button>
              <button className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                PDF
              </button>
              <button className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                CSV
              </button>
            </div>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-gray-600 text-sm">SHIFT START</div>
              <div className="text-2xl font-bold text-gray-900">08:14</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-gray-600 text-sm">SHIFT END</div>
              <div className="text-2xl font-bold text-gray-900">Active</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-gray-600 text-sm">TOTAL DISTANCE</div>
              <div className="text-2xl font-bold text-gray-900">34.2 km</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-gray-600 text-sm">WORKING TIME</div>
              <div className="text-2xl font-bold text-gray-900">6h 22m</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Map Area */}
          <div className="col-span-2 bg-white rounded-lg shadow p-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 h-96 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
              <div className="text-center">
                <MapPin size={48} className="mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600">Route Polyline with 9 stops</p>
              </div>
            </div>
          </div>

          {/* Stop List */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-gray-900 mb-4">9 STOPS - 3 VISITS</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {[
                { time: '08:14', type: 'Start', status: '93% - GPS on' },
                { time: '09:02', type: 'Stop', status: '87% - 4G' },
                { time: '09:45', type: 'Alpha Corp', status: '—' },
                { time: '10:38', type: 'Stop', status: '78% - 4G' },
                { time: '11:15', type: 'Stop', status: '67% - WiFi' },
                { time: '11:52', type: 'Beta Solutions', status: '—' },
                { time: '13:10', type: 'Stop', status: '58% - 4G' },
                { time: '13:48', type: 'Gamma Pvt', status: '—' },
                { time: '14:36', type: 'Stop', status: '45% - GPS on' },
              ].map((stop, idx) => (
                <div key={idx} className="flex gap-3 pb-3 border-b border-gray-200 last:border-b-0">
                  <div className="text-xs font-bold text-blue-600 whitespace-nowrap">{stop.time}</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{stop.type}</p>
                    <p className="text-xs text-gray-500">{stop.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
