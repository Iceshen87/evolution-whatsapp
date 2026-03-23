import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import type { Instance } from '../types';

export default function Instances() {
  const user = useAuthStore((s) => s.user);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  const fetchInstances = () => {
    setLoading(true);
    api.get('/instances')
      .then(({ data }) => setInstances(data.instances || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchInstances(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/instances', { instanceName: newName });
      setNewName('');
      setCreating(false);
      fetchInstances();
    } catch (err: any) {
      const apiError = err.response?.data?.error || err.response?.data?.message || err.message;
      setError(apiError || 'Failed to create instance');
      console.error('Create instance error:', err.response?.data || err);
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Delete instance "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/instances/${name}`);
      fetchInstances();
    } catch {
      alert('Failed to delete instance');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Instances</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage WhatsApp connections</p>
        </div>
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
          >
            + New Instance
          </button>
        )}
      </div>

      {creating && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="text-sm font-medium text-gray-900 mb-3">Create New Instance</h2>
          <form onSubmit={handleCreate} className="flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Instance name (e.g. my-whatsapp)"
              required
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => { setCreating(false); setError(''); }}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </form>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : instances.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <p className="text-gray-500 text-sm">No instances yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Instance</th>
                {user?.role === 'admin' && (
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                )}
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {instances.map((inst) => (
                <tr key={inst.instanceName} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{inst.instanceName}</td>
                  {user?.role === 'admin' && (
                    <td className="px-5 py-3 text-gray-600">{inst.ownerUsername}</td>
                  )}
                  <td className="px-5 py-3">
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
                  </td>
                  <td className="px-5 py-3 text-gray-600">{inst.phoneNumber || '-'}</td>
                  <td className="px-5 py-3 text-right space-x-2">
                    {inst.status !== 'open' && (
                      <Link
                        to={`/instances/${inst.instanceName}/bind`}
                        className="text-emerald-600 hover:text-emerald-700 text-xs font-medium"
                      >
                        Bind QR
                      </Link>
                    )}
                    <button
                      onClick={() => handleDelete(inst.instanceName)}
                      className="text-red-500 hover:text-red-700 text-xs font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
