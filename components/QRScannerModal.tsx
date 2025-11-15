import React, { useRef, useEffect, useState } from 'react';

const QRScannerModal: React.FC<{
  onClose: () => void;
  onScan: (data: string) => void;
}> = ({ onClose, onScan }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [error, setLocalError] = useState('');

    useEffect(() => {
        document.body.classList.add('modal-open');
        return () => {
            document.body.classList.remove('modal-open');
        };
    }, []);

    useEffect(() => {
        let animationFrameId: number;

        const startCamera = async () => {
            try {
                if (!('BarcodeDetector' in window)) {
                    setLocalError('Leitor de QR Code não suportado neste navegador.');
                    return;
                }

                streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                if (videoRef.current) {
                    videoRef.current.srcObject = streamRef.current;
                    await videoRef.current.play();

                    const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
                    
                    const detectCode = async () => {
                        if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
                           try {
                                const barcodes = await barcodeDetector.detect(videoRef.current);
                                if (barcodes.length > 0) {
                                    onScan(barcodes[0].rawValue);
                                } else {
                                    animationFrameId = requestAnimationFrame(detectCode);
                                }
                           } catch (e) {
                                console.error("Barcode detection failed:", e);
                                animationFrameId = requestAnimationFrame(detectCode);
                           }
                        }
                    };
                    detectCode();
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                setLocalError('Não foi possível aceder à câmara. Verifique as permissões.');
            }
        };

        startCamera();

        return () => {
            cancelAnimationFrame(animationFrameId);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [onScan]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50 p-4">
            <div className="relative w-full max-w-md bg-stone-800 rounded-lg overflow-hidden shadow-2xl">
                <video ref={videoRef} className="w-full h-auto" playsInline />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-64 h-64 border-4 border-dashed border-white rounded-lg opacity-75"></div>
                </div>
                 <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent">
                    <h3 className="text-white text-lg font-semibold text-center">Aponte para o código QR</h3>
                </div>
            </div>
            {error && <p className="mt-4 text-white bg-red-600 p-3 rounded-md text-sm text-center">{error}</p>}
            <button onClick={onClose} className="mt-6 bg-white text-stone-800 font-bold py-3 px-6 rounded-full text-lg hover:bg-stone-200 transition-colors">
                Cancelar
            </button>
        </div>
    );
};

export default QRScannerModal;