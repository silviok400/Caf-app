import React, { useState, useRef, useEffect, memo } from 'react';
import { useData } from '../contexts/DataContext';
import { Table, Product, OrderItem, Order, OrderStatus } from '../types';
import { Plus, Minus, X, Send, Receipt, Ban, Mic, Search, MessageSquarePlus, CheckCircle, Loader2 } from 'lucide-react';

const OrderModal: React.FC<{
  table: Table;
  onClose: () => void;
}> = memo(({ table, onClose }) => {
  const { products, addOrder, getOrdersForTable, closeTableBill, removeItemFromOrder, user, theme } = useData();
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [view, setView] = useState<'order' | 'history'>('order');
  const [itemToCancel, setItemToCancel] = useState<{orderId: string, itemIndex: number} | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [editingNote, setEditingNote] = useState<{productId: string; productName: string; currentNote: string} | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddedFeedback, setShowAddedFeedback] = useState<string | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);
  const [submissionState, setSubmissionState] = useState<'idle' | 'submitting' | 'success'>('idle');

  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
        if (feedbackTimeoutRef.current) {
            clearTimeout(feedbackTimeoutRef.current);
        }
    };
  }, []);


  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      const recognition = recognitionRef.current;
      recognition.continuous = false;
      recognition.lang = 'pt-PT';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    } else {
      console.warn("Speech Recognition API not supported in this browser.");
    }
  }, []);

  const handleVoiceSearch = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error("Could not start speech recognition:", error);
        setIsListening(false);
      }
    }
  };


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

    // Show feedback
    setShowAddedFeedback(product.name);
    if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
    }
    feedbackTimeoutRef.current = window.setTimeout(() => {
        setShowAddedFeedback(null);
    }, 1500);
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

  const getTotal = () => {
    return cart.reduce((total, item) => total + item.productPrice * item.quantity, 0).toFixed(2);
  };

  const handleSubmitOrder = async () => {
    if (cart.length > 0) {
      setSubmissionState('submitting');
      try {
        addOrder(table.id, cart); // This is fire and forget, no need to await
        setSubmissionState('success');
        setTimeout(() => {
          onClose();
        }, 1500); // Wait 1.5s before closing
      } catch (error) {
        console.error("Failed to submit order:", error);
        // Optionally show an error to the user here
        setSubmissionState('idle');
      }
    }
  };
  
  const handleSaveNote = () => {
    if (editingNote) {
        setCart(currentCart =>
            currentCart.map(item =>
                item.productId === editingNote.productId
                    ? { ...item, notes: editingNote.currentNote.trim() }
                    : item
            )
        );
        setEditingNote(null);
    }
  };

  const getStatusInfo = (status: OrderStatus) => {
    const statusKey = (Object.keys(OrderStatus) as Array<keyof typeof OrderStatus>).find(key => OrderStatus[key] === status)?.toLowerCase() || 'cancelled';
    const color = theme.statusColors[statusKey as keyof typeof theme.statusColors] || theme.statusColors.cancelled;
    
    return {
      text: status,
      color: color,
      isCancelled: status === OrderStatus.CANCELLED
    };
  }

  const categories = [...new Set(products.map(p => p.category))];
  const activeOrders = getOrdersForTable(table.id).filter(o => o.status !== OrderStatus.PAID && o.status !== OrderStatus.CANCELLED);
  const tableHistory = getOrdersForTable(table.id);
  const tableTotal = activeOrders.reduce((total, order) => {
    return total + order.items.reduce((orderTotal, item) => orderTotal + (item.productPrice * item.quantity), 0);
  }, 0);

  const productsToDisplay = products.filter(p =>
    (selectedCategory === 'all' || p.category === selectedCategory) &&
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      {editingNote && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
            <div className="glass-card w-full max-w-md p-6">
                <h3 className="text-xl font-bold font-display mb-1">Observação para:</h3>
                <p className="mb-4" style={{color: 'var(--color-text-secondary)'}}>{editingNote.productName}</p>
                <textarea
                    value={editingNote.currentNote}
                    onChange={(e) => setEditingNote({ ...editingNote, currentNote: e.target.value })}
                    className="w-full glass-input"
                    rows={4}
                    autoFocus
                    placeholder="Ex: sem cebola, ponto da carne..."
                />
                <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={() => setEditingNote(null)} className="secondary-button font-bold py-2 px-4">Cancelar</button>
                    <button type="button" onClick={handleSaveNote} className="premium-gradient-button py-2 px-4">Guardar</button>
                </div>
            </div>
        </div>
      )}
      <div className="glass-card w-full max-w-7xl h-[95vh] flex flex-col relative overflow-hidden">
        {submissionState === 'success' && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-20 rounded-2xl">
                <CheckCircle size={64} className="text-green-400" />
                <p className="mt-4 text-2xl font-bold">Pedido Enviado!</p>
            </div>
        )}
        <header className="flex items-center justify-between p-4 flex-shrink-0 border-b" style={{borderColor: 'var(--color-glass-border)'}}>
          <h2 className="text-xl sm:text-3xl font-bold font-display">Pedido para {table.name}</h2>
          <button onClick={onClose} style={{color: 'var(--color-text-secondary)'}} className="p-2 rounded-full hover:bg-black/20 hover:text-white"><X size={24} /></button>
        </header>

        <div className="flex-grow flex flex-col md:flex-row overflow-hidden p-2 sm:p-4 gap-2 sm:gap-4">
          {/* Main content */}
          <div className="w-full md:w-3/5 lg:w-2/3 flex flex-col overflow-y-auto relative glass-card !rounded-2xl !bg-black/20 p-2 sm:p-4">
             <div className="flex border-b mb-4 flex-shrink-0" style={{borderColor: 'var(--color-glass-border)'}}>
              <button onClick={() => setView('order')} className={`px-4 py-2 text-base sm:text-lg font-semibold border-b-2 transition-colors ${view === 'order' ? 'text-amber-300 border-amber-300' : 'text-gray-400 border-transparent'}`}>Novo Pedido</button>
              <button onClick={() => setView('history')} className={`px-4 py-2 text-base sm:text-lg font-semibold border-b-2 transition-colors ${view === 'history' ? 'text-amber-300 border-amber-300' : 'text-gray-400 border-transparent'}`}>Conta</button>
            </div>

            {view === 'order' ? (
              <div className="flex-grow flex flex-col overflow-y-hidden">
                <div className="sticky top-0 bg-black/10 backdrop-blur-sm py-3 mb-4 z-10 -mx-2 sm:-mx-4 px-2 sm:px-4 rounded-xl flex-shrink-0">
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Pesquisar produto por texto ou voz..."
                      className="w-full glass-input !rounded-full py-2 pl-10 pr-12"
                    />
                    <button
                      onClick={handleVoiceSearch}
                      className={`absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:bg-black/20'}`}
                      title="Pesquisa por voz"
                    >
                      <Mic size={20} />
                    </button>
                  </div>
                  <div className="flex space-x-2 pb-1 overflow-x-auto -mx-2 sm:-mx-4 px-2 sm:px-4">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`px-4 py-1.5 text-sm font-semibold rounded-full whitespace-nowrap transition-colors ${selectedCategory === 'all' ? 'premium-gradient-button' : 'secondary-button !rounded-full'}`}
                    >
                      Todos
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-full whitespace-nowrap transition-colors ${selectedCategory === cat ? 'premium-gradient-button' : 'secondary-button !rounded-full'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 flex-grow overflow-y-auto pr-2 -mr-2">
                  {productsToDisplay.map(product => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="w-full text-left p-3 glass-card glass-card-highlight !rounded-xl !bg-black/10 flex justify-between items-center"
                    >
                      <div>
                          <p className="font-semibold">{product.name}</p>
                          <p className="text-sm" style={{color: 'var(--color-text-secondary)'}}>€{product.price.toFixed(2)}</p>
                      </div>
                      <div className="p-2 bg-green-900/50 rounded-full">
                          <Plus className="text-green-300" size={20}/>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="overflow-y-auto pr-2 -mr-2">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
                    <h3 className="text-xl font-bold">Total da Conta: €{tableTotal.toFixed(2)}</h3>
                    <button
                      onClick={() => closeTableBill(table.id)}
                      disabled={activeOrders.length === 0}
                      className="w-full sm:w-auto bg-green-600 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-green-700 disabled:bg-stone-600"
                    >
                      <Receipt size={18} /> Fechar Conta
                    </button>
                </div>
                <div className="space-y-4">
                  {tableHistory.length > 0 ? tableHistory.map(order => {
                    const status = getStatusInfo(order.status);
                    return(
                    <div key={order.id} className={`p-3 rounded-lg border ${status.isCancelled ? 'opacity-60' : ''}`} style={{ borderColor: status.color, backgroundColor: `color-mix(in srgb, ${status.color} 20%, transparent)` }}>
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-semibold text-sm">Pedido às {order.created_at.toLocaleTimeString()}</p>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full`} style={{ backgroundColor: `color-mix(in srgb, ${status.color} 50%, transparent)`, color: `color-mix(in srgb, ${status.color} 80%, white)`}}>{status.text}</span>
                      </div>
                      <ul className="space-y-2">
                        {order.items.map((item, index) => (
                          <li key={index} className={`flex justify-between items-start gap-4 ${status.isCancelled ? 'line-through' : ''}`}>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium break-words">{item.quantity}x {item.productName}</p>
                                {item.notes && <p className="text-xs italic pl-4 break-words">↳ {item.notes}</p>}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="font-medium text-sm whitespace-nowrap">€{(item.productPrice * item.quantity).toFixed(2)}</span>
                              {(order.status === OrderStatus.NEW || order.status === OrderStatus.PREPARING) && user?.role !== 'kitchen' && (
                                <button
                                  onClick={() => setItemToCancel({orderId: order.id, itemIndex: index})}
                                  className="text-red-400 hover:text-red-300"
                                  title="Cancelar item"
                                >
                                  <Ban size={16} />
                                </button>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}) : (
                    <p className="text-center py-8" style={{color: 'var(--color-text-secondary)'}}>Nenhum pedido feito para esta mesa ainda.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right panel: Cart */}
          <div className="w-full md:w-2/5 lg:w-1/3 flex flex-col glass-card !rounded-2xl !bg-black/20 p-2 sm:p-4">
            <h3 className="text-xl font-bold font-display mb-4 text-center flex-shrink-0">Cesto</h3>
            {cart.length === 0 ? (
              <div className="flex-grow flex items-center justify-center text-center">
                  <p style={{color: 'var(--color-text-secondary)'}}>O seu cesto está vazio.<br/>Adicione produtos.</p>
              </div>
            ) : (
              <div className="flex-grow space-y-3 overflow-y-auto pr-2 -mr-2">
                  {cart.map(item => (
                    <div key={item.productId} className="flex flex-col p-2 bg-black/20 rounded-xl gap-2 border" style={{borderColor: 'var(--color-glass-border)'}}>
                      <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-sm">{item.productName}</p>
                            <p className="text-xs" style={{color: 'var(--color-text-secondary)'}}>€{(item.productPrice * item.quantity).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => removeFromCart(item.productId)} className="p-1 rounded-full secondary-button !rounded-full"><Minus size={14} /></button>
                            <span className="w-6 text-center font-bold">{item.quantity}</span>
                            <button onClick={() => {
                                const product = products.find(p => p.id === item.productId);
                                if (product) {
                                    addToCart(product);
                                }
                            }} className="p-1 rounded-full secondary-button !rounded-full"><Plus size={14} /></button>
                        </div>
                      </div>
                      <button onClick={() => setEditingNote({productId: item.productId, productName: item.productName, currentNote: item.notes || ''})} className="text-xs text-amber-300 flex items-center gap-1.5 self-start py-1 hover:underline">
                          <MessageSquarePlus size={14} /> {item.notes ? 'Editar observação' : 'Adicionar observação'}
                      </button>
                      {item.notes && <p className="text-xs bg-amber-900/50 p-2 rounded-md text-amber-200 italic">Obs: {item.notes}</p>}
                    </div>
                  ))}
              </div>
            )}
            <div className="mt-4 pt-4 border-t flex-shrink-0" style={{borderColor: 'var(--color-glass-border)'}}>
                <div className="flex justify-between items-center text-xl font-bold mb-4">
                  <span>Total:</span>
                  <span>€{getTotal()}</span>
                </div>
                <button
                  onClick={handleSubmitOrder}
                  disabled={cart.length === 0 || submissionState !== 'idle'}
                  className="w-full premium-gradient-button py-3 flex items-center justify-center gap-2 text-lg"
                >
                  {submissionState === 'submitting' ? <Loader2 className="animate-spin" /> : <Send size={20}/>}
                  {submissionState === 'submitting' ? 'A Enviar...' : 'Enviar Pedido'}
                </button>
            </div>
          </div>
        </div>
         {showAddedFeedback && (
            <div className="absolute bottom-6 right-6 bg-green-500/90 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
                <CheckCircle size={20} /> Adicionado: {showAddedFeedback}
            </div>
        )}
      </div>
      {itemToCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
          <div className="glass-card w-full max-w-sm p-6 text-center">
            <h3 className="text-2xl font-bold font-display mb-2">Cancelar Item</h3>
            <p className="mb-6" style={{color: 'var(--color-text-secondary)'}}>Tem a certeza que quer cancelar este item do pedido? Esta ação não pode ser desfeita.</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setItemToCancel(null)}
                className="w-full secondary-button font-bold py-3"
              >
                Anular
              </button>
              <button
                onClick={async () => {
                  await removeItemFromOrder(itemToCancel.orderId, itemToCancel.itemIndex);
                  setItemToCancel(null);
                }}
                className="w-full bg-red-600 text-white font-bold py-3 rounded-2xl hover:bg-red-700"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

const WaiterDashboard: React.FC = () => {
  const { tables, getOrdersForTable, getTotalForTable, theme } = useData();
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  const isTableOccupied = (tableId: string) => {
    return getOrdersForTable(tableId).some(o => o.status !== OrderStatus.PAID && o.status !== OrderStatus.CANCELLED);
  };

  const visibleTables = tables.filter(table => !table.is_hidden);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <h2 className="text-4xl font-bold font-display mb-8 text-center">Mesas</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
        {visibleTables.map(table => {
          const occupied = isTableOccupied(table.id);
          const total = getTotalForTable(table.id);
          const tableColor = occupied ? theme.tableColors.occupied : theme.tableColors.free;
          return (
            <button
              key={table.id}
              onClick={() => setSelectedTable(table)}
              className="glass-card aspect-square flex flex-col items-center justify-center p-2 sm:p-4 transition-all duration-300 glass-card-highlight"
              style={{
                '--glow-color': tableColor,
                borderColor: occupied ? tableColor : 'var(--color-glass-border)',
                boxShadow: `var(--shadow-light), var(--shadow-inner), 0 0 16px -4px var(--glow-color)`
              } as React.CSSProperties}
            >
              <span className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">{table.name}</span>
              {occupied && (
                <span className="mt-2 text-base sm:text-xl font-semibold text-white bg-black/40 px-3 py-1 rounded-full">€{total.toFixed(2)}</span>
              )}
            </button>
          );
        })}
      </div>
      {selectedTable && <OrderModal table={selectedTable} onClose={() => setSelectedTable(null)} />}
    </div>
  );
};

export default WaiterDashboard;