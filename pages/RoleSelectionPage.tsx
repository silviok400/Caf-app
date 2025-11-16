import React, { useState, useRef, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, User, Shield, ArrowLeft, QrCode, X, AlertTriangle, Crown } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { Cafe } from '../types';
import QRCode from 'qrcode';

const QRCodeModal: React.FC<{
  cafe: Cafe;
  onClose: () => void;
}> = memo(({ cafe, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  const url = `https://cafe-control-app.vercel.app/#/join/${cafe.id}`;

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, { width: 256, margin: 2, errorCorrectionLevel: 'H', color: { dark: '#4f3b2a', light: '#FFFFFF' } }, (error) => {
        if (error) console.error("Falha ao gerar QR Code:", error);
      });
    }
  }, [url, cafe.id]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card w-full max-w-md p-8 text-center relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/20" style={{color: 'var(--color-text-secondary)'}}>
          <X size={24} />
        </button>
        <QrCode className="h-16 w-16 mx-auto icon-glow mb-4" style={{ color: 'var(--color-secondary)' }}/>
        <h3 className="text-3xl font-bold font-display mb-2">Partilhar Acesso</h3>
        <p style={{color: 'var(--color-text-secondary)'}} className="mb-6">Outros podem entrar em <strong>{cafe.name}</strong> lendo este QR Code.</p>
        <div className="qr-container-glow">
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
});


const RoleSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { fullLogout, currentCafe, theme, isAdmCafe } = useData();
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isAdminDevice, setIsAdminDevice] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
        pageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (currentCafe) {
        const key = `cafe-app-is-admin-device-${currentCafe.id}`;
        const flag = localStorage.getItem(key) === 'true';
        setIsAdminDevice(flag);
    }
  }, [currentCafe]);


  const handleBack = () => {
    fullLogout();
    // App.tsx will redirect to /select-server automatically
  };

  const showManagerButton = !theme.hideManagerLogin || isAdminDevice;

  return (
    <div ref={pageRef} className="flex flex-col items-center justify-center min-h-screen p-4 relative">
      <button
        onClick={handleBack}
        className="absolute top-6 left-6 sm:top-8 sm:left-8 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 glass-card !rounded-full glass-card-highlight"
        aria-label="Voltar"
      >
        <ArrowLeft size={24} />
      </button>

      <div className="w-full max-w-md mx-auto glass-card p-6 sm:p-8 text-center">
        <div className="flex justify-center mb-6 h-16 sm:h-20">
          {isAdmCafe ? (
              <Crown className="h-16 w-16 icon-glow" style={{ color: 'var(--color-secondary)' }} />
          ) : theme.logoUrl ? (
            <img src={theme.logoUrl} alt={`${currentCafe?.name || ''} logo`} className="h-full w-auto max-w-[200px] object-contain" />
          ) : (
            <Coffee className="h-16 w-16 icon-glow" style={{ color: 'var(--color-secondary)' }} />
          )}
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold font-display mb-2">{currentCafe?.name}</h2>
        <p className="mb-8 text-base sm:text-lg" style={{ color: 'var(--color-text-secondary)' }}>
          {isAdmCafe ? 'Acesso à administração da plataforma.' : 'Selecione o seu tipo de acesso.'}
        </p>

        <div className="space-y-4">
          {isAdmCafe ? (
              <button
                onClick={() => navigate('/login', { state: { role: 'admin' } })}
                className="w-full premium-gradient-button py-4 text-lg flex items-center justify-center gap-3"
              >
                <Shield size={24} />
                Administrador da Plataforma
              </button>
          ) : (
            <>
              <button
                onClick={() => navigate('/login', { state: { role: 'staff' } })}
                className="w-full secondary-button font-bold py-4 text-lg flex items-center justify-center gap-3"
              >
                <User size={24} />
                Funcionário
              </button>
              {showManagerButton && (
                <button
                    onClick={() => navigate('/login', { state: { role: 'admin' } })}
                    className="w-full premium-gradient-button py-4 text-lg flex items-center justify-center gap-3"
                >
                    <Shield size={24} />
                    Gerente
                </button>
              )}
            </>
          )}
        </div>
        
        {isAdminDevice && (
          <>
            <div className="relative flex items-center py-6">
              <div className="flex-grow border-t" style={{borderColor: 'var(--color-glass-border)'}}></div>
            </div>
            <button
                onClick={() => setIsQrModalOpen(true)}
                className="transition-colors flex items-center justify-center gap-2 mx-auto font-semibold hover:text-white"
                style={{color: 'var(--color-text-secondary)'}}
            >
                <QrCode size={20} /> Partilhar Acesso ao Café
            </button>
          </>
        )}
      </div>

      {isQrModalOpen && currentCafe && (
        <QRCodeModal cafe={currentCafe} onClose={() => setIsQrModalOpen(false)} />
      )}
    </div>
  );
};

export default RoleSelectionPage;