import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider, useData } from './contexts/DataContext';
import LoginPage from './pages/LoginPage';
import RoleSelectionPage from './pages/RoleSelectionPage';
import WaiterDashboard from './pages/WaiterDashboard';
import KitchenDashboard from './pages/KitchenDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Header from './components/Header';
import LoginConfirmationPage from './pages/LoginConfirmationPage';
import ServerSelectionPage from './pages/ServerSelectionPage';
import JoinServerPage from './pages/JoinServerPage';
import CustomerMenuPage from './pages/CustomerMenuPage';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  return (
    <DataProvider>
      <HashRouter>
        <Main />
      </HashRouter>
    </DataProvider>
  );
};

const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center">
    <Loader2 className="animate-spin text-amber-500" size={48} />
    <p className="mt-4 text-lg" style={{ color: 'var(--color-text-secondary)' }}>A carregar...</p>
  </div>
);

const Main: React.FC = () => {
  const { user, currentCafe, isAppLoading, staff } = useData();

  // Show spinner on initial app load OR when a cafe is selected but its data hasn't arrived yet.
  if (isAppLoading || (currentCafe && staff.length === 0)) {
    return <LoadingSpinner />;
  }

  const getRedirectPath = () => {
    if (!user) return '/'; // Should not happen if called correctly
    switch (user.role) {
      case 'admin': return '/admin';
      case 'kitchen': return '/kitchen';
      case 'waiter': return '/waiter';
      default: return '/';
    }
  };
  
  const requiresCafeContext = !['/select-server', '/join/:cafeId', '/menu/:cafeId/:tableId'].some(path => 
    new RegExp(`^${path.replace(/:\w+/g, '[^/]+')}$`).test(window.location.hash.substring(1))
  );

  return (
    <div className="min-h-screen flex flex-col">
      {user && currentCafe && requiresCafeContext && <Header />}
      <main className="flex-grow w-full">
        <div className="mx-auto w-full">
          <Routes>
            {/* Public/Entry routes that define the cafe context */}
            <Route path="/select-server" element={currentCafe ? <Navigate to="/" /> : <ServerSelectionPage />} />
            <Route path="/join/:cafeId" element={<JoinServerPage />} />
            <Route path="/menu/:cafeId/:tableId" element={<CustomerMenuPage />} />

            {/* Routes that require a cafe context */}
            <Route path="/" element={!currentCafe ? <Navigate to="/select-server" /> : (!user ? <RoleSelectionPage /> : <Navigate to={getRedirectPath()} />)} />
            <Route path="/login" element={!currentCafe ? <Navigate to="/select-server" /> : (!user ? <LoginPage /> : <Navigate to={getRedirectPath()} />)} />
            <Route path="/confirm-login" element={!currentCafe ? <Navigate to="/select-server" /> : (!user ? <LoginConfirmationPage /> : <Navigate to={getRedirectPath()} />)} />

            {/* Authenticated routes */}
            <Route path="/waiter" element={user && user.role === 'waiter' ? <WaiterDashboard /> : <Navigate to="/" />} />
            <Route path="/kitchen" element={user ? <KitchenDashboard /> : <Navigate to="/" />} />
            <Route path="/admin" element={user && user.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} />
            
            {/* Fallback for any other path is to go to the main entry point */}
            <Route path="*" element={<Navigate to={!currentCafe ? "/select-server" : "/"} />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default App;