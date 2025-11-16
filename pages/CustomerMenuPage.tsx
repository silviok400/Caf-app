import React, { useState, useEffect, useMemo, useRef, memo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Product, OrderItem, Order, OrderStatus, Table } from '../types';
import { Plus, Minus, Search, ShoppingCart, Send, MessageSquarePlus, X, CheckCircle, Loader2, MonitorPlay, AlertTriangle, Receipt, ChefHat, Bell, ThumbsUp, Star, Ban, UtensilsCrossed } from 'lucide-react';


const ErrorDisplay: React.FC<{ message: string }> = memo(({ message }) => {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
            <div className="glass-card p-8 max-w-lg">
                <AlertTriangle className="text-red-400 mx-auto" size={64} />
                <h2 className="text-3xl font-bold font-display mt-6 mb-2">Link Inválido</h2>
                <p style={{color: 'var(--color-text-secondary)'}}>{message}</p>
                <button 
                    onClick={() => navigate('/select-server', { replace: true })}
                    className="mt-8 premium-gradient-button font-bold py-3 px-6 rounded-lg w-full"
                >
                    Voltar ao Início
                </button>
            </div>
        </div>
    );
});

const LoadingDisplay: React.FC<{ message: string }> = memo(({ message }) => {
    return (
         <div className="flex flex-col items-center justify-center min-h-screen">
            <Loader2 className="animate-spin text-amber-300" size={48} />
            <p className="mt-4" style={{color: 'var(--color-text-secondary)'}}>{message}</p>
        </div>
    );
});

const FeedbackModal: React.FC<{ onClose: () => void }> = memo(({ onClose }) => {
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
        if (!content.trim() && !rating) {
            setErrorMessage('Por favor, deixe uma classificação ou um comentário.');
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
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
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
});

const CustomerOrderStatusPage: React.FC<{
    table: Table;
    onNavigateToMenu: () => void;
    isFirstOrderInSession: boolean;
}> = memo(({ table, onNavigateToMenu, isFirstOrderInSession }) => {
    const { getOrdersForTable, getTotalForTable, customerCancelOrder, theme } = useData();
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
    const [cancelStatus, setCancelStatus] = useState<'idle' | 'loading' | 'error'>('idle');
    const [cancelError, setCancelError] = useState('');

    useEffect(() => {
        if (isFirstOrderInSession) {
            const timer = setTimeout(() => setIsFeedbackModalOpen(true), 3000);
            return () => clearTimeout(timer);
        }
    }, [isFirstOrderInSession]);

    const activeOrders = useMemo(() =>
        getOrdersForTable(table.id)
            .filter(o => o.status !== OrderStatus.PAID && o.status !== OrderStatus.CANCELLED)
            .sort((a, b) => b.created_at.getTime() - a.created_at.getTime()),
        [getOrdersForTable, table.id]
    );

    const total = useMemo(() => getTotalForTable(table.id), [getTotalForTable, table.id, activeOrders]);

    const handleCancelOrder = async () => {
        if (!orderToCancel) return;
        setCancelStatus('loading');
        setCancelError('');
        const result = await customerCancelOrder(orderToCancel.id);
        if (!result.success) {
            setCancelError(result.message);
            setCancelStatus('error');
            setTimeout(() => {
                setOrderToCancel(null);
                setCancelStatus('idle');
            }, 3000);
        } else {
            setOrderToCancel(null);
            setCancelStatus('idle');
        }
    };

    const getStatusInfo = (status: OrderStatus) => {
        const statusKey = (Object.keys(OrderStatus) as Array<keyof typeof OrderStatus>).find(key => OrderStatus[key] === status)?.toLowerCase() || 'cancelled';
        const color = theme.statusColors[statusKey as keyof typeof theme.statusColors] || theme.statusColors.cancelled;
        const icons: { [key in OrderStatus]?: React.ElementType } = {
            [OrderStatus.NEW]: Receipt,
            [OrderStatus.PREPARING]: UtensilsCrossed,
            [OrderStatus.READY]: Bell,
            [OrderStatus.SERVED]: ThumbsUp,
            [OrderStatus.CANCELLED]: Ban,
        };
        return {
            text: status,
            color: color,
            Icon: icons[status] || Ban
        };
    };

    return (
        <>
            {isFeedbackModalOpen && <FeedbackModal onClose={() => setIsFeedbackModalOpen(false)} />}
            {orderToCancel && (
                 <div className="modal-backdrop fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
                    <div className="modal-content glass-card w-full max-w-sm p-6 text-center">
                        <h3 className="text-2xl font-bold font-display mb-2">Cancelar Pedido</h3>
                        <p className="mb-6" style={{color: 'var(--color-text-secondary)'}}>Tem a certeza que quer cancelar este pedido? Esta ação não pode ser desfeita.</p>
                        {cancelStatus === 'error' && <p className="text-red-400 text-sm mb-4">{cancelError}</p>}
                        <div className="flex justify-center gap-4">
                            <button onClick={() => setOrderToCancel(null)} disabled={cancelStatus === 'loading'} className="w-full secondary-button font-bold py-3">Anular</button>
                            <button onClick={handleCancelOrder} disabled={cancelStatus === 'loading'} className="w-full bg-red-600 text-white font-bold py-3 rounded-2xl hover:bg-red-700 flex items-center justify-center">
                                {cancelStatus === 'loading' ? <Loader2 className="animate-spin"/> : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="min-h-screen w-full flex flex-col items-center p-2 sm:p-4">
                <div className="w-full max-w-3xl flex-grow flex flex-col">
                    <header className="py-4 sticky top-0 bg-[var(--color-background)] z-20 w-full mb-4">
                         <div className="glass-card p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div>
                                <h1 className="text-3xl font-bold font-display text-center sm:text-left">Conta da {table.name}</h1>
                                <p className="text-center sm:text-left font-semibold text-lg" style={{color: 'var(--color-secondary)'}}>Total: €{total.toFixed(2)}</p>
                            </div>
                            <button onClick={onNavigateToMenu} className="w-full sm:w-auto premium-gradient-button font-bold py-3 px-6 rounded-lg text-lg flex items-center justify-center gap-2">
                                <Plus size={22}/> Adicionar Itens
                            </button>
                        </div>
                    </header>
                    <main className="flex-grow scrollable-content overflow-y-auto pr-2 -mr-2">
                        {activeOrders.length > 0 ? (
                            <div className="space-y-4">
                                {activeOrders.map(order => {
                                    const { text, color, Icon } = getStatusInfo(order.status);
                                    return (
                                        <div key={order.id} className="glass-card !bg-black/20 p-4 rounded-2xl border-l-4" style={{ borderColor: color }}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="font-bold">Pedido às {order.created_at.toLocaleTimeString()}</p>
                                                    <p className="text-sm" style={{color: 'var(--color-text-secondary)'}}>ID: ...{order.id.slice(-6)}</p>
                                                </div>
                                                <div className="text-center">
                                                    <div className="flex items-center justify-center gap-2 px-3 py-1 text-sm font-semibold rounded-full" style={{ backgroundColor: `color-mix(in srgb, ${color} 30%, transparent)`, color: `color-mix(in srgb, ${color} 85%, white)` }}>
                                                        <Icon size={16} /> {text}
                                                    </div>
                                                </div>
                                            </div>
                                            <ul className="space-y-2 border-t pt-3" style={{borderColor: 'var(--color-glass-border)'}}>
                                                {order.items.map((item, index) => (
                                                    <li key={index} className="flex justify-between items-start">
                                                        <div>
                                                          <p className="font-medium">{item.quantity}x {item.productName}</p>
                                                          {item.notes && <p className="text-xs italic pl-4">↳ {item.notes}</p>}
                                                        </div>
                                                        <span className="font-medium">€{(item.productPrice * item.quantity).toFixed(2)}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            {order.status === OrderStatus.NEW && (
                                                <div className="mt-4 text-right">
                                                    <button onClick={() => setOrderToCancel(order)} className="text-red-300 hover:text-red-200 text-xs font-semibold flex items-center gap-1 ml-auto">
                                                        <Ban size={14}/> Cancelar Pedido
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                             <div className="flex flex-col items-center justify-center text-center h-full glass-card p-8">
                                <ThumbsUp size={64} className="text-stone-400" />
                                <h2 className="text-2xl font-bold mt-4">Tudo em ordem!</h2>
                                <p className="text-lg mt-2" style={{color: 'var(--color-text-secondary)'}}>A sua conta está paga. Adicione novos itens para começar um novo pedido.</p>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </>
    );
});


const ProductItem: React.FC<{ product: Product; onAddToCart: (product: Product) => void; }> = memo(({ product, onAddToCart }) => {
    return (
        <button
            onClick={() => onAddToCart(product)}
            className="w-full text-left p-3 glass-card glass-card-highlight !rounded-xl flex justify-between items-center"
        >
            <div>
                <p className="font-semibold text-lg" style={{ color: 'var(--color-text-primary)' }}>{product.name}</p>
                <p className="text-md" style={{ color: 'var(--color-text-secondary)' }}>€{product.price.toFixed(2)}</p>
            </div>
            <div className="p-2 bg-green-900/50 rounded-full">
                <Plus className="text-green-300" size={24} />
            </div>
        </button>
    );
});


const CustomerMenuPage: React.FC = () => {
    const { cafeId, tableId } = useParams<{ cafeId: string, tableId: string }>();
    const { selectCafe, currentCafe, products, categories, theme, addOrder, tables, isAppLoading, availableCafes } = useData();
    const navigate = useNavigate();
    const menuRef = useRef<HTMLDivElement>(null);

    const location = useLocation();
    const isKioskMode = useMemo(() => new URLSearchParams(location.search).get('kiosk') === 'true', [location.search]);
    const isFirstOrderInSession = useRef(!sessionStorage.getItem('customerFeedbackGiven'));

    const [cart, setCart] = useState<OrderItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<OrderItem | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [view, setView] = useState<'menu' | 'status'>('menu');
    const [fullscreenState, setFullscreenState] = useState<'idle' | 'requested' | 'active' | 'failed'>('idle');
    const [noteText, setNoteText] = useState('');

    useEffect(() => {
        const root = document.documentElement;
        const body = document.body;

        const originalStyles: { [key: string]: string } = {};
        const cssVariables = [
            '--color-background', '--color-text-primary', '--color-text-secondary',
            '--color-glass-bg', '--color-glass-border', '--color-glass-border-highlight',
            '--color-primary', '--color-secondary', '--gradient-gold'
        ];

        cssVariables.forEach(v => {
            originalStyles[v] = root.style.getPropertyValue(v);
        });
        originalStyles['body-backgroundImage'] = body.style.backgroundImage;

        // Apply light theme
        body.classList.add('theme-light');
        root.style.setProperty('--color-background', '#f8f5f2');
        root.style.setProperty('--color-text-primary', '#4a3f35');
        root.style.setProperty('--color-text-secondary', '#776c62');
        root.style.setProperty('--color-glass-bg', 'rgba(255, 255, 255, 0.65)');
        root.style.setProperty('--color-glass-border', 'rgba(74, 63, 53, 0.1)');
        root.style.setProperty('--color-glass-border-highlight', 'rgba(125, 91, 65, 0.4)');
        root.style.setProperty('--color-primary', '#7d5b41');
        root.style.setProperty('--color-secondary', '#c5a371');
        root.style.setProperty('--gradient-gold', 'linear-gradient(145deg, #e6c793, #c5a371, #a48454)');
        body.style.backgroundImage = 'none';

        return () => {
            body.classList.remove('theme-light');
            for (const key in originalStyles) {
                if (key === 'body-backgroundImage') {
                    body.style.backgroundImage = originalStyles[key];
                } else {
                    root.style.setProperty(key, originalStyles[key]);
                }
            }
        };
    }, []);

    const enterFullscreen = async () => {
        try {
            await document.documentElement.requestFullscreen();
            setFullscreenState('active');
        } catch (error) {
            console.error('Failed to enter fullscreen:', error);
            setFullscreenState('failed'); 
        }
    };
    
    useEffect(() => {
        const timer = setTimeout(() => {
            menuRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (isKioskMode && fullscreenState === 'idle') {
            setFullscreenState('requested');
            enterFullscreen();
        }
    }, [isKioskMode, fullscreenState]);

    useEffect(() => {
        if (isCartOpen || editingNote) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }
        return () => {
            document.body.classList.remove('modal-open');
        }
    }, [isCartOpen, editingNote]);
    
    useEffect(() => {
        if(editingNote) {
            setNoteText(editingNote.notes || '');
        }
    }, [editingNote]);


    useEffect(() => {
        if (cafeId && cafeId !== currentCafe?.id) {
            selectCafe(cafeId);
        }
    }, [cafeId, currentCafe, selectCafe]);

    const validationResult = useMemo(() => {
        if (isAppLoading) {
            return { status: 'loading', message: 'A verificar o link...' };
        }
        
        const cafeExists = availableCafes.some(c => c.id === cafeId);
        if (!cafeExists) {
            return { status: 'error', message: 'Café não encontrado. Este link de pedido pode estar incorreto ou desatualizado.' };
        }
        
        if (!currentCafe || currentCafe.id !== cafeId) {
            return { status: 'loading', message: 'A carregar dados do café...' };
        }
        
        const tableExists = tables.find(t => t.id === tableId);
        if (!tableExists) {
             return { status: 'error', message: 'Mesa não encontrada. Este QR Code pode ser de uma mesa que já não existe.' };
        }
        
        return { status: 'ready', message: '' };

    }, [isAppLoading, availableCafes, cafeId, tableId, currentCafe, tables]);


    const table = useMemo(() => tables.find(t => t.id === tableId), [tables, tableId]);

    const addToCart = (product: Product) => {
        setCart(currentCart => {
            const existingItem = currentCart.find(item => item.productId === product.id);
            if (existingItem) {
                return currentCart.map(item =>
                    item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...currentCart, { productId: product.id, quantity: 1, productName: product.name, productPrice: product.price }];
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(currentCart => {
            const existingItem = currentCart.find(item => item.productId === productId);
            if (existingItem && existingItem.quantity > 1) {
                return currentCart.map(item =>
                    item.productId === productId ? { ...item, quantity: item.quantity - 1 } : item
                );
            }
            return currentCart.filter(item => item.productId !== productId);
        });
    };

    const handleSaveNote = (note: string) => {
        if (editingNote) {
            setCart(currentCart =>
                currentCart.map(item =>
                    item.productId === editingNote.productId
                        ? { ...item, notes: note.trim() }
                        : item
                )
            );
            setEditingNote(null);
        }
    };

    const handleSubmitOrder = async () => {
        if (cart.length > 0 && tableId) {
            setIsSubmitting(true);
            try {
                const newOrder = await addOrder(tableId, cart, true);
                if (newOrder) {
                    setView('status');
                    setCart([]);
                    setIsCartOpen(false);
                    if (isFirstOrderInSession.current) {
                        sessionStorage.setItem('customerFeedbackGiven', 'true');
                    }
                } else {
                    throw new Error("Order creation failed.");
                }
            } catch (error) {
                console.error("Failed to submit order:", error);
                alert("Ocorreu um erro ao enviar o seu pedido. Por favor, tente novamente.");
            } finally {
                setIsSubmitting(false);
            }
        }
    };
    
    const cartTotal = useMemo(() => cart.reduce((total, item) => total + item.productPrice * item.quantity, 0), [cart]);
    const cartItemCount = useMemo(() => cart.reduce((count, item) => count + item.quantity, 0), [cart]);

    const productsToDisplay = useMemo(() => {
        return products.filter(p =>
            (selectedCategory === 'all' || p.category === selectedCategory) &&
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [products, selectedCategory, searchQuery]);

    if (validationResult.status === 'loading') {
        return <LoadingDisplay message={validationResult.message} />;
    }

    if (validationResult.status === 'error') {
        return <ErrorDisplay message={validationResult.message} />;
    }
    
    if (isKioskMode && fullscreenState !== 'active') {
        return (
            <div 
                className="fixed inset-0 flex flex-col items-center justify-center z-[100] text-center p-4 cursor-pointer"
                onClick={enterFullscreen}
            >
                <div className="glass-card p-8">
                    <MonitorPlay className="icon-glow mx-auto mb-6" style={{color: 'var(--color-secondary)'}} size={80}/>
                    <h1 className="text-4xl font-bold font-display">Modo Kiosk</h1>
                    <p className="text-lg mt-2" style={{color: 'var(--color-text-secondary)'}}>Toque na tela para iniciar em tela cheia.</p>
                    <button 
                        onClick={enterFullscreen}
                        className="mt-8 premium-gradient-button font-bold py-3 px-8 rounded-lg text-lg"
                    >
                        Iniciar
                    </button>
                </div>
            </div>
        );
    }
    
    if (view === 'status' && table) {
        return <CustomerOrderStatusPage 
                    table={table}
                    onNavigateToMenu={() => {
                        setView('menu');
                        isFirstOrderInSession.current = false;
                    }}
                    isFirstOrderInSession={isFirstOrderInSession.current}
                />
    }

    return (
        <div ref={menuRef} className="min-h-screen w-full flex flex-col items-center p-2 sm:p-4 pb-28">
            <div className="w-full max-w-3xl flex-grow flex flex-col">
                <header className="py-4 sticky top-0 bg-[color:var(--color-background)] z-20 w-full mb-4">
                    <div className="glass-card p-4">
                        <h1 className="text-3xl font-bold font-display text-center">{currentCafe?.name || 'Cardápio'}</h1>
                        <p className="text-center font-semibold" style={{color: 'var(--color-secondary)'}}>A pedir para: {table!.name}</p>
                    </div>
                </header>

                <main className="flex-grow">
                    <div className="sticky top-[120px] bg-[color:var(--color-background)] py-2 z-10 -mx-2 sm:-mx-4 px-2 sm:px-4 rounded-xl">
                        <div className="relative mb-3">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2" style={{color: 'var(--color-text-secondary)'}} size={20} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Pesquisar no cardápio..."
                                className="w-full glass-input !rounded-full py-2 pl-12 pr-4"
                            />
                        </div>
                        <div className="flex space-x-2 pb-1 overflow-x-auto -mx-2 sm:-mx-4 px-2 sm:px-4">
                            <button onClick={() => setSelectedCategory('all')} className={`px-4 py-1.5 text-sm font-semibold rounded-full whitespace-nowrap transition-colors ${selectedCategory === 'all' ? 'premium-gradient-button' : 'secondary-button !rounded-full'}`}>Todos</button>
                            {categories.map(cat => (
                                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-1.5 text-sm font-semibold rounded-full whitespace-nowrap transition-colors ${selectedCategory === cat ? 'premium-gradient-button' : 'secondary-button !rounded-full'}`}>{cat}</button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6 mt-4">
                        {categories.filter(cat => selectedCategory === 'all' || selectedCategory === cat).map(category => {
                            const items = productsToDisplay.filter(p => p.category === category);
                            if (items.length === 0) return null;
                            return (
                                <div key={category}>
                                    <h2 className="text-2xl font-bold font-display mb-3 pl-2">{category}</h2>
                                    <div className="space-y-3">
                                        {items.map(product => (
                                            <ProductItem key={product.id} product={product} onAddToCart={addToCart} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </main>
            </div>
            
            {cartItemCount > 0 && (
                <div className="fixed bottom-4 z-30 w-full max-w-sm px-4">
                    <button onClick={() => setIsCartOpen(true)} className="w-full premium-gradient-button font-bold py-4 rounded-xl text-lg shadow-lg flex items-center justify-between px-6">
                        <div className="flex items-center gap-2">
                            <ShoppingCart />
                            <span>Ver Cesto ({cartItemCount})</span>
                        </div>
                        <span>€{cartTotal.toFixed(2)}</span>
                    </button>
                </div>
            )}
            
            {/* Cart Modal */}
            <div className={`modal-backdrop fixed inset-0 bg-black bg-opacity-70 z-40 transition-opacity ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsCartOpen(false)}></div>
            <div className={`fixed bottom-0 left-0 right-0 glass-card z-50 transition-transform transform ${isCartOpen ? 'translate-y-0' : 'translate-y-full'} max-h-[80vh] flex flex-col !rounded-b-none`}>
                <header className="p-4 border-b flex justify-between items-center" style={{borderColor: 'var(--color-glass-border)'}}>
                    <h2 className="text-2xl font-bold font-display">O seu Pedido</h2>
                    <button onClick={() => setIsCartOpen(false)} style={{color: 'var(--color-text-secondary)'}} className="p-2 rounded-full hover:bg-black/20"><X/></button>
                </header>
                <div className="scrollable-content flex-grow overflow-y-auto p-4 space-y-3">
                     {cart.map(item => (
                        <div key={item.productId} className="flex flex-col p-2 bg-black/20 rounded-xl gap-2 border" style={{borderColor: 'var(--color-glass-border)'}}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold">{item.productName}</p>
                                    <p className="text-sm" style={{color: 'var(--color-text-secondary)'}}>€{(item.productPrice * item.quantity).toFixed(2)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => removeFromCart(item.productId)} className="p-1.5 rounded-full secondary-button !rounded-full"><Minus size={16} /></button>
                                    <span className="w-6 text-center font-bold">{item.quantity}</span>
                                    <button onClick={() => {
                                        const product = products.find(p => p.id === item.productId);
                                        if (product) addToCart(product);
                                    }} className="p-1.5 rounded-full secondary-button !rounded-full"><Plus size={16} /></button>
                                </div>
                            </div>
                            <button onClick={() => setEditingNote(item)} className="text-xs text-amber-300 flex items-center gap-1.5 self-start py-1 hover:underline">
                                <MessageSquarePlus size={14} /> {item.notes ? 'Editar observação' : 'Adicionar observação'}
                            </button>
                            {item.notes && <p className="text-xs bg-amber-900/50 p-2 rounded-md text-amber-200 italic">Obs: {item.notes}</p>}
                        </div>
                    ))}
                </div>
                <footer className="p-4 mt-auto border-t flex-shrink-0" style={{borderColor: 'var(--color-glass-border)'}}>
                    <div className="flex justify-between items-center text-xl font-bold mb-4">
                        <span>Total:</span>
                        <span>€{cartTotal.toFixed(2)}</span>
                    </div>
                    <button
                        onClick={handleSubmitOrder}
                        disabled={cart.length === 0 || isSubmitting}
                        className="w-full premium-gradient-button py-4 text-lg flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                        {isSubmitting ? 'A Enviar...' : 'Enviar Pedido'}
                    </button>
                </footer>
            </div>

            {/* Note editing modal */}
            {editingNote && (
                <div className="modal-backdrop fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
                    <div className="modal-content glass-card w-full max-w-md p-6">
                        <h3 className="text-xl font-bold font-display mb-1">Observação para:</h3>
                        <p className="mb-4" style={{color: 'var(--color-text-secondary)'}}>{editingNote.productName}</p>
                        <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            className="w-full glass-input"
                            rows={4}
                            autoFocus
                            placeholder="Ex: sem cebola, ponto da carne..."
                        />
                         <div className="mt-6 flex justify-end gap-3">
                            <button type="button" onClick={() => setEditingNote(null)} className="secondary-button font-bold py-2 px-4">Cancelar</button>
                            <button type="button" onClick={() => handleSaveNote(noteText)} className="premium-gradient-button py-2 px-4">Guardar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerMenuPage;