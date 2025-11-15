import React, { useState, useMemo, useEffect, useRef, memo } from 'react';
import { useData, defaultTheme } from '../contexts/DataContext';
import { Product, Order, OrderStatus, Staff, UserRole, Cafe, ThemeSettings, Table } from '../types';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Edit, Trash2, Download, Users, Package, BarChart2, Ban, ShieldAlert, SlidersHorizontal, Search, Hash, AlertTriangle, Paintbrush, Undo, Type, Image as ImageIcon, KeyRound, Phone, Shield, TrendingUp, DollarSign, ShoppingCart, BarChartHorizontal, QrCode, Info, Link as LinkIcon, Palette, Droplet } from 'lucide-react';

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
  const [error, setError] = useState('');

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

  const handleConfirm = async () => {
    setError('');
    const success = await onConfirm(pin);
    if (!success) {
      setError('PIN do gerente incorreto. A exclusão falhou.');
      setPin('');
    }
  };

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
          Esta ação é irreversível e apagará todos os dados de <strong>"{cafe.name}"</strong>.
        </p>
        <p style={{color: 'var(--color-text-secondary)'}} className="mb-6">Para confirmar, insira o PIN de 6 dígitos do gerente.</p>
        
        <div className="mb-4">
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            maxLength={6}
            className="w-full glass-input text-center text-lg tracking-[.5em]"
            placeholder="******"
            autoFocus
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
          <button onClick={handleConfirm} disabled={pin.length !== 6} className="w-full bg-red-600 text-white font-bold py-3 rounded-2xl hover:bg-red-700 transition-colors disabled:bg-stone-400">
            Confirmar Exclusão
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

const AppearanceCustomization = memo(() => {
    const { theme, updateTheme, currentCafe, updateCafe } = useData();
    const [localTheme, setLocalTheme] = useState<ThemeSettings>(theme);
    const [appName, setAppName] = useState(currentCafe?.name || '');
    const [logoError, setLogoError] = useState('');
    const [bgError, setBgError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

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
    
    const ColorInput: React.FC<{ label: string, path: string }> = ({ label, path }) => (
        <div>
            <label className="block text-sm font-bold mb-1" style={{color: 'var(--color-text-secondary)'}}>{label}</label>
            <div className="flex items-center gap-3">
                <input type="color" value={path.split('.').reduce((o, i) => o[i], localTheme as any)} onChange={e => handleValueChange(path, e.target.value)} className="p-0 h-10 w-10 block bg-transparent border rounded-md cursor-pointer" style={{borderColor: 'var(--color-glass-border)'}} />
                <input type="text" value={path.split('.').reduce((o, i) => o[i], localTheme as any)} onChange={e => handleValueChange(path, e.target.value)} className="w-full glass-input !py-2 !px-3 font-mono text-sm" />
            </div>
        </div>
    );
    
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
                        <ColorInput label="Fundo do Cartão" path="colors.glassBackground" />
                        <ColorInput label="Borda do Cartão" path="colors.glassBorder" />
                        <ColorInput label="Borda do Cartão (Hover)" path="colors.glassBorderHighlight" />
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
        </div>
    );
});


const SettingsManagement = memo(() => {
    const { tables, categories, addTable, deleteLastTable, updateCategory, currentCafe, deleteCafe, theme, updateCafe, updateTable } = useData();
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [isDeleteLastTableModalOpen, setIsDeleteLastTableModalOpen] = useState(false);
    const [isDeleteServerModalOpen, setIsDeleteServerModalOpen] = useState(false);


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
                            <h3 className="text-sm font-semibold uppercase flex items-center gap-2" style={{color: 'var(--color-text-secondary)'}}><Hash size={16}/>Valor Médio/Pedido</h3>
                            <p className="text-4xl font-bold font-display mt-2" style={{color: 'var(--color-secondary)'}}>€{keyMetrics.averageOrderValue.toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="glass-card p-3 sm:p-6">
                        <h3 className="text-xl font-bold mb-4">Estatísticas de Vendas por Hora</h3>
                        <div className="w-full pb-2 overflow-x-hidden">
                            <div className="h-48 flex items-end gap-px sm:gap-1">
                                {hourlySalesData.hours.map((h, index) => (
                                    <div key={h.hour} className="flex-1 min-w-0 flex flex-col items-center justify-end h-full group">
                                        <div className="text-sm font-bold text-white bg-stone-800 px-2 py-1 rounded-md mb-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            €{h.revenue.toFixed(2)}
                                        </div>
                                        <div 
                                            className="w-full bg-stone-200 rounded-t-md hover:opacity-80 transition-opacity"
                                            style={{ 
                                                height: `${(h.revenue / hourlySalesData.maxRevenue) * 100}%`,
                                                backgroundColor: theme.colors.secondary
                                            }}
                                        ></div>
                                        <div className={`text-xs mt-1 whitespace-nowrap ${index % 3 !== 0 ? 'hidden md:block' : 'block'}`} style={{color: 'var(--color-text-secondary)'}}>
                                            {h.hour}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="glass-card p-6">
                            <h3 className="text-xl font-bold mb-4">Top 5 - Mais Vendidos (Quantidade)</h3>
                            <ul className="space-y-3">
                                {productPerformance.bestSellers.map(p => (
                                    <li key={p.name} className="flex justify-between items-center text-sm gap-2">
                                        <span className="font-medium break-words min-w-0">{p.name}</span>
                                        <span className="font-bold text-white px-2 py-0.5 rounded-full text-xs whitespace-nowrap" style={{backgroundColor: 'var(--color-primary)'}}>{p.quantity}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="glass-card p-6">
                             <h3 className="text-xl font-bold mb-4">Top 5 - Mais Rentáveis (Receita)</h3>
                             <ul className="space-y-3">
                                {productPerformance.mostProfitable.map(p => (
                                    <li key={p.name} className="flex justify-between items-center text-sm gap-2">
                                        <span className="font-medium break-words min-w-0">{p.name}</span>
                                        <span className="font-bold text-white px-2 py-0.5 rounded-md whitespace-nowrap" style={{backgroundColor: 'var(--color-secondary)'}}>€{p.revenue.toFixed(2)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="glass-card overflow-hidden">
                        <h3 className="text-xl font-bold p-6">Desempenho dos Funcionários</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-black/20">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{color: 'var(--color-text-secondary)'}}>Funcionário</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{color: 'var(--color-text-secondary)'}}>Pedidos Processados</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{color: 'var(--color-text-secondary)'}}>Receita Gerada</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y" style={{borderColor: 'var(--color-glass-border)'}}>
                                    {staffPerformance.map(s => (
                                        <tr key={s.name}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{s.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm" style={{color: 'var(--color-text-secondary)'}}>{s.orderCount}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">€{s.revenue.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
});

const ProductManagement = memo(() => {
    const { products, addProduct, updateProduct, deleteProduct } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteError, setDeleteError] = useState('');

    const handleOpenModal = (product: Product | null = null) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    const handleSave = async (productData: Omit<Product, 'id'> & { id?: string }) => {
        if (productData.id) {
            await updateProduct(productData as Product);
        } else {
            await addProduct(productData);
        }
        handleCloseModal();
    };
    
    const handleConfirmDelete = async () => {
        if (productToDelete) {
            try {
                await deleteProduct(productToDelete.id);
                setProductToDelete(null);
                setDeleteError('');
            } catch (err) {
                console.error("Failed to delete product:", err);
                setDeleteError(`Não foi possível apagar o produto. (${(err as Error).message})`);
                setProductToDelete(null);
            }
        }
    };

    const filteredProducts = products
      .filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div>
            {deleteError && (
                <div className="bg-red-900/50 border-l-4 border-red-500 text-red-300 p-4 mb-4" role="alert">
                    <p className="font-bold">Erro de Exclusão</p>
                    <p>{deleteError}</p>
                </div>
            )}
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <div className="relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Pesquisar produtos..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full max-w-sm glass-input !py-2 pl-10 pr-4 text-sm"
                    />
                </div>
                <button onClick={() => handleOpenModal()} className="premium-gradient-button !bg-green-600 hover:!bg-green-700 py-2 px-4 flex items-center gap-2">
                    <PlusCircle size={20}/> Adicionar Produto
                </button>
            </div>
            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-black/20">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{color: 'var(--color-text-secondary)'}}>Nome</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{color: 'var(--color-text-secondary)'}}>Categoria</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{color: 'var(--color-text-secondary)'}}>Preço</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{borderColor: 'var(--color-glass-border)'}}>
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map(product => (
                                    <tr key={product.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{product.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm" style={{color: 'var(--color-text-secondary)'}}>{product.category}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm" style={{color: 'var(--color-text-secondary)'}}>€{product.price.toFixed(2)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                            <button onClick={() => handleOpenModal(product)} className="text-indigo-400 hover:text-indigo-300"><Edit size={20}/></button>
                                            <button onClick={() => setProductToDelete(product)} className="text-red-400 hover:text-red-300"><Trash2 size={20}/></button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center" style={{color: 'var(--color-text-secondary)'}}>
                                        Nenhum produto encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {isModalOpen && <ProductModal product={editingProduct} onSave={handleSave} onClose={handleCloseModal} />}
            <ConfirmationModal
                isOpen={!!productToDelete}
                onClose={() => setProductToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Apagar Produto"
                message={`Tem a certeza que quer apagar o produto "${productToDelete?.name}"? Esta ação não pode ser desfeita.`}
            />
        </div>
    );
});

const ProductModal: React.FC<{product: Product | null, onSave: (data: any) => Promise<void>, onClose: () => void}> = memo(({product, onSave, onClose}) => {
    const { categories } = useData();
    const [name, setName] = useState(product?.name || '');
    const [category, setCategory] = useState(product?.category || '');
    const [price, setPrice] = useState(product?.price || 0);
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        document.body.classList.add('modal-open');
        return () => {
            document.body.classList.remove('modal-open');
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!name || !category || price <= 0) {
            setError('Todos os campos são obrigatórios e o preço deve ser positivo.');
            return;
        }
        setIsSaving(true);
        try {
            await onSave({ id: product?.id, name, category, price: Number(price) });
        } catch (err) {
            setError(`Falha ao guardar: ${(err as Error).message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card w-full max-w-md p-6">
                <h3 className="text-2xl font-bold font-display mb-4">{product ? 'Editar Produto' : 'Novo Produto'}</h3>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium mb-1" style={{color: 'var(--color-text-secondary)'}}>Nome do Produto</label>
                            <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className="w-full glass-input"/>
                        </div>
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium mb-1" style={{color: 'var(--color-text-secondary)'}}>Categoria</label>
                            <input 
                                list="category-options"
                                id="category" 
                                value={category} 
                                onChange={e => setCategory(e.target.value)} 
                                className="w-full glass-input"
                            />
                            <datalist id="category-options">
                                {categories.map(cat => (
                                    <option key={cat} value={cat} />
                                ))}
                            </datalist>
                        </div>
                        <div>
                            <label htmlFor="price" className="block text-sm font-medium mb-1" style={{color: 'var(--color-text-secondary)'}}>Preço (€)</label>
                            <input type="number" id="price" value={price} onChange={e => setPrice(parseFloat(e.target.value))} step="0.01" min="0" className="w-full glass-input"/>
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

const StaffModal: React.FC<{staffMember: Staff | null, onSave: (data: any) => Promise<void>, onClose: () => void}> = memo(({staffMember, onSave, onClose}) => {
    const [name, setName] = useState(staffMember?.name || '');
    const [pin, setPin] = useState(staffMember?.pin || '');
    const [role, setRole] = useState<UserRole>(staffMember?.role || 'waiter');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

     useEffect(() => {
        document.body.classList.add('modal-open');
        return () => {
            document.body.classList.remove('modal-open');
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!name || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
            setError('Nome é obrigatório e o PIN deve ter 6 dígitos numéricos.');
            return;
        }
        setIsSaving(true);
        try {
            await onSave({ id: staffMember?.id, name, pin, role });
        } catch (err) {
            setError(`Falha ao guardar: ${(err as Error).message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card w-full max-w-md p-6">
                <h3 className="text-2xl font-bold font-display mb-4">{staffMember ? 'Editar Funcionário' : 'Novo Funcionário'}</h3>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="staff-name" className="block text-sm font-medium mb-1" style={{color: 'var(--color-text-secondary)'}}>Nome</label>
                            <input type="text" id="staff-name" value={name} onChange={e => setName(e.target.value)} className="w-full glass-input"/>
                        </div>
                         <div>
                            <label htmlFor="staff-pin" className="block text-sm font-medium mb-1" style={{color: 'var(--color-text-secondary)'}}>PIN (6 dígitos)</label>
                            <input type="text" id="staff-pin" value={pin} onChange={e => setPin(e.target.value)} maxLength={6} className="w-full glass-input"/>
                        </div>
                        <div>
                            <label htmlFor="staff-role" className="block text-sm font-medium mb-1" style={{color: 'var(--color-text-secondary)'}}>Função</label>
                            <select id="staff-role" value={role} onChange={e => setRole(e.target.value as UserRole)} className="w-full glass-input" disabled={staffMember?.role === 'admin'}>
                                <option value="waiter" style={{backgroundColor: '#332924', color: 'white'}}>Funcionário</option>
                                <option value="kitchen" style={{backgroundColor: '#332924', color: 'white'}}>Cozinha</option>
                            </select>
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

const StaffManagement = memo(() => {
    const { staff, addStaff, updateStaff, deleteStaff } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
    const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);
    const [deleteError, setDeleteError] = useState('');

    const handleOpenModal = (staffMember: Staff | null = null) => {
        setEditingStaff(staffMember);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingStaff(null);
    };

    const handleSave = async (staffData: Omit<Staff, 'id'> & { id?: string }) => {
        if (staffData.id) {
            await updateStaff(staffData as Staff);
        } else {
            await addStaff(staffData);
        }
        handleCloseModal();
    };
    
    const handleConfirmDelete = async () => {
        if (staffToDelete) {
             try {
                await deleteStaff(staffToDelete.id);
                setStaffToDelete(null);
                setDeleteError('');
            } catch (err) {
                console.error("Failed to delete staff:", err);
                setDeleteError(`Não foi possível apagar o funcionário. (${(err as Error).message})`);
                setStaffToDelete(null);
            }
        }
    }

    const roleNames: Record<UserRole, string> = {
        waiter: 'Funcionário',
        kitchen: 'Cozinha',
        admin: 'Gerente'
    };

    return (
         <div>
            {deleteError && (
                <div className="bg-red-900/50 border-l-4 border-red-500 text-red-300 p-4 mb-4" role="alert">
                    <p className="font-bold">Erro de Exclusão</p>
                    <p>{deleteError}</p>
                </div>
            )}
            <div className="flex justify-end mb-4">
                <button onClick={() => handleOpenModal()} className="premium-gradient-button !bg-green-600 hover:!bg-green-700 py-2 px-4 flex items-center gap-2">
                    <PlusCircle size={20}/> Adicionar Funcionário
                </button>
            </div>
            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-black/20">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{color: 'var(--color-text-secondary)'}}>Nome</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{color: 'var(--color-text-secondary)'}}>Função</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{color: 'var(--color-text-secondary)'}}>PIN</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{borderColor: 'var(--color-glass-border)'}}>
                            {staff.sort((a,b) => a.name.localeCompare(b.name)).map(s => (
                                <tr key={s.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{s.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{color: 'var(--color-text-secondary)'}}>{roleNames[s.role]}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono" style={{color: 'var(--color-text-secondary)'}}>{s.pin}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                        {s.role !== 'admin' && (
                                            <>
                                                <button onClick={() => handleOpenModal(s)} className="text-indigo-400 hover:text-indigo-300"><Edit size={20}/></button>
                                                <button onClick={() => setStaffToDelete(s)} className="text-red-400 hover:text-red-300"><Trash2 size={20}/></button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {isModalOpen && <StaffModal staffMember={editingStaff} onSave={handleSave} onClose={handleCloseModal} />}
            <ConfirmationModal
                isOpen={!!staffToDelete}
                onClose={() => setStaffToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Apagar Funcionário"
                message={`Tem a certeza que quer apagar o funcionário "${staffToDelete?.name}"? Esta ação não pode ser desfeita.`}
            />
        </div>
    );
});

const Reports = memo(() => {
    const { orders, staff, updateOrderStatus, theme, tables } = useData();
    const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
    const [staffSearch, setStaffSearch] = useState('');
    const [orderIdSearch, setOrderIdSearch] = useState('');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysOrders = useMemo(() => {
        const lowercasedStaffSearch = staffSearch.toLowerCase().trim();
        const trimmedOrderIdSearch = orderIdSearch.trim();
        
        return orders
            .filter(o => {
                const isToday = o.created_at >= today;
                const isNotCancelled = o.status !== OrderStatus.CANCELLED;
                
                if (!isToday || !isNotCancelled) {
                    return false;
                }

                if (trimmedOrderIdSearch && !o.id.includes(trimmedOrderIdSearch)) {
                    return false;
                }
                
                if (lowercasedStaffSearch) {
                    const staffMember = staff.find(s => s.id === o.staff_id);
                    const staffName = staffMember ? staffMember.name.toLowerCase() : '';
                    if (!staffName.includes(lowercasedStaffSearch)) {
                        return false;
                    }
                }

                return true;
            })
            .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    }, [orders, today, staffSearch, orderIdSearch, staff]);

    const totalRevenue = useMemo(() => {
        return todaysOrders
            .filter(o => o.status === OrderStatus.PAID || o.status === OrderStatus.SERVED)
            .reduce((total, order) => {
            return total + order.items.reduce((orderTotal, item) => orderTotal + (item.productPrice * item.quantity), 0);
        }, 0);
    }, [todaysOrders]);

    const exportToCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "OrderID,TableID,TableName,StaffID,StaffName,Status,Total,DateTime\n";

        todaysOrders.forEach(order => {
            const staffName = staff.find(s => s.id === order.staff_id)?.name || 'N/A';
            const tableName = tables.find(t => t.id === order.table_id)?.name || 'N/A';
            const orderTotal = order.items.reduce((total, item) => total + item.productPrice * item.quantity, 0);
            const row = [order.id, order.table_id, `"${tableName}"`, order.staff_id, `"${staffName}"`, order.status, orderTotal.toFixed(2), order.created_at.toISOString()].join(",");
            csvContent += row + "\r\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `relatorio_cafe_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleConfirmCancel = async () => {
        if (orderToCancel) {
            await updateOrderStatus(orderToCancel.id, OrderStatus.CANCELLED);
            setOrderToCancel(null);
        }
    };
    
    const getStatusInfo = (status: OrderStatus) => {
      const statusKey = (Object.keys(OrderStatus) as Array<keyof typeof OrderStatus>).find(key => OrderStatus[key] === status)?.toLowerCase() || 'cancelled';
      const color = theme.statusColors[statusKey as keyof typeof theme.statusColors] || theme.statusColors.cancelled;
      return {
          text: status,
          bgColor: `color-mix(in srgb, ${color} 30%, transparent)`,
          textColor: `color-mix(in srgb, ${color} 80%, white)`
      };
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div className="glass-card p-4 text-center">
                    <h3 className="text-sm font-semibold uppercase" style={{color: 'var(--color-text-secondary)'}}>Receita Total de Hoje</h3>
                    <p className="text-3xl font-bold font-display" style={{color: 'var(--color-secondary)'}}>€{totalRevenue.toFixed(2)}</p>
                </div>
                <button onClick={exportToCSV} className="premium-gradient-button !bg-blue-600 hover:!bg-blue-700 py-2 px-4 flex items-center gap-2">
                    <Download size={20}/> Exportar CSV
                </button>
            </div>
            
            <div className="mb-4 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-grow">
                    <Users size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                    <input type="text" value={staffSearch} onChange={e => setStaffSearch(e.target.value)} placeholder="Filtrar por funcionário..." className="w-full glass-input !py-2 pl-10 pr-4 text-sm"/>
                </div>
                <div className="relative flex-grow">
                    <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                    <input type="text" value={orderIdSearch} onChange={e => setOrderIdSearch(e.target.value)} placeholder="Filtrar por ID do pedido..." className="w-full glass-input !py-2 pl-10 pr-4 text-sm"/>
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-black/20">
                             <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{color: 'var(--color-text-secondary)'}}>ID</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{color: 'var(--color-text-secondary)'}}>Mesa</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{color: 'var(--color-text-secondary)'}}>Funcionário</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{color: 'var(--color-text-secondary)'}}>Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{color: 'var(--color-text-secondary)'}}>Total</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{color: 'var(--color-text-secondary)'}}>Hora</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{borderColor: 'var(--color-glass-border)'}}>
                            {todaysOrders.map(order => {
                                const orderTotal = order.items.reduce((total, item) => total + item.productPrice * item.quantity, 0);
                                const tableName = tables.find(t => t.id === order.table_id)?.name || 'Desconhecida';
                                const statusInfo = getStatusInfo(order.status);
                                return (
                                    <tr key={order.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-stone-400">{order.id.slice(-6)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{tableName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm" style={{color: 'var(--color-text-secondary)'}}>{staff.find(s => s.id === order.staff_id)?.name || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span 
                                                className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                                                style={{ backgroundColor: statusInfo.bgColor, color: statusInfo.textColor }}
                                            >
                                                {statusInfo.text}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm" style={{color: 'var(--color-text-secondary)'}}>€{orderTotal.toFixed(2)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm" style={{color: 'var(--color-text-secondary)'}}>{order.created_at.toLocaleTimeString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                             {order.status !== OrderStatus.PAID && order.status !== OrderStatus.CANCELLED && (
                                                <button onClick={() => setOrderToCancel(order)} className="text-red-400 hover:text-red-300 flex items-center gap-1"><Ban size={14}/> Cancelar</button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            <ConfirmationModal
                isOpen={!!orderToCancel}
                onClose={() => setOrderToCancel(null)}
                onConfirm={handleConfirmCancel}
                title="Cancelar Pedido"
                message={`Tem a certeza que quer cancelar o pedido ${orderToCancel?.id.slice(-6)}? O valor não será contabilizado.`}
            />
        </div>
    );
});

const AdminDashboard: React.FC = () => {
    const { theme } = useData();
    const [activeTab, setActiveTab] = useState('analytics');

    const tabs = [
        { id: 'analytics', label: 'Estatísticas', icon: TrendingUp, component: <AnalyticsDashboard /> },
        { id: 'reports', label: 'Relatórios', icon: BarChart2, component: <Reports /> },
        { id: 'products', label: 'Produtos', icon: Package, component: <ProductManagement /> },
        { id: 'staff', label: 'Funcionários', icon: Users, component: <StaffManagement /> },
        { id: 'settings', label: 'Definições', icon: SlidersHorizontal, component: <SettingsManagement /> }
    ];

    const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

    return (
        <div className="p-4 sm:p-6 md:p-8 min-h-[calc(100vh-7rem)]">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
            <aside className="lg:w-64 flex-shrink-0">
                <nav className="sticky top-28">
                    <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 font-semibold transition-colors whitespace-nowrap !rounded-2xl ${
                                    activeTab === tab.id
                                        ? 'premium-gradient-button'
                                        : 'secondary-button'
                                }`}
                            >
                                <tab.icon size={20} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </nav>
            </aside>
            <div className="flex-grow min-w-0">
                {ActiveComponent}
            </div>
          </div>
        </div>
    );
};

export default AdminDashboard;