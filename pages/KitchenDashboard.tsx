import React, { useState, useMemo, useEffect, useRef, memo } from 'react';
import { useData } from '../contexts/DataContext';
import { Order, OrderStatus, Staff, Table } from '../types';
import { Clock, Check, UtensilsCrossed, Ban, ThumbsUp, History, X } from 'lucide-react';

const timeSince = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    const interval = seconds / 60;
    if (interval > 60) return `${Math.floor(interval / 60)}h ${Math.round(interval % 60)}m`;
    if (interval > 1) return `${Math.floor(interval)} min`;
    return `${Math.floor(seconds)} seg`;
};

const OrderCard: React.FC<{ order: Order; isNew: boolean; onAnimationEnd: (orderId: string) => void; }> = memo(({ order, isNew, onAnimationEnd }) => {
  const { updateOrderStatus, staff, user, tables, theme } = useData();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const waiter = staff.find(s => s.id === order.staff_id);
  const table = tables.find(t => t.id === order.table_id);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const orderTotal = useMemo(() => {
    return order.items.reduce((total, item) => total + (item.productPrice * item.quantity), 0);
  }, [order.items]);

  const statusKey = (Object.keys(OrderStatus) as Array<keyof typeof OrderStatus>).find(key => OrderStatus[key] === order.status)?.toLowerCase() || 'cancelled';
  const statusColor = theme.statusColors[statusKey as keyof typeof theme.statusColors] || theme.statusColors.cancelled;
  
  useEffect(() => {
    const handleAnimationEnd = () => {
        onAnimationEnd(order.id);
    };
    const element = cardRef.current;
    if (isNew && element) {
        element.addEventListener('animationend', handleAnimationEnd);
    }
    return () => {
        if (element) {
            element.removeEventListener('animationend', handleAnimationEnd);
        }
    };
  }, [isNew, order.id, onAnimationEnd]);


  return (
    <div ref={cardRef} className={`glass-card !bg-black/20 rounded-2xl shadow-md p-4 flex flex-col justify-between w-full border-t-4 ${isNew ? 'animate-flash' : ''}`} style={{ borderColor: statusColor }}>
      <div>
        <div className="flex justify-between items-start border-b pb-2 mb-3" style={{borderColor: 'var(--color-glass-border)'}}>
            <div>
                <h3 className="font-display font-bold text-xl" style={{color: 'var(--color-text-primary)'}}>{table ? table.name : `Mesa #${order.table_id.substring(0,4)}`}</h3>
                <p className="font-semibold text-lg" style={{color: 'var(--color-secondary)'}}>€{orderTotal.toFixed(2)}</p>
            </div>
          <span className="flex items-center gap-1.5 text-sm pt-1" style={{color: 'var(--color-text-secondary)'}}><Clock size={14} /> {timeSince(order.created_at)}</span>
        </div>
        <ul className="space-y-2 mb-3">
          {order.items.map((item, index) => (
            <li key={`${item.productId}-${index}`} className="flex flex-col items-start text-base">
                <div className="flex items-center">
                    <span className="font-bold mr-2" style={{color: 'var(--color-text-primary)'}}>{item.quantity}x</span>
                    <span style={{color: 'var(--color-text-secondary)'}}>{item.productName}</span>
                </div>
                {item.notes && (
                    <p className="bg-amber-900/50 pl-5 pr-2 py-1 rounded-md text-sm text-amber-200 mt-1 w-full relative">
                        <strong className="absolute top-1 left-1.5 text-lg">↳</strong> {item.notes}
                    </p>
                )}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-2">
        <p className="text-xs text-center mb-3" style={{color: 'var(--color-text-secondary)'}}>Pedido por: {waiter?.name || 'Cliente'}</p>
        <div className="space-y-2">
            {order.status === OrderStatus.NEW && showCancelConfirm ? (
                 <div className="bg-red-900/30 p-3 rounded-lg text-center">
                    <p className="font-semibold text-red-200 mb-2 text-sm">Cancelar o pedido?</p>
                    <div className="flex gap-2">
                        <button onClick={() => setShowCancelConfirm(false)} className="w-full secondary-button !rounded-lg font-bold py-1.5 px-2 text-sm">Anular</button>
                        <button onClick={() => updateOrderStatus(order.id, OrderStatus.CANCELLED)} className="w-full bg-red-600 text-white font-bold py-1.5 px-2 rounded-lg hover:bg-red-700 text-sm">Confirmar</button>
                    </div>
                </div>
            ) : (
                <>
                    {order.status === OrderStatus.NEW && (
                    <button onClick={() => updateOrderStatus(order.id, OrderStatus.PREPARING)} className="w-full bg-amber-600 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-amber-700 transition-colors">
                        <UtensilsCrossed size={18}/> Iniciar Preparo
                    </button>
                    )}
                    {order.status === OrderStatus.PREPARING && (
                    <button onClick={() => updateOrderStatus(order.id, OrderStatus.READY)} className="w-full bg-green-600 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-green-700 transition-colors">
                        <Check size={18}/> Pronto
                    </button>
                    )}
                    {order.status === OrderStatus.READY && (
                    <button onClick={() => updateOrderStatus(order.id, OrderStatus.SERVED)} className="w-full bg-blue-600 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors">
                        Servir
                    </button>
                    )}
                    {order.status === OrderStatus.NEW && user && (user.role === 'admin' || user.role === 'waiter') && (
                        <button onClick={() => setShowCancelConfirm(true)} className="w-full bg-transparent text-red-400 font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-red-900/30 transition-colors text-xs">
                            <Ban size={14}/> Cancelar Pedido
                        </button>
                    )}
                </>
            )}
        </div>
      </div>
    </div>
  );
});

const HistoryModal: React.FC<{
  orders: Order[];
  onClose: () => void;
  staff: Staff[];
  tables: Table[];
}> = memo(({ orders, onClose, staff, tables }) => {
  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-2xl h-[90vh] flex flex-col">
        <header className="flex items-center justify-between p-4 border-b" style={{borderColor: 'var(--color-glass-border)'}}>
          <h2 className="text-2xl font-bold font-display">Histórico de Pedidos</h2>
          <button onClick={onClose} style={{color: 'var(--color-text-secondary)'}} className="p-2 rounded-full hover:bg-black/20"><X size={24} /></button>
        </header>
        <div className="flex-grow overflow-y-auto p-4 space-y-4">
          {orders.length > 0 ? (
            orders.map(order => {
              const orderTotal = order.items.reduce((total, item) => total + (item.productPrice * item.quantity), 0);
              const waiter = staff.find(s => s.id === order.staff_id);
              const table = tables.find(t => t.id === order.table_id);
              const statusColor = order.status === OrderStatus.PAID ? 'bg-green-900/50 text-green-300' : 'bg-stone-700/50 text-stone-300';

              return (
                <div key={order.id} className="glass-card !bg-black/20 p-4 rounded-2xl border" style={{borderColor: 'var(--color-glass-border)'}}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{table ? table.name : `Mesa #${order.table_id.substring(0,4)}`}</h3>
                      <p className="text-sm" style={{color: 'var(--color-text-secondary)'}}>
                        {order.updated_at.toLocaleString('pt-PT')} por {waiter?.name || 'Cliente'}
                      </p>
                    </div>
                    <div className="text-right">
                       <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>{order.status}</span>
                       <p className="font-bold text-lg mt-1">€{orderTotal.toFixed(2)}</p>
                    </div>
                  </div>
                  <ul className="mt-3 border-t pt-3 space-y-1" style={{borderColor: 'var(--color-glass-border)'}}>
                    {order.items.map((item, index) => (
                      <li key={index} className="text-sm" style={{color: 'var(--color-text-secondary)'}}>
                        {item.quantity}x {item.productName}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
          ) : (
            <p className="text-center py-16" style={{color: 'var(--color-text-secondary)'}}>Nenhum pedido pago ou cancelado encontrado.</p>
          )}
        </div>
      </div>
    </div>
  );
});


const KitchenDashboard: React.FC = () => {
  const { orders, staff, tables } = useData();
  const prevOrdersRef = useRef<Order[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());

  // Solicitar permissão de notificação na montagem do componente
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Efeito para notificar sobre novos pedidos
  useEffect(() => {
    if (prevOrdersRef.current.length === 0 && orders.length > 0) {
      prevOrdersRef.current = orders;
      return;
    }
    
    const prevOrderIds = new Set(prevOrdersRef.current.map(o => o.id));
    const newIncomingOrders = orders.filter(o => !prevOrderIds.has(o.id) && o.status === OrderStatus.NEW);

    if (newIncomingOrders.length > 0) {
      new Audio("https://upload.wikimedia.org/wikipedia/commons/c/c8/Blop.mp3").play().catch(e => console.error("Error playing audio:", e));
      
      setNewOrderIds(prev => {
        const newSet = new Set(prev);
        newIncomingOrders.forEach(order => newSet.add(order.id));
        return newSet;
      });

      if ('Notification' in window && Notification.permission === 'granted') {
        const latestOrder = newIncomingOrders[0];
        const table = tables.find(t => t.id === latestOrder.table_id);
        const notification = new Notification('Novo Pedido Recebido!', {
          body: `Um novo pedido foi feito para ${table ? table.name : 'uma mesa'}.`,
          tag: latestOrder.id,
        });
      }
    }
    
    prevOrdersRef.current = orders;
    
  }, [orders, tables]);
  
  const handleAnimationEnd = (orderId: string) => {
    setNewOrderIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
    });
  };


  const newOrders = useMemo(() => {
    return orders
      .filter(o => o.status === OrderStatus.NEW)
      .sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
  }, [orders]);

  const preparingOrders = useMemo(() => {
    return orders
      .filter(o => o.status === OrderStatus.PREPARING)
      .sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
  }, [orders]);

  const readyOrders = useMemo(() => {
    return orders
      .filter(o => o.status === OrderStatus.READY)
      .sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
  }, [orders]);

  const historyOrders = useMemo(() => {
    return orders
      .filter(o => o.status === OrderStatus.PAID || o.status === OrderStatus.CANCELLED)
      .sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime());
  }, [orders]);
  
  const hasOrders = newOrders.length > 0 || preparingOrders.length > 0 || readyOrders.length > 0;

  return (
    <>
    {isHistoryOpen && <HistoryModal orders={historyOrders} onClose={() => setIsHistoryOpen(false)} staff={staff} tables={tables} />}
    <div className="p-4 sm:p-6 md:p-8 min-h-[calc(100vh-7rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-center flex-wrap gap-4 mb-6 flex-shrink-0">
        <h2 className="text-3xl lg:text-4xl font-bold font-display">Pedidos da Cozinha</h2>
        <button
            onClick={() => setIsHistoryOpen(true)}
            className="w-full sm:w-auto secondary-button font-bold py-2 px-4 flex items-center justify-center gap-2"
        >
            <History size={20} /> Histórico de Pedidos
        </button>
      </div>

      {hasOrders ? (
        <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0">
            {/* Column for NEW */}
            <div className="glass-card !bg-black/25 rounded-2xl p-3 sm:p-4 flex flex-col">
              <h3 className="font-bold text-lg mb-4 flex-shrink-0">Novos ({newOrders.length})</h3>
              <div className="flex-grow space-y-4 overflow-y-auto pr-2 -mr-2">
                {newOrders.length > 0 ? (
                  newOrders.map(order => <OrderCard key={order.id} order={order} isNew={newOrderIds.has(order.id)} onAnimationEnd={handleAnimationEnd}/>)
                ) : (
                  <p className="text-center pt-8" style={{color: 'var(--color-text-secondary)'}}>Nenhum pedido novo.</p>
                )}
              </div>
            </div>

            {/* Column for PREPARING */}
            <div className="glass-card !bg-black/25 rounded-2xl p-3 sm:p-4 flex flex-col">
              <h3 className="font-bold text-lg mb-4 flex-shrink-0">Em Preparo ({preparingOrders.length})</h3>
              <div className="flex-grow space-y-4 overflow-y-auto pr-2 -mr-2">
                {preparingOrders.length > 0 ? (
                  preparingOrders.map(order => <OrderCard key={order.id} order={order} isNew={false} onAnimationEnd={() => {}} />)
                ) : (
                  <p className="text-center pt-8" style={{color: 'var(--color-text-secondary)'}}>Nenhum pedido em preparo.</p>
                )}
              </div>
            </div>
            
            {/* Column for READY */}
            <div className="glass-card !bg-black/25 rounded-2xl p-3 sm:p-4 flex flex-col">
              <h3 className="font-bold text-lg mb-4 flex-shrink-0">Prontos ({readyOrders.length})</h3>
              <div className="flex-grow space-y-4 overflow-y-auto pr-2 -mr-2">
                {readyOrders.length > 0 ? (
                  readyOrders.map(order => <OrderCard key={order.id} order={order} isNew={false} onAnimationEnd={() => {}} />)
                ) : (
                  <p className="text-center pt-8" style={{color: 'var(--color-text-secondary)'}}>Nenhum pedido pronto.</p>
                )}
              </div>
            </div>
        </div>
      ) : (
        <div className="flex-grow flex flex-col items-center justify-center text-center glass-card">
            <ThumbsUp size={64} className="text-stone-400" />
            <h2 className="text-2xl font-bold mt-4" style={{color: 'var(--color-text-primary)'}}>Tudo em ordem!</h2>
            <p className="text-lg mt-2" style={{color: 'var(--color-text-secondary)'}}>Nenhum pedido ativo na cozinha neste momento.</p>
        </div>
      )}
    </div>
    </>
  );
};

export default KitchenDashboard;