import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

interface Alert {
  id: string;
  employee_id: string;
  employee_name: string;
  alert_type: 'GPS off' | 'Low battery' | 'Geofence' | 'No activity';
  message: string;
  battery: number;
  is_read: boolean;
  created_at: string;
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRead, setFilterRead] = useState(false);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await axios.get('/api/v1/alerts');
      setAlerts(response.data.alerts);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      setLoading(false);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      await axios.patch(`/api/v1/alerts/${alertId}`, { is_read: true });
      fetchAlerts();
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.post('/api/v1/alerts/mark-all-read');
      fetchAlerts();
    } catch (error) {
      console.error('Failed to mark all alerts as read:', error);
    }
  };

  const filteredAlerts = filterRead ? alerts.filter((a) => a.is_read) : alerts.filter((a) => !a.is_read);

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'GPS off':
        return { border: 'border-red-500', bg: 'bg-red-50', text: 'text-red-700' };
      case 'Low battery':
        return { border: 'border-orange-500', bg: 'bg-orange-50', text: 'text-orange-700' };
      case 'Geofence':
        return { border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' };
      case 'No activity':
        return { border: 'border-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-700' };
      default:
        return { border: 'border-gray-500', bg: 'bg-gray-50', text: 'text-gray-700' };
    }
  };

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  return (
    <div className="flex-1 p-8 bg-gray-50 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Alerts {unreadCount > 0 && <span className="text-red-600 text-xl">({unreadCount} unread)</span>}
          </h1>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <div className="flex gap-4">
            <button
              onClick={() => setFilterRead(false)}
              className={`px-4 py-2 rounded-lg font-semibold ${
                !filterRead
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Unread ({alerts.filter((a) => !a.is_read).length})
            </button>
            <button
              onClick={() => setFilterRead(true)}
              className={`px-4 py-2 rounded-lg font-semibold ${
                filterRead
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Read ({alerts.filter((a) => a.is_read).length})
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <CheckCircle2 size={48} className="mx-auto text-green-500 mb-3" />
              <p className="text-gray-600 text-lg">
                {filterRead ? 'No read alerts' : 'No new alerts'}
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const colors = getAlertColor(alert.alert_type);
              return (
                <div
                  key={alert.id}
                  className={`${colors.bg} border-l-4 ${colors.border} rounded-lg p-4 flex items-start justify-between`}
                >
                  <div className="flex gap-4 flex-1">
                    <AlertCircle className={`${colors.text} mt-1 flex-shrink-0`} size={24} />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`font-bold ${colors.text}`}>{alert.alert_type}</span>
                        <span className={`text-sm font-semibold ${colors.text}`}>
                          {new Date(alert.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className={`text-sm ${colors.text}`}>
                        {alert.employee_name} - {alert.message}
                      </p>
                      {alert.battery && (
                        <p className="text-xs text-gray-600 mt-1">Battery: {alert.battery}%</p>
                      )}
                    </div>
                  </div>
                  {!alert.is_read && (
                    <button
                      onClick={() => markAsRead(alert.id)}
                      className="p-2 hover:bg-white/50 rounded ml-2 flex-shrink-0"
                      title="Mark as read"
                    >
                      <Eye size={20} className={colors.text} />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
