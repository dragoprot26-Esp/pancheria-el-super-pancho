import { useState, useEffect } from 'react';
import { Product, CartItem, Order, AdminSettings, OrderStatus } from './types';
import { PRODUCTS } from './data';
import ProductCard from './components/ProductCard';
import CartBasket from './components/CartBasket';
import CheckoutDialog from './components/CheckoutDialog';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';
import { 
  Store, Phone, Clock, ShieldCheck, MapPin, 
  Menu, Info, ChevronRight, MessageSquare, Sparkles 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  cloudLoad, cloudSave, pancPublica, pancAgregarPedido,
  estaLogueado, miMembresia, signOut as cloudSignOut,
} from './cloud';

const DEFAULT_SETTINGS: AdminSettings = {
  pickupEnabled: true,
  deliveryEnabled: true,
  licenseValidated: true,
};

export default function App() {
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Admin and configuration state
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [loggedAdmin, setLoggedAdmin] = useState<string | null>(null);
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_SETTINGS);

  // Dynamic products list (populated initially by static list)
  const [products, setProducts] = useState<Product[]>(PRODUCTS);

  // Orders list
  const [orders, setOrders] = useState<Order[]>([]);

  // Collaborators (equipo del local)
  const [collaborators, setCollaborators] = useState<any[]>([]);

  // Nube (molde del ecosistema CyC)
  const [cloudCode, setCloudCode] = useState<string>('');
  const [isPublicView, setIsPublicView] = useState(false);

  // Category filter
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showShareModal, setShowShareModal] = useState(false);

  // ── Aplicar un blob de la nube al estado local ──
  const aplicarDatos = (data: any, publico = false) => {
    if (!data) return;
    if (data.config) setSettings(prev => ({ ...prev, ...data.config }));
    if (Array.isArray(data.products)) setProducts(data.products);
    if (!publico) {
      if (Array.isArray(data.orders)) setOrders(data.orders);
      if (Array.isArray(data.collaborators)) setCollaborators(data.collaborators);
    }
  };

  // 1) Vidriera pública por ?codigo=  (menú del local, sin login)
  //    Recuerda el código en este dispositivo, así no hace falta repetirlo.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlCode = (params.get('codigo') || params.get('local') || '').trim().toUpperCase();
    if (urlCode) { try { localStorage.setItem('panc_code', urlCode); } catch (e) {} }
    let stored = '';
    try { stored = (localStorage.getItem('panc_code') || '').trim().toUpperCase(); } catch (e) {}
    // Si hay sesión de admin, no forzamos la vista pública (que restaure el panel).
    const code = urlCode || (!estaLogueado() ? stored : '');
    if (!code) return;
    setIsPublicView(true);
    setCloudCode(code);
    (async () => {
      const data = await pancPublica(code);
      if (data) aplicarDatos(data, true);
    })();
  }, []);

  // 2) Restaurar sesión de admin si ya estaba logueado
  useEffect(() => {
    if (isPublicView) return;
    if (!estaLogueado()) return;
    (async () => {
      const m = await miMembresia();
      if (!m || !m.tenant_id) return;
      setCloudCode(m.tenant_id);
      setLoggedAdmin(m.usuario || 'Jefe');
      const remote = await cloudLoad(m.tenant_id);
      if (remote) aplicarDatos(remote, false);
    })();
  }, [isPublicView]);

  // Login OK (desde AdminLogin): vincula el local y carga/siembra la nube
  const handleLoginSuccess = async (name: string, codigo: string) => {
    setLoggedAdmin(name);
    setCloudCode(codigo);
    setShowAdminLogin(false);
    const remote = await cloudLoad(codigo);
    const vacio = !remote || (!remote.products && !remote.config && !remote.orders);
    if (vacio) {
      // Primera vez: sembrar con el catálogo y la config por defecto
      await cloudSave(codigo, {
        config: settings, products, orders: [], collaborators: [],
      });
    } else {
      aplicarDatos(remote, false);
    }
  };

  const handleLogout = () => {
    cloudSignOut();
    setLoggedAdmin(null);
    setCloudCode('');
  };

  // 3) Guardado en la nube (admin) con traer-antes-de-guardar
  useEffect(() => {
    if (!loggedAdmin || !cloudCode || isPublicView) return;
    const tmr = setTimeout(async () => {
      const remote = await cloudLoad(cloudCode);
      const remoteOrders = (remote && Array.isArray(remote.orders)) ? remote.orders : [];
      const localIds = new Set(orders.map(o => o.id));
      const nuevos = remoteOrders.filter((o: any) => o && o.id && !localIds.has(o.id));
      const mergedOrders = nuevos.length ? [...nuevos, ...orders] : orders;
      if (nuevos.length) setOrders(mergedOrders);
      await cloudSave(cloudCode, {
        config: settings, products, orders: mergedOrders, collaborators,
      });
    }, 1200);
    return () => clearTimeout(tmr);
  }, [products, orders, settings, collaborators, loggedAdmin, cloudCode, isPublicView]);

  // Aviso sonoro + notificación de pedidos nuevos
  const avisarNuevoPedido = (n: number) => {
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (Ctx) { const ctx = new Ctx(); const osc = ctx.createOscillator(); const g = ctx.createGain(); osc.connect(g); g.connect(ctx.destination); osc.type = 'sine'; osc.frequency.value = 880; g.gain.value = 0.12; osc.start(); osc.stop(ctx.currentTime + 0.3); }
    } catch (e) {}
    try { if ('Notification' in window && Notification.permission === 'granted') { new Notification('\u{1F514} Nuevo pedido', { body: `Tenés ${n} pedido(s) nuevo(s) en tu panchería.` }); } } catch (e) {}
  };

  // 4) Sondeo de pedidos nuevos (campanita) cada 15s
  useEffect(() => {
    if (!loggedAdmin || !cloudCode || isPublicView) return;
    if ('Notification' in window && Notification.permission === 'default') { try { Notification.requestPermission(); } catch (e) {} }
    const iv = setInterval(async () => {
      const remote = await cloudLoad(cloudCode);
      if (!remote || !Array.isArray(remote.orders)) return;
      setOrders(prev => {
        const ids = new Set(prev.map(o => o.id));
        const nuevos = (remote.orders as any[]).filter((o: any) => o && o.id && !ids.has(o.id));
        if (nuevos.length) avisarNuevoPedido(nuevos.length);
        return nuevos.length ? [...nuevos, ...prev] : prev;
      });
    }, 15000);
    return () => clearInterval(iv);
  }, [loggedAdmin, cloudCode, isPublicView]);

  // Cart operations
  const handleAddToCart = (product: Product, quantity: number, notes: string) => {
    setCart(prev => {
      // Check if same item with same notes is already in cart
      const existingIdx = prev.findIndex(
        item => item.product.id === product.id && item.notes === notes
      );

      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += quantity;
        return updated;
      }

      return [...prev, { product, quantity, notes }];
    });
  };

  const handleRemoveItem = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateQuantity = (index: number, delta: number) => {
    setCart(prev => {
      const updated = [...prev];
      updated[index].quantity += delta;
      if (updated[index].quantity <= 0) {
        return prev.filter((_, i) => i !== index);
      }
      return updated;
    });
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Cambio de estado de pedido (local → se persiste en la nube por el efecto de guardado)
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  // Toggles de retiro / delivery (config local → nube)
  const handleTogglePickup = async (enabled: boolean) => {
    setSettings(prev => ({ ...prev, pickupEnabled: enabled }));
  };

  const handleToggleDelivery = async (enabled: boolean) => {
    setSettings(prev => ({ ...prev, deliveryEnabled: enabled }));
  };

  // Guardar ajustes de marca/tema (desde AdminPanel)
  const handleSaveTheme = async (payload: Partial<AdminSettings>): Promise<boolean> => {
    setSettings(prev => ({ ...prev, ...payload }));
    return true;
  };

  // Alta/edición de producto (desde AdminPanel)
  const handleSaveProduct = async (payload: Product, editingId: string | null): Promise<{ ok: boolean; error?: string }> => {
    if (editingId) {
      setProducts(prev => prev.map(p => p.id === editingId ? { ...p, ...payload, id: editingId } : p));
    } else {
      const id = (payload.id && String(payload.id)) || `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      setProducts(prev => [{ ...payload, id }, ...prev]);
    }
    return { ok: true };
  };

  // Baja de producto (desde AdminPanel)
  const handleDeleteProduct = async (id: string): Promise<void> => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const filteredProducts = products.filter(
    p => selectedCategory === 'all' || p.category === selectedCategory
  );

  // If a Boss is logged in, show the Admin Dashboard view instead
  if (loggedAdmin) {
    return (
      <AdminPanel
        adminName={loggedAdmin}
        onLogout={handleLogout}
        orders={orders}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        settings={settings}
        onTogglePickup={handleTogglePickup}
        onToggleDelivery={handleToggleDelivery}
        products={products}
        onSaveTheme={handleSaveTheme}
        onSaveProduct={handleSaveProduct}
        onDeleteProduct={handleDeleteProduct}
        publicCode={cloudCode}
      />
    );
  }

  const fontName = settings.fontFamily || 'Inter';
  let fontStyleFamily = "'Inter', sans-serif";
  if (fontName === 'Outfit') fontStyleFamily = "'Outfit', sans-serif";
  else if (fontName === 'Playfair Display') fontStyleFamily = "'Playfair Display', serif";
  else if (fontName === 'JetBrains Mono') fontStyleFamily = "'JetBrains Mono', monospace";

  const publicUrl = cloudCode ? `${window.location.origin}/?codigo=${cloudCode}` : window.location.origin;

  const localAddress = (settings.address || '').trim();
  const mapsHref = (settings.mapsUrl || '').trim()
    ? (settings.mapsUrl || '').trim()
    : (localAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(localAddress)}` : '');

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5]">
      <style>{`
        body, button, input, textarea, select, h1, h2, h3, h4, h5, h6, span, p, div {
          font-family: ${fontStyleFamily} !important;
        }
      `}</style>
      
      {/* Promotion / Announcement Top Bar */}
      <div className="bg-brand-red text-white text-[11px] font-bold text-center py-2 px-4 tracking-wider flex items-center justify-center gap-1.5 shadow-sm font-display">
        <Sparkles size={13} className="animate-pulse" />
        <span>¡RETIROS EN LOCAL O DELIVERY DIRECTO! PEDIDOS LISTOS EN 15 MINUTOS • SÚPER MEJAS 🌭</span>
      </div>

      {/* Main Header */}
      <header className="bg-white border-b border-stone-100 shadow-3xs sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings.logoImage ? (
              <img src={settings.logoImage} alt="Logo" className="w-10 h-10 rounded-xl object-cover border border-stone-200" referrerPolicy="no-referrer" />
            ) : (
              <span className="text-3xl">🌭</span>
            )}
            <div>
              <h1 className="text-xl font-extrabold font-display tracking-tight text-stone-900 flex items-center gap-1.5">
                {settings.brandName || 'La Panchería del Jefe'}
              </h1>
              <p className="text-[10px] text-stone-500 font-medium">{settings.brandSubtitle || 'Panes súper tiernos, salchichas premium'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick schedule badge */}
            <div className="hidden md:flex items-center gap-1.5 bg-stone-50 border border-stone-100 rounded-full px-3 py-1 text-[11px] text-stone-500 font-semibold">
              <Clock size={12} className="text-brand-orange" />
              <span>{settings.openingHours || 'Abierto: 11:30hs a 23:30hs'}</span>
            </div>

            {/* Quick Whatsapp Contact badge */}
            <div className="hidden sm:flex items-center gap-1.5 bg-stone-50 border border-stone-100 rounded-full px-3 py-1 text-[11px] text-stone-500 font-semibold">
              <Phone size={12} className="text-emerald-500" />
              <span>Soporte: {settings.supportPhone || '11 5566-7788'}</span>
            </div>

            {/* Share QR Button */}
            <button
              id="share-qr-trigger-btn"
              onClick={() => setShowShareModal(true)}
              className="px-3 py-1.5 bg-brand-orange hover:bg-brand-orange/90 text-white rounded-full text-xs font-display font-extrabold transition-all flex items-center gap-1 shadow-sm active:scale-95"
              title="Compartir Carta por QR"
            >
              <span>Compartir QR</span>
              <span className="text-sm">📱</span>
            </button>

            {/* Admin Console entry button */}
            <button
              id="admin-console-login-trigger"
              onClick={() => setShowAdminLogin(true)}
              className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-100 rounded-full text-xs font-display font-extrabold transition-all flex items-center gap-1 shadow-sm"
              title="Consola de Administración de Jefes"
            >
              <span>Jefes</span>
              <span className="h-1.5 w-1.5 bg-brand-orange rounded-full animate-ping" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Store banner with visual assets */}
      <div className="relative bg-gradient-to-br from-stone-900 to-stone-950 text-white overflow-hidden py-12 px-6 border-b border-stone-800">
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(255,255,255,0.02)_1px,_transparent_1px)] bg-[size:20px_20px] opacity-40" />
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="space-y-4 max-w-lg text-center md:text-left">
            <span className="bg-brand-orange text-white text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full shadow-xs">
              {settings.heroBadge || 'SABOR ARGENTINO PREMIUM'}
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold font-display tracking-tight text-white leading-tight whitespace-pre-line">
              {settings.heroTitle || 'Panchos cargados de verdad,\ncomo a vos te gustan.'}
            </h2>
            <p className="text-stone-300 text-xs leading-relaxed">
              {settings.heroDescription || 'Disfrutá de panes brioche artesanales, aderezos importados, lluvia interminable de papitas pay crujientes y combinaciones brutales de quesos fundidos. Pedí y retirá rápido en nuestro local o solicitalo directo a tu casa.'}
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs pt-1">
              <div className="flex items-center gap-1.5 text-brand-yellow font-semibold">
                <ShieldCheck size={16} />
                <span>Calidad Asegurada</span>
              </div>
              <div className="h-4 w-[1px] bg-stone-700 hidden sm:block" />
              <div className="flex items-center gap-1.5 text-stone-300 font-semibold">
                <Store size={16} className="text-brand-orange" />
                <span>{settings.pickupEnabled ? 'Retiro en Local Disponible' : 'Delivery Únicamente'}</span>
              </div>
            </div>
          </div>

          {/* Side floating visuals showing photos */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="space-y-4">
              <img 
                src={settings.heroImage1 || products.find(p => p.id === 'pancho-1')?.image || PRODUCTS[0].image} 
                alt="Pancho Clásico" 
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover shadow-lg border-2 border-stone-800/80 hover:rotate-2 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
              <img 
                src={settings.heroImage2 || products.find(p => p.id === 'side-1')?.image || PRODUCTS[4].image} 
                alt="Papas Cheddar" 
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover shadow-lg border-2 border-stone-800/80 -rotate-3 hover:rotate-0 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <img 
                src={settings.heroImage3 || products.find(p => p.id === 'pancho-2')?.image || PRODUCTS[1].image} 
                alt="Súper Pancho" 
                className="w-32 h-44 sm:w-44 sm:h-56 rounded-3xl object-cover shadow-2xl border-2 border-stone-800/80 rotate-2 hover:rotate-0 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="sticky top-[73px] bg-[#FAF9F5]/95 backdrop-blur-md z-20 py-5 border-b border-stone-200/50">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-4 overflow-x-auto">
          <div className="flex gap-2">
            {[
              { id: 'all', name: '📋 Todo el Menú', icon: '' },
              ...(settings.categories || [
                { id: 'panchos', name: 'Súper Panchos', icon: '🌭' },
                { id: 'promos', name: 'Combos / Promos', icon: '🎁' },
                { id: 'sides', name: 'Acompañamientos', icon: '🍟' },
                { id: 'drinks', name: 'Bebidas', icon: '🥤' }
              ])
            ].map(cat => (
              <button
                id={`cat-btn-${cat.id}`}
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-display font-extrabold uppercase tracking-wide transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? 'bg-brand-orange text-white shadow-md active:scale-95'
                    : 'bg-white border border-stone-200 text-stone-600 hover:text-stone-900 hover:border-stone-400'
                }`}
              >
                {cat.icon && <span className="text-sm">{cat.icon}</span>}
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main product showcase grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:py-10">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2 border-b border-stone-100 pb-4">
            <div>
              <h3 className="text-2xl font-black font-display text-stone-900 uppercase tracking-tight">
                {selectedCategory === 'all' 
                  ? 'Nuestra Carta Completa' 
                  : (() => {
                      const found = (settings.categories || [
                        { id: 'panchos', name: 'Súper Panchos', icon: '🌭' },
                        { id: 'promos', name: 'Combos / Promos', icon: '🎁' },
                        { id: 'sides', name: 'Acompañamientos', icon: '🍟' },
                        { id: 'drinks', name: 'Bebidas', icon: '🥤' }
                      ]).find(c => c.id === selectedCategory);
                      if (!found) return 'Nuestra Selección';
                      return `${found.icon ? found.icon + ' ' : ''}${found.name}`;
                    })()
                }
              </h3>
              <p className="text-xs text-stone-500 mt-1">Armados en el acto por nuestros chefs con materias primas premium.</p>
            </div>
            
            {selectedCategory === 'promos' && (
              <span className="bg-brand-red/10 border border-brand-red/20 text-brand-red text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider block w-fit animate-pulse font-display">
                🔥 ¡HOTSALE DE LA SEMANA!
              </span>
            )}
          </div>

          {/* Grid list */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(prod => (
              <ProductCard
                key={prod.id}
                product={prod}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Customer Reviews Section */}
      <section id="opiniones-clientes-seccion" className="bg-amber-50/20 border-y border-stone-100 py-12 px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="bg-brand-orange/10 text-brand-orange text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full font-display">
              CLIENTES VERIFICADOS ★★★★★
            </span>
            <h3 className="text-2xl md:text-3xl font-black font-display text-stone-900 uppercase tracking-tight">
              Lo que opinan de nosotros
            </h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Nuestros comensales confirman la calidad de nuestros súper panchos y el servicio express.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {(settings.reviews || [
              {
                id: 'rev-1',
                author: 'Juan Pérez',
                rating: 5,
                text: '¡Los mejores panchos de Buenos Aires! La salchicha alemana es increíble y las papas pay siempre están súper crujientes. 100% recomendado.',
                date: 'Hace 2 días'
              },
              {
                id: 'rev-2',
                author: 'Carolina Gómez',
                rating: 5,
                text: 'Excelente atención y el delivery llegó rapidísimo. El pan brioche es tan suave que se deshace. Los combos valen totalmente la pena.',
                date: 'Hace 1 semana'
              },
              {
                id: 'rev-3',
                author: 'Lucas Rodríguez',
                rating: 5,
                text: 'Un viaje de ida. La salsa barbacoa casera y el queso fundido arriba son una bomba brutal. Ya pedimos tres veces este mes.',
                date: 'Hace 3 semanas'
              }
            ]).map((rev, idx) => (
              <div key={rev.id || idx} className="bg-white p-6 rounded-2xl border border-stone-200/50 shadow-3xs flex flex-col justify-between space-y-4">
                <p className="text-xs text-stone-600 italic leading-relaxed">
                  "{rev.text}"
                </p>
                <div className="flex items-center justify-between border-t border-stone-50 pt-3">
                  <div>
                    <h5 className="font-display font-extrabold text-xs text-stone-900">{rev.author}</h5>
                    <p className="text-[10px] text-stone-400">{rev.date || 'Cliente Verificado'}</p>
                  </div>
                  <div className="flex items-center text-amber-500 gap-0.5">
                    {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                      <span key={i} className="text-sm">★</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Info footer banner */}
      <footer className="bg-white border-t border-stone-100 py-8 px-4 text-center text-xs text-stone-400 space-y-4">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-6 text-stone-500 font-medium">
          <div className="flex flex-col items-center gap-1.5 p-4 rounded-2xl bg-stone-50 border border-stone-100">
            <span className="text-2xl">⚡</span>
            <p className="font-bold text-stone-900">Preparación Instantánea</p>
            <p className="text-[11px] text-stone-400">Cocinado al recibir. Despacho rápido para agilizar tu comida.</p>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-4 rounded-2xl bg-stone-50 border border-stone-100">
            <span className="text-2xl">📍</span>
            <p className="font-bold text-stone-900">Retiro o Envío</p>
            <p className="text-[11px] text-stone-400">Elegí retirar en mostrador o envío express por moto.</p>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-4 rounded-2xl bg-stone-50 border border-stone-100">
            <span className="text-2xl">⭐</span>
            <p className="font-bold text-stone-900">Jefes del Sabor</p>
            <p className="text-[11px] text-stone-400">Ingredientes frescos auditados diariamente por los dueños.</p>
          </div>
        </div>

        {(localAddress || mapsHref) && (
          <div className="max-w-md mx-auto flex flex-col items-center gap-3 pt-2">
            {localAddress && (
              <p className="flex items-center gap-1.5 text-stone-700 font-semibold text-sm">
                <span>📍</span>
                <span>{localAddress}</span>
              </p>
            )}
            {mapsHref && (
              <a
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-brand-orange hover:bg-brand-orange/90 text-white px-5 py-2.5 rounded-full text-xs font-display font-extrabold shadow-sm transition-all active:scale-95"
              >
                <span>🗺️</span>
                <span>Cómo llegar al local</span>
              </a>
            )}
          </div>
        )}

        <p className="pt-4 border-t border-stone-50 text-[11px]">
          © {new Date().getFullYear()} {settings.brandName || 'La Panchería del Jefe'}. Todos los derechos reservados. Hecho con pasión culinaria.
        </p>
      </footer>

      {/* Interactive Sticky Cart Basket in the center bottom */}
      <CartBasket
        cart={cart}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onOpenCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Checkout dialogue overlay sheet */}
      <CheckoutDialog
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        onRemoveItem={handleRemoveItem}
        onUpdateQuantity={handleUpdateQuantity}
        onClearCart={handleClearCart}
        pickupEnabled={settings.pickupEnabled}
        deliveryEnabled={settings.deliveryEnabled}
        publicCode={cloudCode}
        localAddress={localAddress}
        localMapsUrl={mapsHref}
      />

      {/* Administrative login portal modal */}
      <AnimatePresence>
        {showAdminLogin && (
          <AdminLogin
            onLoginSuccess={handleLoginSuccess}
            onClose={() => setShowAdminLogin(false)}
          />
        )}
      </AnimatePresence>

      {/* Share QR Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white p-6 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-2xl border border-stone-100 relative"
            >
              <div className="flex justify-between items-center pb-2 border-b border-stone-100">
                <h3 className="font-display font-black text-stone-900 uppercase tracking-tight">Compartir Menú</h3>
                <button 
                  onClick={() => setShowShareModal(false)}
                  className="text-stone-400 hover:text-stone-600 text-lg font-bold p-1"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-stone-500">
                Escaneá el código QR con tu celular para abrir la carta digital al instante o compartilo con tus clientes.
              </p>
              
              <div className="bg-stone-50 p-4 rounded-2xl flex flex-col items-center justify-center border border-stone-200">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(publicUrl)}`} 
                  alt="QR Menú" 
                  className="w-48 h-48 rounded-xl shadow-md border-4 border-white bg-white"
                />
                <span className="text-[10px] font-mono mt-2 text-stone-400 break-all select-all">{publicUrl}</span>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(publicUrl);
                  alert('¡Enlace copiado al portapapeles!');
                }}
                className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white py-2.5 rounded-xl text-xs font-bold font-display transition-all active:scale-95 shadow-sm"
              >
                Copiar Enlace
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
