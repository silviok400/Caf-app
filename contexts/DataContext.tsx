import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { Product, Order, Table, Staff, UserRole, OrderStatus, OrderItem, Cafe, ThemeSettings, DataContextType, Coffee } from '../types';
import { supabase } from '../supabaseClient';
import { PostgrestError } from '@supabase/supabase-js';

/*
  ====================================================================================
  === ATENÇÃO: TRIGGER DA BASE DE DADOS REMOVIDO                                   ===
  ====================================================================================
  
  A geração de QR Codes para "Cafés Especiais" é agora gerida diretamente pela
  aplicação. A função `trigger` (generate_qr_code) na sua base de dados Supabase
  já não é necessária e pode ser removida com segurança.

  A aplicação utiliza agora o "URL Público da Aplicação" (definido nas Definições)
  para criar todos os QR Codes, garantindo consistência e fiabilidade.

*/


function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// MOCK DATA (for first-time use when creating a new cafe)
// A new cafe is created "zero KM" - only the admin is created.
// Products and tables are added by the admin later.
const initialStaff: Omit<Staff, 'id' | 'cafe_id'>[] = [
  // The admin user is a template; name and pin are replaced on creation.
  { name: 'Gerente', role: 'admin', pin: '000000', phone: '' },
];
const initialTables: Omit<Table, 'id'|'cafe_id'|'is_hidden'>[] = [];
const initialProducts: Omit<Product, 'id'|'cafe_id'>[] = [];

const initialCategories = [...new Set(initialProducts.map(p => p.category))].sort();
export const defaultTheme: ThemeSettings = {
    logoUrl: '',
    publicUrl: '',
    backgroundImageUrl: '',
    backgroundOverlayOpacity: 0.45,
    colors: {
      primary: '#4f3b2a',
      secondary: '#d9b782',
      background: '#1c1613',
      textPrimary: '#f5eadd',
      textSecondary: '#c9b7a8',
      glassBackground: 'rgba(40, 32, 28, 0.4)',
      glassBorder: 'rgba(245, 234, 221, 0.15)',
      glassBorderHighlight: 'rgba(217, 183, 130, 0.4)',
    },
    tableColors: {
        free: '#3a5c53',
        occupied: '#b0693a',
    },
    statusColors: {
        new: '#b0693a',
        preparing: '#d9b782',
        ready: '#3a5c53',
        served: '#5c8b9c',
        paid: '#6c757d',
        cancelled: '#495057',
    },
    fonts: {
        body: "'Plus Jakarta Sans', sans-serif",
        display: "'Playfair Display', serif",
    },
    layout: {
        cardBorderRadius: 28,
    },
    hideManagerLogin: false,
};

const LOCAL_STORAGE_KEYS = {
  USER: 'cafe-app-user',
  CURRENT_CAFE_ID: 'cafe-app-current-cafe-id',
  IS_ADMIN_DEVICE_PREFIX: 'cafe-app-is-admin-device-',
};

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const storedValue = localStorage.getItem(key);
    if (storedValue) return JSON.parse(storedValue) as T;
  } catch (error) { console.error(`Error loading ${key} from localStorage`, error); }
  return defaultValue;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// Helper function to process theme data from DB and merge with defaults
const mergeDbThemeIntoSettings = (dbTheme: any): ThemeSettings => {
    const baseTheme = JSON.parse(JSON.stringify(defaultTheme)); // Deep copy

    if (!dbTheme) return baseTheme;

    if (dbTheme.colors) {
        const { tableColors, statusColors, ...mainColors } = dbTheme.colors;
        baseTheme.colors = { ...baseTheme.colors, ...mainColors };
        if (tableColors) {
            baseTheme.tableColors = { ...baseTheme.tableColors, ...tableColors };
        }
        if (statusColors) {
            baseTheme.statusColors = { ...baseTheme.statusColors, ...statusColors };
        }
    }
    if (dbTheme.fonts) {
        const { _logoUrl, _hideManagerLogin, _publicUrl, _backgroundImageUrl, _backgroundOverlayOpacity, _layout, ...fontSettings } = dbTheme.fonts;
        baseTheme.fonts = { ...baseTheme.fonts, ...fontSettings };
        if (typeof _logoUrl !== 'undefined') baseTheme.logoUrl = _logoUrl;
        if (typeof _hideManagerLogin !== 'undefined') baseTheme.hideManagerLogin = _hideManagerLogin;
        if (typeof _publicUrl !== 'undefined') baseTheme.publicUrl = _publicUrl;
        if (typeof _backgroundImageUrl !== 'undefined') baseTheme.backgroundImageUrl = _backgroundImageUrl;
        if (typeof _backgroundOverlayOpacity !== 'undefined') baseTheme.backgroundOverlayOpacity = _backgroundOverlayOpacity;
        if (typeof _layout !== 'undefined') baseTheme.layout = { ...baseTheme.layout, ..._layout };
    }
    return baseTheme;
}


export const DataProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<Staff | null>(() => loadFromStorage(LOCAL_STORAGE_KEYS.USER, null));
  const [currentCafeId, setCurrentCafeId] = useState<string | null>(() => loadFromStorage(LOCAL_STORAGE_KEYS.CURRENT_CAFE_ID, null));
  const [isAppLoading, setIsAppLoading] = useState(true);
  
  const [availableCafes, setAvailableCafes] = useState<Cafe[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  // Fix: Add state for coffees to support deprecated CoffeeDetailsPage.
  const [coffees, setCoffees] = useState<Coffee[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [dbTheme, setDbTheme] = useState<any | null>(null);

  const currentCafe = useMemo(() => availableCafes.find(c => c.id === currentCafeId) || null, [availableCafes, currentCafeId]);

  // The final theme object is derived from the theme settings in the DB.
  // It no longer contains cafe-specific properties like name or visibility.
  const theme: ThemeSettings = useMemo(() => {
    return mergeDbThemeIntoSettings(dbTheme);
  }, [dbTheme]);

  // Fetch all available cafes on initial load
  useEffect(() => {
    const fetchCafes = async () => {
        setIsAppLoading(true);
        const { data, error } = await supabase.from('cafes').select('id, name, is_server_hidden');
        if (error) {
            console.error("Error fetching cafes:", error.message);
        } else if (data) {
            setAvailableCafes(data);
        }
        setIsAppLoading(false);
    };
    fetchCafes();
  }, []);

  // Realtime subscription for cafes table
  useEffect(() => {
    const channel = supabase.channel('public:cafes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cafes' },
        (payload) => {
          console.log('Realtime Cafe Change:', payload);
          if (payload.eventType === 'INSERT') {
            setAvailableCafes(current => {
              // Prevent duplicates if we've already added it preemptively
              if (current.some(c => c.id === payload.new.id)) {
                return current.map(c => c.id === payload.new.id ? payload.new as Cafe : c);
              }
              return [...current, payload.new as Cafe];
            });
          } else if (payload.eventType === 'UPDATE') {
            setAvailableCafes(current => current.map(c => c.id === payload.new.id ? payload.new as Cafe : c));
          } else if (payload.eventType === 'DELETE') {
            setAvailableCafes(current => current.filter(c => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);


  // Fetch all data for the selected cafe.
  // This effect ONLY runs when currentCafeId changes, not when the availableCafes list is updated in realtime.
  // This prevents unnecessary data reloads and the "refresh" effect the user was seeing.
  const loadDataForCafe = useCallback(async (cafeId: string) => {
      setIsAppLoading(true);
      const [
          staffRes,
          productsRes,
          tablesRes,
          ordersRes,
          themeRes,
      ] = await Promise.all([
          supabase.from('staff').select('*').eq('cafe_id', cafeId),
          supabase.from('products').select('*').eq('cafe_id', cafeId),
          supabase.from('tables').select('*').eq('cafe_id', cafeId),
          supabase.from('orders').select('*').eq('cafe_id', cafeId),
          supabase.from('theme_settings').select('*').eq('cafe_id', cafeId).maybeSingle(),
      ]);

      if (staffRes.data) setStaff(staffRes.data);
      if (productsRes.data) setProducts(productsRes.data);
      if (tablesRes.data) {
        const sortedTables = tablesRes.data.sort((a, b) => {
            const numA = parseInt(a.name.replace('Mesa ', '')) || 0;
            const numB = parseInt(b.name.replace('Mesa ', '')) || 0;
            return numA - numB;
        });
        setTables(sortedTables);
      }
      if (ordersRes.data) setOrders(ordersRes.data.map(o => ({...o, created_at: new Date(o.created_at), updated_at: new Date(o.updated_at)})));
      setDbTheme(themeRes.data || null);
      
      setIsAppLoading(false);
  }, []);

  useEffect(() => {
    if (currentCafeId) {
      loadDataForCafe(currentCafeId);
    } else {
      // Clear all data if no cafe is selected
      setStaff([]);
      setProducts([]);
      setTables([]);
      setOrders([]);
      setCategories([]);
      // Fix: Reset coffees state when no cafe is selected.
      setCoffees([]);
      setDbTheme(null);
      setIsAppLoading(false);
    }
  }, [currentCafeId, loadDataForCafe]);

  // Automatically derive and update categories whenever products change
  useEffect(() => {
    if (products.length > 0) {
      setCategories([...new Set(products.map(p => p.category))].sort());
    } else {
      setCategories([]);
    }
  }, [products]);

  // All cafe-specific realtime subscriptions
  useEffect(() => {
    if (!currentCafeId) return;

    const ordersChannel = supabase.channel(`rt-orders-cafe-${currentCafeId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `cafe_id=eq.${currentCafeId}` },
        (payload) => {
          console.log('Realtime Order Change:', payload);
          if (payload.eventType === 'INSERT') {
            const newOrder = { ...payload.new, created_at: new Date(payload.new.created_at), updated_at: new Date(payload.new.updated_at) } as Order;
            setOrders(currentOrders => [...currentOrders, newOrder]);
          } else if (payload.eventType === 'UPDATE') {
            const newOrder = { ...payload.new, created_at: new Date(payload.new.created_at), updated_at: new Date(payload.new.updated_at) } as Order;
            setOrders(currentOrders => currentOrders.map(o => o.id === newOrder.id ? newOrder : o));
          } else if (payload.eventType === 'DELETE') {
            setOrders(currentOrders => currentOrders.filter(o => o.id !== payload.old.id));
          }
        }
      ).subscribe();
    
    const productsChannel = supabase.channel(`rt-products-cafe-${currentCafeId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `cafe_id=eq.${currentCafeId}` },
        (payload) => {
          console.log('Realtime Product Change:', payload);
          if (payload.eventType === 'INSERT') {
            setProducts(current => [...current, payload.new as Product]);
          } else if (payload.eventType === 'UPDATE') {
            setProducts(current => current.map(p => p.id === payload.new.id ? payload.new as Product : p));
          }
          // NOTE: DELETE events are now handled via broadcast for reliability.
        }
      )
      .on('broadcast', { event: 'product-deleted' }, ({ payload }) => {
          console.log('Received broadcast product deletion:', payload);
          setProducts(current => current.filter(p => p.id !== payload.id));
      })
      .subscribe();
    
    const staffChannel = supabase.channel(`rt-staff-cafe-${currentCafeId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff', filter: `cafe_id=eq.${currentCafeId}` },
        (payload) => {
          console.log('Realtime Staff Change:', payload);
          if (payload.eventType === 'INSERT') {
            setStaff(current => [...current, payload.new as Staff]);
          } else if (payload.eventType === 'UPDATE') {
            setStaff(current => current.map(s => s.id === payload.new.id ? payload.new as Staff : s));
          }
          // NOTE: DELETE events are now handled via broadcast for reliability.
        }
      )
      .on('broadcast', { event: 'staff-deleted' }, ({ payload }) => {
          console.log('Received broadcast staff deletion:', payload);
          setStaff(current => current.filter(s => s.id !== payload.id));
      })
      .subscribe();

    const tablesChannel = supabase.channel(`rt-tables-cafe-${currentCafeId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables', filter: `cafe_id=eq.${currentCafeId}` },
        (payload) => {
          console.log('Realtime Table Change:', payload);
          
          const sortTables = (tables: Table[]) => {
              return [...tables].sort((a, b) => {
                  const numA = parseInt(a.name.replace('Mesa ', ''), 10) || 0;
                  const numB = parseInt(b.name.replace('Mesa ', ''), 10) || 0;
                  return numA - numB;
              });
          };

          if (payload.eventType === 'INSERT') {
            setTables(current => {
              if (current.some(t => t.id === payload.new.id)) {
                return current;
              }
              return sortTables([...current, payload.new as Table]);
            });
          } else if (payload.eventType === 'UPDATE') {
            setTables(current => sortTables(current.map(t => t.id === payload.new.id ? payload.new as Table : t)));
          } else if (payload.eventType === 'DELETE') {
            setTables(current => sortTables(current.filter(t => t.id !== payload.old.id)));
          }
        }
      )
      .on('broadcast', { event: 'table-updated' }, ({ payload }) => {
        console.log('Received broadcast for table update:', payload.tableUpdate);
        const { id, is_hidden } = payload.tableUpdate;
        if (id !== undefined && is_hidden !== undefined) {
           setTables(currentTables => {
              const newTables = currentTables.map(table => 
                  table.id === id ? { ...table, is_hidden } : table
              );
              // Ensure consistent sorting
              return [...newTables].sort((a, b) => {
                const numA = parseInt(a.name.replace('Mesa ', ''), 10) || 0;
                const numB = parseInt(b.name.replace('Mesa ', ''), 10) || 0;
                return numA - numB;
              });
           });
        }
      })
      .subscribe();
    
    const themeChannel = supabase.channel(`rt-theme-cafe-${currentCafeId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'theme_settings', filter: `cafe_id=eq.${currentCafeId}` },
        (payload) => {
          console.log('Realtime Theme Change:', payload);
          if (payload.eventType === 'DELETE') {
            setDbTheme(null);
          } else {
            setDbTheme(payload.new);
          }
        }
      ).subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(staffChannel);
      supabase.removeChannel(tablesChannel);
      supabase.removeChannel(themeChannel);
    };
  }, [currentCafeId]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-background', theme.colors.background);
    root.style.setProperty('--color-text-primary', theme.colors.textPrimary);
    root.style.setProperty('--color-text-secondary', theme.colors.textSecondary);
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-secondary', theme.colors.secondary);
    root.style.setProperty('--color-glass-bg', theme.colors.glassBackground);
    root.style.setProperty('--color-glass-border', theme.colors.glassBorder);
    root.style.setProperty('--color-glass-border-highlight', theme.colors.glassBorderHighlight);
    
    root.style.setProperty('--color-table-free', theme.tableColors.free);
    root.style.setProperty('--color-table-occupied', theme.tableColors.occupied);
    
    root.style.setProperty('--color-status-new', theme.statusColors.new);
    root.style.setProperty('--color-status-preparing', theme.statusColors.preparing);
    root.style.setProperty('--color-status-ready', theme.statusColors.ready);
    root.style.setProperty('--color-status-served', theme.statusColors.served);
    root.style.setProperty('--color-status-paid', theme.statusColors.paid);
    root.style.setProperty('--color-status-cancelled', theme.statusColors.cancelled);

    root.style.setProperty('--font-body', theme.fonts.body);
    root.style.setProperty('--font-display', theme.fonts.display);

    root.style.setProperty('--layout-card-border-radius', `${theme.layout.cardBorderRadius}px`);

    const defaultBg = 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=2861&auto=format&fit=crop';
    const bgImageUrl = theme.backgroundImageUrl ? `url('${theme.backgroundImageUrl}')` : `url('${defaultBg}')`;
    const bgOverlay = `linear-gradient(rgba(20, 15, 12, ${theme.backgroundOverlayOpacity}), rgba(20, 15, 12, ${theme.backgroundOverlayOpacity}))`;
    
    document.body.style.backgroundImage = `${bgOverlay}, ${bgImageUrl}`;
    document.body.style.backgroundColor = 'var(--color-background)';
    document.body.style.color = 'var(--color-text-primary)';
  }, [theme]);

  useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(user)); }, [user]);
  useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEYS.CURRENT_CAFE_ID, JSON.stringify(currentCafeId)); }, [currentCafeId]);

  const selectCafe = (cafeId: string) => {
    if (cafeId !== currentCafeId) {
        setUser(null);
        setCurrentCafeId(cafeId);
    }
  };

  const createCafe = async (name: string, adminPin: string, managerName: string): Promise<boolean> => {
    let cafeData: Cafe | null = null;
    try {
        // 1. Create Cafe
        const { data, error: cafeError } = await supabase.from('cafes').insert({ name, is_server_hidden: true }).select().single();
        if (cafeError || !data) { throw cafeError || new Error("Failed to create cafe entry."); }
        cafeData = data;
        
        // Add to local state immediately to fix navigation race condition
        setAvailableCafes(current => [...current, cafeData as Cafe]);
        
        const cafe_id = cafeData.id;

        // 2. Create default data
        const new_staff = initialStaff.map(s => ({ ...s, id: uuidv4(), cafe_id, ...(s.role === 'admin' && { pin: adminPin, name: managerName }) }));
        const new_products = initialProducts.map(p => ({ ...p, id: uuidv4(), cafe_id }));
        const new_tables = initialTables.map(t => ({...t, id: uuidv4(), cafe_id, is_hidden: false }));
        
        const { colors, fonts, ...restOfTheme } = defaultTheme;
        const new_theme_for_db = {
          cafe_id,
          colors: {
            ...colors,
            tableColors: defaultTheme.tableColors,
            statusColors: defaultTheme.statusColors,
          },
          fonts: {
            ...fonts,
            _logoUrl: restOfTheme.logoUrl,
            _hideManagerLogin: restOfTheme.hideManagerLogin,
            _publicUrl: restOfTheme.publicUrl,
            _backgroundImageUrl: restOfTheme.backgroundImageUrl,
            _backgroundOverlayOpacity: restOfTheme.backgroundOverlayOpacity,
            _layout: restOfTheme.layout,
          },
        };

        const results = await Promise.all([
            supabase.from('staff').insert(new_staff),
            supabase.from('products').insert(new_products),
            supabase.from('tables').insert(new_tables),
            supabase.from('theme_settings').insert(new_theme_for_db)
        ]);

        results.forEach(result => { if (result.error) throw result.error; });

        // On complete success, the realtime subscription will update the cafe list.
        localStorage.setItem(`${LOCAL_STORAGE_KEYS.IS_ADMIN_DEVICE_PREFIX}${cafe_id}`, 'true');
        selectCafe(cafe_id);
        return true;

    } catch (error) {
        const err = error as PostgrestError;
        console.error("--- Detailed Cafe Creation Error ---");
        console.error("Message:", err.message || 'An unknown error occurred.');
        if(err.code) console.error("Code:", err.code);
        console.error("Full Error Object:", error);
        console.error("------------------------------------");

        // Cleanup if cafe was created but other steps failed
        if (cafeData?.id) {
            console.warn(`Attempting to clean up partially created cafe: ${cafeData.id}`);
            await supabase.from('cafes').delete().eq('id', cafeData.id);
        }
        return false;
    }
  };
  
  const deleteCafe = async (cafeId: string, adminPin: string): Promise<boolean> => {
      const admin = staff.find(s => s.role === 'admin');
      if (!admin || admin.pin !== adminPin) {
        console.error("Admin PIN validation failed for cafe deletion.");
        return false;
      }
      
      try {
        // Supabase is configured with cascading deletes, so we only need to delete the cafe.
        const { error } = await supabase.from('cafes').delete().eq('id', cafeId);
        if (error) throw error;
        
        // The realtime subscription will handle updating the UI for all clients.
        if (currentCafeId === cafeId) {
          fullLogout();
        }
        return true;
      } catch (error) {
        console.error("Error during cafe deletion process:", error);
        return false;
      }
  };

  const findUserByPin = (pin: string): Staff | null => staff.find(s => s.pin === pin) || null;
  
  const setCurrentUser = (userToSet: Staff, cafeIdForFlag?: string) => {
    const cafeId = cafeIdForFlag || currentCafeId;
    if (userToSet.role === 'admin' && cafeId) {
        localStorage.setItem(`${LOCAL_STORAGE_KEYS.IS_ADMIN_DEVICE_PREFIX}${cafeId}`, 'true');
    }
    setUser(userToSet);
  };

  const logout = () => setUser(null);
  
  const fullLogout = () => {
    setUser(null);
    setCurrentCafeId(null);
    
    // Remove only session-specific data, preserving manager device flags.
    localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.CURRENT_CAFE_ID);
  };

  const addOrder = async (tableId: string, items: OrderItem[], isCustomer: boolean = false) => {
    if ((!user && !isCustomer) || !currentCafeId) return;

    const staffId = user ? user.id : 'customer-order';
    const newOrder = {
      id: uuidv4(),
      cafe_id: currentCafeId,
      table_id: tableId, staff_id: staffId, items,
      status: OrderStatus.NEW,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    
    const { error } = await supabase.from('orders').insert(newOrder);
    if (error) console.error("Error adding order:", error.message);
    
    if (!isCustomer) new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg").play().catch(e => console.error("Error playing audio:", e));
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const { error } = await supabase.from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId);
    if (error) console.error("Error updating order status:", error.message);
  };

  const getProductById = useCallback((id: string) => products.find(p => p.id === id), [products]);
  const getOrdersForTable = useCallback((tableId: string) => orders.filter(o => o.table_id === tableId), [orders]);
  
  const getTotalForTable = useCallback((tableId: string) => {
    return orders.filter(o => o.table_id === tableId && o.status !== OrderStatus.PAID && o.status !== OrderStatus.CANCELLED)
      .reduce((total, order) => total + order.items.reduce((orderTotal, item) => orderTotal + (item.productPrice * item.quantity), 0), 0);
  }, [orders]);

  const closeTableBill = async (tableId: string) => {
    if (!currentCafeId) return;
    const ordersToUpdate = orders
        .filter(order => order.table_id === tableId && order.status !== OrderStatus.PAID && order.status !== OrderStatus.CANCELLED)
        .map(order => order.id);

    if (ordersToUpdate.length > 0) {
        const { error } = await supabase.from('orders')
            .update({ status: OrderStatus.PAID, updated_at: new Date().toISOString() })
            .in('id', ordersToUpdate);
        if (error) console.error("Error closing table bill:", error.message);
    }
  };

  const removeItemFromOrder = async (orderId: string, itemIndex: number) => {
    if (!currentCafeId) return;
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const updatedItems = [...order.items];
    updatedItems.splice(itemIndex, 1);

    const newStatus = updatedItems.length === 0 ? OrderStatus.CANCELLED : order.status;
    
    const { error } = await supabase.from('orders')
        .update({ items: updatedItems, status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);
    if (error) console.error("Error removing item from order:", error.message);
  };

  const updateProduct = async (product: Product) => {
    const { error } = await supabase.from('products').update(product).eq('id', product.id);
    if (error) {
      console.error("Error updating product:", error.message);
      throw new Error(error.message);
    }
  };

  const addProduct = async (product: Omit<Product, 'id'|'cafe_id'>) => {
    if (!currentCafeId) throw new Error("Nenhum café selecionado.");
    const newProduct = { ...product, id: uuidv4(), cafe_id: currentCafeId };
    const { error } = await supabase.from('products').insert(newProduct);
    if (error) {
        console.error("Error adding product:", error.message);
        throw new Error(error.message);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!currentCafeId) throw new Error("Nenhum café selecionado.");
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) {
        console.error("Error deleting product:", error.message);
        throw new Error(error.message);
    }
    // Broadcast the change to ensure all clients update in real-time,
    // bypassing potential issues with database REPLICA IDENTITY settings.
    const channel = supabase.channel(`rt-products-cafe-${currentCafeId}`);
    await channel.send({
        type: 'broadcast',
        event: 'product-deleted',
        payload: { id: productId },
    });
  };
  
  const addStaff = async (staffMember: Omit<Staff, 'id'|'cafe_id'>) => {
    if (!currentCafeId) throw new Error("Nenhum café selecionado.");
    const newStaff = { ...staffMember, id: uuidv4(), cafe_id: currentCafeId };
    const { error } = await supabase.from('staff').insert(newStaff);
    if (error) {
        console.error("Error adding staff:", error.message);
        throw new Error(error.message);
    }
  };

  const updateStaff = async (staffMember: Staff) => {
    const { error } = await supabase.from('staff').update(staffMember).eq('id', staffMember.id);
    if (error) {
        console.error("Error updating staff:", error.message);
        throw new Error(error.message);
    }
  };
  
  const deleteStaff = async (staffId: string) => {
    if (!currentCafeId) throw new Error("Nenhum café selecionado.");
    const { error } = await supabase.from('staff').delete().eq('id', staffId);
    if (error) {
        console.error("Error deleting staff:", error.message);
        throw new Error(error.message);
    }
    // Broadcast the change for real-time updates on all clients.
    const channel = supabase.channel(`rt-staff-cafe-${currentCafeId}`);
    await channel.send({
        type: 'broadcast',
        event: 'staff-deleted',
        payload: { id: staffId },
    });
  };

  const addTable = async () => {
    if (!currentCafeId) return;
    const lastTableNumber = tables.reduce((max, table) => Math.max(max, parseInt(table.name.replace('Mesa ', '')) || 0), 0);
    // Rely on DB default for is_hidden to avoid schema cache issues.
    const newTableData = { id: uuidv4(), name: `Mesa ${lastTableNumber + 1}`, cafe_id: currentCafeId };
    
    const { error } = await supabase.from('tables').insert(newTableData);
    
    if (error) {
      console.error("Error adding table:", error.message);
    }
  };

  const updateTable = async (tableUpdate: { id: string, is_hidden: boolean }) => {
    if (!currentCafeId) return;
    // Call the RPC function to bypass schema cache issues.
    const { error } = await supabase.rpc('update_table_visibility', {
      table_id_to_update: tableUpdate.id,
      hidden_status: tableUpdate.is_hidden
    });
    
    if (error) {
      console.error("Error updating table:", error.message, error.details);
    } else {
      // After a successful DB update, broadcast the change to all connected clients.
      const channel = supabase.channel(`rt-tables-cafe-${currentCafeId}`);
      await channel.send({
        type: 'broadcast',
        event: 'table-updated',
        payload: { tableUpdate },
      });
    }
  };

  const deleteTable = async (tableId: string) => {
    if (!currentCafeId) return;
    // This function now HIDES the table by setting is_hidden to true.
    const tableUpdate = { id: tableId, is_hidden: true };
    const { error } = await supabase.rpc('update_table_visibility', {
      table_id_to_update: tableUpdate.id,
      hidden_status: tableUpdate.is_hidden
    });
     if (error) {
      console.error("Error hiding table (deleteTable):", error.message);
    } else {
      // Broadcast change
      const channel = supabase.channel(`rt-tables-cafe-${currentCafeId}`);
      await channel.send({
        type: 'broadcast',
        event: 'table-updated',
        payload: { tableUpdate },
      });
    }
  };
  
  const deleteLastTable = async () => {
    const visibleTables = tables.filter(t => !t.is_hidden);
    if (visibleTables.length === 0) return;
    // Assumes tables are sorted by name number
    const lastTable = visibleTables[visibleTables.length - 1];
    await updateTable({ id: lastTable.id, is_hidden: true });
  };
  
  const updateCategory = async (oldName: string, newName: string) => {
    if (!currentCafeId) return;
    const productsToUpdate = products.filter(p => p.category === oldName).map(p => p.id);
    if (productsToUpdate.length > 0) {
        const { error } = await supabase.from('products')
            .update({ category: newName })
            .in('id', productsToUpdate);
        if (error) {
            console.error("Error updating category:", error.message);
            throw new Error(error.message);
        }
    }
  };

  const updateTheme = async (themeUpdate: Partial<ThemeSettings>) => {
      if (!currentCafeId) return;
      
      const newThemeData = { ...theme, ...themeUpdate };

      // Map JS theme object to the DB schema, packing new values into existing jsonb columns
      const dbThemePayload = {
        cafe_id: currentCafeId,
        colors: {
            ...newThemeData.colors,
            tableColors: newThemeData.tableColors,
            statusColors: newThemeData.statusColors,
        },
        fonts: {
            ...newThemeData.fonts,
            _logoUrl: newThemeData.logoUrl,
            _hideManagerLogin: newThemeData.hideManagerLogin,
            _publicUrl: newThemeData.publicUrl,
            _backgroundImageUrl: newThemeData.backgroundImageUrl,
            _backgroundOverlayOpacity: newThemeData.backgroundOverlayOpacity,
            _layout: newThemeData.layout,
        }
      };
      
      const { error } = await supabase.from('theme_settings')
        .upsert(dbThemePayload, { onConflict: 'cafe_id' });

      if (error) {
          console.error("Error updating theme:", error.message);
      }
  };

  const updateCafe = async (cafeUpdate: Partial<Omit<Cafe, 'id'>>) => {
      if (!currentCafeId) return;
      const { error } = await supabase.from('cafes')
        .update(cafeUpdate)
        .eq('id', currentCafeId);
      if (error) console.error("Error updating cafe details:", error.message);
  };
  
  const updateCurrentUserPin = async (currentPin: string, newPin: string): Promise<{ success: boolean; message: string }> => {
      if (!user || user.pin !== currentPin) {
        return { success: false, message: 'O PIN atual está incorreto.' };
      }
      const { error } = await supabase.from('staff').update({ pin: newPin }).eq('id', user.id);
      if (error) {
        return { success: false, message: `Falha ao atualizar o PIN: ${error.message}` };
      }
      setUser({ ...user, pin: newPin });
      return { success: true, message: 'PIN atualizado com sucesso!' };
  };

  const updateCurrentUserPhone = async (phoneNumber: string): Promise<{ success: boolean; message: string }> => {
      if (!user) return { success: false, message: 'Utilizador não encontrado.' };
      const { error } = await supabase.from('staff').update({ phone: phoneNumber }).eq('id', user.id);
      if (error) {
        return { success: false, message: `Falha ao atualizar o telemóvel: ${error.message}` };
      }
      setUser({ ...user, phone: phoneNumber });
      return { success: true, message: 'Número de telemóvel atualizado!' };
  };

  const findAdminByPhone = (phoneNumber: string): Staff | null => {
      return staff.find(s => s.role === 'admin' && s.phone === phoneNumber) || null;
  };
  
  const resetPinForUser = async (userId: string, newPin: string): Promise<{ success: boolean; message: string }> => {
      const { error } = await supabase.from('staff').update({ pin: newPin }).eq('id', userId);
      if (error) {
        return { success: false, message: `Falha ao redefinir o PIN: ${error.message}` };
      }
      return { success: true, message: 'PIN redefinido com sucesso.' };
  };
  
  const loginAdminByNamePinAndCafe = async (cafeName: string, managerName: string, pin: string): Promise<{ success: boolean; message: string; }> => {
      const cafe = availableCafes.find(c => c.name.toLowerCase() === cafeName.trim().toLowerCase());
      if (!cafe) return { success: false, message: 'Café não encontrado.' };
      
      const { data, error } = await supabase.from('staff').select('*').eq('cafe_id', cafe.id).eq('role', 'admin');
      if (error || !data || data.length === 0) return { success: false, message: 'Gerente não encontrado para este café.' };
      
      const adminUser = data.find(admin => admin.name.toLowerCase() === managerName.trim().toLowerCase() && admin.pin === pin);
      
      if (adminUser) {
        selectCafe(cafe.id);
        setCurrentUser(adminUser, cafe.id);
        return { success: true, message: 'Login bem-sucedido!' };
      } else {
        return { success: false, message: 'Nome do gerente ou PIN incorretos.' };
      }
  };


  const value: DataContextType = {
    user,
    staff,
    products,
    // Fix: Add coffees to the context value for the deprecated CoffeeDetailsPage.
    coffees,
    tables,
    orders,
    categories,
    currentCafe,
    availableCafes,
    theme,
    isAppLoading,
    findUserByPin,
    setCurrentUser,
    logout,
    fullLogout,
    addOrder,
    updateOrderStatus,
    getProductById,
    getOrdersForTable,
    getTotalForTable,
    closeTableBill,
    removeItemFromOrder,
    updateProduct,
    addProduct,
    deleteProduct,
    addStaff,
    updateStaff,
    deleteStaff,
    addTable,
    deleteTable,
    updateTable,
    deleteLastTable,
    updateCategory,
    selectCafe,
    createCafe,
    deleteCafe,
    updateTheme,
    updateCafe,
    updateCurrentUserPin,
    updateCurrentUserPhone,
    findAdminByPhone,
    resetPinForUser,
    loginAdminByNamePinAndCafe,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};