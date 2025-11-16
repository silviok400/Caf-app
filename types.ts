export enum OrderStatus {
  NEW = 'Novo',
  PREPARING = 'Em Preparo',
  READY = 'Pronto',
  SERVED = 'Servido',
  PAID = 'Pago',
  CANCELLED = 'Cancelado'
}

export interface Product {
  id: string;
  cafe_id: string;
  name: string;
  price: number;
  category: string;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  productName: string;
  productPrice: number;
  notes?: string;
}

export interface Order {
  id: string;
  cafe_id: string;
  table_id: string;
  staff_id: string;
  items: OrderItem[];
  status: OrderStatus;
  created_at: Date;
  updated_at: Date;
}

export interface Table {
  id: string;
  cafe_id: string;
  name: string;
  is_hidden: boolean;
}

export type UserRole = 'waiter' | 'kitchen' | 'admin';

export interface Staff {
  id: string;
  cafe_id: string;
  name:string;
  role: UserRole;
  pin: string;
  phone?: string;
}

export interface Cafe {
  id: string;
  name: string;
  is_server_hidden: boolean;
}

// Fix: Add Coffee interface for the deprecated CoffeeDetailsPage.
export interface Coffee {
  id: string;
  cafe_id: string;
  name: string;
  brewing_method: string;
  description: string;
  qr_code_image_url: string;
}

export interface ThemeSettings {
  logoUrl?: string;
  backgroundImageUrl?: string;
  backgroundOverlayOpacity: number;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    textPrimary: string;
    textSecondary: string;
    glassBackground: string;
    glassBorder: string;
    glassBorderHighlight: string;
  };
  tableColors: {
    free: string;
    occupied: string;
  };
  statusColors: {
    new: string;
    preparing: string;
    ready: string;
    served: string;
    paid: string;
    cancelled: string;
  };
  fonts: {
    body: string;
    display: string;
  };
  layout: {
    cardBorderRadius: number; // in px
  };
  hideManagerLogin: boolean;
}

export interface CreationCode {
  code: string;
  created_at: string;
  is_used: boolean;
}

export interface Feedback {
  id: string;
  created_at: string;
  content: string;
  rating: number | null;
  user_id: string | null;
  user_name: string | null;
  cafe_id: string | null;
  cafe_name: string | null;
  context_url: string | null;
  is_resolved: boolean;
}

export type TablePresence = {
  [tableId: string]: { user_id: string; name: string }[];
};

export type RealtimeStatus = 'connected' | 'connecting' | 'error' | 'disconnected' | 'offline';

// O tipo CafeData foi removido pois a estrutura de dados aninhada não é mais necessária com o Supabase.
// Os dados serão obtidos de tabelas individuais.

export interface DataContextType {
  user: Staff | null;
  staff: Staff[];
  products: Product[];
  // Fix: Add coffees to the context type for the deprecated CoffeeDetailsPage.
  coffees: Coffee[];
  tables: Table[];
  orders: Order[];
  categories: string[];
  currentCafe: Cafe | null;
  availableCafes: Cafe[];
  theme: ThemeSettings;
  isAppLoading: boolean;
  isAdmCafe: boolean;
  feedbackSubmissions: Feedback[];
  tablePresence: TablePresence;
  realtimeStatus: RealtimeStatus;
  findUserByPin: (pin: string) => Staff | null;
  setCurrentUser: (user: Staff, cafeIdForFlag?: string) => void;
  logout: () => void;
  fullLogout: () => void;
  addOrder: (tableId: string, items: OrderItem[], isCustomer?: boolean) => Promise<Order | null>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  getProductById: (id: string) => Product | undefined;
  getOrdersForTable: (tableId: string) => Order[];
  getTotalForTable: (tableId: string) => number;
  closeTableBill: (tableId: string) => void;
  removeItemFromOrder: (orderId: string, itemIndex: number) => void;
  updateProduct: (product: Product) => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'cafe_id'>) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  addStaff: (staffMember: Omit<Staff, 'id' | 'cafe_id'>) => Promise<void>;
  updateStaff: (staffMember: Staff) => Promise<void>;
  deleteStaff: (staffId: string) => Promise<void>;
  addTable: () => void;
  deleteTable: (tableId: string) => void;
  updateTable: (tableUpdate: { id: string, is_hidden: boolean }) => void;
  deleteLastTable: () => void;
  updateCategory: (oldName: string, newName: string) => void;
  selectCafe: (cafeId: string) => void;
  createCafe: (name: string, adminPin: string, managerName: string, entryCode: string) => Promise<{ success: boolean; message: string; }>;
  deleteCafe: (cafeId: string, adminPin: string) => Promise<boolean>;
  updateTheme: (theme: Partial<ThemeSettings>) => void;
  updateCafe: (cafe: Partial<Omit<Cafe, 'id'>>) => void;
  updateCurrentUserPin: (currentPin: string, newPin: string) => Promise<{ success: boolean; message: string }>;
  updateCurrentUserPhone: (phoneNumber: string) => Promise<{ success: boolean; message: string }>;
  findAdminByPhone: (phoneNumber: string) => Staff | null;
  resetPinForUser: (userId: string, newPin: string) => Promise<{ success: boolean; message: string }>;
  loginAdminByNamePinAndCafe: (cafeName: string, managerName: string, pin: string) => Promise<{ success: boolean; message: string; }>;
  generateCreationCode: () => Promise<{ error: string | null }>;
  getActiveCreationCodes: () => Promise<{ data: CreationCode[] | null; error: string | null }>;
  platformDeleteCafe: (cafeId: string) => Promise<{ success: boolean; message: string; }>;
  platformUpdateCafeVisibility: (cafeId: string, isHidden: boolean) => Promise<{ success: boolean; message: string; }>;
  submitFeedback: (content: string, rating: number | null) => Promise<{ success: boolean; message: string; }>;
  toggleFeedbackResolved: (id: string, isResolved: boolean) => Promise<{ success: boolean; message: string; }>;
  trackTablePresence: (tableId: string) => void;
  untrackTablePresence: () => void;
}