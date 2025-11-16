import React, { useState, useMemo, useEffect, useRef, memo, useCallback } from 'react';
import { useData, defaultTheme } from '../contexts/DataContext';
import { Product, Order, OrderStatus, Staff, UserRole, Cafe, ThemeSettings, Table, CreationCode, Feedback } from '../types';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import TableQRCodeModal from '../components/TableQRCodeModal';
// Fix: Import 'X' and 'Coffee' icons from 'lucide-react'.
import { PlusCircle, Edit, Trash2, Download, Users, Package, BarChart2, Ban, ShieldAlert, SlidersHorizontal, Search, Hash, AlertTriangle, Paintbrush, Undo, Type, Image as ImageIcon, KeyRound, Phone, Shield, TrendingUp, DollarSign, ShoppingCart, BarChartHorizontal, QrCode, Info, Link as LinkIcon, Palette, Droplet, Copy, Check, Clock, Coffee, Loader2, Server, EyeOff, Eye, Ticket, MessageSquare, Star, User as UserIcon, Crown, MonitorPlay, X } from 'lucide-react';

const CafePreviewModal: React.FC<{
  cafe: Cafe;
  onClose: () => void;
}> = ({ cafe, onClose }) => {
    const baseUrl = window.location.href.split('#')[0];
    const previewUrl = `${baseUrl}#/join/${cafe.id}`;

    useEffect(() => {
        document.body.classList.add('modal-open');
        return () => {
            document.body.classList.remove('modal-open');
        }
    }, []);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
        <div className="glass-card w-full max-w-5xl h-[95vh] flex flex-col">
            <header className="flex-shrink-0 flex items-center justify-between p-4 border-b" style={{borderColor: 'var(--color-glass-border)'}}>
                <h3 className="text-xl font-bold font-display flex items-center gap-2"><MonitorPlay size={24}/> Pré-visualização: {cafe.name}</h3>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-black/20" style={{color: 'var(--color-text-secondary)'}}><X/></button>
            </header>
            <main className="flex-grow p-4 flex items-center justify-center bg-black/20 overflow-auto">
              <div className="w-[400px] h-[820px] bg-stone-900 rounded-[40px] shadow-2xl p-2 border-4 border-stone-700 relative flex-shrink-0 my-4">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 h-6 w-32 bg-stone-900 rounded-b-lg z-10"></div>
                <iframe 
                    src={previewUrl}
                    className="w-full h-full border-0 rounded-[32px] bg-white"
                    title={`Preview of ${cafe.name}`}
                />
              </div>
            </main>
        </div>
      </div>
    );
};


// Reusable Confirmation Modal
const ConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}> = memo(({ isOpen, onClose, onConfirm, title, message }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-sm p-6 text-center">
        <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-900/40 rounded-full flex items-center justify-center">
                <ShieldAlert size={40} className="text-red-300" />
            </div>
        </div>
        <h3 className="text-2xl font-bold font-display mb-2">{title}</h3>
        <p style={{color: 'var(--color-text-secondary)'}} className="mb-6">{message}</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            className="w-full secondary-button font-bold py-3"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirm();
            }}
            className="w-full bg-red-600 text-white font-bold py-3 rounded-2xl hover:bg-red-700 transition-colors"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
});

const CategoryModal: React.FC<{
  categoryName: string | null;
  onSave: (name: string, oldName?: string) => Promise<void>;
  onClose: () => void;
}> = memo(({ categoryName, onSave, onClose }) => {
    const [name, setName] = useState(categoryName || '');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const { categories } = useData();

    useEffect(() => {
        document.body.classList.add('modal-open');
        return () => {
            document.body.classList.remove('modal-open');
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const trimmedName = name.trim();
        if (!trimmedName) {
            setError('O nome da categoria não pode estar vazio.');
            return;
        }
        if (categories.some(c => c.toLowerCase() === trimmedName.toLowerCase() && c.toLowerCase() !== (categoryName || '').toLowerCase())) {
            setError('Já existe uma categoria com este nome.');
            return;
        }

        setIsSaving(true);
        try {
            await onSave(trimmedName, categoryName || undefined);
            onClose();
        } catch (error) {
            console.error("Error saving category:", error);
            setError('Falha ao guardar. Ocorreu um erro ao atualizar os produtos.');
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card w-full max-w-md p-6">
                <h3 className="text-2xl font-bold font-display mb-4">{categoryName ? 'Editar Categoria' : 'Nova Categoria'}</h3>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="category-name" className="block text-sm font-medium mb-2" style={{color: 'var(--color-text-secondary)'}}>Nome da Categoria</label>
                            <input type="text" id="category-name" value={name} onChange={e => setName(e.target.value)} className="w-full glass-input" autoFocus />
                        </div>
                    </div>
                    {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                    <div className="mt-6 flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="secondary-button font-bold py-2 px-4">Cancelar</button>
                        <button type="submit" className="premium-gradient-button py-2 px-4" disabled={isSaving}>
                            {isSaving ? 'A guardar...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
});

const DeleteServerConfirmationModal: React.FC<{
  isOpen: boolean;
  cafe: Cafe;
  onConfirm: (pin: string) => Promise<boolean>;
  onClose: () => void;
}> = memo(({ isOpen, cafe, onConfirm, onClose }) => {
  const [pin, setPin] = useState('');
  const [cafeNameInput, setCafeNameInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
      setPin('');
      setCafeNameInput('');
      setError('');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setError('');
    const success = await onConfirm(pin);
    if (!success) {
      setError('PIN do gerente incorreto. A exclusão falhou.');
      setPin('');
    }
  };
  
  const isConfirmationDisabled = pin.length !== 6 || cafeNameInput.trim().toLowerCase() !== cafe.name.toLowerCase();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-sm p-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-900/40 rounded-full flex items-center justify-center">
            <ShieldAlert size={40} className="text-red-300" />
          </div>
        </div>
        <h3 className="text-2xl font-bold font-display mb-2">Apagar Servidor</h3>
        <p style={{color: 'var(--color-text-secondary)'}} className="mb-4">
          Esta ação é irreversível. Para confirmar, digite <strong>"{cafe.name}"</strong> e o seu PIN de gerente.
        </p>

        <div className="mb-4">
          <input
            type="text"
            value={cafeNameInput}
            onChange={(e) => setCafeNameInput(e.target.value)}
            className="w-full glass-input text-center text-lg"
            placeholder="Digite o nome do café"
            autoFocus
          />
        </div>

        <div className="mb-4">
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            maxLength={6}
            className="w-full glass-input text-center text-lg tracking-[.5em]"
            placeholder="PIN de 6 dígitos"
          />
        </div>

        {error && (
            <p className="text-red-400 text-sm text-center flex items-center justify-center gap-2 mb-4">
                <AlertTriangle size={16} /> {error}
            </p>
        )}

        <div className="flex justify-center gap-4">
          <button onClick={onClose} className="w-full secondary-button font-bold py-3">
            Cancelar
          </button>
          <button onClick={handleConfirm} disabled={isConfirmationDisabled} className="w-full bg-red-600 text-white font-bold py-3 rounded-2xl hover:bg-red-700 transition-colors disabled:bg-stone-400 disabled:opacity-60">
            Confirmar Exclusão
          </button>
        </div>
      </div>
    </div>
  );
});

const PlatformDeleteCafeConfirmationModal: React.FC<{
  isOpen: boolean;
  cafe: Cafe | null;
  onConfirm: () => void;
  onClose: () => void;
}> = memo(({ isOpen, cafe, onConfirm, onClose }) => {
    const [cafeNameInput, setCafeNameInput] = useState('');

    useEffect(() => {
        if (isOpen) {
            document.body.classList.add('modal-open');
            setCafeNameInput(''); // Reset on open
        } else {
            document.body.classList.remove('modal-open');
        }
        return () => {
            document.body.classList.remove('modal-open');
        };
    }, [isOpen]);

    if (!isOpen || !cafe) return null;

    const isConfirmationDisabled = cafeNameInput.trim().toLowerCase() !== cafe.name.toLowerCase();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card w-full max-w-sm p-6 text-center">
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-red-900/40 rounded-full flex items-center justify-center">
                        <ShieldAlert size={40} className="text-red-300" />
                    </div>
                </div>
                <h3 className="text-2xl font-bold font-display mb-2">Apagar Café</h3>
                <p style={{color: 'var(--color-text-secondary)'}} className="mb-6">
                    Para confirmar a exclusão permanente de <strong>"{cafe.name}"</strong>, por favor, digite o nome do café abaixo.
                </p>
                <div className="mb-6">
                    <input
                        type="text"
                        value={cafeNameInput}
                        onChange={(e) => setCafeNameInput(e.target.value)}
                        className="w-full glass-input text-center text-lg"
                        placeholder="Digite o nome do café"
                        autoFocus
                    />
                </div>
                <div className="flex justify-center gap-4">
                    <button onClick={onClose} className="w-full secondary-button font-bold py-3">
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isConfirmationDisabled}
                        className="w-full bg-red-600 text-white font-bold py-3 rounded-2xl hover:bg-red-700 transition-colors disabled:bg-stone-400 disabled:opacity-60"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
});


const FONT_OPTIONS = {
    display: [
        { name: 'Playfair Display', value: "'Playfair Display', serif" },
        { name: 'Lora', value: "'Lora', serif" },
        { name: 'Montserrat', value: "'Montserrat', sans-serif" },
        { name: 'Poppins', value: "'Poppins', sans-serif" },
        { name: 'Roboto', value: "'Roboto', sans-serif" },
    ],
    body: [
        { name: 'Plus Jakarta Sans', value: "'Plus Jakarta Sans', sans-serif" },
        { name: 'Inter', value: "'Inter', sans-serif" },
        { name: 'Lato', value: "'Lato', sans-serif" },
        { name: 'Open Sans', value: "'Open Sans', sans-serif" },
        { name: 'Roboto', value: "'Roboto', sans-serif" },
    ]
};

const AccountSecurity = memo(() => {
    const { user, updateCurrentUserPin, updateCurrentUserPhone, theme, updateTheme } = useData();
    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [pinError, setPinError] = useState('');
    const [pinSuccess, setPinSuccess] = useState('');
    const [isPinSubmitting, setIsPinSubmitting] = useState(false);

    const [phone, setPhone] = useState(user?.phone || '');
    const [phoneError, setPhoneError] = useState('');
    const [phoneSuccess, setPhoneSuccess] = useState('');
    const [isPhoneSubmitting, setIsPhoneSubmitting] = useState(false);

    useEffect(() => {
        setPhone(user?.phone || '');
    }, [user]);

    const handlePinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPinError('');
        setPinSuccess('');

        if (newPin !== confirmPin) {
            setPinError('Os novos PINs não coincidem.');
            return;
        }
        if (!/^\d{6}$/.test(newPin)) {
            setPinError('O novo PIN deve ter exatamente 6 dígitos numéricos.');
            return;
        }
        if (newPin === currentPin) {
            setPinError('O novo PIN deve ser diferente do atual.');
            return;
        }
        
        setIsPinSubmitting(true);
        const result = await updateCurrentUserPin(currentPin, newPin);
        setIsPinSubmitting(false);

        if (result.success) {
            setPinSuccess(result.message);
            setCurrentPin('');
            setNewPin('');
            setConfirmPin('');
        } else {
            setPinError(result.message);
        }
    };

    const handlePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPhoneError('');
        setPhoneSuccess('');

        if (phone && !/^\d{9,15}$/.test(phone)) {
            setPhoneError('O número de telemóvel parece ser inválido.');
            return;
        }
        
        setIsPhoneSubmitting(true);
        const result = await updateCurrentUserPhone(phone);
        setIsPhoneSubmitting(false);
        
        if (result.success) {
            setPhoneSuccess(result.message);
        } else {
            setPhoneError(result.message);
        }
    };
    
    const handleToggleHideManager = async () => {
        await updateTheme({
            hideManagerLogin: !theme.hideManagerLogin,
        });
    };

    if (!user || user.role !== 'admin') {
        return null;
    }

    return (
        <div className="mt-8 pt-8 border-t" style={{borderColor: 'var(--color-glass-border)'}}>
            <h3 className="text-2xl font-bold font-display mb-4 flex items-center gap-3"><KeyRound /> Segurança da Conta</h3>
            <div className="glass-card p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 md:gap-8 lg:gap-12">
                    {/* Change PIN Form */}
                    <form onSubmit={handlePinSubmit} className="space-y-4">
                        <h4 className="text-lg font-bold">Alterar PIN</h4>
                        <div>
                            <label htmlFor="current-pin" className="block text-sm font-bold mb-1" style={{color: 'var(--color-text-secondary)'}}>PIN Atual</label>
                            <input
                                type="password"
                                id="current-pin"
                                value={currentPin}
                                onChange={e => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                                maxLength={6}
                                required
                                className="w-full glass-input"
                            />
                        </div>
                        <div>
                            <label htmlFor="new-pin" className="block text-sm font-bold mb-1" style={{color: 'var(--color-text-secondary)'}}>Novo PIN (6 dígitos)</label>
                            <input
                                type="password"
                                id="new-pin"
                                value={newPin}
                                onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                                maxLength={6}
                                required
                                className="w-full glass-input"
                            />
                        </div>
                        <div>
                            <label htmlFor="confirm-pin" className="block text-sm font-bold mb-1" style={{color: 'var(--color-text-secondary)'}}>Confirmar Novo PIN</label>
                            <input
                                type="password"
                                id="confirm-pin"
                                value={confirmPin}
                                onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                                maxLength={6}
                                required
                                className="w-full glass-input"
                            />
                        </div>
                        
                        {pinError && <p className="text-red-400 text-sm">{pinError}</p>}
                        {pinSuccess && <p className="text-green-300 text-sm">{pinSuccess}</p>}

                        <div>
                            <button type="submit" disabled={isPinSubmitting} className="premium-gradient-button py-2 px-6">
                                {isPinSubmitting ? 'A guardar...' : 'Atualizar PIN'}
                            </button>
                        </div>
                    </form>

                    {/* Recovery Phone Form */}
                    <form onSubmit={handlePhoneSubmit} className="space-y-4 mt-8 md:mt-0 pt-6 md:pt-0 border-t md:border-t-0 md:border-l md:pl-8" style={{borderColor: 'var(--color-glass-border)'}}>
                        <h4 className="text-lg font-bold flex items-center gap-2"><Phone size={18} /> Telemóvel de Recuperação</h4>
                        <p className="text-sm" style={{color: 'var(--color-text-secondary)'}}>Este número será usado para verificar a sua identidade se esquecer o seu PIN.</p>
                        <div>
                            <label htmlFor="phone" className="block text-sm font-bold mb-1" style={{color: 'var(--color-text-secondary)'}}>Número de Telemóvel</label>
                            <input
                                type="tel"
                                id="phone"
                                value={phone}
                                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                                placeholder="Ex: 912345678"
                                className="w-full glass-input"
                            />
                        </div>
                        {phoneError && <p className="text-red-400 text-sm">{phoneError}</p>}
                        {phoneSuccess && <p className="text-green-300 text-sm">{phoneSuccess}</p>}
                        <div>
                            <button type="submit" disabled={isPhoneSubmitting} className="premium-gradient-button py-2 px-6">
                                {isPhoneSubmitting ? 'A guardar...' : 'Guardar Telemóvel'}
                            </button>
                        </div>
                    </form>
                </div>

                 {/* Hide Manager Button Setting */}
                <div className="mt-8 pt-6 border-t" style={{borderColor: 'var(--color-glass-border)'}}>
                     <h4 className="text-lg font-bold flex items-center gap-2"><Shield size={18} /> Acesso de Gerente na Tela de Login</h4>
                     <p className="text-sm" style={{color: 'var(--color-text-secondary)'}}>Oculte o botão "Gerente" na tela de seleção de função para outros utilizadores. O botão permanecerá sempre visível nos dispositivos que já utilizaram uma conta de gerente para este café.</p>
                     <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl border mt-4 max-w-lg" style={{borderColor: 'var(--color-glass-border)'}}>
                        <label htmlFor="hide-manager-toggle" className="font-medium pr-4 cursor-pointer">
                            Ocultar botão "Gerente"
                        </label>
                        <button
                            id="hide-manager-toggle"
                            role="switch"
                            aria-checked={!!theme.hideManagerLogin}
                            onClick={handleToggleHideManager}
                            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-background)] ${theme.hideManagerLogin ? 'bg-green-600' : 'bg-stone-600'}`}
                            style={{'--tw-ring-color': 'var(--color-secondary)'} as React.CSSProperties}
                        >
                            <span
                                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${theme.hideManagerLogin ? 'translate-x-6' : 'translate-x-1'}`}
                            />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});

// --- Color Picker Helper Functions & Components ---
const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
};
const rgbToHex = (r: number, g: number, b: number): string => {
    const toHex = (c: number) => ('0' + Math.round(c).toString(16)).slice(-2);
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};
const parseRgba = (rgba: string): { r: number; g: number; b: number; a: number } => {
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
        return {
            r: parseInt(match[1], 10),
            g: parseInt(match[2], 10),
            b: parseInt(match[3], 10),
            a: match[4] !== undefined ? parseFloat(match[4]) : 1,
        };
    }
    const hexMatch = hexToRgb(rgba);
    return { ...hexMatch, a: 1 };
};
const rgbaToString = (rgba: { r: number; g: number; b: number; a: number }): string => {
    const alpha = Number(rgba.a.toPrecision(2));
    return `rgba(${Math.round(rgba.r)}, ${Math.round(rgba.g)}, ${Math.round(rgba.b)}, ${alpha})`;
};

const Slider: React.FC<{
    label: string;
    value: number;
    max: number;
    gradient: string;
    onChange: (v: number) => void;
    displayValue?: string | number;
    checkered?: boolean;
}> = ({ label, value, max, gradient, onChange, displayValue, checkered = false }) => {
    const sliderRef = useRef<HTMLDivElement>(null);

    const handleInteraction = useCallback((e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
        if (!sliderRef.current) return;
        const rect = sliderRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        let newValue = (x / width) * max;
        newValue = Math.max(0, Math.min(max, newValue));
        onChange(newValue);
    }, [onChange, max]);

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        handleInteraction(e);
        const handleMouseMove = (moveEvent: MouseEvent) => handleInteraction(moveEvent);
        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp, { once: true });
    }, [handleInteraction]);

    const thumbPosition = `${(value / max) * 100}%`;

    return (
        <div>
            <div className="flex justify-between items-center text-sm mb-1">
                <label className="font-bold" style={{ color: 'var(--color-text-secondary)' }}>{label}</label>
                <span className="font-mono text-xs">{displayValue ?? value}</span>
            </div>
            <div
                ref={sliderRef}
                onMouseDown={handleMouseDown}
                className="relative h-6 flex items-center cursor-pointer"
                role="slider"
                aria-valuemin={0}
                aria-valuemax={max}
                aria-valuenow={value}
                aria-label={label}
            >
                 {checkered && (
                     <div
                        className="absolute inset-y-2 left-0 right-0 rounded-lg"
                        style={{ background: 'repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 50% / 10px 10px' }}
                    />
                 )}
                <div className="w-full h-2 rounded-lg" style={{ background: gradient }} />
                <div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-stone-300 shadow-lg"
                    style={{ left: thumbPosition, transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}
                />
            </div>
        </div>
    );
};


const CustomColorPickerModal: React.FC<{
    editingColorInfo: { path: string; value: string; label: string };
    onClose: () => void;
    onChange: (path: string, value: string) => void;
}> = ({ editingColorInfo, onClose, onChange }) => {
    const { path, value, label } = editingColorInfo;
    const [internalHex, setInternalHex] = useState(value);
    const rgb = useMemo(() => hexToRgb(internalHex), [internalHex]);

    useEffect(() => { setInternalHex(value); }, [value]);
    useEffect(() => {
        document.body.classList.add('modal-open');
        return () => document.body.classList.remove('modal-open');
    }, []);

    const handleRgbChange = (newRgb: { r: number; g: number; b: number }) => {
        const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
        setInternalHex(newHex);
        onChange(path, newHex);
    };
    
    const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newHex = e.target.value;
        setInternalHex(newHex);
        if (/^#[0-9a-f]{6}$/i.test(newHex)) {
            onChange(path, newHex);
        }
    }
    
    const RgbSlider: React.FC<{ label: 'R' | 'G' | 'B'; value: number; onChange: (v: number) => void; }> = ({ label, value, onChange }) => {
        const getGradient = () => {
            const { r, g, b } = rgb;
            switch (label) {
                case 'R': return `linear-gradient(to right, rgb(0, ${g}, ${b}), rgb(255, ${g}, ${b}))`;
                case 'G': return `linear-gradient(to right, rgb(${r}, 0, ${b}), rgb(${r}, 255, ${b}))`;
                case 'B': return `linear-gradient(to right, rgb(${r}, ${g}, 0), rgb(${r}, ${g}, 255))`;
            }
        };
        return <Slider label={label} value={value} max={255} gradient={getGradient()} onChange={onChange} displayValue={Math.round(value)} />;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card w-full max-w-xs p-6 space-y-4">
                <h3 className="text-xl font-bold font-display">Editar: {label}</h3>
                <div className="h-24 w-full rounded-lg border" style={{ backgroundColor: internalHex, borderColor: 'var(--color-glass-border)' }}></div>
                <div className="space-y-3">
                   <RgbSlider label="R" value={rgb.r} onChange={v => handleRgbChange({ ...rgb, r: v })} />
                   <RgbSlider label="G" value={rgb.g} onChange={v => handleRgbChange({ ...rgb, g: v })} />
                   <RgbSlider label="B" value={rgb.b} onChange={v => handleRgbChange({ ...rgb, b: v })} />
                </div>
                <div>
                     <label className="block text-sm font-bold mb-1" style={{color: 'var(--color-text-secondary)'}}>Hex</label>
                     <input type="text" value={internalHex} onChange={handleHexChange} className="w-full glass-input font-mono"/>
                </div>
                <button onClick={onClose} className="w-full secondary-button font-bold py-2.5 mt-2">Fechar</button>
            </div>
        </div>
    );
};

const RgbaColorPickerModal: React.FC<{
    editingColorInfo: { path: string; value: string; label: string };
    onClose: () => void;
    onChange: (path: string, value: string) => void;
}> = ({ editingColorInfo, onClose, onChange }) => {
    const { path, value, label } = editingColorInfo;
    const [rgba, setRgba] = useState(() => parseRgba(value));

    useEffect(() => { setRgba(parseRgba(value)); }, [value]);
    useEffect(() => {
        document.body.classList.add('modal-open');
        return () => document.body.classList.remove('modal-open');
    }, []);

    const handleRgbaChange = (newRgba: { r: number; g: number; b: number; a: number }) => {
        setRgba(newRgba);
        onChange(path, rgbaToString(newRgba));
    };

    const RgbSlider: React.FC<{ label: 'R' | 'G' | 'B'; value: number; onChange: (v: number) => void; }> = ({ label, value, onChange }) => {
        const getGradient = () => {
            const { r, g, b } = rgba;
            switch (label) {
                case 'R': return `linear-gradient(to right, rgb(0, ${g}, ${b}), rgb(255, ${g}, ${b}))`;
                case 'G': return `linear-gradient(to right, rgb(${r}, 0, ${b}), rgb(${r}, 255, ${b}))`;
                case 'B': return `linear-gradient(to right, rgb(${r}, ${g}, 0), rgb(${r}, ${g}, 255))`;
            }
        };
        return <Slider label={label} value={value} max={255} gradient={getGradient()} onChange={onChange} displayValue={Math.round(value)} />;
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card w-full max-w-xs p-6 space-y-4">
                <h3 className="text-xl font-bold font-display">Editar: {label}</h3>
                <div className="h-24 w-full rounded-lg border relative overflow-hidden" style={{ borderColor: 'var(--color-glass-border)' }}>
                    <div className="absolute inset-0" style={{ background: 'repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 50% / 10px 10px' }} />
                    <div className="absolute inset-0" style={{ backgroundColor: rgbaToString(rgba) }} />
                </div>
                <div className="space-y-3">
                    <RgbSlider label="R" value={rgba.r} onChange={v => handleRgbaChange({ ...rgba, r: v })} />
                    <RgbSlider label="G" value={rgba.g} onChange={v => handleRgbaChange({ ...rgba, g: v })} />
                    <RgbSlider label="B" value={rgba.b} onChange={v => handleRgbaChange({ ...rgba, b: v })} />
                    <Slider 
                        label="Opacidade" 
                        value={rgba.a} 
                        max={1}
                        gradient={`linear-gradient(to right, rgba(${rgba.r},${rgba.g},${rgba.b}, 0), rgba(${rgba.r},${rgba.g},${rgba.b}, 1))`}
                        onChange={v => handleRgbaChange({ ...rgba, a: v })}
                        displayValue={Number(rgba.a.toFixed(2))}
                        checkered
                    />
                </div>
                <div>
                     <label className="block text-sm font-bold mb-1" style={{color: 'var(--color-text-secondary)'}}>RGBA</label>
                     <input type="text" value={rgbaToString(rgba)} readOnly className="w-full glass-input font-mono"/>
                </div>
                <button onClick={onClose} className="w-full secondary-button font-bold py-2.5 mt-2">Fechar</button>
            </div>
        </div>
    );
};


const AppearanceCustomization = memo(() => {
    const { theme, updateTheme, currentCafe, updateCafe } = useData();
    const [localTheme, setLocalTheme] = useState<ThemeSettings>(theme);
    const [appName, setAppName] = useState(currentCafe?.name || '');
    const [logoError, setLogoError] = useState('');
    const [bgError, setBgError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [editingColor, setEditingColor] = useState<{ path: string; value: string; label: string } | null>(null);
    const [editingRgbaColor, setEditingRgbaColor] = useState<{ path: string; value: string; label: string } | null>(null);

    useEffect(() => {
        setLocalTheme(theme);
        setAppName(currentCafe?.name || '');
    }, [theme, currentCafe]);
    
    const handleValueChange = (path: string, value: any) => {
        setLocalTheme(prev => {
            const keys = path.split('.');
            const newState = JSON.parse(JSON.stringify(prev));
            let current = newState;
            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return newState;
        });
    };
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'background') => {
        const errorSetter = type === 'logo' ? setLogoError : setBgError;
        errorSetter('');
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            errorSetter('O ficheiro é demasiado grande. O limite é 2MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const key = type === 'logo' ? 'logoUrl' : 'backgroundImageUrl';
            handleValueChange(key, reader.result as string);
        };
        reader.onerror = () => { errorSetter('Ocorreu um erro ao ler o ficheiro.'); };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        setIsSaving(true);
        if (currentCafe?.name !== appName) {
            await updateCafe({ name: appName });
        }
        await updateTheme(localTheme);
        setIsSaving(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
    };
    
    const handleReset = async () => {
        setIsSaving(true);
        await updateTheme(defaultTheme);
        setIsSaving(false);
    };
    
    const ColorInput: React.FC<{ label: string, path: string }> = ({ label, path }) => {
        const value = path.split('.').reduce((o, i) => o[i], localTheme as any);
        return (
            <div>
                <label className="block text-sm font-bold mb-1" style={{color: 'var(--color-text-secondary)'}}>{label}</label>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setEditingColor({ path, value, label })}
                        className="h-10 w-10 flex-shrink-0 cursor-pointer rounded-md border"
                        style={{
                            backgroundColor: value,
                            borderColor: 'var(--color-glass-border)'
                        }}
                        aria-label={`Editar cor ${label}`}
                    />
                    <input
                        type="text"
                        value={value}
                        onChange={e => {
                            handleValueChange(path, e.target.value);
                        }}
                        className="w-full glass-input !py-2 !px-3 font-mono text-sm"
                    />
                </div>
            </div>
        );
    };

    const RgbaColorInput: React.FC<{ label: string; path: string }> = ({ label, path }) => {
        const value = path.split('.').reduce((o, i) => o[i], localTheme as any);
        return (
            <div>
                <label className="block text-sm font-bold mb-1" style={{color: 'var(--color-text-secondary)'}}>{label}</label>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setEditingRgbaColor({ path, value, label })}
                        className="h-10 w-10 flex-shrink-0 cursor-pointer rounded-md border relative overflow-hidden"
                        style={{ borderColor: 'var(--color-glass-border)' }}
                        aria-label={`Editar cor ${label}`}
                    >
                        <div className="absolute inset-0" style={{ background: 'repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 50% / 10px 10px' }} />
                        <div className="absolute inset-0" style={{ backgroundColor: value }} />
                    </button>
                    <input
                        type="text"
                        value={value}
                        onChange={e => handleValueChange(path, e.target.value)}
                        className="w-full glass-input !py-2 !px-3 font-mono text-sm"
                    />
                </div>
            </div>
        );
    };
    
    return (
        <div className="mt-8 pt-8 border-t" style={{borderColor: 'var(--color-glass-border)'}}>
             <h3 className="text-2xl font-bold font-display mb-4 flex items-center gap-3"><Paintbrush />Personalização da Aparência</h3>
             <div className="glass-card p-6 space-y-8">
                {/* General */}
                <div>
                    <h4 className='text-lg font-bold mb-4'>Geral</h4>
                    <div className='space-y-4'>
                        <div>
                            <label htmlFor="app-name" className="block text-sm font-bold mb-1" style={{color: 'var(--color-text-secondary)'}}>Nome da Aplicação</label>
                            <input type="text" id="app-name" value={appName} onChange={(e) => setAppName(e.target.value)} className="w-full max-w-md glass-input" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-3 flex items-center gap-2" style={{color: 'var(--color-text-secondary)'}}><ImageIcon size={16}/>Logótipo</label>
                            <div className="flex items-center gap-6">
                                <div className="w-32 h-32 bg-black/20 rounded-xl flex items-center justify-center border-2 border-dashed" style={{borderColor: 'var(--color-glass-border)'}}>
                                   {localTheme.logoUrl ? <img src={localTheme.logoUrl} alt="Pré-visualização" className="max-w-full max-h-full object-contain" /> : <ImageIcon size={48} className="text-stone-400" />}
                                </div>
                                <div>
                                    <input type="file" id="logo-upload" accept="image/*" onChange={(e) => handleImageChange(e, 'logo')} className="hidden" />
                                    <label htmlFor="logo-upload" className="cursor-pointer secondary-button font-bold py-2 px-4">Carregar Imagem</label>
                                    <button onClick={() => handleValueChange('logoUrl', '')} className="ml-3 text-sm text-red-400 hover:text-red-300 font-semibold">Remover</button>
                                    <p className="text-xs mt-2" style={{color: 'var(--color-text-secondary)'}}>Recomendado: .PNG transparente. Max 2MB.</p>
                                    {logoError && <p className="text-sm text-red-400 mt-2">{logoError}</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Background */}
                <div className='pt-6 border-t' style={{borderColor: 'var(--color-glass-border)'}}>
                    <h4 className='text-lg font-bold mb-4'>Fundo da Aplicação</h4>
                     <div className='space-y-4'>
                        <div>
                            <label className="block text-sm font-bold mb-3 flex items-center gap-2" style={{color: 'var(--color-text-secondary)'}}><ImageIcon size={16}/>Imagem de Fundo</label>
                            <div className="flex items-center gap-6">
                                <div className="w-32 h-32 bg-black/20 rounded-xl flex items-center justify-center border-2 border-dashed overflow-hidden" style={{borderColor: 'var(--color-glass-border)'}}>
                                   {localTheme.backgroundImageUrl ? <img src={localTheme.backgroundImageUrl} alt="Pré-visualização" className="w-full h-full object-cover" /> : <ImageIcon size={48} className="text-stone-400" />}
                                </div>
                                <div>
                                    <input type="file" id="bg-upload" accept="image/*" onChange={(e) => handleImageChange(e, 'background')} className="hidden" />
                                    <label htmlFor="bg-upload" className="cursor-pointer secondary-button font-bold py-2 px-4">Carregar Imagem</label>
                                    <button onClick={() => handleValueChange('backgroundImageUrl', '')} className="ml-3 text-sm text-red-400 hover:text-red-300 font-semibold">Remover</button>
                                    <p className="text-xs mt-2" style={{color: 'var(--color-text-secondary)'}}>Max 2MB.</p>
                                    {bgError && <p className="text-sm text-red-400 mt-2">{bgError}</p>}
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1" style={{color: 'var(--color-text-secondary)'}}>Opacidade da Sobreposição (0 a 1)</label>
                            <input type="range" min="0" max="1" step="0.05" value={localTheme.backgroundOverlayOpacity} onChange={e => handleValueChange('backgroundOverlayOpacity', parseFloat(e.target.value))} className="w-full max-w-sm" />
                        </div>
                    </div>
                </div>

                {/* Colors */}
                <div className='pt-6 border-t' style={{borderColor: 'var(--color-glass-border)'}}>
                    <h4 className="text-lg font-bold mb-4 flex items-center gap-2"><Palette size={18}/>Cores</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <ColorInput label="Primária" path="colors.primary" />
                        <ColorInput label="Secundária (Destaque)" path="colors.secondary" />
                        <ColorInput label="Fundo" path="colors.background" />
                        <ColorInput label="Texto Principal" path="colors.textPrimary" />
                        <ColorInput label="Texto Secundário" path="colors.textSecondary" />
                    </div>
                    <h5 className="text-md font-bold mt-6 mb-2 flex items-center gap-2"><Droplet size={16}/>Efeito Vidro</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <RgbaColorInput label="Fundo do Cartão" path="colors.glassBackground" />
                        <RgbaColorInput label="Borda do Cartão" path="colors.glassBorder" />
                        <RgbaColorInput label="Borda do Cartão (Hover)" path="colors.glassBorderHighlight" />
                    </div>
                    <h5 className="text-md font-bold mt-6 mb-2">Cores das Mesas</h5>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <ColorInput label="Livre" path="tableColors.free" />
                        <ColorInput label="Ocupada" path="tableColors.occupied" />
                    </div>
                     <h5 className="text-md font-bold mt-6 mb-2">Cores dos Status de Pedido</h5>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                        <ColorInput label="Novo" path="statusColors.new" />
                        <ColorInput label="Em Preparo" path="statusColors.preparing" />
                        <ColorInput label="Pronto" path="statusColors.ready" />
                        <ColorInput label="Servido" path="statusColors.served" />
                        <ColorInput label="Pago" path="statusColors.paid" />
                        <ColorInput label="Cancelado" path="statusColors.cancelled" />
                    </div>
                </div>

                {/* Typography & Layout */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                    <div className='pt-6 border-t' style={{borderColor: 'var(--color-glass-border)'}}>
                        <h4 className="text-lg font-bold mb-4 flex items-center gap-2"><Type size={18}/>Tipografia</h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1" style={{color: 'var(--color-text-secondary)'}}>Fonte dos Títulos</label>
                                <select value={localTheme.fonts.display} onChange={e => handleValueChange('fonts.display', e.target.value)} className="w-full glass-input">
                                    {FONT_OPTIONS.display.map(f => <option key={f.value} value={f.value} style={{backgroundColor: '#332924'}}>{f.name}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-bold mb-1" style={{color: 'var(--color-text-secondary)'}}>Fonte do Corpo</label>
                                <select value={localTheme.fonts.body} onChange={e => handleValueChange('fonts.body', e.target.value)} className="w-full glass-input">
                                    {FONT_OPTIONS.body.map(f => <option key={f.value} value={f.value} style={{backgroundColor: '#332924'}}>{f.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className='pt-6 border-t' style={{borderColor: 'var(--color-glass-border)'}}>
                         <h4 className="text-lg font-bold mb-4">Layout</h4>
                         <div>
                            <label className="block text-sm font-bold mb-1" style={{color: 'var(--color-text-secondary)'}}>Arredondamento dos Cantos (px)</label>
                            <input type="range" min="0" max="48" step="1" value={localTheme.layout.cardBorderRadius} onChange={e => handleValueChange('layout.cardBorderRadius', parseInt(e.target.value))} className="w-full" />
                        </div>
                    </div>
                </div>
                
                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t" style={{borderColor: 'var(--color-glass-border)'}}>
                    <button onClick={handleSave} className="premium-gradient-button py-2 px-6 flex items-center justify-center gap-2" disabled={isSaving}>
                        {isSaving ? 'A guardar...' : showSuccess ? 'Guardado com Sucesso!' : 'Guardar Alterações'}
                    </button>
                    <button onClick={handleReset} className="secondary-button font-bold py-2 px-6 flex items-center justify-center gap-2" disabled={isSaving}>
                        <Undo size={18}/> Repor Padrões
                    </button>
                </div>
             </div>
             {editingColor && (
                <CustomColorPickerModal
                    editingColorInfo={editingColor}
                    onClose={() => setEditingColor(null)}
                    onChange={(path, value) => {
                        handleValueChange(path, value);
                        setEditingColor(prev => prev ? {...prev, value} : null);
                    }}
                />
            )}
            {editingRgbaColor && (
                <RgbaColorPickerModal
                    editingColorInfo={editingRgbaColor}
                    onClose={() => setEditingRgbaColor(null)}
                    onChange={(path, value) => {
                        handleValueChange(path, value);
                        setEditingRgbaColor(prev => prev ? { ...prev, value } : null);
                    }}
                />
            )}
        </div>
    );
});


const SettingsManagement = memo(() => {
    const { tables, categories, addTable, deleteLastTable, updateCategory, currentCafe, deleteCafe, theme, updateCafe, updateTable } = useData();
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [isDeleteLastTableModalOpen, setIsDeleteLastTableModalOpen] = useState(false);
    const [isDeleteServerModalOpen, setIsDeleteServerModalOpen] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [qrCodeTable, setQrCodeTable] = useState<Table | null>(null);

    const baseUrl = window.location.href.split('#')[0];
    const shareUrl = `${baseUrl}#/join/${currentCafe?.id}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
    };

    const handleSaveCategory = async (newName: string, oldName?: string) => {
        if (oldName) {
            await updateCategory(oldName, newName);
        }
    };
    
    const handleOpenCategoryModal = (category: string | null = null) => {
        setEditingCategory(category);
        setIsCategoryModalOpen(true);
    };

    const handleConfirmLastTableDelete = async () => {
        await deleteLastTable();
        setIsDeleteLastTableModalOpen(false);
    };

    const handleConfirmServerDelete = async (pin: string): Promise<boolean> => {
        if (!currentCafe) return false;
        const success = await deleteCafe(currentCafe.id, pin);
        if (success) {
            setIsDeleteServerModalOpen(false);
        }
        return success;
    };

    const handleToggleHideServer = async () => {
        if (!currentCafe) return;
        await updateCafe({
            is_server_hidden: !currentCafe.is_server_hidden,
        });
    };

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Table Management */}
                <div className="glass-card p-6">
                    <h3 className="text-xl font-bold mb-4">Gerir Mesas</h3>
                    <div className="mb-4 space-y-2 max-h-60 overflow-y-auto p-2 border rounded-xl" style={{borderColor: 'var(--color-glass-border)'}}>
                        {tables.map(table => (
                            <div key={table.id} className="flex items-center justify-between bg-black/20 p-2 rounded-lg">
                                <span className={`font-medium ${table.is_hidden ? 'text-stone-400 line-through' : 'text-white'}`}>
                                    {table.name}
                                </span>
                                <div className="flex items-center gap-3">
                                     <button onClick={() => setQrCodeTable(table)} className="text-amber-300 hover:text-amber-200" title="Mostrar QR Code para Pedidos">
                                        <QrCode size={20}/>
                                    </button>
                                    <button
                                        role="switch"
                                        aria-checked={!table.is_hidden}
                                        onClick={() => updateTable({ id: table.id, is_hidden: !table.is_hidden })}
                                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-background)] ${!table.is_hidden ? 'bg-green-600' : 'bg-stone-600'}`}
                                        style={{'--tw-ring-color': 'var(--color-secondary)'} as React.CSSProperties}
                                        title={table.is_hidden ? 'Tornar visível' : 'Ocultar mesa'}
                                    >
                                        <span
                                            className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${!table.is_hidden ? 'translate-x-6' : 'translate-x-1'}`}
                                        />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-4">
                        <button onClick={addTable} className="w-full premium-gradient-button !bg-green-600 hover:!bg-green-700 py-2 px-4 flex items-center justify-center gap-2">
                            <PlusCircle size={20}/> Adicionar Mesa
                        </button>
                        <button 
                          onClick={() => setIsDeleteLastTableModalOpen(true)}
                          disabled={tables.filter(t => !t.is_hidden).length === 0}
                          className="w-full premium-gradient-button !bg-red-600 hover:!bg-red-700 py-2 px-4 flex items-center justify-center gap-2">
                            <Trash2 size={20}/> Ocultar Última Mesa
                        </button>
                    </div>
                </div>

                {/* Category Management */}
                <div className="glass-card p-6">
                    <h3 className="text-xl font-bold mb-4">Gerir Categorias</h3>
                    <div className="mb-4 space-y-2 max-h-60 overflow-y-auto p-2 border rounded-xl" style={{borderColor: 'var(--color-glass-border)'}}>
                        {categories.map(category => (
                            <div key={category} className="flex items-center justify-between bg-black/20 p-2 rounded-lg">
                                <span className="font-medium">{category}</span>
                                <div className="space-x-2">
                                    <button onClick={() => handleOpenCategoryModal(category)} className="text-indigo-400 hover:text-indigo-300" title="Renomear categoria">
                                        <Edit size={18}/>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="text-sm bg-blue-900/40 text-blue-200 p-3 rounded-lg flex items-start gap-3 border border-blue-400/30">
                        <Info size={18} className="flex-shrink-0 mt-0.5" />
                        <div>
                            As categorias são criadas e removidas automaticamente com base nos produtos que existem. Para adicionar uma nova categoria, crie um produto e atribua-lhe o novo nome. Para renomear, use o botão de editar.
                        </div>
                    </div>
                </div>
            </div>

            {/* Share Link Section */}
            <div className="glass-card p-6 mt-8">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><LinkIcon size={20} /> Partilhar Acesso ao Café</h3>
                <p className="text-sm mb-4" style={{color: 'var(--color-text-secondary)'}}>
                    Partilhe este link para permitir que outros funcionários ou dispositivos entrem diretamente neste café, sem precisar de o procurar na lista pública.
                </p>
                <div className="flex items-center gap-2 bg-black/20 p-2 rounded-xl border" style={{borderColor: 'var(--color-glass-border)'}}>
                    <input 
                        type="text" 
                        value={shareUrl} 
                        readOnly 
                        className="w-full bg-transparent p-2 text-sm font-mono" 
                        style={{color: 'var(--color-text-secondary)'}} 
                    />
                    <button 
                        onClick={handleCopyLink} 
                        className="secondary-button font-semibold py-2 px-3 flex-shrink-0 flex items-center gap-1.5 text-sm"
                    >
                        {copiedLink ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                        {copiedLink ? 'Copiado!' : 'Copiar'}
                    </button>
                </div>
            </div>

            <AppearanceCustomization />

            <AccountSecurity />

            {/* Danger Zone */}
            <div className="mt-12 pt-8 border-t-2 border-red-500/50">
                <h3 className="text-2xl font-bold text-red-300 font-display">Zona de Perigo</h3>
                <div className="bg-red-900/20 p-6 rounded-2xl mt-4 border border-red-500/30 space-y-6">
                    <div>
                        <h4 className="text-lg font-semibold">Visibilidade do Servidor</h4>
                        <p className="mt-1 mb-4" style={{color: 'var(--color-text-secondary)'}}>
                            Oculte este café da lista pública de servidores. Apenas dispositivos que já acederam como gerente ou através do QR code de partilha poderão encontrá-lo.
                        </p>
                        <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl border" style={{borderColor: 'var(--color-glass-border)'}}>
                            <label htmlFor="hide-server-toggle" className="font-medium pr-4 cursor-pointer">
                                Ocultar servidor da lista pública
                            </label>
                            <button
                                id="hide-server-toggle"
                                role="switch"
                                aria-checked={!!currentCafe?.is_server_hidden}
                                onClick={handleToggleHideServer}
                                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-background)] ${currentCafe?.is_server_hidden ? 'bg-red-600' : 'bg-stone-600'}`}
                                style={{'--tw-ring-color': 'var(--color-secondary)'} as React.CSSProperties}
                            >
                                <span
                                    className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${currentCafe?.is_server_hidden ? 'translate-x-6' : 'translate-x-1'}`}
                                />
                            </button>
                        </div>
                    </div>
                    <div className="pt-6 border-t" style={{borderColor: 'var(--color-glass-border)'}}>
                         <h4 className="text-lg font-semibold">Apagar este Servidor</h4>
                        <p className="mt-1 mb-4" style={{color: 'var(--color-text-secondary)'}}>
                            Esta ação é permanente e irá apagar todos os produtos, funcionários e dados de pedidos associados a este café. Esta ação não pode ser desfeita.
                        </p>
                        <button 
                            onClick={() => setIsDeleteServerModalOpen(true)}
                            className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-red-700 transition-colors"
                        >
                            <Trash2 /> Apagar Servidor Permanentemente
                        </button>
                    </div>
                </div>
            </div>
            
            {qrCodeTable && currentCafe && (
                <TableQRCodeModal 
                    table={qrCodeTable} 
                    cafe={currentCafe} 
                    theme={theme} 
                    onClose={() => setQrCodeTable(null)} 
                />
            )}

            {currentCafe && (
                <DeleteServerConfirmationModal
                    isOpen={isDeleteServerModalOpen}
                    cafe={currentCafe}
                    onClose={() => setIsDeleteServerModalOpen(false)}
                    onConfirm={handleConfirmServerDelete}
                />
            )}
            
            {isCategoryModalOpen && (
                <CategoryModal 
                    categoryName={editingCategory}
                    onClose={() => setIsCategoryModalOpen(false)}
                    onSave={handleSaveCategory}
                />
            )}
            
            <ConfirmationModal
                isOpen={isDeleteLastTableModalOpen}
                onClose={() => setIsDeleteLastTableModalOpen(false)}
                onConfirm={handleConfirmLastTableDelete}
                title="Ocultar Última Mesa"
                message={`Tem a certeza que quer ocultar a última mesa visível? A mesa com o número mais alto será ocultada. Poderá torná-la visível novamente nesta tela.`}
            />

        </div>
    );
});

const AnalyticsDashboard = memo(() => {
    const { orders, staff, theme } = useData();
    const [dateRange, setDateRange] = useState<'today' | 'thisWeek' | 'thisMonth' | 'allTime'>('thisWeek');
  
    const filteredOrders = useMemo(() => {
      const now = new Date();
      let startDate = new Date();
  
      switch (dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'thisWeek':
          const day = now.getDay();
          const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
          startDate = new Date(new Date(now).setDate(diff));
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'thisMonth':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'allTime':
          startDate = new Date(0);
          break;
      }
  
      return orders.filter(o => 
          o.created_at >= startDate && 
          o.status !== OrderStatus.CANCELLED
      );
    }, [orders, dateRange]);
  
    const keyMetrics = useMemo(() => {
      const paidOrders = filteredOrders.filter(o => o.status === OrderStatus.PAID || o.status === OrderStatus.SERVED);
      const revenue = paidOrders.reduce((total, order) => 
          total + order.items.reduce((orderTotal, item) => orderTotal + item.productPrice * item.quantity, 0), 0);
      const totalOrders = filteredOrders.length;
      const averageOrderValue = totalOrders > 0 ? revenue / totalOrders : 0;
  
      return {
        revenue,
        totalOrders,
        averageOrderValue
      };
    }, [filteredOrders]);
  
    const hourlySalesData = useMemo(() => {
      const salesByHour = Array(24).fill(0); // Indices 0-23 for hours 00:00-23:59
      
      filteredOrders.forEach(order => {
          const hour = order.created_at.getHours(); // 0-23
          const orderTotal = order.items.reduce((total, item) => total + (item.productPrice * item.quantity), 0);
          salesByHour[hour] += orderTotal;
      });

      const hoursData = salesByHour.map((revenue, i) => {
        const label = `${i + 1}h`; 
        return {
            hour: label,
            revenue: revenue,
        };
      });

      const maxRevenue = Math.max(...salesByHour, 1);
      return { hours: hoursData, maxRevenue };
    }, [filteredOrders]);
    
    const productPerformance = useMemo(() => {
        const stats: { [productId: string]: { name: string; quantity: number; revenue: number } } = {};
        
        filteredOrders.forEach(order => {
            order.items.forEach(item => {
                if (!stats[item.productId]) {
                    stats[item.productId] = { name: item.productName, quantity: 0, revenue: 0 };
                }
                stats[item.productId].quantity += item.quantity;
                stats[item.productId].revenue += item.productPrice * item.quantity;
            });
        });
  
        const allProducts = Object.values(stats);
        const bestSellers = [...allProducts].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
        const mostProfitable = [...allProducts].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
        
        return { bestSellers, mostProfitable };
    }, [filteredOrders]);
  
    const staffPerformance = useMemo(() => {
        const stats: { [staffId: string]: { name: string; orderCount: number; revenue: number } } = {};
  
        staff.forEach(s => {
            stats[s.id] = { name: s.name, orderCount: 0, revenue: 0 };
        });
        
        filteredOrders.forEach(order => {
            if (stats[order.staff_id]) {
                stats[order.staff_id].orderCount++;
                const orderRevenue = order.items.reduce((total, item) => total + item.productPrice * item.quantity, 0);
                stats[order.staff_id].revenue += orderRevenue;
            }
        });
  
        return Object.values(stats)
            .filter(s => s.orderCount > 0)
            .sort((a, b) => b.revenue - a.revenue);
    }, [filteredOrders, staff]);
  
    const dateRanges = [
      { id: 'today', label: 'Hoje' },
      { id: 'thisWeek', label: 'Esta Semana' },
      { id: 'thisMonth', label: 'Este Mês' },
      { id: 'allTime', label: 'Sempre' },
    ];
  
    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
                {dateRanges.map(range => (
                    <button 
                        key={range.id}
                        onClick={() => setDateRange(range.id as any)}
                        className={`font-semibold py-2 px-4 rounded-xl transition-colors text-sm ${
                            dateRange === range.id 
                            ? 'premium-gradient-button' 
                            : 'secondary-button'
                        }`}
                    >
                        {range.label}
                    </button>
                ))}
            </div>

            {filteredOrders.length === 0 ? (
                <div className="text-center py-16 glass-card">
                    <BarChartHorizontal size={48} className="mx-auto text-stone-400" />
                    <h3 className="mt-4 text-xl font-semibold">Nenhum dado disponível</h3>
                    <p className="mt-1" style={{color: 'var(--color-text-secondary)'}}>Não há pedidos para o período selecionado.</p>
                </div>
            ) : (
                <>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="glass-card p-6">
                            <h3 className="text-sm font-semibold uppercase flex items-center gap-2" style={{color: 'var(--color-text-secondary)'}}><DollarSign size={16}/>Receita Total</h3>
                            <p className="text-4xl font-bold font-display mt-2" style={{color: 'var(--color-secondary)'}}>€{keyMetrics.revenue.toFixed(2)}</p>
                        </div>
                        <div className="glass-card p-6">
                            <h3 className="text-sm font-semibold uppercase flex items-center gap-2" style={{color: 'var(--color-text-secondary)'}}><ShoppingCart size={16}/>Total de Pedidos</h3>
                            <p className="text-4xl font-bold font-display mt-2" style={{color: 'var(--color-secondary)'}}>{keyMetrics.totalOrders}</p>
                        </div>
                        <div className="glass-card p-6">
                            <h3 className="text-sm font-semibold uppercase flex items-center gap-2" style={{color: 'var(--color-text-secondary)'}}><Hash size={16}/>Média por Pedido</h3>
                            <p className="text-4xl font-bold font-display mt-2" style={{color: 'var(--color-secondary)'}}>€{keyMetrics.averageOrderValue.toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="glass-card p-6">
                        <h3 className="text-xl font-bold font-display mb-4">Vendas por Hora</h3>
                        <div className="flex items-end gap-2 sm:gap-3 h-64 border-b-2" style={{borderColor: 'var(--color-glass-border)'}}>
                            {hourlySalesData.hours.map((data) => (
                                <div key={data.hour} className="flex-1 flex flex-col items-center justify-end group">
                                    <div className="text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity mb-1">€{data.revenue.toFixed(0)}</div>
                                    <div 
                                        className="w-full rounded-t-lg transition-all duration-300" 
                                        style={{ 
                                            height: `${(data.revenue / hourlySalesData.maxRevenue) * 100}%`,
                                            minHeight: '4px',
                                            background: `linear-gradient(to top, ${theme.colors.secondary}, color-mix(in srgb, ${theme.colors.secondary} 50%, ${theme.colors.primary}))`
                                        }}
                                        title={`${data.hour}: €${data.revenue.toFixed(2)}`}
                                    />
                                    <div className="text-xs mt-2" style={{color: 'var(--color-text-secondary)'}}>{data.hour}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="glass-card p-6">
                            <h3 className="text-xl font-bold font-display mb-4 flex items-center gap-2"><TrendingUp size={20}/>Mais Vendidos (Quantidade)</h3>
                            <ul className="space-y-3">
                                {productPerformance.bestSellers.map((prod, index) => (
                                    <li key={prod.name} className="flex items-center justify-between text-sm gap-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="font-bold w-6 text-center">{index + 1}</span>
                                            <span className="font-semibold truncate">{prod.name}</span>
                                        </div>
                                        <span className="font-bold flex-shrink-0">{prod.quantity} un.</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                         <div className="glass-card p-6">
                            <h3 className="text-xl font-bold font-display mb-4 flex items-center gap-2"><DollarSign size={20}/>Mais Rentáveis (Receita)</h3>
                             <ul className="space-y-3">
                                {productPerformance.mostProfitable.map((prod, index) => (
                                     <li key={prod.name} className="flex items-center justify-between text-sm gap-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="font-bold w-6 text-center">{index + 1}</span>
                                            <span className="font-semibold truncate">{prod.name}</span>
                                        </div>
                                        <span className="font-bold flex-shrink-0">€{prod.revenue.toFixed(2)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="glass-card p-6">
                        <h3 className="text-xl font-bold font-display mb-4 flex items-center gap-2"><Users size={20}/>Desempenho dos Funcionários</h3>
                        <ul className="space-y-3">
                             {staffPerformance.map(s => (
                                <li key={s.name} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-black/20 rounded-lg">
                                    <span className="font-semibold text-base">{s.name}</span>
                                    <div className="flex items-center gap-4 text-sm w-full sm:w-auto justify-between">
                                        <span className="font-medium">Pedidos: <strong className="font-bold">{s.orderCount}</strong></span>
                                        <span className="font-medium">Receita Gerada: <strong className="font-bold">€{s.revenue.toFixed(2)}</strong></span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </>
            )}
        </div>
    );
});


const AdminDashboard: React.FC = () => {
    const { isAdmCafe } = useData();
    return isAdmCafe ? <PlatformAdminDashboard /> : <CafeAdminDashboard />;
};

// Fix: Add StaffModal component for creating/editing staff.
const StaffModal: React.FC<{
  staffMember: Staff | null;
  onClose: () => void;
  onSave: (staffMember: Omit<Staff, 'id' | 'cafe_id'> | Staff) => void;
}> = memo(({ staffMember, onClose, onSave }) => {
    const [name, setName] = useState(staffMember?.name || '');
    const [role, setRole] = useState<UserRole>(staffMember?.role || 'waiter');
    const [pin, setPin] = useState(staffMember?.pin || '');
    const [error, setError] = useState('');
    const { staff } = useData();

    useEffect(() => {
        document.body.classList.add('modal-open');
        return () => {
            document.body.classList.remove('modal-open');
        };
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!name.trim()) {
            return setError('O nome é obrigatório.');
        }
        if (!/^\d{6}$/.test(pin)) {
            return setError('O PIN deve ter exatamente 6 dígitos numéricos.');
        }
        if (staff.some(s => s.pin === pin && s.id !== staffMember?.id)) {
            return setError('Este PIN já está em uso.');
        }
        
        const staffData = { name, role, pin };
        if (staffMember) {
            onSave({ ...staffMember, ...staffData });
        } else {
            onSave(staffData);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card w-full max-w-md p-6">
                <h3 className="text-2xl font-bold font-display mb-4">{staffMember ? 'Editar Funcionário' : 'Novo Funcionário'}</h3>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="staff-name" className="block text-sm font-medium mb-2" style={{color: 'var(--color-text-secondary)'}}>Nome</label>
                            <input type="text" id="staff-name" value={name} onChange={e => setName(e.target.value)} className="w-full glass-input" autoFocus />
                        </div>
                            <div>
                            <label htmlFor="staff-role" className="block text-sm font-medium mb-2" style={{color: 'var(--color-text-secondary)'}}>Função</label>
                            <select id="staff-role" value={role} onChange={e => setRole(e.target.value as UserRole)} className="w-full glass-input">
                                <option value="waiter" style={{backgroundColor: '#332924'}}>Empregado de Mesa</option>
                                <option value="kitchen" style={{backgroundColor: '#332924'}}>Cozinha</option>
                                <option value="admin" style={{backgroundColor: '#332924'}}>Gerente</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="staff-pin" className="block text-sm font-medium mb-2" style={{color: 'var(--color-text-secondary)'}}>PIN (6 dígitos)</label>
                            <input type="password" id="staff-pin" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} maxLength={6} className="w-full glass-input" />
                        </div>
                    </div>
                        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                    <div className="mt-6 flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="secondary-button font-bold py-2 px-4">Cancelar</button>
                        <button type="submit" className="premium-gradient-button py-2 px-4">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
});

// Fix: Add StaffManagement component to render the staff management UI.
const StaffManagement = memo(() => {
    const { staff, addStaff, updateStaff, deleteStaff } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
    const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);

    const handleOpenModal = (staffMember: Staff | null = null) => {
        setEditingStaff(staffMember);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingStaff(null);
    };

    const handleSaveStaff = async (staffData: Omit<Staff, 'id' | 'cafe_id'> | Staff) => {
        if ('id' in staffData) {
            await updateStaff(staffData);
        } else {
            await addStaff(staffData);
        }
        handleCloseModal();
    };

    const handleDeleteStaff = async () => {
        if (staffToDelete) {
            await deleteStaff(staffToDelete.id);
            setStaffToDelete(null);
        }
    };

    return (
        <div>
            <div className="flex justify-end mb-6">
                <button
                    onClick={() => handleOpenModal()}
                    className="premium-gradient-button py-2 px-4 flex items-center gap-2"
                >
                    <PlusCircle size={20} /> Adicionar Funcionário
                </button>
            </div>
            <div className="scrollable-content overflow-x-auto">
                <table className="w-full min-w-[600px] text-left">
                    <thead>
                        <tr className="border-b" style={{borderColor: 'var(--color-glass-border)'}}>
                            <th className="p-3">Nome</th>
                            <th className="p-3">Função</th>
                            <th className="p-3">PIN</th>
                            <th className="p-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {staff.map(member => (
                            <tr key={member.id} className="border-b" style={{borderColor: 'var(--color-glass-border)'}}>
                                <td className="p-3 font-semibold">{member.name}</td>
                                <td className="p-3">{member.role}</td>
                                <td className="p-3 font-mono">******</td>
                                <td className="p-3">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => handleOpenModal(member)} className="p-2 rounded-md hover:bg-black/20" title="Editar"><Edit size={18}/></button>
                                        {member.role !== 'admin' && ( // Prevent admin deletion
                                            <button onClick={() => setStaffToDelete(member)} className="p-2 text-red-400 rounded-md hover:bg-red-900/40" title="Apagar"><Trash2 size={18}/></button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && (
                <StaffModal
                    staffMember={editingStaff}
                    onClose={handleCloseModal}
                    onSave={handleSaveStaff}
                />
            )}
            <ConfirmationModal
                isOpen={!!staffToDelete}
                onClose={() => setStaffToDelete(null)}
                onConfirm={handleDeleteStaff}
                title="Apagar Funcionário"
                message={`Tem a certeza que quer apagar "${staffToDelete?.name}"? Esta ação não pode ser desfeita.`}
            />
        </div>
    );
});

const CafeAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('products');

  const tabs = [
    { id: 'products', label: 'Produtos', icon: Package },
    { id: 'staff', label: 'Funcionários', icon: Users },
    { id: 'analytics', label: 'Análises', icon: BarChart2 },
    { id: 'settings', label: 'Definições', icon: SlidersHorizontal },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-4xl font-bold font-display text-center">Painel de Administração</h2>
      </div>
      
      <div className="glass-card !rounded-full p-2 mb-8 flex items-center justify-center gap-2 max-w-lg mx-auto flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-full font-semibold flex items-center gap-2 transition-colors text-sm sm:text-base ${
              activeTab === tab.id ? 'premium-gradient-button' : 'hover:bg-black/20'
            }`}
          >
            <tab.icon size={18} /> {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'products' && <ProductManagement />}
        {activeTab === 'staff' && <StaffManagement />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
        {activeTab === 'settings' && <SettingsManagement />}
      </div>
    </div>
  );
};

const PlatformAdminDashboard: React.FC = () => {
  const { availableCafes, platformDeleteCafe, platformUpdateCafeVisibility } = useData();
  const [filter, setFilter] = useState('');
  const [cafeToDelete, setCafeToDelete] = useState<Cafe | null>(null);
  const [previewCafe, setPreviewCafe] = useState<Cafe | null>(null);

  const handleDelete = async () => {
    if (!cafeToDelete) return;
    await platformDeleteCafe(cafeToDelete.id);
    setCafeToDelete(null);
  };
  
  const handleToggleVisibility = async (cafeId: string, isHidden: boolean) => {
    await platformUpdateCafeVisibility(cafeId, isHidden);
  };
  
  const filteredCafes = useMemo(() => {
    return availableCafes
        .filter(c => c.id !== "5ef90427-306f-465a-9691-bec38da14a49") // Exclude ADM cafe
        .filter(c => c.name.toLowerCase().includes(filter.toLowerCase()));
  }, [availableCafes, filter]);
  
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <h2 className="text-4xl font-bold font-display text-center mb-8">Gestão de Cafés da Plataforma</h2>
      <div className="glass-card p-6">
        <div className="mb-4 relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{color: 'var(--color-text-secondary)'}} />
          <input 
            type="text"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Pesquisar cafés..."
            className="w-full glass-input pl-12"
          />
        </div>
        <div className="scrollable-content overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b" style={{borderColor: 'var(--color-glass-border)'}}>
                <th className="p-3">Nome do Café</th>
                <th className="p-3">ID</th>
                <th className="p-3 text-center">Visibilidade</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredCafes.map(cafe => (
                <tr key={cafe.id} className="border-b" style={{borderColor: 'var(--color-glass-border)'}}>
                  <td className="p-3 font-semibold">{cafe.name}</td>
                  <td className="p-3 font-mono text-xs" style={{color: 'var(--color-text-secondary)'}}>{cafe.id}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => handleToggleVisibility(cafe.id, !cafe.is_server_hidden)} title={cafe.is_server_hidden ? 'Oculto (clique para mostrar)' : 'Visível (clique para ocultar)'}>
                        {cafe.is_server_hidden ? <EyeOff className="text-stone-400" /> : <Eye className="text-green-400" />}
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setPreviewCafe(cafe)} className="p-2 rounded-md hover:bg-black/20" title="Pré-visualizar"><MonitorPlay size={18} /></button>
                        <button onClick={() => setCafeToDelete(cafe)} className="p-2 text-red-400 rounded-md hover:bg-red-900/40" title="Apagar Café"><Trash2 size={18}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {cafeToDelete && (
        <PlatformDeleteCafeConfirmationModal
            isOpen={!!cafeToDelete}
            cafe={cafeToDelete}
            onClose={() => setCafeToDelete(null)}
            onConfirm={handleDelete}
        />
      )}
      {previewCafe && (
        <CafePreviewModal
            cafe={previewCafe}
            onClose={() => setPreviewCafe(null)}
        />
      )}
    </div>
  )
};

const ProductManagement = memo(() => {
    // Component content here...
    const { products, categories, addProduct, updateProduct, deleteProduct } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [filterCategory, setFilterCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);


    const handleOpenModal = (product: Product | null = null) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    const handleSaveProduct = async (productData: Omit<Product, 'id' | 'cafe_id'> | Product) => {
        if ('id' in productData) {
            await updateProduct(productData);
        } else {
            await addProduct(productData);
        }
        handleCloseModal();
    };
    
    const handleDeleteProduct = async () => {
        if(productToDelete){
            await deleteProduct(productToDelete.id);
            setProductToDelete(null);
        }
    };

    const filteredProducts = useMemo(() => {
        return products
            .filter(p => filterCategory === 'all' || p.category === filterCategory)
            .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [products, filterCategory, searchTerm]);

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex gap-2 w-full sm:w-auto">
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="glass-input !rounded-full"
                    >
                        <option value="all">Todas as Categorias</option>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                     <div className="relative flex-grow">
                        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{color: 'var(--color-text-secondary)'}}/>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Pesquisar produtos..."
                            className="w-full glass-input !rounded-full pl-12"
                        />
                    </div>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="w-full sm:w-auto premium-gradient-button py-2 px-4 flex items-center justify-center gap-2"
                >
                    <PlusCircle size={20} /> Adicionar Produto
                </button>
            </div>
            <div className="scrollable-content overflow-x-auto">
                <table className="w-full min-w-[600px] text-left">
                    <thead>
                        <tr className="border-b" style={{borderColor: 'var(--color-glass-border)'}}>
                            <th className="p-3">Nome</th>
                            <th className="p-3">Categoria</th>
                            <th className="p-3">Preço</th>
                            <th className="p-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map(product => (
                            <tr key={product.id} className="border-b" style={{borderColor: 'var(--color-glass-border)'}}>
                                <td className="p-3 font-semibold">{product.name}</td>
                                <td className="p-3">{product.category}</td>
                                <td className="p-3">€{product.price.toFixed(2)}</td>
                                <td className="p-3">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => handleOpenModal(product)} className="p-2 rounded-md hover:bg-black/20" title="Editar"><Edit size={18}/></button>
                                        <button onClick={() => setProductToDelete(product)} className="p-2 text-red-400 rounded-md hover:bg-red-900/40" title="Apagar"><Trash2 size={18}/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && (
                <ProductModal
                    product={editingProduct}
                    onClose={handleCloseModal}
                    onSave={handleSaveProduct}
                />
            )}
             <ConfirmationModal
                isOpen={!!productToDelete}
                onClose={() => setProductToDelete(null)}
                onConfirm={handleDeleteProduct}
                title="Apagar Produto"
                message={`Tem a certeza que quer apagar o produto "${productToDelete?.name}"? Esta ação não pode ser desfeita.`}
            />
        </div>
    );
});

const ProductModal: React.FC<{
  product: Product | null;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id' | 'cafe_id'> | Product) => void;
}> = memo(({ product, onClose, onSave }) => {
    const [name, setName] = useState(product?.name || '');
    const [price, setPrice] = useState(product?.price?.toString() || '');
    const [category, setCategory] = useState(product?.category || '');
    const [newCategory, setNewCategory] = useState('');
    const [error, setError] = useState('');
    const { categories } = useData();

    useEffect(() => {
        document.body.classList.add('modal-open');
        return () => {
            document.body.classList.remove('modal-open');
        };
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const finalCategory = category === '__new__' ? newCategory.trim() : category;

        if (!name.trim() || !finalCategory) {
            setError('Todos os campos são obrigatórios.');
            return;
        }
        const priceNumber = parseFloat(price.replace(',', '.'));
        if (isNaN(priceNumber) || priceNumber < 0) {
            setError('O preço inserido é inválido.');
            return;
        }

        const productData = { name: name.trim(), price: priceNumber, category: finalCategory };
        
        if (product) {
            onSave({ ...product, ...productData });
        } else {
            onSave(productData);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card w-full max-w-md p-6">
                <h3 className="text-2xl font-bold font-display mb-4">{product ? 'Editar Produto' : 'Novo Produto'}</h3>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="product-name" className="block text-sm font-medium mb-2" style={{color: 'var(--color-text-secondary)'}}>Nome</label>
                            <input type="text" id="product-name" value={name} onChange={e => setName(e.target.value)} className="w-full glass-input" autoFocus />
                        </div>
                        <div>
                            <label htmlFor="product-price" className="block text-sm font-medium mb-2" style={{color: 'var(--color-text-secondary)'}}>Preço (€)</label>
                            <input type="text" id="product-price" value={price} onChange={e => setPrice(e.target.value)} className="w-full glass-input" />
                        </div>
                        <div>
                             <label htmlFor="product-category" className="block text-sm font-medium mb-2" style={{color: 'var(--color-text-secondary)'}}>Categoria</label>
                            <select id="product-category" value={category} onChange={e => setCategory(e.target.value)} className="w-full glass-input">
                                <option value="" disabled style={{backgroundColor: '#332924'}}>Selecione uma categoria</option>
                                {categories.map(cat => <option key={cat} value={cat} style={{backgroundColor: '#332924'}}>{cat}</option>)}
                                <option value="__new__" style={{backgroundColor: '#332924'}}>-- Criar Nova Categoria --</option>
                            </select>
                        </div>
                        {category === '__new__' && (
                             <div>
                                <label htmlFor="new-category-name" className="block text-sm font-medium mb-2" style={{color: 'var(--color-text-secondary)'}}>Nome da Nova Categoria</label>
                                <input type="text" id="new-category-name" value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full glass-input" />
                            </div>
                        )}
                    </div>
                    {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                    <div className="mt-6 flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="secondary-button font-bold py-2 px-4">Cancelar</button>
                        <button type="submit" className="premium-gradient-button py-2 px-4">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
});
export default AdminDashboard;
