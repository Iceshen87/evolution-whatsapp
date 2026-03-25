import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import type { Instance } from '../types';

interface UserInfo {
  id: number;
  username: string;
  role: string;
  instanceName: string | null;
  posMapping?: {
    instanceId: string;
    accessToken: string;
  } | null;
}

interface LogStats {
  total: number;
  sent: number;
  failed: number;
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [logStats, setLogStats] = useState<LogStats>({ total: 0, sent: 0, failed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch instances
        const instancesRes = await api.get('/instances');
        setInstances(instancesRes.data.instances || []);
        
        // Fetch user info with POS credentials
        const userRes = await api.get('/auth/me');
        setUserInfo(userRes.data.user);
        
        // Fetch user message logs stats
        const logsRes = await api.get('/pos/logs?limit=1000');
        const logs = logsRes.data.data?.logs || [];
        const userLogs = user?.role === 'admin' 
          ? logs 
          : logs.filter((l: any) => l.userId === user?.id);
        setLogStats({
          total: userLogs.length,
          sent: userLogs.filter((l: any) => l.status === 'sent').length,
          failed: userLogs.filter((l: any) => l.status === 'failed').length,
        });
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.id, user?.role]);

  const online = instances.filter((i) => i.status === 'open').length;
  const offline = instances.length - online;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Dashboard</h1>
      <p className="text-sm text-gray-500 mb-6">Welcome back, {user?.username}</p>

      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Total Instances</p>
              <p className="text-3xl font-semibold text-gray-900 mt-1">{instances.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Online</p>
              <p className="text-3xl font-semibold text-emerald-600 mt-1">{online}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Offline</p>
              <p className="text-3xl font-semibold text-red-500 mt-1">{offline}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">My Messages</p>
              <p className="text-3xl font-semibold text-blue-600 mt-1">{logStats.total}</p>
            </div>
          </div>

          {/* POS Credentials Section */}
          {userInfo?.posMapping && (
            <div className="bg-white rounded-xl border border-gray-200 mb-8">
              <div className="px-5 py-4 border-b border-gray-200">
                <h2 className="text-sm font-medium text-gray-900">POS Integration Credentials</h2>
                <p className="text-xs text-gray-500 mt-1">Use these credentials to connect your POS system</p>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Instance ID</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={userInfo.posMapping.instanceId}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono"
                    />
                    <button
                      onClick={() => copyToClipboard(userInfo.posMapping!.instanceId)}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Access Token</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={userInfo.posMapping.accessToken}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono"
                    />
                    <button
                      onClick={() => copyToClipboard(userInfo.posMapping!.accessToken)}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Message Stats */}
          {logStats.total > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 mb-8">
              <div className="px-5 py-4 border-b border-gray-200">
                <h2 className="text-sm font-medium text-gray-900">My Message Statistics</h2>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-gray-900">{logStats.total}</p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-emerald-600">{logStats.sent}</p>
                    <p className="text-xs text-gray-500">Sent</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-red-600">{logStats.failed}</p>
                    <p className="text-xs text-gray-500">Failed</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Instance Overview */}
          {instances.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-200">
                <h2 className="text-sm font-medium text-gray-900">Instance Overview</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {instances.map((inst) => (
                  <div key={inst.instanceName} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{inst.instanceName}</p>
                      <p className="text-xs text-gray-500">{inst.ownerUsername}{inst.phoneNumber ? ` - ${inst.phoneNumber}` : ''}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                      inst.status === 'open'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-red-50 text-red-600'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        inst.status === 'open' ? 'bg-emerald-500' : 'bg-red-400'
                      }`} />
                      {inst.status === 'open' ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
