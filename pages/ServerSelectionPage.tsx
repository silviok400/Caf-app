import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Coffee, PlusCircle, AlertTriangle, KeyRound, Search, ScanLine, Loader2, Shield, Ticket, Crown } from 'lucide-react';
import QRScannerModal from '../components/QRScannerModal';

const getAdminCafeIds = (): string[] => {
    const ids: string[] = [];
    const prefix = 'cafe-app-is-admin-device-';
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
            ids.push(key.substring(prefix.length));
        }
    }
    return ids;
};

const AdminAccessModal: React.FC<{
    onClose: () => void;
}> = ({ onClose }) => {
    const { loginAdminByNamePinAndCafe } = useData();
    const [cafeName, setCafeName] = useState('');
    const [managerName, setManagerName] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        const result = await loginAdminByNamePinAndCafe(cafeName, managerName, pin);
        setIsLoading(false);
        if (!result.success) {
            setError(result.message);
            setPin('');
        }
        // On success, the app will navigate away automatically.
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card w-full max-w-md p-8">
                <h3 className="text-3xl font-bold font-display text-center mb-2">Acesso Direto de Gerente</h3>
                <p style={{color: 'var(--color-text-secondary)'}} className="mb-6 text-center">Insira os dados para aceder diretamente ao seu painel.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        value={cafeName}
                        onChange={(e) => setCafeName(e.target.value)}
                        placeholder="Nome do Café"
                        className="w-full glass-input text-lg"
                        autoFocus
                    />
                    <input
                        type="text"
                        value={managerName}
                        onChange={(e) => setManagerName(e.target.value)}
                        placeholder="Nome do Gerente"
                        className="w-full glass-input text-lg"
                    />
                    <input
                        type="password"
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="PIN de 6 dígitos"
                        maxLength={6}
                        className="w-full glass-input text-lg text-center tracking-[.5em]"
                    />
                    {error && (
                        <p className="text-red-400 text-sm text-center flex items-center justify-center gap-2 pt-2">
                            <AlertTriangle size={16} /> {error}
                        </p>
                    )}
                    <div className="!mt-8 flex gap-4">
                         <button type="button" onClick={onClose} className="w-full secondary-button font-bold py-3">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={!cafeName.trim() || pin.length !== 6 || !managerName.trim() || isLoading}
                            className="w-full premium-gradient-button py-3 text-lg"
                        >
                            {isLoading ? <Loader2 className="animate-spin mx-auto" /> : 'Entrar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ADM_CAFE_ID = "5ef90427-306f-465a-9691-bec38da14a49";

const ServerSelectionPage: React.FC = () => {
  const { availableCafes, selectCafe, createCafe } = useData();
  const navigate = useNavigate();
  const [newCafeName, setNewCafeName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [entryCode, setEntryCode] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAdminAccessOpen, setIsAdminAccessOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const adminCafeIds = useMemo(() => getAdminCafeIds(), []);

  const handleSelectCafe = (cafeId: string) => {
    selectCafe(cafeId);
    navigate('/');
  };

  const handleCreateCafe = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmedName = newCafeName.trim();

    if (!trimmedName || !managerName.trim()) {
      return setError('O nome do café e do gerente são obrigatórios.');
    }
    if (!/^\d{6}$/.test(adminPin)) {
      return setError('O PIN do gerente deve ter exatamente 6 dígitos numéricos.');
    }
    if (entryCode.length !== 15) {
      return setError('O código de convite deve ter 15 caracteres.');
    }
    if (availableCafes.some(cafe => cafe.name.toLowerCase() === trimmedName.toLowerCase())) {
        return setError('Já existe um café com este nome. Por favor, escolha outro.');
    }
    
    setIsCreating(true);
    const result = await createCafe(trimmedName, adminPin, managerName.trim(), entryCode);
    setIsCreating(false);

    if (!result.success) {
      setError(result.message);
    }
    // On success, the App router will handle the redirect.
  };

  const handleScan = (url: string) => {
    setIsScannerOpen(false);
    setError('');
    try {
        const urlObject = new URL(url);
        const pathWithHash = urlObject.hash; // e.g., #/join/cafe-123 or #/menu/cafe-123/table-456

        const joinPrefix = '#/join/';
        const menuPrefix = '#/menu/';

        if (pathWithHash.startsWith(joinPrefix)) {
            const cafeId = pathWithHash.substring(joinPrefix.length);
            if (cafeId) {
                const cafeExists = availableCafes.some(c => c.id === cafeId);
                if (cafeExists) {
                    handleSelectCafe(cafeId);
                } else {
                    setError(`Café com o ID fornecido não foi encontrado.`);
                }
            } else {
                setError('Código QR de convite inválido. Não contém um ID de café.');
            }
        } else if (pathWithHash.startsWith(menuPrefix)) {
            // Redirect directly to the customer menu
            // The path will be handled by the App router
            navigate(pathWithHash.substring(1));
        }
        else {
            setError('Código QR inválido. Não parece ser um código de Café Control.');
        }
    } catch (e) {
        console.error("Invalid URL scanned:", e);
        setError('O código QR não contém um URL válido.');
    }
  };


  const filteredCafes = useMemo(() => {
    return availableCafes
      .filter(cafe => {
        const isAdminForThisCafe = adminCafeIds.includes(cafe.id);
        const isAdmCafeItself = cafe.id === ADM_CAFE_ID;
        return !cafe.is_server_hidden || isAdminForThisCafe || isAdmCafeItself;
      })
      .filter(cafe =>
        cafe.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [availableCafes, searchQuery, adminCafeIds]);


  return (
    <>
    {isAdminAccessOpen && <AdminAccessModal onClose={() => setIsAdminAccessOpen(false)} />}
    {isScannerOpen && <QRScannerModal onClose={() => setIsScannerOpen(false)} onScan={handleScan} />}
    {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-4 text-center">
            <Loader2 className="animate-spin text-amber-300" size={64} />
            <p className="text-2xl mt-6 font-semibold">
                A preparar o seu novo café...
            </p>
        </div>
    )}
    
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-6xl mx-auto">
            <div className="text-center mb-10">
                <Coffee className="h-20 w-20 text-amber-300 mx-auto icon-glow" />
                <h2 className="text-4xl md:text-5xl font-bold font-display mt-4 mb-2">Bem-vindo ao Café Control</h2>
                <p className="text-lg md:text-xl" style={{color: 'var(--color-text-secondary)'}}>A sua experiência de luxo começa aqui.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
              {/* Left Column: Join Cafe */}
              <div className="glass-card p-6 sm:p-8 flex flex-col space-y-4">
                <h3 className="text-2xl sm:text-3xl font-bold font-display text-center mb-4">Entrar num Café</h3>
                
                 <button
                    onClick={() => setIsAdminAccessOpen(true)}
                    className="w-full secondary-button font-bold py-3 text-lg flex items-center justify-center gap-3"
                >
                    <Shield size={22} />
                    Acesso Gerente
                </button>

                <button
                    onClick={() => setIsScannerOpen(true)}
                    className="w-full secondary-button font-bold py-3 text-lg flex items-center justify-center gap-3"
                >
                    <ScanLine size={22} />
                    Ler QR Code
                </button>
                
                <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t" style={{borderColor: 'var(--color-glass-border)'}}></div>
                    <span className="flex-shrink mx-4 text-sm" style={{color: 'var(--color-text-secondary)'}}>ou selecione da lista</span>
                    <div className="flex-grow border-t" style={{borderColor: 'var(--color-glass-border)'}}></div>
                </div>

                {availableCafes.length > 0 && (
                <div className="relative">
                    <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{color: 'var(--color-text-secondary)'}} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Pesquisar café..."
                        className="w-full glass-input pl-12"
                    />
                </div>
                )}

                {availableCafes.length > 0 ? (
                filteredCafes.length > 0 ? (
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 -mr-2">
                    {filteredCafes.map(cafe => {
                        const isAdminCafe = cafe.id === ADM_CAFE_ID;
                        const isPrivateButVisible = cafe.is_server_hidden && adminCafeIds.includes(cafe.id);
                        return (
                            <button
                                key={cafe.id}
                                onClick={() => handleSelectCafe(cafe.id)}
                                className={`w-full glass-card glass-card-highlight !rounded-2xl font-bold py-3 text-lg flex items-center justify-center gap-3 relative ${isAdminCafe ? 'shadow-lg shadow-amber-400/30 !border-amber-400/50' : ''}`}
                                title={isPrivateButVisible && !isAdminCafe ? "Este café está oculto mas é visível porque acedeu como gerente." : isAdminCafe ? "Acesso à Plataforma de Administração" : ""}
                            >
                                {isAdminCafe ? <Crown size={22} className="text-amber-300 icon-glow"/> : <Coffee size={22} />}
                                <span>{cafe.name}</span>
                                {isPrivateButVisible && !isAdminCafe && (
                                    <Shield size={18} className="text-amber-300 opacity-80 absolute top-2 right-3" />
                                )}
                            </button>
                        );
                    })}
                    </div>
                ) : (
                    <p className="text-center py-4" style={{color: 'var(--color-text-secondary)'}}>Nenhum café encontrado.</p>
                )
                ) : (
                <p className="text-center py-4" style={{color: 'var(--color-text-secondary)'}}>Nenhum café público encontrado.</p>
                )}
              </div>

              {/* Right Column: Create Cafe */}
              <div className="glass-card p-6 sm:p-8 flex flex-col space-y-4">
                 <h3 className="text-2xl sm:text-3xl font-bold font-display text-center mb-4">Criar um Novo Café</h3>
                 <form onSubmit={handleCreateCafe} className="space-y-4">
                    <input
                        type="text"
                        value={newCafeName}
                        onChange={(e) => { setNewCafeName(e.target.value); setError(''); }}
                        placeholder="Nome do seu Café"
                        className="w-full glass-input text-lg"
                    />
                    <input
                        type="text"
                        value={managerName}
                        onChange={(e) => { setManagerName(e.target.value); setError(''); }}
                        placeholder="Seu Nome (Gerente)"
                        className="w-full glass-input text-lg"
                    />
                    <div className="relative">
                        <KeyRound size={20} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{color: 'var(--color-text-secondary)'}}/>
                        <input
                            type="password"
                            value={adminPin}
                            onChange={(e) => { setAdminPin(e.target.value.replace(/\D/g, '')); setError(''); }}
                            placeholder="PIN do Gerente (6 dígitos)"
                            maxLength={6}
                            className="w-full glass-input pl-12 text-center text-lg"
                        />
                    </div>
                     <div className="relative">
                        <Ticket size={20} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{color: 'var(--color-text-secondary)'}}/>
                        <input
                            type="text"
                            value={entryCode}
                            onChange={(e) => { setEntryCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()); setError(''); }}
                            placeholder="Código de Convite (15 caracteres)"
                            maxLength={15}
                            className="w-full glass-input pl-12 text-center text-lg"
                        />
                    </div>
                    {error && (
                        <p className="text-red-400 text-sm text-center flex items-center justify-center gap-2">
                            <AlertTriangle size={16} /> {error}
                        </p>
                    )}
                    <button
                        type="submit"
                        disabled={isCreating}
                        className="!mt-8 w-full premium-gradient-button py-3 text-lg flex items-center justify-center gap-3"
                    >
                        <PlusCircle size={22} />
                        Criar Servidor
                    </button>
                 </form>
              </div>
            </div>
        </div>
    </div>
    </>
  );
};

export default ServerSelectionPage;