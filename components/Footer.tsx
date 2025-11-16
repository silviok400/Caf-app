import React from 'react';
import { Phone, Mail } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full mt-auto p-4 sm:p-6 md:p-8">
      <div className="glass-card max-w-7xl mx-auto p-6 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
         <div className="flex-shrink-0">
            <p className="font-bold text-base" style={{ color: 'var(--color-text-primary)' }}>Café Control</p>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>© {new Date().getFullYear()} Todos os direitos reservados.</p>
         </div>
         <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
            <div className="text-center">
               <p className="font-semibold text-sm" style={{color: 'var(--color-text-secondary)'}}>Suporte</p>
               <div className="flex items-center gap-2 justify-center">
                 <Phone size={14} style={{ color: 'var(--color-secondary)' }} />
                 <a href="tel:+351935271698" className="text-sm hover:underline" style={{ color: 'var(--color-text-primary)' }}>935 271 698</a>
               </div>
            </div>
             <div className="text-center">
               <p className="font-semibold text-sm" style={{color: 'var(--color-text-secondary)'}}>Email</p>
               <div className="flex items-center gap-2 justify-center">
                 <Mail size={14} style={{ color: 'var(--color-secondary)' }} />
                 <a href="mailto:cafe.control.art@gmail.com" className="text-sm hover:underline" style={{ color: 'var(--color-text-primary)' }}>cafe.control.art@gmail.com</a>
               </div>
             </div>
         </div>
      </div>
    </footer>
  );
};

export default Footer;
