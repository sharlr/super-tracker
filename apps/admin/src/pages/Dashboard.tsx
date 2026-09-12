import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, AlertCircle, MapPin, CheckCircle2 } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    activeEmployees: 0,
    totalAlerts: 0,
    activeTracking: 0,
    completedTasks: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/v1/dashboard/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    {
      title: 'Active Employees',
      value: stats.activeEmployees,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Active Tracking',
      value: stats.activeTracking,
      icon: MapPin,
      color: 'bg-green-500'
    },
    {
      title: 'Active Alerts',
      value: stats.totalAlerts,
      icon: AlertCircle,
      color: 'bg-orange-500'
    },
    {
      title: 'Tasks Completed',
      value: stats.completedTasks,
      icon: CheckCircle2,
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="flex-1 p-8 bg-gray-50 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">{card.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                  </div>
                  <div className={`${card.color} text-white p-3 rounded-full`}>
                    <Icon size={24} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Alerts */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Alerts</h2>
            <div className="space-y-4">
              <div className="flex items-start p-3 bg-red-50 border-l-4 border-red-500 rounded">
                <AlertCircle className="text-red-500 mt-1 mr-3 flex-shrink-0" size={20} />
                <div>
                  <p className="font-semibold text-gray-900">GPS Disabled</p>
                  <p className="text-sm text-gray-600">Sunita Rao - 14:22 today</p>
                </div>
              </div>
              <div className="flex items-start p-3 bg-orange-50 border-l-4 border-orange-500 rounded">
                <AlertCircle className="text-orange-500 mt-1 mr-3 flex-shrink-0" size={20} />
                <div>
                  <p className="font-semibold text-gray-900">Low Battery</p>
                  <p className="text-sm text-gray-600">Priya Sharma - 13:58 today</p>
                </div>
              </div>
            </div>
          </div>

          {/* Active Employees */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Active Now</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
                    AM
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold text-gray-900">Amit Mehta</p>
                    <p className="text-xs text-gray-500">34.2 km • 87% battery</p>
                  </div>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center font-semibold">
                    PS
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold text-gray-900">Priya Sharma</p>
                    <p className="text-xs text-gray-500">14.4 km • 65% battery</p>
                  </div>
                </div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
