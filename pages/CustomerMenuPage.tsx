import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Product, OrderItem } from '../types';
import { Plus, Minus, Search, ShoppingCart, Send, MessageSquarePlus, X, CheckCircle, Loader2, MonitorPlay, AlertTriangle } from 'lucide-react';


const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => {
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
};

const LoadingDisplay: React.FC<{ message: string }> = ({ message }) => {
    return (
         <div className="flex flex-col items-center justify-center min-h-screen">
            <Loader2 className="animate-spin text-amber-300" size={48} />
            <p className="mt-4" style={{color: 'var(--color-text-secondary)'}}>{message}</p>
        </div>
    );
};

const CustomerMenuPage: React.FC = () => {
    const { cafeId, tableId } = useParams<{ cafeId: string, tableId: string }>();
    const { selectCafe, currentCafe, products, categories, theme, addOrder, tables, isAppLoading, availableCafes } = useData();
    const navigate = useNavigate();
    const menuRef = useRef<HTMLDivElement>(null);

    const location = useLocation();
    const isKioskMode = useMemo(() => new URLSearchParams(location.search).get('kiosk') === 'true', [location.search]);

    const [cart, setCart] = useState<OrderItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<OrderItem | null>(null);
    const [orderState, setOrderState] = useState<'idle' | 'sending' | 'sent'>('idle');
    const [fullscreenState, setFullscreenState] = useState<'idle' | 'requested' | 'active' | 'failed'>('idle');

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
        if (cafeId && cafeId !== currentCafe?.id) {
            selectCafe(cafeId);
        }
    }, [cafeId, currentCafe, selectCafe]);

    useEffect(() => {
        if (orderState === 'sent') {
            const timer = setTimeout(() => {
                if (isKioskMode) {
                    // In Kiosk mode, just go back to the menu for the next order
                    setOrderState('idle');
                } else {
                    // In normal mode, navigate back to the main selection screen
                    navigate('/select-server');
                }
            }, 8000); // 8-second delay before auto-action

            // Cleanup the timer if the component unmounts or state changes
            return () => clearTimeout(timer);
        }
    }, [orderState, isKioskMode, navigate]);

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
            setOrderState('sending');
            try {
                // Not awaiting this is intentional for fire-and-forget
                addOrder(tableId, cart, true);
                setOrderState('sent');
                setCart([]);
                setIsCartOpen(false);
            } catch (error) {
                console.error("Failed to submit order:", error);
                // Maybe show an error message to the user
                setOrderState('idle');
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
    
    if (orderState === 'sent') {
         return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
                <div className="glass-card p-8 max-w-lg">
                    <CheckCircle className="text-green-400 mx-auto" size={80} />
                    <h2 className="text-3xl font-bold font-display mt-4">Pedido Enviado!</h2>
                    <p className="text-stone-300 mt-2">O seu pedido foi enviado para a cozinha e será preparado em breve.</p>
                    {!isKioskMode && (
                        <p className="text-stone-400 mt-4 text-sm">Será redirecionado para a página inicial em alguns segundos...</p>
                    )}
                    <div className="mt-8 w-full max-w-sm space-y-4">
                        <button 
                            onClick={() => setOrderState('idle')} 
                            className="w-full premium-gradient-button font-bold py-3 px-6 rounded-lg"
                        >
                            Fazer Novo Pedido
                        </button>
                        {!isKioskMode && (
                            <button 
                                onClick={() => navigate('/select-server')} 
                                className="w-full secondary-button font-bold py-3 px-6 rounded-lg"
                            >
                                Voltar ao Início
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div ref={menuRef} className="min-h-screen w-full flex flex-col items-center p-2 sm:p-4 pb-28">
            <div className="w-full max-w-3xl flex-grow flex flex-col">
                <header className="py-4 sticky top-0 bg-transparent z-20 w-full mb-4">
                    <div className="glass-card p-4">
                        <h1 className="text-3xl font-bold font-display text-center">{currentCafe?.name || 'Cardápio'}</h1>
                        <p className="text-center font-semibold" style={{color: 'var(--color-secondary)'}}>A pedir para: {table!.name}</p>
                    </div>
                </header>

                <main className="flex-grow">
                    <div className="sticky top-[120px] bg-transparent backdrop-blur-sm py-2 z-10 -mx-2 sm:-mx-4 px-2 sm:px-4 rounded-xl">
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

                    <div className="space-y-6">
                        {categories.filter(cat => selectedCategory === 'all' || selectedCategory === cat).map(category => {
                            const items = productsToDisplay.filter(p => p.category === category);
                            if (items.length === 0) return null;
                            return (
                                <div key={category}>
                                    <h2 className="text-2xl font-bold font-display mb-3 pl-2">{category}</h2>
                                    <div className="space-y-3">
                                        {items.map(product => (
                                            <button key={product.id} onClick={() => addToCart(product)} className="w-full text-left p-3 glass-card glass-card-highlight !rounded-xl flex justify-between items-center">
                                                <div>
                                                    <p className="font-semibold text-lg" style={{color: 'var(--color-text-primary)'}}>{product.name}</p>
                                                    <p className="text-md" style={{color: 'var(--color-text-secondary)'}}>€{product.price.toFixed(2)}</p>
                                                </div>
                                                <div className="p-2 bg-green-900/50 rounded-full">
                                                    <Plus className="text-green-300" size={24}/>
                                                </div>
                                            </button>
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
            <div className={`fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-40 transition-opacity ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsCartOpen(false)}></div>
            <div className={`fixed bottom-0 left-0 right-0 glass-card z-50 transition-transform transform ${isCartOpen ? 'translate-y-0' : 'translate-y-full'} max-h-[80vh] flex flex-col !rounded-b-none`}>
                <header className="p-4 border-b flex justify-between items-center" style={{borderColor: 'var(--color-glass-border)'}}>
                    <h2 className="text-2xl font-bold font-display">O seu Pedido</h2>
                    <button onClick={() => setIsCartOpen(false)} style={{color: 'var(--color-text-secondary)'}} className="p-2 rounded-full hover:bg-black/20"><X/></button>
                </header>
                <div className="flex-grow overflow-y-auto p-4 space-y-3">
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
                             <button onClick={() => setEditingNote(item)} className="text-sm text-amber-300 flex items-center gap-1.5 self-start py-1 hover:underline">
                                <MessageSquarePlus size={16} /> {item.notes ? 'Editar observação' : 'Adicionar observação'}
                            </button>
                            {item.notes && <p className="text-sm bg-amber-900/50 p-2 rounded-md text-amber-200 italic">Obs: {item.notes}</p>}
                        </div>
                    ))}
                </div>
                <footer className="p-4 border-t bg-transparent" style={{borderColor: 'var(--color-glass-border)'}}>
                    <div className="flex justify-between items-center text-xl font-bold mb-4">
                        <span>Total:</span>
                        <span>€{cartTotal.toFixed(2)}</span>
                    </div>
                    <button onClick={handleSubmitOrder} disabled={cart.length === 0 || orderState === 'sending'} className="w-full premium-gradient-button font-bold py-4 rounded-lg flex items-center justify-center gap-2 text-lg">
                        {orderState === 'sending' ? <Loader2 className="animate-spin" /> : <Send size={20}/>}
                        {orderState === 'sending' ? 'A Enviar...' : 'Enviar Pedido para a Cozinha'}
                    </button>
                </footer>
            </div>

            {/* Note Modal */}
            {editingNote && (
                 <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="glass-card w-full max-w-md p-6">
                        <h3 className="text-xl font-bold font-display mb-1">Observação para:</h3>
                        <p style={{color: 'var(--color-text-secondary)'}} className="mb-4">{editingNote.productName}</p>
                        <textarea
                            defaultValue={editingNote.notes || ''}
                            onBlur={(e) => handleSaveNote(e.target.value)}
                            className="w-full glass-input"
                            rows={4}
                            autoFocus
                            placeholder="Ex: sem gelo, bem passado..."
                        />
                        <div className="mt-6 flex justify-end">
                            <button onClick={() => setEditingNote(null)} className="premium-gradient-button font-bold py-2 px-6 rounded-lg">Fechar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerMenuPage;