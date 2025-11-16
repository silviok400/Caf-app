import React, { useState, useEffect } from 'react';
import { SignalHigh, SignalMedium, SignalLow, WifiOff, Loader2 } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const PING_INTERVAL = 5000; // 5 seconds
const PING_URL = 'https://ixwpnecamexsrjndoedj.supabase.co'; // Base Supabase URL for latency check

type LatencyStatus = 'good' | 'medium' | 'low';

const PingIndicator: React.FC = () => {
  const { realtimeStatus } = useData();
  const [ping, setPing] = useState<number | null>(null);
  const [latencyStatus, setLatencyStatus] = useState<LatencyStatus>('good');

  useEffect(() => {
    let intervalId: number | undefined;

    const measurePing = async () => {
      const startTime = performance.now();
      try {
        await fetch(`${PING_URL}?_=${Date.now()}`, { method: 'HEAD', cache: 'no-store' });
        const endTime = performance.now();
        const latency = Math.round(endTime - startTime);
        
        setPing(latency);
        if (latency < 100) {
            setLatencyStatus('good');
        } else if (latency < 300) {
            setLatencyStatus('medium');
        } else {
            setLatencyStatus('low');
        }
      } catch (error) {
        // The realtimeStatus will reflect the connection issue, no need to set a separate status here.
        console.warn('Ping measurement failed. Relying on realtime status.');
        setPing(null);
      }
    };

    if (realtimeStatus === 'connected') {
      measurePing();
      intervalId = window.setInterval(measurePing, PING_INTERVAL);
    } else {
      setPing(null); // Clear ping display when not connected
    }

    return () => {
        if (intervalId) {
            clearInterval(intervalId);
        }
    };
  }, [realtimeStatus]);

  const getStatusInfo = () => {
    switch (realtimeStatus) {
      case 'connecting':
        return { Icon: Loader2, color: 'text-stone-400 animate-spin', title: 'A ligar ao tempo real...' };
      
      case 'connected':
        const pingText = ping !== null ? `(${ping}ms)` : '';
        if (latencyStatus === 'good') {
            return { Icon: SignalHigh, color: 'text-green-400', title: `Ligação excelente ${pingText}` };
        }
        if (latencyStatus === 'medium') {
            return { Icon: SignalMedium, color: 'text-yellow-400', title: `Ligação moderada ${pingText}` };
        }
        return { Icon: SignalLow, color: 'text-red-400', title: `Ligação lenta ${pingText}` };
      
      case 'error':
        return { Icon: WifiOff, color: 'text-red-500', title: 'Erro na ligação em tempo real' };

      case 'disconnected':
        return { Icon: WifiOff, color: 'text-stone-400', title: 'Desligado do tempo real' };

      case 'offline':
        return { Icon: WifiOff, color: 'text-stone-400', title: 'Sem ligação à Internet' };
      
      default:
        return { Icon: Loader2, color: 'text-stone-400 animate-spin', title: 'A verificar...' };
    }
  };

  const { Icon, color, title } = getStatusInfo();

  return (
    <div className="flex items-center gap-1.5" title={`Estado da Ligação: ${title}`}>
      <Icon size={18} className={`${color} transition-colors`} />
      <span className={`hidden sm:inline text-xs font-mono font-semibold ${color} transition-colors`}>
        {realtimeStatus === 'connected' && ping !== null ? `${ping}ms` : '--'}
      </span>
    </div>
  );
};

export default PingIndicator;