import React, { useState, useEffect } from 'react';
import { MessageSquare, Star, X, Send, CheckCircle, Loader2 } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const FeedbackModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { submitFeedback } = useData();
    const [rating, setRating] = useState<number | null>(null);
    const [hoverRating, setHoverRating] = useState<number | null>(null);
    const [content, setContent] = useState('');
    const [state, setState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        document.body.classList.add('modal-open');
        return () => {
            document.body.classList.remove('modal-open');
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) {
            setErrorMessage('Por favor, escreva a sua opinião.');
            setState('error');
            return;
        }

        setState('submitting');
        setErrorMessage('');
        const result = await submitFeedback(content, rating);

        if (result.success) {
            setState('success');
            setTimeout(onClose, 2000);
        } else {
            setState('error');
            setErrorMessage(result.message);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="glass-card w-full max-w-md p-6 relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 p-2 rounded-full hover:bg-black/20" style={{color: 'var(--color-text-secondary)'}}>
                    <X />
                </button>

                {state === 'success' ? (
                    <div className="text-center p-8">
                        <CheckCircle size={56} className="mx-auto text-green-400 mb-4" />
                        <h3 className="text-2xl font-bold font-display">Obrigado!</h3>
                        <p style={{color: 'var(--color-text-secondary)'}}>O seu feedback foi enviado com sucesso.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <h3 className="text-2xl font-bold font-display mb-2 text-center">Deixe o seu Feedback</h3>
                        <p className="text-center mb-4" style={{color: 'var(--color-text-secondary)'}}>A sua opinião é importante para nós.</p>

                        <div className="mb-4">
                            <p className="text-center font-semibold mb-2" style={{color: 'var(--color-text-primary)'}}>Como classifica a sua experiência?</p>
                            <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        type="button"
                                        key={star}
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(null)}
                                        className="p-2 transition-transform duration-150 ease-in-out hover:scale-125"
                                    >
                                        <Star
                                            size={32}
                                            className={`transition-colors ${
                                                (hoverRating ?? rating ?? 0) >= star
                                                    ? 'text-amber-400 fill-current'
                                                    : 'text-stone-500'
                                            }`}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Escreva aqui a sua mensagem..."
                            rows={5}
                            className="w-full glass-input"
                            required
                        />

                        {state === 'error' && <p className="text-red-400 text-sm mt-2 text-center">{errorMessage}</p>}
                        
                        <div className="mt-6">
                            <button type="submit" disabled={state === 'submitting'} className="w-full premium-gradient-button py-3 text-lg flex items-center justify-center gap-3">
                                {state === 'submitting' ? <Loader2 className="animate-spin" /> : <Send />}
                                {state === 'submitting' ? 'A Enviar...' : 'Enviar Feedback'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

const FeedbackButton: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-4 right-4 z-40 w-12 h-12 rounded-full shadow-lg flex items-center justify-center premium-gradient-button"
                aria-label="Deixar Feedback"
                title="Deixar Feedback"
            >
                <MessageSquare size={20} />
            </button>
            {isModalOpen && <FeedbackModal onClose={() => setIsModalOpen(false)} />}
        </>
    );
};

export default FeedbackButton;