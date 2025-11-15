import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Coffee, ChefHat, Shield, LogOut } from 'lucide-react';

const Header: React.FC = () => {
  const { user, fullLogout, currentCafe, theme } = useData();
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    if (isLogoutModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isLogoutModalOpen]);

  const handleLogout = () => {
    fullLogout();
    navigate('/select-server');
  };

  const commonLinkClasses = "flex items-center gap-2 px-3 py-2 rounded-xl text-sm sm:text-base font-medium transition-all";
  const activeLinkClasses = "bg-black/40";
  const inactiveLinkClasses = "hover:bg-black/20";

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 p-2 sm:p-4">
        <div className="glass-card flex justify-between items-center h-16 sm:h-20 px-4 sm:px-6 max-w-7xl mx-auto">
            <div className="flex items-center gap-3 sm:gap-4">
              {theme.logoUrl ? (
                <img src={theme.logoUrl} alt={`${currentCafe?.name || 'Café'} logo`} className="h-10 sm:h-14 w-auto max-w-[120px] sm:max-w-[200px] object-contain" />
              ) : (
                <Coffee className="h-8 w-8 sm:h-10 sm:w-10 icon-glow" style={{ color: 'var(--color-secondary)' }} />
              )}
              <div>
                <h1 className="text-xl sm:text-2xl font-bold font-display leading-tight">{currentCafe?.name || 'Café Control'}</h1>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-2 sm:gap-4">
              {user?.role === 'waiter' && (
                <NavLink to="/waiter" className={({ isActive }) => `${commonLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}>
                  <Coffee size={18} /> <span className="hidden lg:inline">Mesas</span>
                </NavLink>
              )}
              {(user?.role === 'kitchen' || user?.role === 'admin') && (
                <NavLink to="/kitchen" className={({ isActive }) => `${commonLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}>
                  <ChefHat size={18} /> <span className="hidden lg:inline">Cozinha</span>
                </NavLink>
              )}
              {user?.role === 'admin' && (
                <NavLink to="/admin" className={({ isActive }) => `${commonLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}>
                  <Shield size={18} /> <span className="hidden lg:inline">Admin</span>
                </NavLink>
              )}
            </nav>
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="hidden sm:inline text-sm" style={{color: 'var(--color-text-secondary)'}}>Olá, {user?.name}</span>
              <button
                onClick={() => setIsLogoutModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-red-800/70 hover:bg-red-700/90 transition-colors"
                title="Sair"
              >
                <LogOut size={18} />
                <span className="hidden md:inline">Sair</span>
              </button>
            </div>
        </div>
      </header>
      <div className="h-24 sm:h-28" /> {/* Spacer to push content below fixed header */}


      {isLogoutModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-sm p-8 text-center">
            <h3 className="text-3xl font-bold font-display mb-2">Terminar Sessão</h3>
            <p style={{color: 'var(--color-text-secondary)'}} className="mb-8">Tem a certeza que quer terminar a sessão?</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="w-full secondary-button font-bold py-3"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogout}
                className="w-full bg-red-700 hover:bg-red-800 transition-colors text-white font-bold py-3 rounded-2xl"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;