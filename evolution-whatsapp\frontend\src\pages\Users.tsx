import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import type { User } from '../types';

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchUsers = () => {
    setLoading(true);
    api.get('/users')
      .then(({ data }) => setUsers(data.users || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async (id: number, username: string) => {
    if (!confirm(`Deactivate user "${username}"? Their WhatsApp instance will be removed.`)) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to deactivate user');
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage user accounts and POS credentials</p>
        </div>
        <Link
          to="/users/new"
          className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
        >
          + New User
        </Link>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <p className="text-gray-500 text-sm">No users yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {users.map((u) => (
            <div key={u.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{u.username}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      u.role === 'admin'
                        ? 'bg-purple-50 text-purple-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}>
                      {u.role}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Instance: {u.instanceName || 'None'} | Created: {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
                  </p>
                </div>
                <div className="flex gap-2">
                  {u.role !== 'admin' && (
                    <button
                      onClick={() => handleDelete(u.id, u.username)}
                      className="text-red-500 hover:text-red-700 text-xs font-medium"
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              </div>

              {u.posMapping && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-2">POS Credentials - Server 1 (ai.365ws.com style)</p>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <p className="text-xs text-gray-500">App Key</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <code className="text-xs text-gray-800 truncate flex-1">{u.posMapping.appkey}</code>
                        <button
                          onClick={() => copyToClipboard(u.posMapping!.appkey, `appkey-${u.id}`)}
                          className="text-gray-400 hover:text-gray-600 shrink-0"
                          title="Copy"
                        >
                          {copiedKey === `appkey-${u.id}` ? (
                            <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <p className="text-xs text-gray-500">Auth Key</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <code className="text-xs text-gray-800 truncate flex-1">{u.posMapping.authkey}</code>
                        <button
                          onClick={() => copyToClipboard(u.posMapping!.authkey, `authkey-${u.id}`)}
                          className="text-gray-400 hover:text-gray-600 shrink-0"
                          title="Copy"
                        >
                          {copiedKey === `authkey-${u.id}` ? (
                            <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs font-medium text-gray-500 mb-2">POS Credentials - Server 2 (ccs.365ws.com style)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <p className="text-xs text-gray-500">Instance ID</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <code className="text-xs text-gray-800 truncate flex-1">{u.posMapping.instanceId}</code>
                        <button
                          onClick={() => copyToClipboard(u.posMapping!.instanceId, `instid-${u.id}`)}
                          className="text-gray-400 hover:text-gray-600 shrink-0"
                          title="Copy"
                        >
                          {copiedKey === `instid-${u.id}` ? (
                            <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <p className="text-xs text-gray-500">Access Token</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <code className="text-xs text-gray-800 truncate flex-1">{u.posMapping.accessToken}</code>
                        <button
                          onClick={() => copyToClipboard(u.posMapping!.accessToken, `token-${u.id}`)}
                          className="text-gray-400 hover:text-gray-600 shrink-0"
                          title="Copy"
                        >
                          {copiedKey === `token-${u.id}` ? (
                            <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
