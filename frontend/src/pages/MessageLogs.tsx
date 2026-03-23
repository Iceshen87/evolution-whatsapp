import { useEffect, useState } from 'react';
import api from '../services/api';

interface Log {
  id: number;
  userId: number;
  username: string;
  instanceName: string;
  to: string;
  message: string;
  messageId: string | null;
  status: 'sent' | 'failed' | 'pending';
  error: string | null;
  createdAt: string;
}

interface Stats {
  userId: number;
  username: string;
  total: number;
  sent: number;
  failed: number;
}

export default function MessageLogs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [stats, setStats] = useState<Stats[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedUser, setSelectedUser] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch stats
      const statsRes = await api.get('/pos/stats');
      setStats(statsRes.data.data || []);

      // Fetch logs with filters
      const params: any = { limit: 100 };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (selectedUser) params.userId = selectedUser;

      const logsRes = await api.get('/pos/logs', { params });
      setLogs(logsRes.data.data?.logs || []);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFilter = () => {
    fetchData();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const totalMessages = stats.reduce((sum, s) => sum + s.total, 0);
  const totalSent = stats.reduce((sum, s) => sum + s.sent, 0);
  const totalFailed = stats.reduce((sum, s) => sum + s.failed, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Message Logs</h1>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
        >
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">Total Messages</p>
          <p className="text-2xl font-semibold text-gray-900">{totalMessages}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">Sent</p>
          <p className="text-2xl font-semibold text-emerald-600">{totalSent}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">Failed</p>
          <p className="text-2xl font-semibold text-red-600">{totalFailed}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">Active Users</p>
          <p className="text-2xl font-semibold text-blue-600">{stats.length}</p>
        </div>
      </div>

      {/* User Stats Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="text-sm font-medium text-gray-900">Statistics by User</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Sent</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Failed</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Success Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats.map((stat) => (
                <tr key={stat.userId} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-900">{stat.username}</td>
                  <td className="px-4 py-2 text-sm text-gray-900 text-right">{stat.total}</td>
                  <td className="px-4 py-2 text-sm text-emerald-600 text-right">{stat.sent}</td>
                  <td className="px-4 py-2 text-sm text-red-600 text-right">{stat.failed}</td>
                  <td className="px-4 py-2 text-sm text-gray-900 text-right">
                    {stat.total > 0 ? Math.round((stat.sent / stat.total) * 100) : 0}%
                  </td>
                </tr>
              ))}
              {stats.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-sm text-gray-500 text-center">No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">User</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Users</option>
              {stats.map((s) => (
                <option key={s.userId} value={s.userId}>{s.username}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleFilter}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-900">Message Details</h2>
          <span className="text-xs text-gray-500">Showing {logs.length} messages</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-xs text-gray-500 whitespace-nowrap">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">{log.username}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{log.to}</td>
                  <td className="px-4 py-2 text-sm text-gray-600 max-w-xs truncate" title={log.message}>
                    {log.message}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        log.status === 'sent'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-sm text-gray-500 text-center">
                    {loading ? 'Loading...' : 'No messages found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
