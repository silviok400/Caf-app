import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Coffee, XCircle, ArrowLeft, KeyRound, Phone, MessageSquare, ShieldCheck, CheckCircle, Fingerprint, Loader2, Copy, Check } from 'lucide-react';
import { Staff } from '../types';
import { supabase } from '../supabaseClient';

const PinRecoveryModal: React.FC<{
  onClose: () => void;
}> = ({ onClose }) => {
  const { findAdminByPhone, resetPinForUser } = useData();
  const [step, setStep] = useState<'phone' | 'code' | 'reset' | 'success'>('phone');
  const [phone, setPhone] = useState('');
  const [adminUser, setAdminUser] = useState<Staff | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [enteredManagerName, setEnteredManagerName] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const foundAdmin = findAdminByPhone(phone);
    if (foundAdmin?.phone) {
      setAdminUser(foundAdmin);
      
      // --- LÓGICA DE SIMULAÇÃO ---
      // 1. Gerar um código aleatório.
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // 2. Guardar o código e avançar para o próximo passo.
      setVerificationCode(code);
      setStep('code');
      // --- FIM DA LÓGICA DE SIMULAÇÃO ---

    } else {
      setError('Nenhum gerente encontrado com este número de telemóvel.');
    }
  };
  
  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (enteredCode !== verificationCode) {
        setError('Código de verificação incorreto.');
        return;
    }
    if (!adminUser || enteredManagerName.trim().toLowerCase() !== adminUser.name.toLowerCase()) {
        setError('Nome do gerente incorreto.');
        return;
    }
    setStep('reset');
  };
  
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPin !== confirmPin) {
      return setError('Os PINs não coincidem.');
    }
    if (!/^\d{6}$/.test(newPin)) {
      return setError('O novo PIN deve conter exatamente 6 dígitos.');
    }
    if (!adminUser) return; // Should not happen
    
    setIsSubmitting(true);
    const result = await resetPinForUser(adminUser.id, newPin);
    setIsSubmitting(false);

    if (result.success) {
      setStep('success');
    } else {
      setError(result.message);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'phone':
        return (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <h3 className="text-xl font-bold font-display">Recuperar PIN de Gerente</h3>
            <p className="text-sm" style={{color: 'var(--color-text-secondary)'}}>Insira o seu número de telemóvel registado.</p>
            <div className="relative">
                 <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{color: 'var(--color-text-secondary)'}} />
                 <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} required className="w-full glass-input pl-11" placeholder="912345678" autoFocus/>
            </div>
            <button type="submit" className="w-full premium-gradient-button py-3">
                Enviar Código
            </button>
          </form>
        );
      case 'code':
        const handleCopyCode = () => {
          navigator.clipboard.writeText(verificationCode)
            .then(() => {
              setCopyFeedback('Copiado!');
              setTimeout(() => setCopyFeedback(''), 2000);
            })
            .catch(err => console.error('Failed to copy code: ', err));
        };
        return (
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <h3 className="text-xl font-bold font-display">Verificar Código</h3>
            <div className="bg-blue-900/50 border border-blue-400/50 text-blue-200 p-3 rounded-2xl text-sm space-y-2">
                <p>Use o código de simulação abaixo para continuar:</p>
                <div className="relative bg-black/30 p-2 rounded-lg text-center">
                    <span className="text-2xl font-mono tracking-widest font-bold text-white select-all">{verificationCode}</span>
                    <button type="button" onClick={handleCopyCode} className="absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-white/20 text-white" title="Copiar código">
                       {copyFeedback ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                </div>
            </div>
             <input
                type="text"
                value={enteredManagerName}
                onChange={e => setEnteredManagerName(e.target.value)}
                required
                className="w-full glass-input"
                placeholder="Seu Nome de Gerente"
                autoComplete="off"
                autoFocus
            />
            <input
                type="text"
                value={enteredCode}
                onChange={e => setEnteredCode(e.target.value.replace(/\D/g, ''))}
                required
                maxLength={6}
                className="w-full glass-input"
                placeholder="Insira o código aqui"
            />
            <button type="submit" className="w-full premium-gradient-button py-3">Verificar</button>
          </form>
        );
       case 'reset':
        return (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <h3 className="text-xl font-bold font-display">Definir Novo PIN</h3>
            <p className="text-sm" style={{color: 'var(--color-text-secondary)'}}>Crie um novo PIN de 6 dígitos.</p>
            <div className="relative">
                 <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{color: 'var(--color-text-secondary)'}}/>
                 <input type="password" value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))} required maxLength={6} className="w-full glass-input pl-11" placeholder="Novo PIN de 6 dígitos" autoFocus/>
            </div>
             <div className="relative">
                 <ShieldCheck size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{color: 'var(--color-text-secondary)'}} />
                 <input type="password" value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))} required maxLength={6} className="w-full glass-input pl-11" placeholder="Confirme o novo PIN"/>
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full premium-gradient-button py-3">
                {isSubmitting ? 'A guardar...' : 'Redefinir PIN'}
            </button>
          </form>
        );
      case 'success':
        return (
            <div className="text-center space-y-4">
                <CheckCircle size={48} className="mx-auto text-green-400"/>
                <h3 className="text-xl font-bold font-display">PIN Redefinido!</h3>
                <p className="text-sm" style={{color: 'var(--color-text-secondary)'}}>O seu PIN foi atualizado. Pode agora entrar com o novo PIN.</p>
                <button onClick={onClose} className="w-full secondary-button font-bold py-2.5">Voltar ao Login</button>
            </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-sm p-6 relative">
        <button onClick={onClose} className="absolute top-3 right-3 p-2 rounded-full hover:bg-black/20" style={{color: 'var(--color-text-secondary)'}}>
            <XCircle />
        </button>
        {error && (
            <div className="bg-red-900/50 text-red-300 p-3 rounded-xl text-sm mb-4 flex items-center gap-2">
                <XCircle size={16}/>
                <span>{error}</span>
            </div>
        )}
        {renderStep()}
      </div>
    </div>
  );
};


const LoginPage: React.FC = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const { findUserByPin } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);

  const intendedRole = location.state?.role as 'admin' | 'staff' | undefined;
  const pageTitle = intendedRole === 'admin' ? 'Acesso Gerente' : 'Acesso Funcionário';

  useEffect(() => {
    if (!intendedRole) {
      navigate('/');
    }
  }, [intendedRole, navigate]);

  const handleKeyPress = (key: string) => {
    setError('');
    if (pin.length < 6) {
      setPin(pin + key);
    }
  };

  const handleDelete = () => {
    setError('');
    setPin(pin.slice(0, -1));
  };

  const attemptLoginWithPin = (loginPin: string) => {
      const user = findUserByPin(loginPin);
      if (user) {
          if (intendedRole === 'admin' && user.role !== 'admin') {
              setError('PIN não corresponde a um gerente.');
              setPin('');
              return;
          }
          if (intendedRole === 'staff' && user.role !== 'waiter' && user.role !== 'kitchen') {
              setError('PIN não corresponde a um funcionário.');
              setPin('');
              return;
          }
          
          navigate('/confirm-login', { state: { userToConfirm: user } });

      } else {
        setError('PIN inválido. Verifique o PIN e tente novamente.');
        setPin('');
      }
  };

  useEffect(() => {
    if (pin.length === 6) {
      attemptLoginWithPin(pin);
    }
  }, [pin]);
  
  if (!intendedRole) {
    return null; // Render nothing while redirecting
  }

  return (
    <>
    {isRecoveryModalOpen && <PinRecoveryModal onClose={() => setIsRecoveryModalOpen(false)} />}
    <div className="relative flex flex-col items-center justify-center min-h-screen p-4">
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 sm:top-8 sm:left-8 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 glass-card !rounded-full glass-card-highlight"
        aria-label="Voltar"
      >
        <ArrowLeft size={24} />
      </button>

      <div className="w-full max-w-sm mx-auto glass-card p-6 sm:p-8 text-center">
        <Fingerprint className="h-14 w-14 sm:h-16 sm:w-16 mx-auto icon-glow mb-4" style={{ color: 'var(--color-secondary)' }} />

        <h2 className="text-2xl sm:text-3xl font-bold font-display mb-2">{pageTitle}</h2>
        <p className="mb-6 text-sm sm:text-base" style={{ color: 'var(--color-text-secondary)' }}>Insira o seu PIN de 6 dígitos.</p>

        <div className="flex justify-center gap-3 sm:gap-4 mb-4 h-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                pin.length > index ? 'bg-amber-300 border-amber-300' : 'border-gray-500'
              }`}
              style={{
                transform: `scale(${pin.length > index ? 1.1 : 0.8})`,
                opacity: pin.length > index ? 1 : 0.5
              }}
            ></div>
          ))}
        </div>
        
        {error && (
            <div className="flex items-center justify-center bg-red-900/50 text-red-300 p-2 rounded-xl my-4 text-sm animate-shake">
                <XCircle size={16} className="mr-2"/>
                {error}
            </div>
        )}

        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'help', 0, 'del'].map((item) => {
            if (item === 'help') {
              return intendedRole === 'admin' ? (
                <button
                  key={item}
                  onClick={() => setIsRecoveryModalOpen(true)}
                  className="aspect-square text-sm font-semibold glass-card !rounded-full glass-card-highlight flex items-center justify-center"
                  style={{color: 'var(--color-text-secondary)'}}
                >
                  Ajuda?
                </button>
              ) : (
                <div key={item}></div>
              );
            }
            if (item === 'del') {
               return (
                <button
                    key={item}
                    onClick={handleDelete}
                    className="aspect-square text-xl font-semibold glass-card !rounded-full glass-card-highlight flex items-center justify-center"
                >
                    ⌫
                </button>
               );
            }
            return (
                <button
                key={item}
                onClick={() => handleKeyPress(item.toString())}
                className="aspect-square text-2xl sm:text-3xl font-semibold glass-card !rounded-full glass-card-highlight"
                >
                {item}
                </button>
            );
          })}
        </div>
      </div>
    </div>
    </>
  );
};

export default LoginPage;
