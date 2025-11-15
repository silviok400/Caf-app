import React, { useState } from 'react';
import { useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { X, Coffee } from 'lucide-react';
import { Staff } from '../types';

const LoginConfirmationPage: React.FC = () => {
  const { setCurrentUser, theme, currentCafe } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const [nameInput, setNameInput] = useState('');

  const user: Staff | undefined = location.state?.userToConfirm;

  if (!user) {
    return <Navigate to="/" />;
  }

  const enterKioskMode = async () => {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      try {
        await element.requestFullscreen();
      } catch (err) {
        console.error(`Error attempting to enable full-screen mode: ${(err as Error).message} (${(err as Error).name})`);
      }
    }
  };
  
  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    // Case-insensitive comparison for better user experience
    if (nameInput.trim().toLowerCase() === user.name.toLowerCase()) {
      await enterKioskMode();
      setCurrentUser(user);
      navigate('/'); 
    }
  }

  const handleCancel = () => {
    navigate(-1);
  }

  const isNameMatch = nameInput.trim().toLowerCase() === user.name.toLowerCase();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <form onSubmit={handleConfirm} className="w-full max-w-sm mx-auto glass-card p-6 sm:p-8 text-center">
        <div className="flex justify-center mb-6 h-16 sm:h-20">
          {theme.logoUrl ? (
            <img src={theme.logoUrl} alt={`${currentCafe?.name || ''} logo`} className="h-full w-auto max-w-[200px] object-contain" />
          ) : (
            <Coffee className="h-16 w-16 icon-glow" style={{ color: 'var(--color-secondary)' }} />
          )}
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold font-display mb-2">Confirme a sua identidade</h2>
        <p className="mb-6 text-sm sm:text-base" style={{ color: 'var(--color-text-secondary)' }}>Para continuar, digite o seu nome de utilizador no campo abaixo.</p>

        <div className="mb-6">
            <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Digite o seu nome"
                className="w-full glass-input text-center text-lg"
                aria-label="Confirmação de nome"
                autoComplete="off"
                autoFocus
            />
        </div>

        <div className="space-y-4">
          <button
            type="submit"
            disabled={!isNameMatch}
            className="w-full premium-gradient-button py-3 sm:py-4 text-lg"
          >
            Sim, sou eu
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="w-full secondary-button font-bold py-3 sm:py-4 text-lg flex items-center justify-center gap-3"
          >
             <X size={24}/> Não sou eu / Voltar
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginConfirmationPage;