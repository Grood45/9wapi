import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import AccessControl from './pages/AccessControl';
import Ledger from './pages/Ledger';
import ApiDocumentation from './pages/ApiDocumentation';
import Settings from './pages/Settings';
import Login from './pages/Login';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router basename="/admin">
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="access" element={<AccessControl />} />
          <Route path="ledger" element={<Ledger />} />
          <Route path="docs" element={<ApiDocumentation />} />
          <Route path="settings" element={<Settings />} />

          {/* Fallback to Dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
