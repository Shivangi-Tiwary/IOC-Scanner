import { BrowserRouter as Router, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Settings from './pages/Settings';
import History from './pages/History';
import { Shield, LayoutDashboard, Clock, Settings as SettingsIcon, LogOut, Loader2 } from 'lucide-react';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg-dark)' }}>
        <Loader2 size={32} className="animate-spin text-purple-500" />
      </div>
    );
  }
  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg-dark)' }}>
        <Loader2 size={32} className="animate-spin text-purple-500" />
      </div>
    );
  }
  return user ? <Navigate to="/" /> : children;
}

function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: <LayoutDashboard size={18} />, label: 'Scanner' },
    { to: '/history', icon: <Clock size={18} />, label: 'History' },
    { to: '/settings', icon: <SettingsIcon size={18} />, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg-dark)' }}>
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 glass-panel rounded-none border-t-0 border-b-0 border-l-0 flex flex-col sticky top-0 h-screen">
        {/* Logo */}
        <div className="px-5 py-6 flex items-center gap-3 border-b border-border-dark">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Shield size={18} className="text-white" />
          </div>
          <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 m-0">
            IOC Scanner
          </h1>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-purple-500/15 text-purple-300 border border-purple-500/20 shadow-sm shadow-purple-500/5'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-surface-dark/80 border border-transparent'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-border-dark">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center border border-border-dark flex-shrink-0">
                <span className="text-xs font-bold text-purple-300">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-xs text-gray-400 truncate">{user?.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-400/10"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-6xl">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
          <Route path="/*" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
