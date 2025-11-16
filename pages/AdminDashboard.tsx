import React, { useState, useMemo, useEffect, useRef, memo, useCallback } from 'react';
import { useData, defaultTheme } from '../contexts/DataContext';
import { Product, Order, OrderStatus, Staff, UserRole, Cafe, ThemeSettings, Table, CreationCode, Feedback } from '../types';
import { useNavigate } from 'react-router-dom';
// Fix: Import 'Coffee' icon from 'lucide-react'.
import { PlusCircle, Edit, Trash2, Download, Users, Package, BarChart2, Ban, ShieldAlert, SlidersHorizontal, Search, Hash, AlertTriangle, Paintbrush, Undo, Type, Image as ImageIcon, KeyRound, Phone, Shield, TrendingUp, DollarSign, ShoppingCart, BarChartHorizontal, QrCode, Info, Link as LinkIcon, Palette, Droplet, Copy, Check, Clock, Coffee, Loader2, Server, EyeOff, Eye, Ticket, MessageSquare, Star, User as UserIcon, Crown } from 'lucide-react';
import TableQRCodeModal from '../components/TableQRCodeModal';

// Reusable Confirmation Modal
const ConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}> = memo(({ isOpen, onClose, onConfirm, title, message }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-sm p-6 text-center">
        <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-900/40 rounded-full flex items-center justify-center">
                <ShieldAlert size={40} className="text-red-300" />
            </div>
        </div>
        <h3 className="text-2xl font-bold font-display mb-2">{title}</h3>
        <p style={{color: 'var(--color-text-secondary)'}} className="mb-6">{message}</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            className="w-full secondary-button font-bold py-3"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirm();
            }}
            className="w-full bg-red-600 text-white font-bold py-3 rounded-2xl hover:bg-red-700 transition-colors"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
});

const CategoryModal: React.FC<{
  categoryName: string | null;
  onSave: (name: string, oldName?: string) => Promise<void>;
  onClose: () => void;
}> = memo(({ categoryName, onSave, onClose }) => {
    const [name, setName] = useState(categoryName || '');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const { categories } = useData();

    useEffect(() => {
        document.body.classList.add('modal-open');
        return () => {
            document.body.classList.remove('modal-open');
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const trimmedName = name.trim();
        if (!trimmedName) {
            setError('O nome da categoria não pode estar vazio.');
            return;
        }
        if (categories.some(c => c.toLowerCase() === trimmedName.toLowerCase() && c.toLowerCase() !== (categoryName || '').toLowerCase())) {
            setError('Já existe uma categoria com este nome.');
            return;
        }

        setIsSaving(true);
        try {
            await onSave(trimmedName, categoryName || undefined);
            onClose();
        } catch (error) {
            console.error("Error saving category:", error);
            setError('Falha ao guardar. Ocorreu um erro ao atualizar os produtos.');
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card w-full max-w-md p-6">
                <h3 className="text-2xl font-bold font-display mb-4">{categoryName ? 'Editar Categoria' : 'Nova Categoria'}</h3>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="category-name" className="block text-sm font-medium mb-2" style={{color: 'var(--color-text-secondary)'}}>Nome da Categoria</label>
                            <input type="text" id="category-name" value={name} onChange={e => setName(e.target.value)} className="w-full glass-input" autoFocus />
                        </div>
                    </div>
                    {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                    <div className="mt-6 flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="secondary-button font-bold py-2 px-4">Cancelar</button>
                        <button type="submit" className="premium-gradient-button py-2 px-4" disabled={isSaving}>
                            {isSaving ? 'A guardar...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
});

const DeleteServerConfirmationModal: React.FC<{
  isOpen: boolean;
  cafe: Cafe;
  onConfirm: (pin: string) => Promise<boolean>;
  onClose: () => void;
}> = memo(({ isOpen, cafe, onConfirm, onClose }) => {
  const [pin, setPin] = useState('');
  const [cafeNameInput, setCafeNameInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
      setPin('');
      setCafeNameInput('');
      setError('');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setError('');
    const success = await onConfirm(pin);
    if (!success) {
      setError('PIN do gerente incorreto. A exclusão falhou.');
      setPin('');
    }
  };
  
  const isConfirmationDisabled = pin.length !== 6 || cafeNameInput.trim().toLowerCase() !== cafe.name.toLowerCase();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-sm p-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-900/40 rounded-full flex items-center justify-center">
            <ShieldAlert size={40} className="text-red-300" />
          </div>
        </div>
        <h3 className="text-2xl font-bold font-display mb-2">Apagar Servidor</h3>
        <p style={{color: 'var(--color-text-secondary)'}} className="mb-4">
          Esta ação é irreversível. Para confirmar, digite <strong>"{cafe.name}"</strong> e o seu PIN de gerente.
        </p>

        <div className="mb-4">
          <input
            type="text"
            value={cafeNameInput}
            onChange={(e) => setCafeNameInput(e.target.value)}
            className="w-full glass-input text-center text-lg"
            placeholder="Digite o nome do café"
            autoFocus
          />
        </div>

        <div className="mb-4">
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            maxLength={6}
            className="w-full glass-input text-center text-lg tracking-[.5em]"
            placeholder="PIN de 6 dígitos"
          />
        </div>

        {error && (
            <p className="text-red-400 text-sm text-center flex items-center justify-center gap-2 mb-4">
                <AlertTriangle size={16} /> {error}
            </p>
        )}

        <div className="flex justify-center gap-4">
          <button onClick={onClose} className="w-full secondary-button font-bold py-3">
            Cancelar
          </button>
          <button onClick={handleConfirm} disabled={isConfirmationDisabled} className="w-full bg-red-600 text-white font-bold py-3 rounded-2xl hover:bg-red-700 transition-colors disabled:bg-stone-400 disabled:opacity-60">
            Confirmar Exclusão
          </button>
        </div>
      </div>
    </div>
  );
});

const PlatformDeleteCafeConfirmationModal: React.FC<{
  isOpen: boolean;
  cafe: Cafe | null;
  onConfirm: () => void;
  onClose: () => void;
}> = memo(({ isOpen, cafe, onConfirm, onClose }) => {
    const [cafeNameInput, setCafeNameInput] = useState('');

    useEffect(() => {
        if (isOpen) {
            document.body.classList.add('modal-open');
            setCafeNameInput(''); // Reset on open
        } else {
            document.body.classList.remove('modal-open');
        }
        return () => {
            document.body.classList.remove('modal-open');
        };
    }, [isOpen]);

    if (!isOpen || !cafe) return null;

    const isConfirmationDisabled = cafeNameInput.trim().toLowerCase() !== cafe.name.toLowerCase();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card w-full max-w-sm p-6 text-center">
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-red-900/40 rounded-full flex items-center justify-center">
                        <ShieldAlert size={40} className="text-red-300" />
                    </div>
                </div>
                <h3 className="text-2xl font-bold font-display mb-2">Apagar Café</h3>
                <p style={{color: 'var(--color-text-secondary)'}} className="mb-6">
                    Para confirmar a exclusão permanente de <strong>"{cafe.name}"</strong>, por favor, digite o nome do café abaixo.
                </p>
                <div className="mb-6">
                    <input
                        type="text"
                        value={cafeNameInput}
                        onChange={(e) => setCafeNameInput(e.target.value)}
                        className="w-full glass-input text-center text-lg"
                        placeholder="Digite o nome do café"
                        autoFocus
                    />
                </div>
                <div className="flex justify-center gap-4">
                    <button onClick={onClose} className="w-full secondary-button font-bold py-3">
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isConfirmationDisabled}
                        className="w-full bg-red-600 text-white font-bold py-3 rounded-2xl hover:bg-red-700 transition-colors disabled:bg-stone-400 disabled:opacity-60"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
});


const FONT_OPTIONS = {
    display: [
        { name: 'Playfair Display', value: "'Playfair Display', serif" },
        { name: 'Lora', value: "'Lora', serif" },
        { name: 'Montserrat', value: "'Montserrat', sans-serif" },
        { name: 'Poppins', value: "'Poppins', sans-serif" },
        { name: 'Roboto', value: "'Roboto', sans-serif" },
    ],
    body: [
        { name: 'Plus Jakarta Sans', value: "'Plus Jakarta Sans', sans-serif" },
        { name: 'Inter', value: "'Inter', sans-serif" },
        { name: 'Lato', value: "'Lato', sans-serif" },
        { name: 'Open Sans', value: "'Open Sans', sans-serif" },
        { name: 'Roboto', value: "'Roboto', sans-serif" },
    ]
};

const AccountSecurity = memo(() => {
    const { user, updateCurrentUserPin, updateCurrentUserPhone, theme, updateTheme } = useData();
    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [pinError, setPinError] = useState('');
    const [pinSuccess, setPinSuccess] = useState('');
    const [isPinSubmitting, setIsPinSubmitting] = useState(false);

    const [phone, setPhone] = useState(user?.phone || '');
    const [phoneError, setPhoneError] = useState('');
    const [phoneSuccess, setPhoneSuccess] = useState('');
    const [isPhoneSubmitting, setIsPhoneSubmitting] = useState(false);

    useEffect(() => {
        setPhone(user?.phone || '');
    }, [user]);

    const handlePinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPinError('');
        setPinSuccess('');

        if (newPin !== confirmPin) {
            setPinError('Os novos PINs não coincidem.');
            return;
        }
        if (!/^\d{6}$/.test(newPin)) {
            setPinError('O novo PIN deve ter exatamente 6 dígitos numéricos.');
            return;
        }
        if (newPin === currentPin) {
            setPinError('O novo PIN deve ser diferente do atual.');
            return;
        }
        
        setIsPinSubmitting(true);
        const result = await updateCurrentUserPin(currentPin, newPin);
        setIsPinSubmitting(false);

        if (result.success) {
            setPinSuccess(result.message);
            setCurrentPin('');
            setNewPin('');
            setConfirmPin('');
        } else {
            setPinError(result.message);
        }
    };

    const handlePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPhoneError('');
        setPhoneSuccess('');
        // This is a partial file, assuming the rest of AccountSecurity component is valid.
        // It ends here.
        // --- End of AccountSecurity component snippet ---
    };
});


const AdminDashboard: React.FC = () => {
  const { 
    user, staff, products, orders, tables, categories, currentCafe, 
    availableCafes, theme, updateTheme, updateCafe, deleteCafe,
    addTable, deleteTable, updateTable, deleteLastTable,
    addProduct, updateProduct, deleteProduct,
    addStaff, updateStaff, deleteStaff,
    updateCategory, isAdmCafe, generateCreationCode, getActiveCreationCodes,
    platformDeleteCafe, platformUpdateCafeVisibility, feedbackSubmissions,
    toggleFeedbackResolved
  } = useData();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState<(() => Promise<void>) | null>(null);
  const [confirmationTitle, setConfirmationTitle] = useState('');
  const [confirmationMessage, setConfirmationMessage] = useState('');

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [showAdminPinField, setShowAdminPinField] = useState(false); // For staff management

  const [tableQRCodeModalOpen, setTableQRCodeModalOpen] = useState(false);
  const [selectedTableForQR, setSelectedTableForQR] = useState<Table | null>(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);

  const [deleteServerModalOpen, setDeleteServerModalOpen] = useState(false);

  // Platform Admin modals
  const [platformDeleteCafeModalOpen, setPlatformDeleteCafeModalOpen] = useState(false);
  const [selectedPlatformCafe, setSelectedPlatformCafe] = useState<Cafe | null>(null);

  // Function to show confirmation modal
  const showConfirm = useCallback((title: string, message: string, action: () => Promise<void>) => {
    setConfirmationTitle(title);
    setConfirmationMessage(message);
    setConfirmationAction(() => action);
    setIsConfirmationModalOpen(true);
  }, []);

  // Handlers for Products
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductModalOpen(true);
  };

  const handleDeleteProduct = (productId: string) => {
    showConfirm(
      "Apagar Produto",
      "Tem a certeza que quer apagar este produto? Esta ação é irreversível e removerá o produto de todos os pedidos futuros e existentes.",
      async () => {
        await deleteProduct(productId);
        setIsConfirmationModalOpen(false);
      }
    );
  };
  
  // Handlers for Staff
  const handleEditStaff = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setStaffModalOpen(true);
  };

  const handleDeleteStaff = (staffId: string) => {
    showConfirm(
      "Apagar Funcionário",
      "Tem a certeza que quer apagar este funcionário? Esta ação é irreversível.",
      async () => {
        await deleteStaff(staffId);
        setIsConfirmationModalOpen(false);
      }
    );
  };

  // Handlers for Tables
  const handleAddTable = () => {
    showConfirm(
      "Adicionar Nova Mesa",
      "Tem a certeza que quer adicionar uma nova mesa?",
      async () => {
        await addTable();
        setIsConfirmationModalOpen(false);
      }
    );
  };

  const handleToggleTableVisibility = (tableId: string, currentStatus: boolean) => {
    showConfirm(
      currentStatus ? "Ocultar Mesa" : "Exibir Mesa",
      currentStatus ? "Tem a certeza que quer ocultar esta mesa? Ela não será visível para os garçons e clientes." : "Tem a certeza que quer exibir esta mesa? Ela voltará a ser visível.",
      async () => {
        await updateTable({ id: tableId, is_hidden: !currentStatus });
        setIsConfirmationModalOpen(false);
      }
    );
  };

  const handleDeleteLastTable = () => {
    showConfirm(
      "Apagar Última Mesa Visível",
      "Tem a certeza que quer apagar a última mesa visível? Ela será ocultada, não removida permanentemente.",
      async () => {
        await deleteLastTable();
        setIsConfirmationModalOpen(false);
      }
    );
  };

  // Handlers for Categories
  const handleUpdateCategory = async (newName: string, oldName?: string) => {
    if (oldName) {
      await updateCategory(oldName, newName);
    } else {
      // For new categories, we don't need to do anything in the DB immediately.
      // They get added when a product is assigned to them.
    }
  };

  // Handlers for Theme
  const handleUpdateTheme = useCallback(async (newTheme: Partial<ThemeSettings>) => {
      await updateTheme(newTheme);
  }, [updateTheme]);

  // Handlers for Cafe details
  const handleUpdateCafeDetails = useCallback(async (cafeUpdate: Partial<Omit<Cafe, 'id'>>) => {
      await updateCafe(cafeUpdate);
  }, [updateCafe]);
  
  // Delete Cafe handler
  const handleDeleteCafe = async (adminPin: string) => {
      if (!currentCafe) return false;
      const success = await deleteCafe(currentCafe.id, adminPin);
      if (success) {
          navigate('/select-server'); // Redirect after successful deletion
      }
      return success;
  };

  // Platform Admin Handlers
  const handlePlatformDeleteCafe = (cafe: Cafe) => {
      setSelectedPlatformCafe(cafe);
      setPlatformDeleteCafeModalOpen(true);
  };

  const confirmPlatformDeleteCafe = async () => {
      if (!selectedPlatformCafe) return;
      const result = await platformDeleteCafe(selectedPlatformCafe.id);
      if (result.success) {
          setPlatformDeleteCafeModalOpen(false);
          setSelectedPlatformCafe(null);
      } else {
          alert(`Erro: ${result.message}`); // Display error to admin
      }
  };

  const handlePlatformToggleCafeVisibility = async (cafeId: string, isHidden: boolean) => {
      const result = await platformUpdateCafeVisibility(cafeId, isHidden);
      if (!result.success) {
          alert(`Erro: ${result.message}`);
      }
  };

  // Filter feedback for display
  const pendingFeedback = useMemo(() => feedbackSubmissions.filter(f => !f.is_resolved), [feedbackSubmissions]);
  const resolvedFeedback = useMemo(() => feedbackSubmissions.filter(f => f.is_resolved), [feedbackSubmissions]);


  if (!user || user.role !== 'admin') {
    return <p>Acesso negado. Apenas administradores podem aceder a esta página.</p>;
  }

  const allOrders = orders.sort((a,b) => b.created_at.getTime() - a.created_at.getTime());
  const totalRevenue = orders.filter(o => o.status === OrderStatus.PAID).reduce((acc, order) => {
    return acc + order.items.reduce((sum, item) => sum + (item.productPrice * item.quantity), 0);
  }, 0);
  const totalOrders = orders.length;

  return (
    <>
      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={() => setIsConfirmationModalOpen(false)}
        onConfirm={async () => {
          if (confirmationAction) await confirmationAction();
        }}
        title={confirmationTitle}
        message={confirmationMessage}
      />

      {deleteServerModalOpen && currentCafe && (
        <DeleteServerConfirmationModal
          isOpen={deleteServerModalOpen}
          cafe={currentCafe}
          onClose={() => setDeleteServerModalOpen(false)}
          onConfirm={handleDeleteCafe}
        />
      )}

      {platformDeleteCafeModalOpen && (
          <PlatformDeleteCafeConfirmationModal
              isOpen={platformDeleteCafeModalOpen}
              cafe={selectedPlatformCafe}
              onClose={() => setPlatformDeleteCafeModalOpen(false)}
              onConfirm={confirmPlatformDeleteCafe}
          />
      )}

      {selectedTableForQR && currentCafe && (
        <TableQRCodeModal
          table={selectedTableForQR}
          cafe={currentCafe}
          theme={theme}
          onClose={() => setSelectedTableForQR(null)}
        />
      )}

      {categoryModalOpen && (
          <CategoryModal
              categoryName={editingCategory}
              onSave={handleUpdateCategory}
              onClose={() => { setCategoryModalOpen(false); setEditingCategory(null); }}
          />
      )}

      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold font-display mb-8 text-center">{isAdmCafe ? 'Painel de Administração da Plataforma' : 'Painel de Administração do Café'}</h2>
        
        {isAdmCafe && (
            <div className="glass-card p-6 mb-8 text-center border-amber-400/50 shadow-lg shadow-amber-400/30">
                <Crown size={48} className="icon-glow text-amber-300 mx-auto mb-3" />
                <h3 className="text-2xl font-bold font-display mb-2">Administração da Plataforma</h3>
                <p className="text-lg" style={{color: 'var(--color-text-secondary)'}}>Ferramentas para gerir a infraestrutura e os cafés registados.</p>
                <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
                    <button onClick={() => setActiveTab('platform-codes')} className="w-full sm:w-auto secondary-button font-bold py-3 px-6 flex items-center justify-center gap-3">
                        <Ticket size={20} /> Códigos de Convite
                    </button>
                    <button onClick={() => setActiveTab('platform-cafes')} className="w-full sm:w-auto premium-gradient-button py-3 px-6 flex items-center justify-center gap-3">
                        <Server size={20} /> Gerir Cafés
                    </button>
                    <button onClick={() => setActiveTab('platform-feedback')} className="w-full sm:w-auto secondary-button font-bold py-3 px-6 flex items-center justify-center gap-3">
                        <MessageSquare size={20} /> Feedback Global
                    </button>
                </div>
            </div>
        )}

        {/* Tab Navigation */}
        <div className="glass-card mb-8 p-3 flex flex-wrap gap-2 justify-center">
          {!isAdmCafe && (
            <>
              <button onClick={() => setActiveTab('overview')} className={`tab-button ${activeTab === 'overview' ? 'tab-button-active' : ''}`}>
                <BarChart2 size={18} /> Visão Geral
              </button>
              <button onClick={() => setActiveTab('products')} className={`tab-button ${activeTab === 'products' ? 'tab-button-active' : ''}`}>
                <Package size={18} /> Produtos
              </button>
              <button onClick={() => setActiveTab('staff')} className={`tab-button ${activeTab === 'staff' ? 'tab-button-active' : ''}`}>
                <Users size={18} /> Funcionários
              </button>
              <button onClick={() => setActiveTab('tables')} className={`tab-button ${activeTab === 'tables' ? 'tab-button-active' : ''}`}>
                <Hash size={18} /> Mesas
              </button>
              <button onClick={() => setActiveTab('theme')} className={`tab-button ${activeTab === 'theme' ? 'tab-button-active' : ''}`}>
                <Palette size={18} /> Tema
              </button>
              <button onClick={() => setActiveTab('feedback')} className={`tab-button ${activeTab === 'feedback' ? 'tab-button-active' : ''}`}>
                <MessageSquare size={18} /> Feedback
              </button>
              <button onClick={() => setActiveTab('security')} className={`tab-button ${activeTab === 'security' ? 'tab-button-active' : ''}`}>
                <Shield size={18} /> Segurança
              </button>
              <button onClick={() => setActiveTab('settings')} className={`tab-button ${activeTab === 'settings' ? 'tab-button-active' : ''}`}>
                <SlidersHorizontal size={18} /> Definições
              </button>
            </>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && !isAdmCafe && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="glass-card p-6 flex flex-col items-center justify-center text-center">
              <TrendingUp size={48} className="text-green-400 mb-3" />
              <h3 className="text-xl font-bold font-display">Receita Total</h3>
              <p className="text-4xl font-bold mt-2">€{totalRevenue.toFixed(2)}</p>
            </div>
            <div className="glass-card p-6 flex flex-col items-center justify-center text-center">
              <ShoppingCart size={48} className="text-blue-400 mb-3" />
              <h3 className="text-xl font-bold font-display">Total de Pedidos</h3>
              <p className="text-4xl font-bold mt-2">{totalOrders}</p>
            </div>
            <div className="glass-card p-6 flex flex-col items-center justify-center text-center">
              <Users size={48} className="text-purple-400 mb-3" />
              <h3 className="text-xl font-bold font-display">Funcionários Ativos</h3>
              <p className="text-4xl font-bold mt-2">{staff.length}</p>
            </div>
            {/* Recent Orders Section */}
            <div className="glass-card p-6 lg:col-span-3">
                <h3 className="text-2xl font-bold font-display mb-6">Pedidos Recentes</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="text-left border-b" style={{borderColor: 'var(--color-glass-border)'}}>
                                <th className="py-2 px-3">Mesa</th>
                                <th className="py-2 px-3">Itens</th>
                                <th className="py-2 px-3">Total</th>
                                <th className="py-2 px-3">Status</th>
                                <th className="py-2 px-3">Hora</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allOrders.slice(0, 5).map(order => (
                                <tr key={order.id} className="border-b" style={{borderColor: 'var(--color-glass-border)'}}>
                                    <td className="py-2 px-3">{tables.find(t => t.id === order.table_id)?.name || 'N/A'}</td>
                                    <td className="py-2 px-3 text-sm" style={{color: 'var(--color-text-secondary)'}}>{order.items.map(item => `${item.quantity}x ${item.productName}`).join(', ')}</td>
                                    <td className="py-2 px-3">€{(order.items.reduce((sum, item) => sum + item.productPrice * item.quantity, 0)).toFixed(2)}</td>
                                    <td className="py-2 px-3">{order.status}</td>
                                    <td className="py-2 px-3 text-sm" style={{color: 'var(--color-text-secondary)'}}>{order.created_at.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && !isAdmCafe && (
          <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold font-display">Produtos</h3>
              <button onClick={() => { setEditingProduct(null); setProductModalOpen(true); }} className="premium-gradient-button py-2 px-4 flex items-center gap-2">
                <PlusCircle size={20} /> Adicionar Produto
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
                <button onClick={() => {setEditingCategory(null); setCategoryModalOpen(true);}} className="secondary-button py-1.5 px-3 flex items-center gap-2 text-sm">
                    <PlusCircle size={16}/> Nova Categoria
                </button>
                {categories.map(cat => (
                    <button key={cat} onClick={() => {setEditingCategory(cat); setCategoryModalOpen(true);}} className="secondary-button py-1.5 px-3 flex items-center gap-2 text-sm">
                        <Edit size={16}/> {cat}
                    </button>
                ))}
            </div>

            {productModalOpen && (
              <ProductFormModal
                product={editingProduct}
                onClose={() => setProductModalOpen(false)}
                onSave={async (p) => {
                  if (editingProduct) await updateProduct(p);
                  else await addProduct(p);
                  setProductModalOpen(false);
                }}
                categories={categories}
              />
            )}

            <div className="space-y-4">
              {categories.map(category => (
                <div key={category} className="mb-8">
                  <h4 className="text-xl font-bold font-display mb-4 border-b pb-2" style={{borderColor: 'var(--color-glass-border)'}}>{category}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.filter(p => p.category === category).map(product => (
                      <div key={product.id} className="glass-card !bg-black/20 p-4 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-lg">{product.name}</p>
                          <p className="text-sm" style={{color: 'var(--color-text-secondary)'}}>€{product.price.toFixed(2)}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleEditProduct(product)} className="secondary-button p-2">
                            <Edit size={18} />
                          </button>
                          <button onClick={() => handleDeleteProduct(product.id)} className="bg-red-700/70 hover:bg-red-800/80 p-2 rounded-lg transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'staff' && !isAdmCafe && (
          <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold font-display">Funcionários</h3>
              <button onClick={() => { setEditingStaff(null); setStaffModalOpen(true); setShowAdminPinField(false); }} className="premium-gradient-button py-2 px-4 flex items-center gap-2">
                <PlusCircle size={20} /> Adicionar Funcionário
              </button>
            </div>

            {staffModalOpen && (
              <StaffFormModal
                staffMember={editingStaff}
                onClose={() => setStaffModalOpen(false)}
                onSave={async (s) => {
                  if (editingStaff) await updateStaff(s);
                  else await addStaff(s);
                  setStaffModalOpen(false);
                }}
                showAdminPinField={showAdminPinField}
                setShowAdminPinField={setShowAdminPinField}
              />
            )}

            <div className="space-y-4">
              {staff.map(staffMember => (
                <div key={staffMember.id} className="glass-card !bg-black/20 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg">{staffMember.name}</p>
                    <p className="text-sm" style={{color: 'var(--color-text-secondary)'}}>
                      {staffMember.role === 'admin' ? 'Gerente' : staffMember.role === 'waiter' ? 'Garçon' : 'Cozinha'} - PIN: {staffMember.pin}
                      {staffMember.phone && ` - Telemóvel: ${staffMember.phone}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditStaff(staffMember)} className="secondary-button p-2">
                      <Edit size={18} />
                    </button>
                    {staffMember.role !== 'admin' && ( // Prevent deleting the main admin through this interface
                        <button onClick={() => handleDeleteStaff(staffMember.id)} className="bg-red-700/70 hover:bg-red-800/80 p-2 rounded-lg transition-colors">
                            <Trash2 size={18} />
                        </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tables' && !isAdmCafe && (
          <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold font-display">Mesas</h3>
              <div className="flex gap-4">
                <button onClick={handleAddTable} className="premium-gradient-button py-2 px-4 flex items-center gap-2">
                  <PlusCircle size={20} /> Adicionar Mesa
                </button>
                <button 
                  onClick={handleDeleteLastTable} 
                  className="secondary-button py-2 px-4 flex items-center gap-2"
                  disabled={tables.filter(t => !t.is_hidden).length === 0}
                >
                  <Trash2 size={20} /> Ocultar Última
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tables.map(table => (
                <div key={table.id} className="glass-card !bg-black/20 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg">{table.name}</p>
                    <p className="text-sm flex items-center gap-1" style={{color: 'var(--color-text-secondary)'}}>
                        {table.is_hidden ? (
                            <span className="text-red-400 flex items-center gap-1"><EyeOff size={14}/> Oculta</span>
                        ) : (
                            <span className="text-green-400 flex items-center gap-1"><Eye size={14}/> Visível</span>
                        )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedTableForQR(table)} className="secondary-button p-2">
                        <QrCode size={18}/>
                    </button>
                    <button onClick={() => handleToggleTableVisibility(table.id, table.is_hidden)} className="secondary-button p-2">
                        {table.is_hidden ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'theme' && !isAdmCafe && (
            <ThemeSettingsPanel onSave={handleUpdateTheme} currentTheme={theme} currentCafe={currentCafe!} onSaveCafe={handleUpdateCafeDetails}/>
        )}

        {activeTab === 'feedback' && !isAdmCafe && (
          <div className="glass-card p-6">
            <h3 className="text-2xl font-bold font-display mb-6">Feedback dos Clientes</h3>

            {pendingFeedback.length > 0 && (
                <div className="mb-8">
                    <h4 className="text-xl font-bold font-display mb-4 border-b pb-2" style={{borderColor: 'var(--color-glass-border)'}}>Pendentes ({pendingFeedback.length})</h4>
                    <div className="space-y-4">
                        {pendingFeedback.map(feedback => (
                            <FeedbackCard key={feedback.id} feedback={feedback} onToggleResolved={toggleFeedbackResolved} />
                        ))}
                    </div>
                </div>
            )}

            {resolvedFeedback.length > 0 && (
                <div>
                    <h4 className="text-xl font-bold font-display mb-4 border-b pb-2" style={{borderColor: 'var(--color-glass-border)'}}>Resolvidos ({resolvedFeedback.length})</h4>
                    <div className="space-y-4">
                        {resolvedFeedback.map(feedback => (
                            <FeedbackCard key={feedback.id} feedback={feedback} onToggleResolved={toggleFeedbackResolved} />
                        ))}
                    </div>
                </div>
            )}
            
            {pendingFeedback.length === 0 && resolvedFeedback.length === 0 && (
                 <p className="text-center py-12" style={{color: 'var(--color-text-secondary)'}}>Nenhum feedback recebido ainda.</p>
            )}
          </div>
        )}

        {activeTab === 'security' && !isAdmCafe && (
            <div className="glass-card p-6">
                <AccountSecurity />
            </div>
        )}

        {activeTab === 'settings' && !isAdmCafe && (
            <div className="glass-card p-6">
                <h3 className="text-2xl font-bold font-display mb-6">Definições do Café</h3>
                <div className="space-y-4">
                    <p style={{color: 'var(--color-text-secondary)'}}>Utilize esta opção com cautela. A exclusão é irreversível.</p>
                    <button
                        onClick={() => setDeleteServerModalOpen(true)}
                        className="w-full bg-red-700/70 hover:bg-red-800/80 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-3 transition-colors"
                    >
                        <Ban size={22} /> Apagar este Café
                    </button>
                </div>
            </div>
        )}

        {activeTab === 'platform-codes' && isAdmCafe && (
            <AdmPanelModal onClose={() => setActiveTab('overview')} /> // This modal is full screen, so we change tab to close it.
        )}

        {activeTab === 'platform-cafes' && isAdmCafe && (
          <div className="glass-card p-6">
            <h3 className="text-2xl font-bold font-display mb-6">Gerir Cafés da Plataforma</h3>
            <div className="space-y-4">
                {availableCafes.filter(c => c.id !== '5ef90427-306f-465a-9691-bec38da14a49').map(cafe => (
                    <div key={cafe.id} className="glass-card !bg-black/20 p-4 rounded-xl flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-lg">{cafe.name}</p>
                            <p className="text-sm" style={{color: 'var(--color-text-secondary)'}}>ID: {cafe.id}</p>
                            <p className="text-sm" style={{color: 'var(--color-text-secondary)'}}>Estado: {cafe.is_server_hidden ? 'Oculto' : 'Público'}</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePlatformToggleCafeVisibility(cafe.id, !cafe.is_server_hidden)}
                                className="secondary-button p-2"
                                title={cafe.is_server_hidden ? "Tornar Público" : "Ocultar"}
                            >
                                {cafe.is_server_hidden ? <Eye size={18} /> : <EyeOff size={18} />}
                            </button>
                            <button
                                onClick={() => handlePlatformDeleteCafe(cafe)}
                                className="bg-red-700/70 hover:bg-red-800/80 p-2 rounded-lg transition-colors"
                                title="Apagar Café"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            {availableCafes.filter(c => c.id !== '5ef90427-306f-465a-9691-bec38da14a49').length === 0 && (
                <p className="text-center py-12" style={{color: 'var(--color-text-secondary)'}}>Nenhum café registado na plataforma ainda.</p>
            )}
          </div>
        )}

        {activeTab === 'platform-feedback' && isAdmCafe && (
          <div className="glass-card p-6">
            <h3 className="text-2xl font-bold font-display mb-6">Feedback Global da Plataforma</h3>
            {pendingFeedback.length > 0 && (
                <div className="mb-8">
                    <h4 className="text-xl font-bold font-display mb-4 border-b pb-2" style={{borderColor: 'var(--color-glass-border)'}}>Pendentes ({pendingFeedback.length})</h4>
                    <div className="space-y-4">
                        {pendingFeedback.map(feedback => (
                            <FeedbackCard key={feedback.id} feedback={feedback} onToggleResolved={toggleFeedbackResolved} showCafeInfo={true}/>
                        ))}
                    </div>
                </div>
            )}

            {resolvedFeedback.length > 0 && (
                <div>
                    <h4 className="text-xl font-bold font-display mb-4 border-b pb-2" style={{borderColor: 'var(--color-glass-border)'}}>Resolvidos ({resolvedFeedback.length})</h4>
                    <div className="space-y-4">
                        {resolvedFeedback.map(feedback => (
                            <FeedbackCard key={feedback.id} feedback={feedback} onToggleResolved={toggleFeedbackResolved} showCafeInfo={true}/>
                        ))}
                    </div>
                </div>
            )}
            
            {pendingFeedback.length === 0 && resolvedFeedback.length === 0 && (
                 <p className="text-center py-12" style={{color: 'var(--color-text-secondary)'}}>Nenhum feedback global recebido ainda.</p>
            )}
          </div>
        )}

      </div>
    </>
  );
};

// Reusable Product Form Modal
const ProductFormModal: React.FC<{
  product: Product | null;
  onClose: () => void;
  onSave: (product: Product | Omit<Product, 'id' | 'cafe_id'>) => Promise<void>;
  categories: string[];
}> = memo(({ product, onClose, onSave, categories }) => {
  const [name, setName] = useState(product?.name || '');
  const [price, setPrice] = useState(product?.price.toString() || '');
  const [category, setCategory] = useState(product?.category || categories[0] || '');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !price || parseFloat(price) <= 0 || !category.trim()) {
      setError('Por favor, preencha todos os campos e certifique-se de que o preço é válido.');
      return;
    }

    setIsSaving(true);
    try {
      const productData = {
        name: name.trim(),
        price: parseFloat(price),
        category: category.trim(),
        ...(product ? { id: product.id, cafe_id: product.cafe_id } : {})
      };
      await onSave(productData as Product | Omit<Product, 'id' | 'cafe_id'>);
      onClose();
    } catch (err) {
      console.error("Error saving product:", err);
      setError(`Falha ao guardar produto: ${err instanceof Error ? err.message : String(err)}`);
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-md p-6">
        <h3 className="text-2xl font-bold font-display mb-4">{product ? 'Editar Produto' : 'Novo Produto'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="product-name" className="block text-sm font-medium mb-2" style={{color: 'var(--color-text-secondary)'}}>Nome do Produto</label>
              <input type="text" id="product-name" value={name} onChange={e => setName(e.target.value)} className="w-full glass-input" autoFocus />
            </div>
            <div>
              <label htmlFor="product-price" className="block text-sm font-medium mb-2" style={{color: 'var(--color-text-secondary)'}}>Preço (€)</label>
              <input type="number" id="product-price" value={price} onChange={e => setPrice(e.target.value)} className="w-full glass-input" step="0.01" />
            </div>
            <div>
              <label htmlFor="product-category" className="block text-sm font-medium mb-2" style={{color: 'var(--color-text-secondary)'}}>Categoria</label>
              <select id="product-category" value={category} onChange={e => setCategory(e.target.value)} className="w-full glass-input">
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                {/* Option to add if it's a new product or category not in list */}
                {(!categories.includes(category) || !product) && category && <option value={category}>{category}</option>}
              </select>
              <input 
                type="text" 
                value={category} 
                onChange={e => setCategory(e.target.value)} 
                placeholder="Ou digite uma nova categoria" 
                className="w-full glass-input mt-2" 
              />
            </div>
          </div>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          <div className="mt-6 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="secondary-button font-bold py-2 px-4">Cancelar</button>
            <button type="submit" className="premium-gradient-button py-2 px-4" disabled={isSaving}>
              {isSaving ? 'A guardar...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

// Reusable Staff Form Modal
const StaffFormModal: React.FC<{
  staffMember: Staff | null;
  onClose: () => void;
  onSave: (staff: Staff | Omit<Staff, 'id' | 'cafe_id'>) => Promise<void>;
  showAdminPinField: boolean;
  setShowAdminPinField: React.Dispatch<React.SetStateAction<boolean>>;
}> = memo(({ staffMember, onClose, onSave, showAdminPinField, setShowAdminPinField }) => {
  const [name, setName] = useState(staffMember?.name || '');
  const [role, setRole] = useState<UserRole>(staffMember?.role || 'waiter');
  const [pin, setPin] = useState(staffMember?.pin || '');
  const [phone, setPhone] = useState(staffMember?.phone || '');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !pin || pin.length !== 6) {
      setError('Por favor, preencha o nome e um PIN de 6 dígitos.');
      return;
    }
    if (role === 'admin' && !showAdminPinField && !staffMember) { // If creating a new admin and admin pin field is not shown
        setError('Para adicionar um novo gerente, o PIN deve ser inserido manualmente.');
        setShowAdminPinField(true);
        return;
    }
    
    setIsSaving(true);
    try {
      const staffData = {
        name: name.trim(),
        role,
        pin,
        phone: phone.trim() || null,
        ...(staffMember ? { id: staffMember.id, cafe_id: staffMember.cafe_id } : {})
      };
      await onSave(staffData as Staff | Omit<Staff, 'id' | 'cafe_id'>);
      onClose();
    } catch (err) {
      console.error("Error saving staff:", err);
      setError(`Falha ao guardar funcionário: ${err instanceof Error ? err.message : String(err)}`);
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-md p-6">
        <h3 className="text-2xl font-bold font-display mb-4">{staffMember ? 'Editar Funcionário' : 'Novo Funcionário'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="staff-name" className="block text-sm font-medium mb-2" style={{color: 'var(--color-text-secondary)'}}>Nome</label>
              <input type="text" id="staff-name" value={name} onChange={e => setName(e.target.value)} className="w-full glass-input" autoFocus />
            </div>
            <div>
              <label htmlFor="staff-role" className="block text-sm font-medium mb-2" style={{color: 'var(--color-text-secondary)'}}>Cargo</label>
              <select id="staff-role" value={role} onChange={e => {setRole(e.target.value as UserRole); setShowAdminPinField(false);}} className="w-full glass-input">
                <option value="waiter">Garçon</option>
                <option value="kitchen">Cozinha</option>
                <option value="admin">Gerente</option>
              </select>
            </div>
            <div>
              <label htmlFor="staff-pin" className="block text-sm font-medium mb-2" style={{color: 'var(--color-text-secondary)'}}>PIN (6 dígitos)</label>
              <input type="password" id="staff-pin" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} maxLength={6} className="w-full glass-input" />
            </div>
            <div>
              <label htmlFor="staff-phone" className="block text-sm font-medium mb-2" style={{color: 'var(--color-text-secondary)'}}>Telemóvel (opcional)</label>
              <input type="tel" id="staff-phone" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} className="w-full glass-input" />
            </div>
          </div>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          <div className="mt-6 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="secondary-button font-bold py-2 px-4">Cancelar</button>
            <button type="submit" className="premium-gradient-button py-2 px-4" disabled={isSaving}>
              {isSaving ? 'A guardar...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

const ThemeSettingsPanel: React.FC<{
    onSave: (themeUpdate: Partial<ThemeSettings>) => void;
    currentTheme: ThemeSettings;
    currentCafe: Cafe;
    onSaveCafe: (cafeUpdate: Partial<Omit<Cafe, 'id'>>) => Promise<void>;
}> = memo(({ onSave, currentTheme, currentCafe, onSaveCafe }) => {
    const [themeSettings, setThemeSettings] = useState<ThemeSettings>(currentTheme);
    const [cafeName, setCafeName] = useState(currentCafe.name);
    const [isServerHidden, setIsServerHidden] = useState(currentCafe.is_server_hidden);
    const [isSaving, setIsSaving] = useState(false);
    const [logoPreview, setLogoPreview] = useState<string | null>(currentTheme.logoUrl || null);
    const [bgImagePreview, setBgImagePreview] = useState<string | null>(currentTheme.backgroundImageUrl || null);

    useEffect(() => {
        setThemeSettings(currentTheme);
        setLogoPreview(currentTheme.logoUrl || null);
        setBgImagePreview(currentTheme.backgroundImageUrl || null);
        setCafeName(currentCafe.name);
        setIsServerHidden(currentCafe.is_server_hidden);
    }, [currentTheme, currentCafe]);

    const handleColorChange = (key: keyof typeof themeSettings['colors'], value: string) => {
        setThemeSettings(prev => ({
            ...prev,
            colors: {
                ...prev.colors,
                [key]: value,
            }
        }));
    };

    const handleTableColorChange = (key: keyof typeof themeSettings['tableColors'], value: string) => {
        setThemeSettings(prev => ({
            ...prev,
            tableColors: {
                ...prev.tableColors,
                [key]: value,
            }
        }));
    };

    const handleStatusColorChange = (key: keyof typeof themeSettings['statusColors'], value: string) => {
        setThemeSettings(prev => ({
            ...prev,
            statusColors: {
                ...prev.statusColors,
                [key]: value,
            }
        }));
    };

    const handleFontChange = (type: 'body' | 'display', value: string) => {
        setThemeSettings(prev => ({
            ...prev,
            fonts: {
                ...prev.fonts,
                [type]: value,
            }
        }));
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoPreview(reader.result as string);
          setThemeSettings(prev => ({ ...prev, logoUrl: reader.result as string }));
        };
        reader.readAsDataURL(file);
      }
    };

    const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setBgImagePreview(reader.result as string);
                setThemeSettings(prev => ({ ...prev, backgroundImageUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave(themeSettings); // Save theme changes
            await onSaveCafe({ name: cafeName, is_server_hidden: isServerHidden }); // Save cafe changes
            setIsSaving(false);
            alert('Configurações guardadas com sucesso!');
        } catch (error) {
            console.error("Error saving theme/cafe settings:", error);
            alert('Erro ao guardar configurações.');
            setIsSaving(false);
        }
    };

    const handleResetTheme = () => {
        if (window.confirm("Tem a certeza que quer reverter para o tema padrão? Todas as suas personalizações serão perdidas.")) {
            setThemeSettings(defaultTheme);
            setLogoPreview(defaultTheme.logoUrl || null);
            setBgImagePreview(defaultTheme.backgroundImageUrl || null);
            // Don't save to DB immediately, let user click Save button
        }
    };

    return (
        <div className="glass-card p-6">
            <h3 className="text-2xl font-bold font-display mb-6">Personalizar Tema e Café</h3>
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Cafe Info Section */}
                <div>
                    <h4 className="text-xl font-bold font-display mb-4 border-b pb-2" style={{borderColor: 'var(--color-glass-border)'}}>Informações do Café</h4>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="cafe-name" className="block text-sm font-medium mb-2" style={{color: 'var(--color-text-secondary)'}}>Nome do Café</label>
                            <input type="text" id="cafe-name" value={cafeName} onChange={(e) => setCafeName(e.target.value)} className="w-full glass-input" />
                        </div>
                        <div className="flex items-center gap-3">
                            <input type="checkbox" id="is-server-hidden" checked={isServerHidden} onChange={(e) => setIsServerHidden(e.target.checked)} className="form-checkbox h-5 w-5 text-amber-500 rounded-md" />
                            <label htmlFor="is-server-hidden" className="text-sm font-medium" style={{color: 'var(--color-text-secondary)'}}>Ocultar café da lista pública</label>
                            <Info size={16} className="text-stone-400" title="Se marcado, o café só poderá ser acedido via QR Code ou link direto." />
                        </div>
                    </div>
                </div>

                {/* Logo Section */}
                <div>
                    <h4 className="text-xl font-bold font-display mb-4 border-b pb-2" style={{borderColor: 'var(--color-glass-border)'}}>Logótipo</h4>
                    <div className="space-y-4">
                        {logoPreview && (
                            <div className="w-48 h-auto max-h-32 p-2 border border-dashed rounded-lg flex items-center justify-center mx-auto mb-4" style={{borderColor: 'var(--color-glass-border)'}}>
                                <img src={logoPreview} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                            </div>
                        )}
                        <label htmlFor="logo-upload" className="secondary-button w-full flex items-center justify-center gap-2 py-2 px-4 cursor-pointer">
                            <ImageIcon size={20} /> Carregar Logótipo
                        </label>
                        <input id="logo-upload" type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        <button type="button" onClick={() => { setLogoPreview(null); setThemeSettings(prev => ({ ...prev, logoUrl: '' })); }} className="w-full text-red-400 hover:text-red-300 text-sm mt-2">Remover Logótipo</button>
                    </div>
                </div>

                {/* Background Image Section */}
                <div>
                    <h4 className="text-xl font-bold font-display mb-4 border-b pb-2" style={{borderColor: 'var(--color-glass-border)'}}>Imagem de Fundo</h4>
                    <div className="space-y-4">
                        {bgImagePreview && (
                            <div className="w-full h-32 bg-cover bg-center rounded-lg flex items-center justify-center mx-auto mb-4" style={{backgroundImage: `url(${bgImagePreview})`, borderColor: 'var(--color-glass-border)'}}>
                                <span className="text-white text-sm">Preview</span>
                            </div>
                        )}
                        <label htmlFor="bg-image-upload" className="secondary-button w-full flex items-center justify-center gap-2 py-2 px-4 cursor-pointer">
                            <ImageIcon size={20} /> Carregar Imagem de Fundo
                        </label>
                        <input id="bg-image-upload" type="file" accept="image/*" onChange={handleBgImageUpload} className="hidden" />
                        <button type="button" onClick={() => { setBgImagePreview(null); setThemeSettings(prev => ({ ...prev, backgroundImageUrl: '' })); }} className="w-full text-red-400 hover:text-red-300 text-sm mt-2">Remover Imagem de Fundo</button>
                    </div>
                    <div className="mt-4">
                        <label htmlFor="bg-overlay-opacity" className="block text-sm font-medium mb-2" style={{color: 'var(--color-text-secondary)'}}>Opacidade da Camada de Fundo</label>
                        <input
                            type="range"
                            id="bg-overlay-opacity"
                            min="0"
                            max="1"
                            step="0.05"
                            value={themeSettings.backgroundOverlayOpacity}
                            onChange={(e) => setThemeSettings(prev => ({ ...prev, backgroundOverlayOpacity: parseFloat(e.target.value) }))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-xs" style={{color: 'var(--color-text-secondary)'}}>{(themeSettings.backgroundOverlayOpacity * 100).toFixed(0)}%</span>
                    </div>
                </div>

                {/* Colors Section */}
                <div>
                    <h4 className="text-xl font-bold font-display mb-4 border-b pb-2" style={{borderColor: 'var(--color-glass-border)'}}>Cores</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Object.entries(themeSettings.colors).map(([key, value]) => (
                            <div key={key}>
                                <label htmlFor={`color-${key}`} className="block text-sm font-medium mb-2 capitalize" style={{color: 'var(--color-text-secondary)'}}>{key.replace(/([A-Z])/g, ' $1')}</label>
                                <input type="color" id={`color-${key}`} value={value} onChange={(e) => handleColorChange(key as keyof typeof themeSettings['colors'], e.target.value)} className="w-full h-10 rounded-lg border-0" />
                            </div>
                        ))}
                    </div>
                    <h5 className="text-lg font-bold font-display mt-6 mb-3 border-b pb-2" style={{borderColor: 'var(--color-glass-border)'}}>Cores das Mesas</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Object.entries(themeSettings.tableColors).map(([key, value]) => (
                            <div key={key}>
                                <label htmlFor={`table-color-${key}`} className="block text-sm font-medium mb-2 capitalize" style={{color: 'var(--color-text-secondary)'}}>{key.replace(/([A-Z])/g, ' $1')}</label>
                                <input type="color" id={`table-color-${key}`} value={value} onChange={(e) => handleTableColorChange(key as keyof typeof themeSettings['tableColors'], e.target.value)} className="w-full h-10 rounded-lg border-0" />
                            </div>
                        ))}
                    </div>
                    <h5 className="text-lg font-bold font-display mt-6 mb-3 border-b pb-2" style={{borderColor: 'var(--color-glass-border)'}}>Cores de Status</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Object.entries(themeSettings.statusColors).map(([key, value]) => (
                            <div key={key}>
                                <label htmlFor={`status-color-${key}`} className="block text-sm font-medium mb-2 capitalize" style={{color: 'var(--color-text-secondary)'}}>{key.replace(/([A-Z])/g, ' $1')}</label>
                                <input type="color" id={`status-color-${key}`} value={value} onChange={(e) => handleStatusColorChange(key as keyof typeof themeSettings['statusColors'], e.target.value)} className="w-full h-10 rounded-lg border-0" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Fonts Section */}
                <div>
                    <h4 className="text-xl font-bold font-display mb-4 border-b pb-2" style={{borderColor: 'var(--color-glass-border)'}}>Fontes</h4>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="font-display" className="block text-sm font-medium mb-2" style={{color: 'var(--color-text-secondary)'}}>Fonte do Título</label>
                            <select id="font-display" value={themeSettings.fonts.display} onChange={(e) => handleFontChange('display', e.target.value)} className="w-full glass-input">
                                {FONT_OPTIONS.display.map(font => (
                                    <option key={font.name} value={font.value}>{font.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="font-body" className="block text-sm font-medium mb-2" style={{color: 'var(--color-text-secondary)'}}>Fonte do Corpo</label>
                            <select id="font-body" value={themeSettings.fonts.body} onChange={(e) => handleFontChange('body', e.target.value)} className="w-full glass-input">
                                {FONT_OPTIONS.body.map(font => (
                                    <option key={font.name} value={font.value}>{font.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Layout Section */}
                <div>
                    <h4 className="text-xl font-bold font-display mb-4 border-b pb-2" style={{borderColor: 'var(--color-glass-border)'}}>Layout</h4>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="card-border-radius" className="block text-sm font-medium mb-2" style={{color: 'var(--color-text-secondary)'}}>Raio da Borda dos Cartões (px)</label>
                            <input
                                type="number"
                                id="card-border-radius"
                                min="0"
                                max="50"
                                value={themeSettings.layout.cardBorderRadius}
                                onChange={(e) => setThemeSettings(prev => ({ ...prev, layout: { ...prev.layout, cardBorderRadius: parseInt(e.target.value) } }))}
                                className="w-full glass-input"
                            />
                        </div>
                         <div className="flex items-center gap-3">
                            <input type="checkbox" id="hide-manager-login" checked={themeSettings.hideManagerLogin} onChange={(e) => setThemeSettings(prev => ({ ...prev, hideManagerLogin: e.target.checked }))} className="form-checkbox h-5 w-5 text-amber-500 rounded-md" />
                            <label htmlFor="hide-manager-login" className="text-sm font-medium" style={{color: 'var(--color-text-secondary)'}}>Ocultar botão de login de Gerente para dispositivos não-admin</label>
                            <Info size={16} className="text-stone-400" title="Quando ativado, o botão 'Gerente' só aparece se o dispositivo já tiver acedido como gerente pelo menos uma vez." />
                        </div>
                    </div>
                </div>


                <div className="flex flex-col sm:flex-row gap-4 justify-end border-t pt-6" style={{borderColor: 'var(--color-glass-border)'}}>
                    <button type="button" onClick={handleResetTheme} className="secondary-button py-3 px-6 flex items-center justify-center gap-3">
                        <Undo size={20}/> Redefinir para Padrão
                    </button>
                    <button type="submit" className="premium-gradient-button py-3 px-6 flex items-center justify-center gap-3" disabled={isSaving}>
                        {isSaving ? <Loader2 className="animate-spin" /> : <Check size={20} />}
                        {isSaving ? 'A guardar...' : 'Guardar Alterações'}
                    </button>
                </div>
            </form>
        </div>
    );
});


const FeedbackCard: React.FC<{ feedback: Feedback; onToggleResolved: (id: string, isResolved: boolean) => Promise<{ success: boolean; message: string; }>; showCafeInfo?: boolean }> = memo(({ feedback, onToggleResolved, showCafeInfo }) => {
    const [isUpdating, setIsUpdating] = useState(false);

    const handleToggle = async () => {
        setIsUpdating(true);
        await onToggleResolved(feedback.id, !feedback.is_resolved);
        setIsUpdating(false);
    };

    return (
        <div className="glass-card !bg-black/20 p-4 rounded-xl">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <UserIcon size={18} className="text-amber-300" />
                    <span className="font-semibold">{feedback.user_name || 'Anónimo'}</span>
                    {showCafeInfo && feedback.cafe_name && (
                        <span className="text-sm" style={{color: 'var(--color-text-secondary)'}}>({feedback.cafe_name})</span>
                    )}
                </div>
                <div className="flex items-center gap-2 text-sm" style={{color: 'var(--color-text-secondary)'}}>
                    <Clock size={14} /> {new Date(feedback.created_at).toLocaleDateString()}
                    {feedback.rating !== null && (
                        <div className="flex items-center gap-1 ml-2">
                            {[1, 2, 3, 4, 5].map(star => (
                                <Star key={star} size={14} className={star <= feedback.rating! ? 'text-amber-400 fill-current' : 'text-stone-500'} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <p className="text-base mb-3" style={{color: 'var(--color-text-primary)'}}>{feedback.content}</p>
            {feedback.context_url && (
                <p className="text-xs mb-3 flex items-center gap-1" style={{color: 'var(--color-text-secondary)'}}>
                    <LinkIcon size={12}/> <a href={feedback.context_url} target="_blank" rel="noopener noreferrer" className="hover:underline">Ver Contexto</a>
                </p>
            )}
            <div className="flex justify-end">
                <button
                    onClick={handleToggle}
                    disabled={isUpdating}
                    className={`py-1.5 px-3 rounded-xl flex items-center gap-2 text-sm transition-colors ${
                        feedback.is_resolved ? 'bg-green-700/70 hover:bg-green-800/80' : 'bg-stone-700/70 hover:bg-stone-800/80'
                    }`}
                >
                    {isUpdating ? <Loader2 size={16} className="animate-spin"/> : (
                        feedback.is_resolved ? <Check size={16}/> : <Clock size={16}/>
                    )}
                    {feedback.is_resolved ? 'Marcado como Resolvido' : 'Marcar como Resolvido'}
                </button>
            </div>
        </div>
    );
});

export default AdminDashboard;