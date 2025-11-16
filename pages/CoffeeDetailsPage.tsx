import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Coffee, Loader2, AlertTriangle, ArrowLeft, Download, Share2 } from 'lucide-react';
import { Coffee as CoffeeType } from '../types';

const LoadingDisplay: React.FC<{ message: string }> = ({ message }) => {
    return (
         <div className="flex flex-col items-center justify-center min-h-screen">
            <Loader2 className="animate-spin text-amber-300" size={48} />
            <p className="mt-4" style={{color: 'var(--color-text-secondary)'}}>{message}</p>
        </div>
    );
};

const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
            <div className="glass-card p-8 max-w-lg">
                <AlertTriangle className="text-red-400 mx-auto" size={64} />
                <h2 className="text-3xl font-bold font-display mt-6 mb-2">Ocorreu um Erro</h2>
                <p style={{color: 'var(--color-text-secondary)'}}>{message}</p>
                <Link 
                    to="/select-server"
                    className="mt-8 premium-gradient-button font-bold py-3 px-6 rounded-lg w-full inline-block"
                >
                    Voltar ao Início
                </Link>
            </div>
        </div>
    );
};

const CoffeeDetailsPage: React.FC = () => {
    const { cafeId, coffeeId } = useParams<{ cafeId: string, coffeeId: string }>();
    const { selectCafe, currentCafe, coffees, isAppLoading, availableCafes } = useData();
    const [coffee, setCoffee] = useState<CoffeeType | null | undefined>(undefined);
    const [shareFeedback, setShareFeedback] = useState('');
    const [isSharing, setIsSharing] = useState(false);

    useEffect(() => {
        if (cafeId && cafeId !== currentCafe?.id) {
            selectCafe(cafeId);
        }
    }, [cafeId, currentCafe, selectCafe]);

    useEffect(() => {
        if (currentCafe && currentCafe.id === cafeId && coffees.length > 0) {
            setCoffee(coffees.find(c => c.id === coffeeId) || null);
        }
    }, [currentCafe, cafeId, coffees, coffeeId]);

    const handleDownload = async () => {
        if (!coffee) return;
        try {
            // The URL is now a direct link to an image file, not a data URL
            const response = await fetch(coffee.qr_code_image_url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `qrcode-${coffee.name.replace(/\s+/g, '-')}.png`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Error downloading QR code:", error);
            alert("Não foi possível descarregar o QR Code.");
        }
    };
    
    const handleShare = async () => {
        if (!coffee || isSharing) return;
        setIsSharing(true);

        const shareableUrl = window.location.href;
        const shareData = {
            title: `Café Especial: ${coffee.name}`,
            text: `Veja os detalhes sobre o ${coffee.name} no ${currentCafe?.name}!`,
            url: shareableUrl,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                throw new Error('Share API not supported');
            }
        } catch (error) {
            console.error("Share failed, falling back to clipboard:", error);
            // Only fallback if the user didn't cancel the share dialog
            if ((error as DOMException).name !== 'AbortError') {
                navigator.clipboard.writeText(shareableUrl).then(() => {
                    setShareFeedback('Link copiado para a área de transferência!');
                    setTimeout(() => setShareFeedback(''), 2000);
                }).catch(copyError => {
                    console.error('Clipboard write failed:', copyError);
                    setShareFeedback('Falha ao partilhar ou copiar.');
                    setTimeout(() => setShareFeedback(''), 2000);
                });
            }
        } finally {
            setIsSharing(false);
        }
    };

    if (isAppLoading || coffee === undefined) {
        return <LoadingDisplay message="A carregar detalhes do café..." />;
    }

    if (coffee === null) {
        return <ErrorDisplay message="Café especial não encontrado. O link pode estar incorreto ou o café pode ter sido removido." />;
    }

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen p-4">
             <Link
                to="/select-server"
                className="absolute top-8 left-8 flex items-center justify-center w-14 h-14 glass-card !rounded-full transition-colors"
                aria-label="Voltar"
            >
                <ArrowLeft size={24} />
            </Link>
            <div className="w-full max-w-md mx-auto glass-card p-8 text-center">
                 <Coffee className="h-16 w-16 mx-auto icon-glow mb-4" style={{ color: 'var(--color-secondary)' }}/>

                <h1 className="text-4xl font-bold font-display mb-2">{coffee.name}</h1>
                <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-secondary)' }}>{coffee.brewing_method}</h2>

                <p className="text-base mb-6" style={{color: 'var(--color-text-primary)'}}>{coffee.description || "Descubra o sabor e aroma únicos deste café especial."}</p>
                
                <div className="qr-container-glow mb-8">
                    <img 
                        src={coffee.qr_code_image_url} 
                        alt={`QR Code para ${coffee.name}`}
                        className="w-full max-w-[256px] h-auto"
                    />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={handleShare}
                        disabled={isSharing}
                        className="w-full secondary-button font-bold py-3 text-lg flex items-center justify-center gap-3"
                    >
                        <Share2 size={22} />
                        Partilhar
                    </button>
                    <button
                        onClick={handleDownload}
                        className="w-full premium-gradient-button py-3 text-lg flex items-center justify-center gap-3"
                    >
                        <Download size={22} />
                        Baixar PNG
                    </button>
                </div>
                 {shareFeedback && (
                    <p className="mt-4 text-sm text-green-300">{shareFeedback}</p>
                )}
            </div>
        </div>
    );
};

export default CoffeeDetailsPage;