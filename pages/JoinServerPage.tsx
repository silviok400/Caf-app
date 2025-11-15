import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Coffee, Loader2 } from 'lucide-react';

const JoinServerPage: React.FC = () => {
  const { cafeId } = useParams<{ cafeId: string }>();
  const { selectCafe, availableCafes, theme, currentCafe } = useData();
  const navigate = useNavigate();

  useEffect(() => {
    if (cafeId) {
      const cafeExists = availableCafes.some(c => c.id === cafeId);
      if (cafeExists) {
        selectCafe(cafeId);
        navigate('/', { replace: true });
      } else {
        console.error(`Café com o ID ${cafeId} não foi encontrado.`);
        navigate('/select-server', { replace: true });
      }
    }
  }, [cafeId, selectCafe, navigate, availableCafes]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-stone-100 p-4">
      <div className="text-center">
        <div className="flex justify-center mb-4 h-20">
          {theme.logoUrl ? (
            <img src={theme.logoUrl} alt={`${currentCafe?.name} logo`} className="h-full w-auto max-w-[200px] object-contain" />
          ) : (
            <Coffee className="h-16 w-16 text-amber-800 mx-auto" />
          )}
        </div>
        <h2 className="text-2xl font-bold font-display text-stone-800 mt-4">A entrar no café...</h2>
        <p className="text-stone-500 mt-2">A configurar o seu dispositivo. Por favor, aguarde.</p>
        <Loader2 size={32} className="animate-spin text-stone-400 mx-auto mt-6" />
      </div>
    </div>
  );
};

export default JoinServerPage;
