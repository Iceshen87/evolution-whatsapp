import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import type { Instance } from '../types';

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/instances')
      .then(({ data }) => setInstances(data.instances || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const online = instances.filter((i) => i.status === 'open').length;
  const offline = instances.length - online;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Dashboard</h1>
      <p className="text-sm text-gray-500 mb-6">Welcome back, {user?.username}</p>

      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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
        </div>
      )}

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
    </div>
  );
}
