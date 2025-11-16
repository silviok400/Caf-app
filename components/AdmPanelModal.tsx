import React, { useState, useEffect, useCallback } from 'react';
import { useData } from '../contexts/DataContext';
import { CreationCode } from '../types';
import { X, PlusCircle, Copy, Check, Clock, Loader2, KeyRound, AlertTriangle } from 'lucide-react';

const Countdown: React.FC<{ createdAt: string }> = ({ createdAt }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const startTime = new Date(createdAt).getTime();
      const now = new Date().getTime();
      const difference = startTime + (15 * 60 * 1000) - now;

      if (difference <= 0) {
        setTimeLeft('Expirado');
        return;
      }

      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [createdAt]);

  return <span className={`font-mono ${timeLeft === 'Expirado' ? 'text-red-400' : 'text-stone-300'}`}>{timeLeft}</span>;
};


const AdmPanelModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { generateCreationCode, getActiveCreationCodes } = useData();
  const [activeCodes, setActiveCodes] = useState<CreationCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchCodes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getActiveCreationCodes();
    
    if (result.error) {
        setError(`Falha ao carregar códigos: ${result.error}. Verifique se as permissões (RLS) da tabela 'creation_codes' estão corretas.`);
        setActiveCodes([]);
    } else if (result.data) {
        const codes = result.data;
        const validCodes = codes.filter(code => {
            const ageInMinutes = (new Date().getTime() - new Date(code.created_at).getTime()) / (1000 * 60);
            return ageInMinutes < 15;
        });
        setActiveCodes(validCodes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    }
    setIsLoading(false);
  }, [getActiveCreationCodes]);

  useEffect(() => {
    fetchCodes();
    const interval = setInterval(fetchCodes, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [fetchCodes]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    const result = await generateCreationCode();
    if (result.error) {
        setError(`Falha ao gerar código: ${result.error}. Verifique se as permissões (RLS) da tabela 'creation_codes' estão corretas.`);
    } else {
        await fetchCodes();
    }
    setIsGenerating(false);
  };
  
  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-2xl h-[90vh] flex flex-col">
        <header className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-glass-border)' }}>
          <div className="flex items-center gap-3">
            <KeyRound size={28} className="icon-glow" style={{ color: 'var(--color-secondary)' }} />
            <h2 className="text-2xl font-bold font-display">Painel de Administrador</h2>
          </div>
          <button onClick={onClose} style={{ color: 'var(--color-text-secondary)' }} className="p-2 rounded-full hover:bg-black/20">
            <X size={24} />
          </button>
        </header>
        <div className="flex-grow flex flex-col overflow-hidden p-4">
          <div className="flex-shrink-0 mb-4">
            {error && (
                <div className="bg-red-900/50 text-red-300 p-3 rounded-xl text-sm mb-4 flex items-start gap-2">
                    <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                    <div>
                        <strong className="font-bold">Ocorreu um Erro</strong>
                        <p>{error}</p>
                    </div>
                </div>
            )}
            <p style={{ color: 'var(--color-text-secondary)' }} className="mb-2">Gere códigos de convite para permitir que novos cafés sejam criados. Cada código é válido por 15 minutos.</p>
            <button 
              onClick={handleGenerate} 
              disabled={isGenerating}
              className="w-full premium-gradient-button py-3 flex items-center justify-center gap-2 text-lg">
                {isGenerating ? <Loader2 className="animate-spin"/> : <PlusCircle />}
                {isGenerating ? 'A gerar...' : 'Gerar Novo Código de Convite'}
            </button>
          </div>
          
          <div className="flex-grow overflow-y-auto pr-2 -mr-2">
            {isLoading ? (
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="animate-spin text-amber-300" size={32} />
                </div>
            ) : activeCodes.length === 0 ? (
                <p className="text-center pt-16" style={{color: 'var(--color-text-secondary)'}}>Nenhum código de convite ativo.</p>
            ) : (
                <div className="space-y-3">
                    {activeCodes.map(code => (
                        <div key={code.code} className="bg-black/20 p-3 rounded-xl flex items-center justify-between gap-4">
                            <span className="font-mono text-lg tracking-wider" style={{ color: 'var(--color-text-primary)' }}>
                                {code.code.replace(/(.{5})/g, '$1 ').trim()}
                            </span>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5 text-sm">
                                    <Clock size={16} />
                                    <Countdown createdAt={code.created_at} />
                                </div>
                                <button
                                    onClick={() => handleCopy(code.code)}
                                    className="secondary-button font-semibold py-1.5 px-3 flex items-center gap-1.5 text-sm"
                                >
                                    {copiedCode === code.code ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                                    {copiedCode === code.code ? 'Copiado' : 'Copiar'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdmPanelModal;