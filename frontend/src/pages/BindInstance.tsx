import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function BindInstance() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchQR = async () => {
    try {
      const { data } = await api.get(`/instances/${name}/qr`);
      // Evolution API returns base64 QR code or pairingCode
      if (data?.base64) {
        setQrCode(data.base64);
        setStatus('waiting');
      } else if (data?.code) {
        setQrCode(data.code);
        setStatus('waiting');
      } else {
        setStatus('no_qr');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to get QR code');
      setStatus('error');
    }
  };

  const checkStatus = async () => {
    try {
      const { data } = await api.get(`/instances/${name}/status`);
      const state = data?.instance?.state || data?.state;
      if (state === 'open') {
        setStatus('connected');
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    } catch {
      // ignore polling errors
    }
  };

  useEffect(() => {
    fetchQR();
    // Poll for connection status every 3 seconds
    intervalRef.current = setInterval(() => {
      checkStatus();
    }, 3000);

    // Refresh QR every 30 seconds
    const qrInterval = setInterval(() => {
      fetchQR();
    }, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearInterval(qrInterval);
    };
  }, [name]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/instances')}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Bind WhatsApp</h1>
          <p className="text-sm text-gray-500 mt-0.5">Instance: {name}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md mx-auto text-center">
        {status === 'loading' && (
          <div>
            <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-500">Loading QR code...</p>
          </div>
        )}

        {status === 'waiting' && qrCode && (
          <div>
            <div className="mb-4">
              {qrCode.startsWith('data:') ? (
                <img src={qrCode} alt="QR Code" className="w-64 h-64 mx-auto rounded-lg" />
              ) : (
                <div className="bg-gray-100 rounded-lg p-6 inline-block">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qrCode)}`}
                    alt="QR Code"
                    className="w-64 h-64"
                  />
                </div>
              )}
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">Scan with WhatsApp</p>
            <p className="text-xs text-gray-500">Open WhatsApp &gt; Settings &gt; Linked Devices &gt; Link a Device</p>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              Waiting for connection...
            </div>
          </div>
        )}

        {status === 'connected' && (
          <div>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900 mb-1">Connected!</p>
            <p className="text-sm text-gray-500 mb-4">WhatsApp has been successfully linked.</p>
            <button
              onClick={() => navigate('/instances')}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Back to Instances
            </button>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <button
              onClick={() => { setStatus('loading'); setError(''); fetchQR(); }}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {status === 'no_qr' && (
          <div>
            <p className="text-sm text-gray-500 mb-2">No QR code available.</p>
            <p className="text-xs text-gray-400 mb-4">The instance is initializing. Please wait a moment and retry.</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => { setStatus('loading'); fetchQR(); }}
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Retry
              </button>
              <button
                onClick={() => navigate('/instances')}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
