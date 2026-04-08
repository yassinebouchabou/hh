"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, User, CartItem, SiteSettings, Order, DeliveryTariff, Category, OrderItem } from './types';
import { 
  doc, 
  onSnapshot, 
  collection,
  FirestoreError
} from 'firebase/firestore';
import { useFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { setDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';

interface PixelCartContextType {
  user: User | null;
  isUserLoading: boolean;
  isInitialLoading: boolean;
  setUser: (user: User | null) => void;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  categories: Category[];
  cart: CartItem[];
  addToCart: (product: Product, quantity: number, variant?: string) => void;
  removeFromCart: (productId: string, variant?: string) => void;
  clearCart: () => void;
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrder: (orderId: string, data: Partial<Order>) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  logout: () => void;
  settings: SiteSettings;
  updateSettings: (newSettings: Partial<SiteSettings>) => void;
  deliveryTariffs: DeliveryTariff[];
  updateDeliveryTariff: (stateId: string, tariff: DeliveryTariff) => void;
  addAdmin: (userId: string) => void;
  removeAdmin: (userId: string) => void;
}

const PixelCartContext = createContext<PixelCartContextType | undefined>(undefined);

const DEFAULT_SETTINGS: SiteSettings = {
  brandName: "Outilya DZ", 
  logoUrl: "",
  primaryColor: "24 95% 53%", 
  checkoutColor: "24 95% 53%",
  checkoutBgColor: "0 0% 100%",
  priceBadgeColor: "24 95% 53%",
  checkoutTitleAr: "اطلب الآن",
  checkoutButtonTextAr: "اطلب الآن",
  checkoutSuccessMsgAr: "شكرا، سنتصل بك قريبا لتأكيد الطلب.",
  nameLabelAr: "الاسم الكامل",
  phoneLabelAr: "رقم الهاتف",
  stateLabelAr: "الولاية",
  communeLabelAr: "البلدية",
  deliveryApiKey: "",
  deliveryCompanyName: "",
  deliveryAccountNameAr: "",
  deliveryXTenant: "",
  deliveryCanOpenPackages: true,
  deliveryIsFree: false,
  productColsDesktop: 6,
  categoryColsDesktop: 3,
  homeCategoriesLimit: 3,
  homeCategoriesTitle: "Nos Univers Métiers",
  homeCategoriesSubtitle: "Trouvez l'équipement adapté à votre expertise.",
  homeProductsTitle: "Derniers Arrivages",
  homeProductsSubtitle: "Équipez-vous avec les outils les plus récents du marché.",
  homePromotionsTitle: "Ventes Flash & Offres",
  homePromotionsSubtitle: "Sélection du Moment",
  contactPhone: "",
  contactEmail: "",
  contactAddress: "",
  workingHoursWeek: "08:00 - 18:00",
  workingHoursThu: "08:00 - 13:00",
  workingHoursFri: "Fermé",
  whatsappUrl: "",
  telegramUrl: "",
  facebookUrl: "",
  instagramUrl: "",
  tiktokUrl: "",
  banners: [],
  bannerHeight: 'standard',
  announcementText: "",
  showAnnouncement: false,
  announcementBgColor: "24 95% 53%",
  promotedProductIds: [],
  showPromotions: true
};

const SUPER_ADMIN_UIDS = ['cgeNA9jvuCeC42zZV4EcntT21Jw2', '2EyPzIYJzNUa9H0fMXQ7L0cA7iC3'];

export const PixelCartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { firestore, user: firebaseUser, auth, isUserLoading } = useFirebase();
  const [user, setUserState] = useState<User | null>(null);
  const [products, setProductsState] = useState<Product[]>([]);
  const [categories, setCategoriesState] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [deliveryTariffs, setDeliveryTariffs] = useState<DeliveryTariff[]>([]);
  
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState({ settings: false, products: false });

  useEffect(() => {
    if (syncStatus.settings && syncStatus.products) {
      setIsInitialLoading(false);
    }
  }, [syncStatus]);

  useEffect(() => {
    if (firebaseUser) {
      const email = firebaseUser.email?.toLowerCase() || '';
      const isAdmin = SUPER_ADMIN_UIDS.includes(firebaseUser.uid);
      setUserState({
        id: firebaseUser.uid,
        name: firebaseUser.displayName || email.split('@')[0],
        email: email,
        isAdmin: isAdmin
      });
    } else {
      setUserState(null);
    }
  }, [firebaseUser]);

  useEffect(() => {
    if (!firestore || !firebaseUser) return;
    if (SUPER_ADMIN_UIDS.includes(firebaseUser.uid)) return;
    
    const adminRef = doc(firestore, 'roles_admin', firebaseUser.uid);
    return onSnapshot(
      adminRef, 
      (docSnap) => {
        const isAdmin = docSnap.exists();
        setUserState(prev => prev ? { ...prev, isAdmin } : null);
      },
      (error: FirestoreError) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: adminRef.path,
          operation: 'get'
        }));
      }
    );
  }, [firestore, firebaseUser]);

  useEffect(() => {
    if (!firestore) return;
    const settingsRef = doc(firestore, 'settings', 'config');
    return onSnapshot(
      settingsRef, 
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as SiteSettings;
          setSettings({ ...DEFAULT_SETTINGS, ...data });
          const root = document.documentElement;
          if (root.style.getPropertyValue('--primary') !== data.primaryColor) {
            root.style.setProperty('--primary', data.primaryColor);
          }
        } else if (user?.isAdmin) {
          setDocumentNonBlocking(settingsRef, DEFAULT_SETTINGS, { merge: true });
        }
        setSyncStatus(prev => ({ ...prev, settings: true }));
      },
      (error: FirestoreError) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: settingsRef.path,
          operation: 'get'
        }));
        setSyncStatus(prev => ({ ...prev, settings: true }));
      }
    );
  }, [firestore, user?.isAdmin]);

  useEffect(() => {
    if (!firestore) return;
    const productsRef = collection(firestore, 'products');
    return onSnapshot(
      productsRef, 
      (snapshot) => {
        const results: Product[] = [];
        snapshot.forEach(doc => {
          results.push({ ...doc.data() as Product, id: doc.id });
        });
        setProductsState(results);
        setSyncStatus(prev => ({ ...prev, products: true }));
      },
      (error: FirestoreError) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: productsRef.path,
          operation: 'list'
        }));
        setSyncStatus(prev => ({ ...prev, products: true }));
      }
    );
  }, [firestore]);

  useEffect(() => {
    if (!firestore) return;
    const categoriesRef = collection(firestore, 'categories');
    return onSnapshot(
      categoriesRef, 
      (snapshot) => {
        const results: Category[] = [];
        snapshot.forEach(doc => {
          results.push({ ...doc.data() as Category, id: doc.id });
        });
        setCategoriesState(results);
      },
      (error: FirestoreError) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: categoriesRef.path,
          operation: 'list'
        }));
      }
    );
  }, [firestore]);

  useEffect(() => {
    if (!firestore || !user?.isAdmin) {
      if (orders.length > 0) setOrders([]);
      return;
    }
    const ordersRef = collection(firestore, 'orders');
    return onSnapshot(
      ordersRef, 
      (snapshot) => {
        const results: Order[] = [];
        snapshot.forEach(doc => {
          results.push({ ...doc.data() as Order, id: doc.id });
        });
        setOrders(results);
      },
      (error: FirestoreError) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: ordersRef.path,
          operation: 'list'
        }));
      }
    );
  }, [firestore, user?.isAdmin]);

  useEffect(() => {
    if (!firestore) return;
    const tariffsRef = collection(firestore, 'delivery_tariffs');
    return onSnapshot(
      tariffsRef, 
      (snapshot) => {
        const results: DeliveryTariff[] = [];
        snapshot.forEach(doc => {
          results.push({ ...doc.data() as DeliveryTariff, stateName: doc.id });
        });
        setDeliveryTariffs(results);
      },
      (error: FirestoreError) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: tariffsRef.path,
          operation: 'list'
        }));
      }
    );
  }, [firestore]);

  useEffect(() => {
    const storedCart = localStorage.getItem('pixelcart_cart');
    if (storedCart) {
      try {
        setCart(JSON.parse(storedCart));
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('pixelcart_cart', JSON.stringify(cart));
  }, [cart]);

  const setUser = (newUser: User | null) => setUserState(newUser);

  const logout = () => {
    if (auth) auth.signOut();
    setUser(null);
    setCart([]);
  };

  const addToCart = (product: Product, quantity: number, variant?: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.selectedVariant === variant);
      if (existing) {
        return prev.map(item =>
          (item.id === product.id && item.selectedVariant === variant) ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { ...product, quantity, selectedVariant: variant }];
    });
  };

  const removeFromCart = (productId: string, variant?: string) => {
    setCart(prev => prev.filter(item => !(item.id === productId && item.selectedVariant === variant)));
  };

  const clearCart = () => setCart([]);

  const addOrder = (order: Order) => {
    if (!firestore) return;
    const orderRef = doc(firestore, 'orders', order.id);
    setDocumentNonBlocking(orderRef, order, { merge: true });
  };

  const updateOrder = (orderId: string, data: Partial<Order>) => {
    if (!firestore) return;
    const orderRef = doc(firestore, 'orders', orderId);
    updateDocumentNonBlocking(orderRef, data);
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    if (!firestore) return;
    
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      updateOrder(orderId, { status });
      return;
    }

    if (status === 'delivered' && order.status !== 'delivered') {
      const itemsToUpdate = order.items && order.items.length > 0 
        ? order.items 
        : [{ productId: order.productId, quantity: order.quantity, selectedVariant: order.selectedVariant } as OrderItem];

      itemsToUpdate.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const productRef = doc(firestore, 'products', product.id);
          
          if (item.selectedVariant && product.variants) {
            const updatedVariants = product.variants.map(v => {
              if (v.name === item.selectedVariant) {
                return { ...v, countInStock: Math.max(0, v.countInStock - item.quantity) };
              }
              return v;
            });
            
            updateDocumentNonBlocking(productRef, {
              variants: updatedVariants,
              countInStock: Math.max(0, product.countInStock - item.quantity)
            });
          } else {
            updateDocumentNonBlocking(productRef, {
              countInStock: Math.max(0, product.countInStock - item.quantity)
            });
          }
        }
      });
    }

    updateOrder(orderId, { status });
  };

  const updateSettings = (newSettings: Partial<SiteSettings>) => {
    if (!firestore) return;
    const settingsRef = doc(firestore, 'settings', 'config');
    updateDocumentNonBlocking(settingsRef, newSettings);
  };

  const updateDeliveryTariff = (stateId: string, tariff: DeliveryTariff) => {
    if (!firestore) return;
    const tariffRef = doc(firestore, 'delivery_tariffs', stateId);
    setDocumentNonBlocking(tariffRef, tariff, { merge: true });
  };

  const addAdmin = (userId: string) => {
    if (!firestore) return;
    const roleRef = doc(firestore, 'roles_admin', userId);
    setDocumentNonBlocking(roleRef, { isAdmin: true }, { merge: true });
  };

  const removeAdmin = (userId: string) => {
    if (!firestore) return;
    const roleRef = doc(firestore, 'roles_admin', userId);
    deleteDocumentNonBlocking(roleRef);
  };

  const setProducts: React.Dispatch<React.SetStateAction<Product[]>> = (val) => {
    if (typeof val === 'function') {
      const updated = val(products);
      setProductsState(updated);
    } else {
      setProductsState(val);
    }
  };

  return (
    <PixelCartContext.Provider value={{
      user,
      isUserLoading,
      isInitialLoading,
      setUser,
      products,
      setProducts,
      categories,
      cart,
      addToCart,
      removeFromCart,
      clearCart,
      orders,
      addOrder,
      updateOrder,
      updateOrderStatus,
      logout,
      settings,
      updateSettings,
      deliveryTariffs,
      updateDeliveryTariff,
      addAdmin,
      removeAdmin
    }}>
      {children}
    </PixelCartContext.Provider>
  );
};

export const usePixelCart = () => {
  const context = useContext(PixelCartContext);
  if (!context) throw new Error('usePixelCart must be used within PixelCartProvider');
  return context;
};
