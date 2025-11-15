import React, { useRef, useEffect, useState } from 'react';
import { Cafe, Table, ThemeSettings } from '../types';
import QRCode from 'qrcode';
import { X, Printer, QrCode, AlertTriangle } from 'lucide-react';

const TableQRCodeModal: React.FC<{
  table: Table;
  cafe: Cafe;
  theme: ThemeSettings;
  onClose: () => void;
}> = ({ table, cafe, theme, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [kioskEnabled, setKioskEnabled] = useState(false);
  
  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => {
        document.body.classList.remove('modal-open');
    };
  }, []);

  const url = `https://cafe-control-app.vercel.app/#/menu/${cafe.id}/${table.id}${kioskEnabled ? '?kiosk=true' : ''}`;

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, { width: 256, margin: 2, errorCorrectionLevel: 'H', color: { dark: '#4f3b2a', light: '#FFFFFF' } }, (error) => {
        if (error) console.error("Falha ao gerar QR Code:", error);
      });
    }
  }, [url]);

  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL();
    const printWindow = window.open('', '_blank');
    
    const logoHtml = theme.logoUrl
      ? `<img class="logo-img" src="${theme.logoUrl}" alt="${cafe.name} Logo" />`
      : `<h1 class="cafe-name">${cafe.name}</h1>`;

    if (printWindow) {
        printWindow.document.write(`
            <html>
                <head>
                    <title>QR Code para ${table.name} - ${cafe.name}</title>
                    <link rel="preconnect" href="https://fonts.googleapis.com">
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
                    <style>
                        @page { size: A6; margin: 0; }
                        @media print {
                            body { background-color: #fff; }
                            .print-container { 
                                box-shadow: none !important; 
                                border: 2px dashed #999; 
                                transform: scale(0.95);
                            }
                        }
                        body {
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            height: 100vh;
                            margin: 0;
                            font-family: 'Inter', sans-serif;
                            background-color: #e5e7eb;
                            -webkit-print-color-adjust: exact;
                        }
                        .print-container {
                            text-align: center;
                            padding: 2rem;
                            border-radius: 16px;
                            background-color: white;
                            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                            width: 350px;
                            box-sizing: border-box;
                        }
                        .logo-img {
                            max-height: 80px;
                            max-width: 250px;
                            object-fit: contain;
                            margin-bottom: 0.5rem;
                        }
                        .cafe-name {
                            font-family: 'Playfair Display', serif;
                            font-size: 2.5rem;
                            color: #111827;
                            margin: 0;
                            line-height: 1.2;
                        }
                        .table-name {
                            font-family: 'Inter', sans-serif;
                            font-weight: 700;
                            font-size: 1.75rem;
                            color: #374151;
                            margin-top: 0.25rem;
                            margin-bottom: 1.5rem;
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                        }
                        .qr-code-img {
                            width: 100%;
                            max-width: 250px;
                            height: auto;
                            border-radius: 12px;
                            margin: 0 auto;
                        }
                        .instructions {
                            margin-top: 1.5rem;
                            color: #4b5563;
                            font-size: 1rem;
                        }
                    </style>
                </head>
                <body>
                    <div class="print-container">
                        ${logoHtml}
                        <h2 class="table-name">${table.name}</h2>
                        <img class="qr-code-img" src="${dataUrl}" alt="QR Code" />
                        <p class="instructions">Aponte a câmara para fazer o seu pedido.</p>
                    </div>
                    <script>
                        window.onload = function() {
                            window.print();
                            window.onafterprint = function() { window.close(); }
                        }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    }
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card w-full max-w-md p-8 text-center relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4" style={{color: 'var(--color-text-secondary)'}}>
          <X size={24} />
        </button>
        <QrCode className="h-16 w-16 mx-auto icon-glow mb-4" style={{ color: 'var(--color-secondary)' }} />
        <h3 className="text-3xl font-bold font-display mb-2">{table.name}</h3>
        <p style={{color: 'var(--color-text-secondary)'}} className="mb-6">Aponte a câmara para este código para ver o menu e fazer pedidos.</p>
        <div className="qr-container-glow relative">
           <canvas ref={canvasRef} />
        </div>
        
        <div className="mt-6">
            <label htmlFor="kiosk-toggle" className="flex items-center justify-center gap-3 cursor-pointer p-2">
                 <span className="font-medium" style={{color: 'var(--color-text-secondary)'}}>Modo Kiosk (Tela Cheia)</span>
                 <button
                    id="kiosk-toggle"
                    role="switch"
                    aria-checked={kioskEnabled}
                    onClick={() => setKioskEnabled(!kioskEnabled)}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-background)] ${kioskEnabled ? 'bg-green-600' : 'bg-stone-600'}`}
                    style={{'--tw-ring-color': 'var(--color-secondary)'} as React.CSSProperties}
                >
                    <span
                        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${kioskEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                </button>
            </label>
        </div>

        <div className="mt-6">
            <button 
                onClick={handlePrint}
                className="w-full premium-gradient-button py-3 text-lg flex items-center justify-center gap-3"
            >
                <Printer size={22}/>
                Imprimir
            </button>
        </div>
      </div>
    </div>
  );
};

export default TableQRCodeModal;