import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Instances from './pages/Instances';
import BindInstance from './pages/BindInstance';
import Users from './pages/Users';
import CreateUser from './pages/CreateUser';

export default function App() {
  const { hydrate, isAuthenticated, fetchMe, token } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hydrate();
    setReady(true);
  }, [hydrate]);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchMe().catch(() => {});
    }
  }, [isAuthenticated, token, fetchMe]);

  if (!ready) return null;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/instances" element={<Instances />} />
        <Route path="/instances/:name/bind" element={<BindInstance />} />
        <Route path="/users" element={<Users />} />
        <Route path="/users/new" element={<CreateUser />} />
      </Route>
      <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}
