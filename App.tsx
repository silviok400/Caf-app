import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import FeedbackButton from './components/FeedbackButton';
import Footer from './components/Footer';
import { Loader2 } from 'lucide-react';
import CustomerMenuPage from './pages/CustomerMenuPage';

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
  const location = useLocation();

  React.useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.key.toLowerCase() === 'u')
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    const intervalId = setInterval(() => {
      const startTime = performance.now();
      // eslint-disable-next-line no-debugger
      debugger;
      const endTime = performance.now();
      if (endTime - startTime > 100) {
        console.clear();
        console.log('%cALERTA!', 'color: red; font-size: 24px; font-weight: bold;');
        console.log('%cEsta área é restrita a desenvolvedores. Ações não autorizadas podem comprometer a segurança.', 'font-size: 16px;');
      }
    }, 1000);

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      clearInterval(intervalId);
    };
  }, []); // Runs only once

  // Show spinner on initial app load OR when a cafe is selected but its data hasn't arrived yet.
  if (isAppLoading || (currentCafe && staff.length === 0 && !location.pathname.startsWith('/menu/'))) {
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
  
  const isPublicPage = ['/select-server', '/join/', '/menu/'].some(path => location.pathname.startsWith(path));
  
  const requiresHeader = user && currentCafe && !isPublicPage;
  const requiresFeedbackButton = currentCafe && !isPublicPage;

  return (
    <div className="min-h-screen flex flex-col">
      {requiresHeader && <Header />}
      <main className="flex-grow w-full">
        <div className="mx-auto w-full">
          <Routes>
            {/* Customer-facing menu */}
            <Route path="/menu/:cafeId/:tableId" element={<CustomerMenuPage />} />

            {/* Public/Entry routes that define the cafe context */}
            <Route path="/select-server" element={currentCafe ? <Navigate to="/" /> : <ServerSelectionPage />} />
            <Route path="/join/:cafeId" element={<JoinServerPage />} />

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
      {location.pathname === '/select-server' && <Footer />}
      {requiresFeedbackButton && <FeedbackButton />}
    </div>
  );
};

export default App;