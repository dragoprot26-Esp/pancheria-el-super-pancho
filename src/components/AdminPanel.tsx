import React, { useState, useEffect, useRef } from 'react';
import { comprimirImagen } from '../img';
import { Order, OrderStatus, AdminSettings, SalesMetrics, Product } from '../types';
import { 
  ClipboardList, BarChart3, Settings2, Bell, Download, 
  Store, CheckCircle2, Clock, Play, Check, AlertTriangle, 
  User, RefreshCw, LogOut, TrendingUp, DollarSign, 
  ShoppingBag, Percent, ArrowUpRight, Volume2, VolumeX, ShieldCheck,
  Trash2, Plus, Image, Tag, Sparkles, MapPin, Pencil, Palette,
  ChevronUp, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const AVAILABLE_ICONS = [
  '🌭', '🍔', '🍕', '🍟', '🥤', '🍺', '🍻', '🍹', '🧉', '☕', '🍩', '🍦', '🍰', '🍫', '🍪', '🥞',
  '🥗', '🌮', '🌯', '🥩', '🍗', '🍖', '🍣', '🍱', '🍜', '🍝', '🥖', '🥐', '🍞', '🧀', '🍿', '🎁',
  '🎈', '🎉', '⭐', '🔥', '❤️', '💼', '🛒', '🍽️', '🍳', '🏪', '🚚', '🛵'
];

interface AdminPanelProps {
  adminName: string;
  onLogout: () => void;
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  settings: AdminSettings;
  onTogglePickup: (enabled: boolean) => Promise<void>;
  onToggleDelivery: (enabled: boolean) => Promise<void>;
  products: Product[];
  onSaveTheme: (payload: Partial<AdminSettings>) => Promise<boolean>;
  onSaveProduct: (payload: Product, editingId: string | null) => Promise<{ ok: boolean; error?: string }>;
  onDeleteProduct: (id: string) => Promise<void>;
  publicCode: string;
}

export default function AdminPanel({
  adminName,
  onLogout,
  orders,
  onUpdateOrderStatus,
  settings,
  onTogglePickup,
  onToggleDelivery,
  products,
  onSaveTheme,
  onSaveProduct,
  onDeleteProduct,
  publicCode
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'analytics' | 'settings' | 'menu' | 'theme'>('orders');
  const [orderViewMode, setOrderViewMode] = useState<'grid' | 'bar'>('grid');
  const [menuSubTab, setMenuSubTab] = useState<'products' | 'promotions' | 'offers'>('products');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Menu Creation Form State
  const [prodName, setProdName] = useState('');
  const [prodDescription, setProdDescription] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodOriginalPrice, setProdOriginalPrice] = useState('');
  const [prodCategory, setProdCategory] = useState<string>('panchos');
  const [prodImageBase64, setProdImageBase64] = useState('');
  const [prodTag, setProdTag] = useState('');
  const [customFields, setCustomFields] = useState<{ name: string; value: string }[]>([]);
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [errorProductMsg, setErrorProductMsg] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Theme customization state
  const [themeBrandName, setThemeBrandName] = useState('');
  const [themeBrandSubtitle, setThemeBrandSubtitle] = useState('');
  const [themeSupportPhone, setThemeSupportPhone] = useState('');
  const [themeOpeningHours, setThemeOpeningHours] = useState('');
  const [themeAddress, setThemeAddress] = useState('');
  const [themeMapsUrl, setThemeMapsUrl] = useState('');
  const [themeLogoImage, setThemeLogoImage] = useState('');
  const [themeHeroBadge, setThemeHeroBadge] = useState('');
  const [themeHeroTitle, setThemeHeroTitle] = useState('');
  const [themeHeroDescription, setThemeHeroDescription] = useState('');
  const [themeHeroImage1, setThemeHeroImage1] = useState('');
  const [themeHeroImage2, setThemeHeroImage2] = useState('');
  const [themeHeroImage3, setThemeHeroImage3] = useState('');
  const [themeFontFamily, setThemeFontFamily] = useState('Inter');
  const [themeReviews, setThemeReviews] = useState<any[]>([]);
  const [themeCategories, setThemeCategories] = useState<any[]>([]);
  const [adminTheme, setAdminTheme] = useState('classic');
  
  // Dynamic add states
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🌭');
  const [showIconPickerFor, setShowIconPickerFor] = useState<'new' | number | null>(null);
  const [deletingCatIdx, setDeletingCatIdx] = useState<number | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [deletingReviewIdx, setDeletingReviewIdx] = useState<number | null>(null);
  const [newRevAuthor, setNewRevAuthor] = useState('');
  const [newRevRating, setNewRevRating] = useState(5);
  const [newRevText, setNewRevText] = useState('');
  const [newRevDate, setNewRevDate] = useState('');
  
  const [savingTheme, setSavingTheme] = useState(false);
  const [themeSuccessMsg, setThemeSuccessMsg] = useState('');

  // Synchronize from settings on mount or settings load
  useEffect(() => {
    if (settings) {
      setThemeBrandName(settings.brandName || 'La Panchería del Jefe');
      setThemeBrandSubtitle(settings.brandSubtitle || 'Panes súper tiernos, salchichas premium');
      setThemeSupportPhone(settings.supportPhone || '11 5566-7788');
      setThemeOpeningHours(settings.openingHours || 'Abierto: 11:30hs a 23:30hs');
      setThemeAddress(settings.address || '');
      setThemeMapsUrl(settings.mapsUrl || '');
      setThemeLogoImage(settings.logoImage || '');
      setThemeHeroBadge(settings.heroBadge || 'SABOR ARGENTINO PREMIUM');
      setThemeHeroTitle(settings.heroTitle || 'Panchos cargados de verdad,\ncomo a vos te gustan.');
      setThemeHeroDescription(settings.heroDescription || 'Disfrutá de panes brioche artesanales, aderezos importados, lluvia interminable de papitas pay crujientes y combinaciones brutales de quesos fundidos. Pedí y retirá rápido en nuestro local o solicitalo directo a tu casa.');
      setThemeHeroImage1(settings.heroImage1 || '');
      setThemeHeroImage2(settings.heroImage2 || '');
      setThemeHeroImage3(settings.heroImage3 || '');
      setThemeFontFamily(settings.fontFamily || 'Inter');
      setThemeReviews(settings.reviews || []);
      setThemeCategories(settings.categories || []);
      setAdminTheme(settings.adminTheme || 'classic');
    }
  }, [settings]);

  // To play beeps on new order
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
  };

  // Sound generator helper
  const playNewOrderSound = () => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      
      // Play a beautiful "food delivery" double beep
      const playBeep = (time: number, freq: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
        
        osc.start(time);
        osc.stop(time + duration);
      };

      const now = ctx.currentTime;
      playBeep(now, 587.33, 0.15); // D5
      playBeep(now + 0.18, 880, 0.25); // A5
    } catch (err) {
      console.warn('Audio Context block:', err);
    }
  };

  // Monitor for new orders to trigger sound/notifications
  const lastOrderCount = useRef(orders.length);
  useEffect(() => {
    if (orders.length > lastOrderCount.current) {
      const newOrders = orders.slice(0, orders.length - lastOrderCount.current);
      // If there's an actual new pending order
      const hasPending = newOrders.some(o => o.status === 'pending');
      if (hasPending) {
        playNewOrderSound();
        triggerWebNotification(orders[0]);
      }
    }
    lastOrderCount.current = orders.length;
  }, [orders]);

  const triggerWebNotification = (order: Order) => {
    if (notificationPermission === 'granted') {
      new Notification('🌭 ¡Nuevo Pedido en Panchería!', {
        body: `${order.customerName} pidió: ${order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}`,
        icon: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=128'
      });
    }
  };

  // Helper to test notification manually
  const simulateNotification = () => {
    playNewOrderSound();
    if (notificationPermission === 'granted') {
      new Notification('🔔 Notificación Push Activada', {
        body: 'El sistema de avisos instantáneos para Jefes está operativo.',
      });
    } else {
      alert('Por favor, conceda los permisos de notificación primero.');
    }
  };

  // ---------------- MENU AND PRODUCT MANAGEMENT HELPERS ----------------
  const handleAddCustomField = () => {
    setCustomFields(prev => [...prev, { name: '', value: '' }]);
  };

  const handleUpdateCustomField = (index: number, key: 'name' | 'value', val: string) => {
    setCustomFields(prev => prev.map((f, idx) => idx === index ? { ...f, [key]: val } : f));
  };

  const handleRemoveCustomField = (index: number) => {
    setCustomFields(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      comprimirImagen(file, 1000, 0.72).then((r) => { if (r) setProdImageBase64(r); });
    }
  };

  const handleStartEdit = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdDescription(p.description || '');
    setProdPrice(p.price.toString());
    setProdOriginalPrice(p.originalPrice ? p.originalPrice.toString() : '');
    setProdCategory(p.category === 'promos' ? (settings.categories?.[0]?.id || 'panchos') : p.category);
    setProdImageBase64(p.image);
    setProdTag(p.tag || '');
    setCustomFields(p.customFields || []);
    
    const formElement = document.getElementById('prod-form-header');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setProdName('');
    setProdDescription('');
    setProdPrice('');
    setProdOriginalPrice('');
    setProdImageBase64('');
    setProdTag('');
    setCustomFields([]);
    setErrorProductMsg('');
  };

  const handleSaveThemeSettings = async (overrideParams?: any) => {
    setSavingTheme(true);
    setThemeSuccessMsg('');
    try {
      const payload = {
        brandName: overrideParams?.brandName !== undefined ? overrideParams.brandName : themeBrandName,
        brandSubtitle: overrideParams?.brandSubtitle !== undefined ? overrideParams.brandSubtitle : themeBrandSubtitle,
        supportPhone: overrideParams?.supportPhone !== undefined ? overrideParams.supportPhone : themeSupportPhone,
        openingHours: overrideParams?.openingHours !== undefined ? overrideParams.openingHours : themeOpeningHours,
        address: overrideParams?.address !== undefined ? overrideParams.address : themeAddress,
        mapsUrl: overrideParams?.mapsUrl !== undefined ? overrideParams.mapsUrl : themeMapsUrl,
        logoImage: overrideParams?.logoImage !== undefined ? overrideParams.logoImage : themeLogoImage,
        heroBadge: overrideParams?.heroBadge !== undefined ? overrideParams.heroBadge : themeHeroBadge,
        heroTitle: overrideParams?.heroTitle !== undefined ? overrideParams.heroTitle : themeHeroTitle,
        heroDescription: overrideParams?.heroDescription !== undefined ? overrideParams.heroDescription : themeHeroDescription,
        heroImage1: overrideParams?.heroImage1 !== undefined ? overrideParams.heroImage1 : themeHeroImage1,
        heroImage2: overrideParams?.heroImage2 !== undefined ? overrideParams.heroImage2 : themeHeroImage2,
        heroImage3: overrideParams?.heroImage3 !== undefined ? overrideParams.heroImage3 : themeHeroImage3,
        fontFamily: overrideParams?.fontFamily !== undefined ? overrideParams.fontFamily : themeFontFamily,
        reviews: overrideParams?.reviews !== undefined ? overrideParams.reviews : themeReviews,
        categories: overrideParams?.categories !== undefined ? overrideParams.categories : themeCategories,
        adminTheme: overrideParams?.adminTheme !== undefined ? overrideParams.adminTheme : adminTheme,
      };

      const ok = await onSaveTheme(payload);
      if (ok) {
        setThemeSuccessMsg('¡Cambios guardados con éxito!');
        setTimeout(() => setThemeSuccessMsg(''), 4000);
      } else {
        alert('Error al guardar los ajustes del tema.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al guardar los ajustes.');
    } finally {
      setSavingTheme(false);
    }
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorProductMsg('');

    if (!prodName.trim()) return setErrorProductMsg('El nombre es requerido.');
    if (!prodDescription.trim()) return setErrorProductMsg('La descripción es requerida.');
    if (!prodPrice) return setErrorProductMsg('El precio es requerido.');
    if (!prodImageBase64) return setErrorProductMsg('Debe cargar una imagen desde su PC o móvil.');

    setSubmittingProduct(true);
    try {
      const payload = {
        name: prodName.trim(),
        description: prodDescription.trim(),
        price: Number(prodPrice),
        originalPrice: prodOriginalPrice ? Number(prodOriginalPrice) : undefined,
        category: menuSubTab === 'promotions' ? 'promos' : prodCategory,
        image: prodImageBase64,
        isOffer: menuSubTab === 'promotions' || menuSubTab === 'offers',
        tag: prodTag.trim() || (menuSubTab === 'promotions' ? 'PROMO' : menuSubTab === 'offers' ? 'OFERTA' : undefined),
        customFields: customFields.filter(f => f.name.trim() && f.value.trim())
      };

      const r = await onSaveProduct(payload as Product, editingProduct ? editingProduct.id : null);
      if (!r.ok) {
        throw new Error(r.error || 'Error al procesar el ítem.');
      }

      // Reset form on success
      handleCancelEdit();
      alert(editingProduct ? '¡Ítem modificado con éxito!' : '¡Ítem agregado con éxito al menú!');
    } catch (err: any) {
      setErrorProductMsg(err.message || 'Error de conexión. Intente de nuevo.');
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await onDeleteProduct(id);
    } catch (err: any) {
      alert(err.message || 'Error de conexión.');
    }
  };

  // ---------------- ANALYTICS CALCULATIONS ----------------
  const calculateMetrics = (): SalesMetrics => {
    // We only compute metrics for 'completed' orders for actual revenue
    const completedOrders = orders.filter(o => o.status === 'completed');
    const totalSales = completedOrders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = completedOrders.length;
    const averageTicket = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

    const salesByCategory = { panchos: 0, promos: 0, sides: 0, drinks: 0 };
    const ordersByType = { delivery: 0, pickup: 0 };
    const productQuantities: { [name: string]: { qty: number; revenue: number } } = {};

    completedOrders.forEach(order => {
      ordersByType[order.type]++;
      
      order.items.forEach(item => {
        // Find category from items or fallback
        let cat: keyof typeof salesByCategory = 'panchos';
        if (item.name.toLowerCase().includes('combo') || item.name.toLowerCase().includes('promo')) {
          cat = 'promos';
        } else if (item.name.toLowerCase().includes('papas')) {
          cat = 'sides';
        } else if (item.name.toLowerCase().includes('cola') || item.name.toLowerCase().includes('sprite') || item.name.toLowerCase().includes('cerveza')) {
          cat = 'drinks';
        }

        salesByCategory[cat] += item.price * item.quantity;

        if (!productQuantities[item.name]) {
          productQuantities[item.name] = { qty: 0, revenue: 0 };
        }
        productQuantities[item.name].qty += item.quantity;
        productQuantities[item.name].revenue += item.price * item.quantity;
      });
    });

    const topProducts = Object.entries(productQuantities)
      .map(([name, data]) => ({ name, quantity: data.qty, revenue: data.revenue }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Compute past 7 days history for trend
    const historyMap: { [date: string]: { sales: number; count: number } } = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
      historyMap[dateString] = { sales: 0, count: 0 };
    }

    completedOrders.forEach(order => {
      const orderDate = new Date(order.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
      if (historyMap[orderDate] !== undefined) {
        historyMap[orderDate].sales += order.total;
        historyMap[orderDate].count++;
      }
    });

    const dailySalesHistory = Object.entries(historyMap).map(([date, data]) => ({
      date,
      sales: data.sales,
      count: data.count
    }));

    return {
      totalSales,
      totalOrders,
      averageTicket,
      salesByCategory,
      ordersByType,
      dailySalesHistory,
      topProducts
    };
  };

  const metrics = calculateMetrics();

  // ---------------- PDF EXPORT GENERATION ----------------
  const generatePdfReport = (period: 'daily' | 'weekly' | 'monthly') => {
    setGeneratingPdf(true);
    
    setTimeout(() => {
      try {
        const doc = new jsPDF();
        const now = new Date();
        const formattedDate = now.toLocaleDateString('es-AR');
        const formattedTime = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

        // Filter orders based on period
        const periodDays = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - periodDays);

        const periodOrders = orders.filter(o => 
          new Date(o.createdAt) >= cutoffDate && o.status === 'completed'
        );

        const totalPeriodSales = periodOrders.reduce((sum, o) => sum + o.total, 0);
        const totalPeriodOrders = periodOrders.length;
        const avgPeriodTicket = totalPeriodOrders > 0 ? Math.round(totalPeriodSales / totalPeriodOrders) : 0;

        // Header Styling
        doc.setFillColor(225, 29, 72); // Brand Red
        doc.rect(0, 0, 210, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.text('EL SUPER PANCHO - REPORTE DE VENTAS', 15, 20);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Sistema de Facturacion y Control de Jefes • Generado por ${adminName}`, 15, 30);

        // Document Info
        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('INFORMACION GENERAL DEL REPORTE', 15, 52);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Periodo: ${period === 'daily' ? 'Diario (Ultimas 24hs)' : period === 'weekly' ? 'Semanal (Ultimos 7 dias)' : 'Mensual (Ultimos 30 dias)'}`, 15, 60);
        doc.text(`Fecha de Emision: ${formattedDate} a las ${formattedTime}`, 15, 66);
        doc.text(`Administrador Firmante: ${adminName}`, 15, 72);

        // Grid of Core Metrics (using autotable or drawn rectangles)
        doc.setFillColor(250, 250, 249);
        doc.rect(15, 80, 55, 22, 'F');
        doc.rect(77, 80, 55, 22, 'F');
        doc.rect(140, 80, 55, 22, 'F');

        doc.setFontSize(8);
        doc.setTextColor(115, 115, 115);
        doc.text('RECAUDACION TOTAL', 20, 86);
        doc.text('PEDIDOS COMPLETADOS', 82, 86);
        doc.text('TICKET PROMEDIO', 145, 86);

        doc.setFontSize(14);
        doc.setTextColor(225, 29, 72);
        doc.setFont('helvetica', 'bold');
        doc.text(`$${totalPeriodSales.toLocaleString('es-AR')}`, 20, 96);
        doc.setTextColor(30, 41, 59);
        doc.text(`${totalPeriodOrders} pedidos`, 82, 96);
        doc.text(`$${avgPeriodTicket.toLocaleString('es-AR')}`, 145, 96);

        // Detailed Items Sold Table
        const productQuantities: { [name: string]: { qty: number; total: number } } = {};
        periodOrders.forEach(o => {
          o.items.forEach(i => {
            if (!productQuantities[i.name]) {
              productQuantities[i.name] = { qty: 0, total: 0 };
            }
            productQuantities[i.name].qty += i.quantity;
            productQuantities[i.name].total += i.price * i.quantity;
          });
        });

        const tableRows = Object.entries(productQuantities).map(([name, data]) => [
          name,
          data.qty,
          `$${(data.total / data.qty).toLocaleString('es-AR')}`,
          `$${data.total.toLocaleString('es-AR')}`
        ]);

        if (tableRows.length === 0) {
          tableRows.push(['Sin registros de venta en este periodo', '-', '-', '-']);
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('DESGLOSE DETALLADO DE PRODUCTOS VENDIDOS', 15, 115);

        (doc as any).autoTable({
          startY: 120,
          head: [['Nombre del Producto / Combo', 'Cantidad Vendida', 'Precio Unitario', 'Subtotal Recaudado']],
          body: tableRows,
          theme: 'striped',
          headStyles: { fillColor: [234, 88, 12] }, // Brand Orange
          styles: { fontSize: 9, font: 'helvetica' },
          columnStyles: {
            0: { cellWidth: 90 },
            1: { halign: 'center' },
            2: { halign: 'right' },
            3: { halign: 'right' }
          }
        });

        // Add a signature line at bottom
        const finalY = (doc as any).lastAutoTable.finalY + 30;
        doc.setDrawColor(200, 200, 200);
        doc.line(15, finalY, 80, finalY);
        doc.line(130, finalY, 195, finalY);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Firma de Jefe Autorizado', 30, finalY + 5);
        doc.text('Sello Centralizado Panchería', 142, finalY + 5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Documento de control interno auditado electrónicamente. ID Licencia: PANCHERIA-2026-OK.`, 15, finalY + 20);

        // Download file
        doc.save(`reporte_${period}_pancheria_${now.toISOString().slice(0,10)}.pdf`);
      } catch (err) {
        console.error('Error generating PDF:', err);
        alert('Hubo un error al generar el PDF. Revise la consola.');
      } finally {
        setGeneratingPdf(false);
      }
    }, 1000);
  };

  const getThemeClasses = () => {
    switch (adminTheme) {
      case 'dark':
        return {
          bg: 'bg-stone-950 text-stone-100 min-h-screen transition-colors duration-200 font-sans',
          card: 'bg-stone-900 border-stone-800 text-stone-100 shadow-md',
          cardInner: 'bg-stone-950/50 border-stone-800 text-stone-100',
          cardHeader: 'text-stone-100 border-stone-800',
          textMuted: 'text-stone-400',
          textTitle: 'text-stone-100 font-display font-bold',
          border: 'border-stone-800',
          input: 'bg-stone-950 border-stone-800 text-white focus:ring-brand-orange',
          headerBg: 'bg-stone-900 border-b border-stone-800 text-white',
          tabActive: 'border-brand-orange text-brand-orange bg-stone-900',
          tabInactive: 'border-transparent text-stone-400 hover:text-stone-200',
          tabContainer: 'bg-stone-900 border-b border-stone-800 shadow-sm',
          styles: `
            .admin-panel-theme-root .bg-white { background-color: #1c1917 !important; color: #f5f5f4 !important; }
            .admin-panel-theme-root .border-stone-100,
            .admin-panel-theme-root .border-stone-150,
            .admin-panel-theme-root .border-stone-200 { border-color: #2e2a24 !important; }
            .admin-panel-theme-root .text-stone-900,
            .admin-panel-theme-root .text-stone-800,
            .admin-panel-theme-root .text-stone-700 { color: #f5f5f4 !important; }
            .admin-panel-theme-root .text-stone-500,
            .admin-panel-theme-root .text-stone-400 { color: #a8a29e !important; }
            .admin-panel-theme-root .bg-stone-50,
            .admin-panel-theme-root .bg-stone-100 { background-color: #0c0a09 !important; color: #f5f5f4 !important; }
            .admin-panel-theme-root input,
            .admin-panel-theme-root textarea,
            .admin-panel-theme-root select { background-color: #0c0a09 !important; color: #ffffff !important; border-color: #2e2a24 !important; }
            .admin-panel-theme-root .hover\\:bg-stone-50:hover { background-color: #2e2a24 !important; }
          `
        };
      case 'indigo':
        return {
          bg: 'bg-slate-950 text-slate-100 min-h-screen transition-colors duration-200 font-sans',
          card: 'bg-slate-900 border-slate-800 text-slate-100 shadow-md',
          cardInner: 'bg-slate-950/60 border-slate-800 text-slate-100',
          cardHeader: 'text-indigo-400 border-slate-800',
          textMuted: 'text-slate-400',
          textTitle: 'text-indigo-400 font-display font-bold',
          border: 'border-slate-800',
          input: 'bg-slate-950 border-slate-800 text-slate-100 focus:ring-indigo-500',
          headerBg: 'bg-indigo-950 border-b border-indigo-900 text-white',
          tabActive: 'border-indigo-500 text-indigo-400 bg-slate-900',
          tabInactive: 'border-transparent text-slate-400 hover:text-slate-200',
          tabContainer: 'bg-slate-900 border-b border-slate-800 shadow-sm',
          styles: `
            .admin-panel-theme-root .bg-white { background-color: #0f172a !important; color: #f1f5f9 !important; }
            .admin-panel-theme-root .border-stone-100,
            .admin-panel-theme-root .border-stone-150,
            .admin-panel-theme-root .border-stone-200 { border-color: #1e293b !important; }
            .admin-panel-theme-root .text-stone-900,
            .admin-panel-theme-root .text-stone-800,
            .admin-panel-theme-root .text-stone-700 { color: #f1f5f9 !important; }
            .admin-panel-theme-root .text-stone-500,
            .admin-panel-theme-root .text-stone-400 { color: #94a3b8 !important; }
            .admin-panel-theme-root .bg-stone-50,
            .admin-panel-theme-root .bg-stone-100 { background-color: #020617 !important; color: #f1f5f9 !important; }
            .admin-panel-theme-root input,
            .admin-panel-theme-root textarea,
            .admin-panel-theme-root select { background-color: #020617 !important; color: #ffffff !important; border-color: #1e293b !important; }
            .admin-panel-theme-root .hover\\:bg-stone-50:hover { background-color: #1e293b !important; }
          `
        };
      case 'amber':
        return {
          bg: 'bg-zinc-950 text-zinc-100 min-h-screen transition-colors duration-200 font-sans',
          card: 'bg-zinc-900 border-zinc-800 text-zinc-100 shadow-md',
          cardInner: 'bg-zinc-950/60 border-zinc-800 text-zinc-100',
          cardHeader: 'text-amber-400 border-zinc-800',
          textMuted: 'text-amber-500/80',
          textTitle: 'text-amber-400 font-display font-bold',
          border: 'border-zinc-800',
          input: 'bg-zinc-950 border-zinc-800 text-zinc-100 focus:ring-amber-500',
          headerBg: 'bg-zinc-900 border-b border-zinc-850 text-white',
          tabActive: 'border-amber-500 text-amber-400 bg-zinc-900',
          tabInactive: 'border-transparent text-zinc-400 hover:text-zinc-200',
          tabContainer: 'bg-zinc-900 border-b border-zinc-800 shadow-sm',
          styles: `
            .admin-panel-theme-root .bg-white { background-color: #18181b !important; color: #fafafa !important; }
            .admin-panel-theme-root .border-stone-100,
            .admin-panel-theme-root .border-stone-150,
            .admin-panel-theme-root .border-stone-200 { border-color: #27272a !important; }
            .admin-panel-theme-root .text-stone-900,
            .admin-panel-theme-root .text-stone-800,
            .admin-panel-theme-root .text-stone-700 { color: #fafafa !important; }
            .admin-panel-theme-root .text-stone-500,
            .admin-panel-theme-root .text-stone-400 { color: #d97706 !important; }
            .admin-panel-theme-root .bg-stone-50,
            .admin-panel-theme-root .bg-stone-100 { background-color: #09090b !important; color: #fafafa !important; }
            .admin-panel-theme-root input,
            .admin-panel-theme-root textarea,
            .admin-panel-theme-root select { background-color: #09090b !important; color: #f59e0b !important; border-color: #27272a !important; }
            .admin-panel-theme-root .hover\\:bg-stone-50:hover { background-color: #27272a !important; }
          `
        };
      case 'emerald':
        return {
          bg: 'bg-emerald-950 text-emerald-100 min-h-screen transition-colors duration-200 font-sans',
          card: 'bg-stone-900 border-emerald-900/40 text-stone-100 shadow-md',
          cardInner: 'bg-stone-950/60 border-emerald-900/30 text-stone-100',
          cardHeader: 'text-emerald-400 border-emerald-900/30',
          textMuted: 'text-emerald-400/80',
          textTitle: 'text-emerald-400 font-display font-bold',
          border: 'border-emerald-900/30',
          input: 'bg-stone-950 border-emerald-900/40 text-stone-100 focus:ring-emerald-500',
          headerBg: 'bg-emerald-950 border-b border-emerald-900 text-white',
          tabActive: 'border-emerald-500 text-emerald-400 bg-stone-900',
          tabInactive: 'border-transparent text-emerald-300/60 hover:text-emerald-200',
          tabContainer: 'bg-stone-900 border-b border-stone-850 shadow-sm',
          styles: `
            .admin-panel-theme-root .bg-white { background-color: #064e3b !important; color: #f0fdf4 !important; }
            .admin-panel-theme-root .border-stone-100,
            .admin-panel-theme-root .border-stone-150,
            .admin-panel-theme-root .border-stone-200 { border-color: #047857 !important; }
            .admin-panel-theme-root .text-stone-900,
            .admin-panel-theme-root .text-stone-800,
            .admin-panel-theme-root .text-stone-700 { color: #f0fdf4 !important; }
            .admin-panel-theme-root .text-stone-500,
            .admin-panel-theme-root .text-stone-400 { color: #34d399 !important; }
            .admin-panel-theme-root .bg-stone-50,
            .admin-panel-theme-root .bg-stone-100 { background-color: #022c22 !important; color: #f0fdf4 !important; }
            .admin-panel-theme-root input,
            .admin-panel-theme-root textarea,
            .admin-panel-theme-root select { background-color: #022c22 !important; color: #ffffff !important; border-color: #047857 !important; }
            .admin-panel-theme-root .hover\\:bg-stone-50:hover { background-color: #047857 !important; }
          `
        };
      case 'classic':
      default:
        return {
          bg: 'bg-stone-50 text-stone-900 min-h-screen transition-colors duration-200 font-sans',
          card: 'bg-white border-stone-100 text-stone-900 shadow-sm',
          cardInner: 'bg-stone-50 border-stone-150',
          cardHeader: 'text-stone-900 border-stone-100',
          textMuted: 'text-stone-500',
          textTitle: 'text-stone-900 font-display font-bold',
          border: 'border-stone-100',
          input: 'bg-stone-50 border-stone-200 text-stone-900 focus:ring-brand-orange',
          headerBg: 'bg-stone-900 border-b border-stone-800 text-white',
          tabActive: 'border-brand-orange text-brand-orange bg-white',
          tabInactive: 'border-transparent text-stone-500 hover:text-stone-800',
          tabContainer: 'bg-white border-b border-stone-100 shadow-xs',
          styles: ''
        };
    }
  };

  const tc = getThemeClasses();

  const filteredOrders = orders.filter(
    (o) => filterStatus === 'all' || o.status === filterStatus
  );

  return (
    <div className={`admin-panel-theme-root ${tc.bg}`}>
      {tc.styles && <style>{tc.styles}</style>}
      {/* Top Banner Control */}
      <div className="bg-stone-900 border-b border-stone-800 text-white py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-brand-orange text-white p-2.5 rounded-xl font-display font-black text-sm shadow-sm tracking-tighter">
              🌭 BOSS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-lg text-stone-100">Panel de Jefes</h2>
                <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <ShieldCheck size={10} />
                  Licencia OK
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Operando como: <strong className="text-brand-orange">{adminName}</strong>
              </p>
            </div>
          </div>

          {/* Quick Stats on banner */}
          <div className="flex items-center gap-2">
            {/* View Public Page */}
            <a
              id="view-public-page-btn"
              href={publicCode ? `/?codigo=${publicCode}` : '/'}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-emerald-600 border border-emerald-500 hover:bg-emerald-500 text-white rounded-xl text-xs font-display font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer mr-1"
              title="Abrir la carta pública en una nueva pestaña"
            >
              <span>👁️ Ver Carta Pública</span>
            </a>

            {/* Sound Toggle */}
            <button
              id="sound-toggle-btn"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border transition-colors ${
                soundEnabled 
                  ? 'bg-brand-orange/10 border-brand-orange/30 text-brand-orange' 
                  : 'bg-stone-800 border-stone-700 text-stone-500'
              }`}
              title={soundEnabled ? 'Silenciar alertas sonoras' : 'Activar alertas sonoras'}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {/* Simulated Push Notify */}
            <button
              id="test-notification-btn"
              onClick={simulateNotification}
              className="p-2 bg-stone-800 border border-stone-700 text-stone-300 hover:text-white rounded-xl text-xs flex items-center gap-1.5 transition-all"
              title="Probar notificación push"
            >
              <Bell size={14} />
              <span className="hidden sm:inline">Probar Alerta</span>
            </button>

            {/* Logout */}
            <button
              id="logout-btn"
              onClick={onLogout}
              className="px-3.5 py-2 bg-brand-red/10 border border-brand-red/20 text-brand-red hover:bg-brand-red/20 rounded-xl text-xs font-display font-bold flex items-center gap-1.5 transition-colors"
            >
              <LogOut size={14} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className={tc.tabContainer}>
        <div className="max-w-7xl mx-auto px-4 flex gap-4 overflow-x-auto">
          <button
            id="tab-orders"
            onClick={() => setActiveTab('orders')}
            className={`py-4 px-2 text-sm font-display font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'orders' ? tc.tabActive : tc.tabInactive
            }`}
          >
            <ClipboardList size={16} />
            Pedidos en Vivo
            {orders.filter(o => o.status === 'pending').length > 0 && (
              <span className="bg-brand-red text-white font-bold text-[10px] h-5 px-1.5 rounded-full flex items-center justify-center font-display">
                {orders.filter(o => o.status === 'pending').length} nuevos
              </span>
            )}
          </button>

          <button
            id="tab-analytics"
            onClick={() => setActiveTab('analytics')}
            className={`py-4 px-2 text-sm font-display font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'analytics' ? tc.tabActive : tc.tabInactive
            }`}
          >
            <BarChart3 size={16} />
            Métricas y Dashboard
          </button>

          <button
            id="tab-settings"
            onClick={() => setActiveTab('settings')}
            className={`py-4 px-2 text-sm font-display font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'settings' ? tc.tabActive : tc.tabInactive
            }`}
          >
            <Settings2 size={16} />
            Inventario y Retiros
          </button>

          <button
            id="tab-menu"
            onClick={() => setActiveTab('menu')}
            className={`py-4 px-2 text-sm font-display font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'menu' ? tc.tabActive : tc.tabInactive
            }`}
          >
            <ShoppingBag size={16} />
            Gestión de Menú y Ofertas
          </button>

          <button
            id="tab-theme"
            onClick={() => setActiveTab('theme')}
            className={`py-4 px-2 text-sm font-display font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'theme' ? tc.tabActive : tc.tabInactive
            }`}
          >
            <Palette size={16} />
            Personalizar Tema y Textos
          </button>
        </div>
      </div>

      {/* Main Body Grid */}
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: Real-Time Live Order Management */}
          {activeTab === 'orders' && (
            <motion.div
              key="orders-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-6"
            >
              {/* Filter controls */}
              <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-2xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Filtrar por:</span>
                  <div className="flex flex-wrap gap-1">
                    {(['all', 'pending', 'accepted', 'preparing', 'completed', 'cancelled'] as const).map((st) => (
                      <button
                        id={`filter-btn-${st}`}
                        key={st}
                        onClick={() => setFilterStatus(st)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                          filterStatus === st
                            ? 'bg-stone-900 text-white'
                            : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                        }`}
                      >
                        {st === 'all' && 'Todos'}
                        {st === 'pending' && 'Pendientes'}
                        {st === 'accepted' && 'Aceptados'}
                        {st === 'preparing' && 'Preparando'}
                        {st === 'completed' && 'Entregados'}
                        {st === 'cancelled' && 'Cancelados'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-stone-100 p-1 rounded-xl">
                    <button
                      id="view-mode-grid-btn"
                      type="button"
                      onClick={() => setOrderViewMode('grid')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold font-display flex items-center gap-1 transition-all ${
                        orderViewMode === 'grid'
                          ? 'bg-white text-stone-900 shadow-xs'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      Vista Cuadrícula
                    </button>
                    <button
                      id="view-mode-bar-btn"
                      type="button"
                      onClick={() => setOrderViewMode('bar')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold font-display flex items-center gap-1 transition-all ${
                        orderViewMode === 'bar'
                          ? 'bg-white text-stone-900 shadow-xs'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      Vista Horizontal
                    </button>
                  </div>

                  <div className="text-xs text-stone-400">
                    Mostrando <strong className="text-stone-700">{filteredOrders.length}</strong> de <strong className="text-stone-700">{orders.length}</strong> pedidos totales.
                  </div>
                </div>
              </div>

              {/* Order List */}
              {orderViewMode === 'grid' ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {filteredOrders.length === 0 ? (
                      <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-stone-100 p-8 space-y-2">
                        <ClipboardList className="mx-auto text-stone-300" size={48} />
                        <p className="text-stone-500 font-medium">No se encontraron pedidos con este filtro.</p>
                        <p className="text-stone-400 text-xs">Los pedidos entrantes de la web pública aparecerán acá al instante.</p>
                      </div>
                    ) : (
                    filteredOrders.map((order) => {
                      // Status colors
                      const badgeColors = {
                        pending: 'bg-amber-100 text-amber-800 border-amber-200',
                        accepted: 'bg-sky-100 text-sky-800 border-sky-200',
                        preparing: 'bg-brand-orange/10 text-brand-orange border-brand-orange/20',
                        completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                        cancelled: 'bg-stone-200 text-stone-700 border-stone-300'
                      };

                      return (
                        <motion.div
                          id={`order-card-${order.id}`}
                          key={order.id}
                          layout
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.95, opacity: 0 }}
                          className={`bg-white rounded-2xl border p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-all relative overflow-hidden ${
                            order.status === 'pending' ? 'ring-2 ring-amber-500/50' : 'border-stone-150'
                          }`}
                        >
                          {/* Top row with ID and Time */}
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <span className="font-mono text-xs font-bold text-stone-400">#{order.id.slice(-6).toUpperCase()}</span>
                              <h4 className="text-3xl font-black text-brand-orange font-mono leading-none mt-1">
                                {order.code}
                              </h4>
                            </div>
                            <div className="text-right">
                              <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${badgeColors[order.status]}`}>
                                {order.status === 'pending' && 'Pendiente'}
                                {order.status === 'accepted' && 'Aceptado'}
                                {order.status === 'preparing' && 'Preparando'}
                                {order.status === 'completed' && 'Entregado'}
                                {order.status === 'cancelled' && 'Cancelado'}
                              </span>
                              <p className="text-[10px] text-stone-400 mt-1.5 font-medium">
                                {new Date(order.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                              </p>
                            </div>
                          </div>

                          {/* Customer Details */}
                          <div className="bg-stone-50 p-3 rounded-xl mb-4 space-y-1 border border-stone-100 text-xs">
                            <div className="flex justify-between">
                              <span className="text-stone-400">Cliente:</span>
                              <span className="font-bold text-stone-800">{order.customerName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-stone-400">Teléfono:</span>
                              <a href={`tel:${order.customerPhone}`} className="text-brand-orange hover:underline font-semibold flex items-center gap-1">
                                {order.customerPhone}
                              </a>
                            </div>
                            <div className="flex justify-between items-center pt-1 border-t border-stone-100">
                              <span className="text-stone-400">Modo:</span>
                              <span className="font-bold flex items-center gap-1 text-stone-700">
                                {order.type === 'pickup' ? (
                                  <>
                                    <Store size={12} className="text-brand-yellow" />
                                    Retiro en Local
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 size={12} className="text-emerald-500" />
                                    Envío a Domicilio
                                  </>
                                )}
                              </span>
                            </div>
                            {order.address && (
                              <div className="pt-1 text-stone-500 font-medium border-t border-stone-100 truncate">
                                📍 {order.address}
                              </div>
                            )}
                          </div>

                          {/* Order Items */}
                          <div className="space-y-1.5 flex-1 mb-4">
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Productos</p>
                            <div className="space-y-1">
                              {order.items.map((item, index) => (
                                <div key={index} className="text-xs flex justify-between gap-2">
                                  <span className="text-stone-700">
                                    <strong className="text-brand-orange">{item.quantity}x</strong> {item.name}
                                  </span>
                                  <span className="font-semibold text-stone-500">${(item.price * item.quantity).toLocaleString('es-AR')}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Bottom Total & Actions */}
                          <div className="pt-3 border-t border-stone-100 flex items-center justify-between mb-4">
                            <span className="text-xs font-semibold text-stone-500">Total</span>
                            <span className="text-lg font-black text-stone-900 font-display">
                              ${order.total.toLocaleString('es-AR')}
                            </span>
                          </div>

                          {/* Control buttons */}
                          <div className="flex gap-1">
                            {order.status === 'pending' && (
                              <>
                                <button
                                  id={`cancel-btn-${order.id}`}
                                  onClick={() => onUpdateOrderStatus(order.id, 'cancelled')}
                                  className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 py-2 rounded-lg text-xs font-bold transition-all"
                                >
                                  Rechazar
                                </button>
                                <button
                                  id={`accept-btn-${order.id}`}
                                  onClick={() => onUpdateOrderStatus(order.id, 'accepted')}
                                  className="flex-1 bg-brand-orange hover:bg-brand-orange/95 text-white py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
                                >
                                  <Play size={12} className="fill-white" />
                                  Aceptar
                                </button>
                              </>
                            )}

                            {order.status === 'accepted' && (
                              <button
                                id={`prepare-btn-${order.id}`}
                                onClick={() => onUpdateOrderStatus(order.id, 'preparing')}
                                className="w-full bg-brand-yellow hover:bg-brand-yellow/90 text-stone-900 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
                              >
                                <Clock size={12} />
                                Comenzar a Cocinar
                              </button>
                            )}

                            {order.status === 'preparing' && (
                              <button
                                id={`complete-btn-${order.id}`}
                                onClick={() => onUpdateOrderStatus(order.id, 'completed')}
                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
                              >
                                <Check size={14} className="stroke-[3px]" />
                                Listo / Entregado
                              </button>
                            )}

                            {(order.status === 'completed' || order.status === 'cancelled') && (
                              <div className="text-[11px] text-stone-400 font-medium text-center w-full py-1.5 bg-stone-50 rounded-lg">
                                {order.status === 'completed' ? '✓ Pedido finalizado correctamente' : '✗ Pedido cancelado'}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* BAR-STYLE HORIZONTAL LAYOUT */
              <div className="flex flex-col gap-4">
                <AnimatePresence>
                  {filteredOrders.length === 0 ? (
                    <div className="py-12 text-center bg-white rounded-3xl border border-stone-100 p-8 space-y-2">
                      <ClipboardList className="mx-auto text-stone-300" size={48} />
                      <p className="text-stone-500 font-medium">No se encontraron pedidos con este filtro.</p>
                      <p className="text-stone-400 text-xs">Los pedidos entrantes aparecerán acá al instante.</p>
                    </div>
                  ) : (
                    filteredOrders.map((order) => {
                      const badgeColors = {
                        pending: 'bg-amber-100 text-amber-800 border-amber-200',
                        accepted: 'bg-sky-100 text-sky-800 border-sky-200',
                        preparing: 'bg-brand-orange/10 text-brand-orange border-brand-orange/20',
                        completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                        cancelled: 'bg-stone-200 text-stone-700 border-stone-300'
                      };

                      return (
                        <motion.div
                          id={`order-bar-${order.id}`}
                          key={order.id}
                          layout
                          initial={{ scale: 0.98, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.98, opacity: 0 }}
                          className={`bg-white rounded-2xl border p-4 flex flex-col lg:flex-row justify-between items-stretch lg:items-center shadow-xs hover:shadow-md transition-all gap-4 relative overflow-hidden ${
                            order.status === 'pending' ? 'ring-2 ring-amber-500/50' : 'border-stone-150'
                          }`}
                        >
                          {/* Left Section: Order Code & status */}
                          <div className="flex items-center justify-between lg:justify-start gap-4 min-w-[140px]">
                            <div>
                              <span className="font-mono text-[10px] font-bold text-stone-400">#{order.id.slice(-6).toUpperCase()}</span>
                              <h4 className="text-2xl font-black text-brand-orange font-mono leading-none mt-0.5">
                                {order.code}
                              </h4>
                              <p className="text-[10px] text-stone-400 mt-1 font-medium">
                                {new Date(order.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                              </p>
                            </div>
                            <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border h-fit ${badgeColors[order.status]}`}>
                              {order.status === 'pending' && 'Pendiente'}
                              {order.status === 'accepted' && 'Aceptado'}
                              {order.status === 'preparing' && 'Preparando'}
                              {order.status === 'completed' && 'Entregado'}
                              {order.status === 'cancelled' && 'Cancelado'}
                            </span>
                          </div>

                          {/* Middle-Left Section: Customer Info */}
                          <div className="flex-1 min-w-[200px] bg-stone-50 p-2.5 rounded-xl border border-stone-100 text-xs flex flex-col justify-center">
                            <div className="flex justify-between">
                              <span className="text-stone-400">Cliente:</span>
                              <span className="font-bold text-stone-800">{order.customerName}</span>
                            </div>
                            <div className="flex justify-between mt-0.5">
                              <span className="text-stone-400">Teléfono:</span>
                              <a href={`tel:${order.customerPhone}`} className="text-brand-orange hover:underline font-semibold flex items-center gap-1">
                                {order.customerPhone}
                              </a>
                            </div>
                            <div className="flex justify-between items-center pt-1 border-t border-stone-100 mt-1">
                              <span className="text-stone-400">Modo:</span>
                              <span className="font-bold flex items-center gap-1 text-stone-700">
                                {order.type === 'pickup' ? (
                                  <>
                                    <Store size={11} className="text-brand-yellow" />
                                    Retiro en Local
                                  </>
                                ) : (
                                  <>
                                    <MapPin size={11} className="text-emerald-500" />
                                    Envío a Domicilio
                                  </>
                                )}
                              </span>
                            </div>
                            {order.address && (
                              <div className="pt-1 text-stone-500 font-medium border-t border-stone-100 mt-1 truncate max-w-xs" title={order.address}>
                                📍 {order.address}
                              </div>
                            )}
                          </div>

                          {/* Middle Section: Items */}
                          <div className="flex-1 min-w-[180px] text-xs flex flex-col justify-center py-1 border-y lg:border-y-0 py-2.5 lg:py-0 border-stone-100">
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Productos</p>
                            <div className="space-y-1 max-h-[70px] overflow-y-auto pr-1">
                              {order.items.map((item, index) => (
                                <div key={index} className="flex justify-between gap-2 text-[11px]">
                                  <span className="text-stone-700">
                                    <strong className="text-brand-orange">{item.quantity}x</strong> {item.name}
                                  </span>
                                  <span className="font-semibold text-stone-500">${(item.price * item.quantity).toLocaleString('es-AR')}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Right Section: Total & Controls */}
                          <div className="flex flex-col sm:flex-row lg:flex-row items-stretch sm:items-center justify-between gap-4 lg:min-w-[280px]">
                            <div>
                              <span className="text-[10px] font-semibold text-stone-500 block">Total</span>
                              <span className="text-base font-black text-stone-900 font-display">
                                ${order.total.toLocaleString('es-AR')}
                              </span>
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-1 flex-1 justify-end">
                              {order.status === 'pending' && (
                                <>
                                  <button
                                    id={`cancel-bar-btn-${order.id}`}
                                    onClick={() => onUpdateOrderStatus(order.id, 'cancelled')}
                                    className="flex-1 sm:flex-initial px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-bold transition-all"
                                  >
                                    Rechazar
                                  </button>
                                  <button
                                    id={`accept-bar-btn-${order.id}`}
                                    onClick={() => onUpdateOrderStatus(order.id, 'accepted')}
                                    className="flex-1 sm:flex-initial px-4 py-2 bg-brand-orange hover:bg-brand-orange/95 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
                                  >
                                    <Play size={11} className="fill-white" />
                                    Aceptar
                                  </button>
                                </>
                              )}

                              {order.status === 'accepted' && (
                                <button
                                  id={`prepare-bar-btn-${order.id}`}
                                  onClick={() => onUpdateOrderStatus(order.id, 'preparing')}
                                  className="w-full sm:w-auto px-4 py-2 bg-brand-yellow hover:bg-brand-yellow/90 text-stone-900 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
                                >
                                  <Clock size={11} />
                                  Comenzar Cocinar
                                </button>
                              )}

                              {order.status === 'preparing' && (
                                <button
                                  id={`complete-bar-btn-${order.id}`}
                                  onClick={() => onUpdateOrderStatus(order.id, 'completed')}
                                  className="w-full sm:w-auto px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
                                >
                                  <Check size={13} className="stroke-[3px]" />
                                  Listo / Entregado
                                </button>
                              )}

                              {(order.status === 'completed' || order.status === 'cancelled') && (
                                <div className="text-[11px] text-stone-400 font-medium text-center w-full py-1.5 bg-stone-50 rounded-lg px-3">
                                  {order.status === 'completed' ? '✓ Pedido Entregado' : '✗ Cancelado'}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

          {/* TAB 2: Sales Metrics & Dynamic Analytics Dashboard */}
          {activeTab === 'analytics' && (
            <motion.div
              key="analytics-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-6"
            >
              {/* Core metrics row */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Metric 1 */}
                <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-2xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Ventas Totales</span>
                    <span className="p-2 bg-emerald-50 text-emerald-500 rounded-lg">
                      <DollarSign size={16} />
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-stone-900 font-display">
                    ${metrics.totalSales.toLocaleString('es-AR')}
                  </h3>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-500 font-semibold">
                    <TrendingUp size={12} />
                    <span>Calculado sobre entregados</span>
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-2xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Entregas Realizadas</span>
                    <span className="p-2 bg-rose-50 text-brand-red rounded-lg">
                      <ShoppingBag size={16} />
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-stone-900 font-display">
                    {metrics.totalOrders} <span className="text-xs font-semibold text-stone-400">pedidos</span>
                  </h3>
                  <div className="text-[11px] text-stone-400">
                    Excluye cancelados ({orders.filter(o => o.status === 'cancelled').length})
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-2xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Ticket Promedio</span>
                    <span className="p-2 bg-amber-50 text-brand-yellow rounded-lg">
                      <Percent size={16} />
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-stone-900 font-display">
                    ${metrics.averageTicket.toLocaleString('es-AR')}
                  </h3>
                  <div className="text-[11px] text-stone-400">
                    Valor medio por compra
                  </div>
                </div>

                {/* Metric 4 */}
                <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-2xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">En Preparación</span>
                    <span className="p-2 bg-sky-50 text-sky-500 rounded-lg">
                      <Clock size={16} />
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-stone-900 font-display">
                    {orders.filter(o => o.status === 'preparing' || o.status === 'accepted').length} <span className="text-xs font-semibold text-stone-400">pedidos</span>
                  </h3>
                  <div className="text-[11px] text-brand-orange font-semibold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 bg-brand-orange rounded-full animate-pulse" />
                    <span>Actualizando en vivo</span>
                  </div>
                </div>

              </div>

              {/* PDF Reports trigger card */}
              <div className="bg-gradient-to-r from-brand-orange to-brand-red p-5 rounded-3xl text-white shadow-md flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="space-y-1 text-center md:text-left">
                  <h4 className="font-display font-bold text-lg">Exportador de Reportes de Ventas</h4>
                  <p className="text-xs text-stone-100/80">Genera e imprime reportes mensuales, semanales o diarios certificados en formato PDF para contabilidad.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    id="pdf-btn-daily"
                    disabled={generatingPdf}
                    onClick={() => generatePdfReport('daily')}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-stone-500 text-white font-display font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <Download size={14} />
                    Reporte Diario
                  </button>
                  <button
                    id="pdf-btn-weekly"
                    disabled={generatingPdf}
                    onClick={() => generatePdfReport('weekly')}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-stone-500 text-white font-display font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <Download size={14} />
                    Reporte Semanal
                  </button>
                  <button
                    id="pdf-btn-monthly"
                    disabled={generatingPdf}
                    onClick={() => generatePdfReport('monthly')}
                    className="px-4 py-2 bg-white text-brand-red hover:bg-stone-50 disabled:bg-stone-300 font-display font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    {generatingPdf ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Download size={14} />
                    )}
                    Reporte Mensual PDF
                  </button>
                </div>
              </div>

              {/* Graphs and product leaderboards */}
              <div className="grid lg:grid-cols-3 gap-6">
                
                {/* SVG Revenue trend chart */}
                <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-2xs lg:col-span-2 flex flex-col justify-between">
                  <div>
                    <h4 className="font-display font-bold text-stone-900 mb-1">Evolución de Ventas Semanal</h4>
                    <p className="text-xs text-stone-400 mb-4">Ingresos generados por día sobre los pedidos completados</p>
                  </div>
                  
                  {/* Custom SVG Line Area Graph */}
                  <div className="h-60 w-full relative pt-2">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 500 200" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ea580c" stopOpacity="0.3"/>
                          <stop offset="100%" stopColor="#ea580c" stopOpacity="0"/>
                        </linearGradient>
                      </defs>

                      {/* Horizontal grid lines */}
                      <line x1="0" y1="40" x2="500" y2="40" stroke="#f5f5f4" strokeWidth="1" />
                      <line x1="0" y1="90" x2="500" y2="90" stroke="#f5f5f4" strokeWidth="1" />
                      <line x1="0" y1="140" x2="500" y2="140" stroke="#f5f5f4" strokeWidth="1" />
                      <line x1="0" y1="190" x2="500" y2="190" stroke="#e7e5e4" strokeWidth="1.5" />

                      {/* Generate points for SVG path */}
                      {/* Using the 7 history elements from metrics */}
                      {(() => {
                        const maxSales = Math.max(...metrics.dailySalesHistory.map(h => h.sales), 5000);
                        const points = metrics.dailySalesHistory.map((h, index) => {
                          const x = (index / 6) * 500;
                          const ratio = h.sales / maxSales;
                          const y = 190 - (ratio * 150); // Leave margin on top
                          return { x, y, date: h.date, sales: h.sales };
                        });

                        const pathD = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
                        const areaD = `${pathD} L 500,190 L 0,190 Z`;

                        return (
                          <>
                            {/* Filled Area */}
                            <path d={areaD} fill="url(#chartGradient)" />
                            
                            {/* Line path */}
                            <path d={pathD} fill="none" stroke="#ea580c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                            {/* Data points & tooltips */}
                            {points.map((p, i) => (
                              <g key={i} className="group/dot cursor-pointer">
                                <circle cx={p.x} cy={p.y} r="5" fill="#ffffff" stroke="#ea580c" strokeWidth="2.5" />
                                <circle cx={p.x} cy={p.y} r="10" fill="#ea580c" opacity="0" className="hover:opacity-20 transition-opacity" />
                                
                                {/* Float value text on hover */}
                                <text x={p.x} y={p.y - 12} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#ea580c" className="opacity-0 group-hover/dot:opacity-100 transition-opacity">
                                  ${p.sales.toLocaleString()}
                                </text>
                              </g>
                            ))}
                          </>
                        );
                      })()}
                    </svg>
                  </div>

                  {/* Dates footer */}
                  <div className="flex justify-between text-[10px] text-stone-400 font-bold px-2 border-t border-stone-100 pt-2.5 mt-2">
                    {metrics.dailySalesHistory.map((h, i) => (
                      <span key={i}>{h.date}</span>
                    ))}
                  </div>
                </div>

                {/* Leaderboard panel */}
                <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-2xs flex flex-col justify-between">
                  <div>
                    <h4 className="font-display font-bold text-stone-900 mb-1">Líderes de Venta</h4>
                    <p className="text-xs text-stone-400 mb-4">Productos más vendidos e ingresos acumulados</p>
                  </div>

                  <div className="space-y-4 flex-1">
                    {metrics.topProducts.length === 0 ? (
                      <div className="text-center py-8 text-stone-300 text-xs">Sin registros de ventas completadas aún.</div>
                    ) : (
                      metrics.topProducts.map((p, i) => {
                        const maxQty = Math.max(...metrics.topProducts.map(tp => tp.quantity), 1);
                        const progressPercent = (p.quantity / maxQty) * 100;

                        return (
                          <div key={i} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-stone-800 truncate max-w-[150px]">{p.name}</span>
                              <span className="text-stone-500 font-mono">
                                {p.quantity} u. • <strong className="text-stone-900">${p.revenue.toLocaleString('es-AR')}</strong>
                              </span>
                            </div>
                            <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-brand-orange rounded-full" 
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="border-t border-stone-100 pt-3 mt-4 text-[10px] text-stone-400 font-bold text-center">
                    MÉTRICA GLOBAL DE POPULARIDAD
                  </div>
                </div>

              </div>

              {/* Categorization & logistics shares */}
              <div className="grid md:grid-cols-2 gap-6">
                
                {/* Category Breakdown */}
                <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-2xs">
                  <h4 className="font-display font-bold text-stone-900 mb-4">Recaudación por Categoría</h4>
                  <div className="space-y-3">
                    {Object.entries(metrics.salesByCategory).map(([cat, val]) => {
                      const totalVal = Object.values(metrics.salesByCategory).reduce((a,b) => a+b, 0);
                      const pct = totalVal > 0 ? (val / totalVal) * 100 : 0;
                      
                      const label = {
                        panchos: '🌭 Panchos Premium',
                        promos: '✨ Combos & Promociones',
                        sides: '🍟 Acompañamientos',
                        drinks: '🥤 Bebidas bien heladas'
                      }[cat] || cat;

                      const colors = {
                        panchos: 'bg-brand-red',
                        promos: 'bg-brand-orange',
                        sides: 'bg-brand-yellow',
                        drinks: 'bg-sky-500'
                      }[cat] || 'bg-stone-500';

                      return (
                        <div key={cat} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium text-stone-600">{label}</span>
                            <span className="font-bold text-stone-900">${val.toLocaleString('es-AR')} ({Math.round(pct)}%)</span>
                          </div>
                          <div className="h-2.5 w-full bg-stone-100 rounded-full overflow-hidden">
                            <div className={`h-full ${colors}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Logistics breakdown */}
                <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-2xs flex flex-col justify-between">
                  <h4 className="font-display font-bold text-stone-900 mb-3">Preferencias de Entrega</h4>
                  
                  <div className="flex items-center justify-around gap-4 py-4">
                    {/* Delivery circle */}
                    <div className="text-center space-y-1">
                      <div className="relative flex items-center justify-center h-20 w-20 rounded-full border-4 border-emerald-500 bg-emerald-50 text-emerald-600 mx-auto">
                        <CheckCircle2 size={32} />
                      </div>
                      <p className="text-xs font-bold text-stone-700">Envío Domicilio</p>
                      <p className="text-lg font-black font-mono text-stone-900">{metrics.ordersByType.delivery} u.</p>
                      <p className="text-[10px] text-stone-400">
                        {metrics.totalOrders > 0 ? Math.round((metrics.ordersByType.delivery / metrics.totalOrders) * 100) : 0}% de preferencia
                      </p>
                    </div>

                    {/* Pickup circle */}
                    <div className="text-center space-y-1">
                      <div className="relative flex items-center justify-center h-20 w-20 rounded-full border-4 border-brand-yellow bg-amber-50 text-brand-yellow mx-auto">
                        <Store size={32} />
                      </div>
                      <p className="text-xs font-bold text-stone-700">Retiro en Local</p>
                      <p className="text-lg font-black font-mono text-stone-900">{metrics.ordersByType.pickup} u.</p>
                      <p className="text-[10px] text-stone-400">
                        {metrics.totalOrders > 0 ? Math.round((metrics.ordersByType.pickup / metrics.totalOrders) * 100) : 0}% de preferencia
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-stone-400 text-center bg-stone-50 p-2 rounded-lg border border-stone-100">
                    💡 Puede incentivar los retiros en tienda habilitando o deshabilitando la opción en la pestaña de ajustes para regular la aglomeración de clientes.
                  </p>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 3: Inventory Rules & Pickup Control */}
          {activeTab === 'settings' && (
            <motion.div
              key="settings-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-6 max-w-2xl mx-auto"
            >
              {/* Pickup and Delivery controls card */}
              <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm space-y-6">
                
                {/* 1. Pickup Switch */}
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-2xl ${settings.pickupEnabled ? 'bg-amber-50 text-brand-yellow' : 'bg-stone-100 text-stone-400'}`}>
                      <Store size={26} />
                    </div>
                    <div className="space-y-1 flex-1">
                      <h3 className="text-lg font-bold font-display text-stone-900">Control de Retiro en Tienda</h3>
                      <p className="text-xs text-stone-500">
                        Habilite o deshabilite instantáneamente la opción de retiro en el local para los clientes finales según la disponibilidad de mercadería o personal en mostrador.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border flex items-center justify-between transition-colors bg-stone-50">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block">Estado actual</span>
                      <strong className={`text-sm font-display uppercase tracking-wide block mt-0.5 ${
                        settings.pickupEnabled ? 'text-emerald-600' : 'text-brand-red'
                      }`}>
                        {settings.pickupEnabled ? '● HABILITADO' : '● DESHABILITADO POR INVENTARIO'}
                      </strong>
                    </div>

                    {/* Toggle button slider */}
                    <button
                      id="toggle-pickup-control-btn"
                      type="button"
                      onClick={() => onTogglePickup(!settings.pickupEnabled)}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${
                        settings.pickupEnabled ? 'bg-emerald-500' : 'bg-stone-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          settings.pickupEnabled ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <hr className="border-stone-100" />

                {/* 2. Delivery Switch */}
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-2xl ${settings.deliveryEnabled ? 'bg-emerald-50 text-emerald-500' : 'bg-stone-100 text-stone-400'}`}>
                      <MapPin size={26} />
                    </div>
                    <div className="space-y-1 flex-1">
                      <h3 className="text-lg font-bold font-display text-stone-900">Control de Envíos a Domicilio</h3>
                      <p className="text-xs text-stone-500">
                        Habilite o deshabilite la opción de entrega de pedidos por delivery para los clientes finales según disponibilidad de repartidores o clima.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border flex items-center justify-between transition-colors bg-stone-50">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block">Estado actual</span>
                      <strong className={`text-sm font-display uppercase tracking-wide block mt-0.5 ${
                        settings.deliveryEnabled ? 'text-emerald-600' : 'text-brand-red'
                      }`}>
                        {settings.deliveryEnabled ? '● HABILITADO' : '● DESHABILITADO'}
                      </strong>
                    </div>

                    {/* Toggle button slider */}
                    <button
                      id="toggle-delivery-control-btn"
                      type="button"
                      onClick={() => onToggleDelivery(!settings.deliveryEnabled)}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${
                        settings.deliveryEnabled ? 'bg-emerald-500' : 'bg-stone-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          settings.deliveryEnabled ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-stone-400 leading-relaxed bg-amber-50/60 p-4 rounded-xl border border-amber-200/40 text-amber-900 flex gap-2.5">
                  <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Información de Canales de Entrega:</p>
                    <p>Si se queda sin repartidores, o las condiciones de lluvia/clima extremo dificultan las entregas, apagar el interruptor de Envíos a Domicilio forzará a los clientes online a seleccionar únicamente "Retiro en local". Si apaga ambos, el sistema avisará que no hay entregas disponibles.</p>
                  </div>
                </div>
              </div>

              {/* Push notifications permission setup */}
              <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-brand-orange/10 text-brand-orange rounded-2xl">
                    <Bell size={24} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold font-display text-stone-900">Notificaciones de Pedidos en Vivo</h3>
                    <p className="text-xs text-stone-500">
                      Gestione el permiso para que este dispositivo reciba avisos push sonoros e interactivos cada vez que un cliente final confirme un nuevo pedido desde su celular.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-0.5 text-xs">
                    <span className="font-bold text-stone-500">Permiso del Navegador:</span>
                    <p className="text-stone-400 capitalize font-medium">{notificationPermission === 'granted' ? '✓ Concedido' : notificationPermission === 'denied' ? '✗ Denegado' : 'Pendiente'}</p>
                  </div>

                  <button
                    id="grant-notifications-btn"
                    onClick={requestNotificationPermission}
                    disabled={notificationPermission === 'granted'}
                    className={`px-4 py-2.5 rounded-xl font-display font-bold text-xs transition-all ${
                      notificationPermission === 'granted'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-default'
                        : 'bg-brand-orange hover:bg-brand-orange/90 text-white active:scale-95'
                    }`}
                  >
                    {notificationPermission === 'granted' ? '✓ Operativo' : 'Activar Alertas de Navegador'}
                  </button>
                </div>
              </div>

            </motion.div>
          )}

          {/* TAB 4: Menu and Promotion/Offer Management */}
          {activeTab === 'menu' && (
            <motion.div
              key="menu-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-6 max-w-5xl mx-auto"
            >
              {/* Tabs within the Menu panel */}
              <div className="bg-white p-3 rounded-2xl border border-stone-100 shadow-2xs flex flex-wrap gap-2">
                <button
                  id="menu-subtab-products-btn"
                  type="button"
                  onClick={() => {
                    setMenuSubTab('products');
                    setErrorProductMsg('');
                    handleCancelEdit();
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold font-display flex items-center gap-2 transition-all ${
                    menuSubTab === 'products'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-600'
                  }`}
                >
                  <ShoppingBag size={14} />
                  Ingreso de Productos
                </button>
                <button
                  id="menu-subtab-promotions-btn"
                  type="button"
                  onClick={() => {
                    setMenuSubTab('promotions');
                    setErrorProductMsg('');
                    handleCancelEdit();
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold font-display flex items-center gap-2 transition-all ${
                    menuSubTab === 'promotions'
                      ? 'bg-brand-orange text-white shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-600'
                  }`}
                >
                  <Percent size={14} />
                  Ingreso de Promociones (Combos)
                </button>
                <button
                  id="menu-subtab-offers-btn"
                  type="button"
                  onClick={() => {
                    setMenuSubTab('offers');
                    setErrorProductMsg('');
                    handleCancelEdit();
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold font-display flex items-center gap-2 transition-all ${
                    menuSubTab === 'offers'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-600'
                  }`}
                >
                  <Sparkles size={14} />
                  Ingreso de Ofertas Especiales
                </button>
              </div>

              {/* Dynamic entry form card & current item overview */}
              <div className="grid lg:grid-cols-12 gap-6 items-start">
                
                {/* 1. ENTRY FORM */}
                <form 
                  onSubmit={handleSubmitProduct}
                  className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm space-y-4 lg:col-span-7"
                >
                  <div id="prod-form-header" className="flex items-center gap-3 pb-3 border-b border-stone-100 scroll-mt-20">
                    <div className="p-2 bg-brand-orange/10 text-brand-orange rounded-xl">
                      {menuSubTab === 'products' && <ShoppingBag size={20} />}
                      {menuSubTab === 'promotions' && <Percent size={20} />}
                      {menuSubTab === 'offers' && <Sparkles size={20} />}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-stone-900">
                        {editingProduct ? (
                          <>
                            {menuSubTab === 'products' && `Editar: ${editingProduct.name}`}
                            {menuSubTab === 'promotions' && `Editar Combo: ${editingProduct.name}`}
                            {menuSubTab === 'offers' && `Editar Oferta: ${editingProduct.name}`}
                          </>
                        ) : (
                          <>
                            {menuSubTab === 'products' && 'Nuevo Producto de Carta'}
                            {menuSubTab === 'promotions' && 'Nueva Promoción / Combo'}
                            {menuSubTab === 'offers' && 'Nueva Oferta Destacada'}
                          </>
                        )}
                      </h3>
                      <p className="text-[11px] text-stone-400">
                        {editingProduct ? 'Modifique los campos y guarde los cambios en tiempo real.' : 'Cargue los datos. Se actualizará en la web de clientes en tiempo real.'}
                      </p>
                    </div>
                  </div>

                  {errorProductMsg && (
                    <div className="p-3 bg-brand-red/10 border border-brand-red/20 rounded-xl text-xs font-semibold text-brand-red flex gap-2">
                      <AlertTriangle size={14} className="flex-shrink-0" />
                      {errorProductMsg}
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Nombre del Ítem</label>
                      <input
                        id="prod-name-input"
                        type="text"
                        value={prodName}
                        onChange={(e) => setProdName(e.target.value)}
                        placeholder={
                          menuSubTab === 'products' ? '🌭 Super Pancho Doble' : 
                          menuSubTab === 'promotions' ? '✨ Combo Amigos (2 Panchos + Papas)' : '🔥 Oferta Relámpago Cheddar'
                        }
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-brand-orange focus:outline-none"
                      />
                    </div>

                    {/* Price */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Precio de Venta ($)</label>
                      <input
                        id="prod-price-input"
                        type="number"
                        min="0"
                        value={prodPrice}
                        onChange={(e) => setProdPrice(e.target.value)}
                        placeholder="4500"
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-brand-orange focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Original Price (optional / display discount) */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Precio Original ($) <span className="text-stone-300 font-normal">(Opcional tachado)</span></label>
                      <input
                        id="prod-original-price-input"
                        type="number"
                        min="0"
                        value={prodOriginalPrice}
                        onChange={(e) => setProdOriginalPrice(e.target.value)}
                        placeholder="5500"
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-brand-orange focus:outline-none"
                      />
                    </div>

                    {/* Category Selection (or forced) */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Categoría</label>
                      {menuSubTab === 'promotions' ? (
                        <div className="w-full bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-3 py-2 text-xs font-bold">
                          ✨ Promociones y Combos (Fijo)
                        </div>
                      ) : (
                        <select
                          id="prod-category-select"
                          value={prodCategory}
                          onChange={(e) => setProdCategory(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-brand-orange focus:outline-none"
                        >
                          {(settings.categories || [
                            { id: 'panchos', name: '🌭 Súper Panchos' },
                            { id: 'sides', name: '🍟 Acompañamientos' },
                            { id: 'drinks', name: '🥤 Bebidas' }
                          ]).map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Detalle / Descripción</label>
                    <textarea
                      id="prod-desc-input"
                      value={prodDescription}
                      onChange={(e) => setProdDescription(e.target.value)}
                      placeholder="Escriba los detalles, ingredientes o lo que incluye este producto..."
                      rows={2}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-brand-orange focus:outline-none"
                    />
                  </div>

                  {/* Optional Offer Tag */}
                  {menuSubTab === 'offers' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Etiqueta de Oferta (Opcional)</label>
                      <input
                        id="prod-tag-input"
                        type="text"
                        value={prodTag}
                        onChange={(e) => setProdTag(e.target.value)}
                        placeholder="Ej: 20% OFF, RECOMENDADO, MÁS VENDIDO"
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-brand-orange focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Image input supporting drag/drop and camera capture */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Imagen del Producto (PC o Móvil)</label>
                    <div className="border-2 border-dashed border-stone-200 rounded-2xl p-4 text-center hover:bg-stone-50 transition-colors relative">
                      <input
                        id="prod-image-file"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      {prodImageBase64 ? (
                        <div className="flex items-center gap-4 justify-center">
                          <img 
                            src={prodImageBase64} 
                            alt="Preview" 
                            className="h-16 w-16 object-cover rounded-xl border border-stone-150 shadow-xs" 
                          />
                          <div className="text-left">
                            <p className="text-xs font-bold text-emerald-600">✓ Imagen cargada correctamente</p>
                            <p className="text-[10px] text-stone-400">Haga clic o arrastre otra para cambiar</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5 py-1">
                          <Image className="mx-auto text-stone-300" size={24} />
                          <p className="text-xs font-bold text-stone-700">Subir imagen / Tomar foto</p>
                          <p className="text-[10px] text-stone-400">Soporta PNG, JPG de hasta 2MB</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dynamic Custom Fields Section with "+" option */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between border-t border-stone-100 pt-3">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Campos Adicionales Dinámicos</span>
                      <button
                        id="add-custom-field-btn"
                        type="button"
                        onClick={handleAddCustomField}
                        className="text-xs font-bold text-brand-orange hover:text-brand-orange/80 flex items-center gap-1 transition-all"
                      >
                        <Plus size={14} />
                        Agregar Campo
                      </button>
                    </div>

                    {customFields.length === 0 ? (
                      <p className="text-[11px] text-stone-400 italic">No hay campos extra agregados. Haga clic en "+ Agregar Campo" para detallar tamaño, peso, picor u otros atributos customizados.</p>
                    ) : (
                      <div className="space-y-2">
                        {customFields.map((field, idx) => (
                          <div key={idx} className="flex gap-2 items-center bg-stone-50 p-2 rounded-xl border border-stone-150">
                            <input
                              type="text"
                              value={field.name}
                              onChange={(e) => handleUpdateCustomField(idx, 'name', e.target.value)}
                              placeholder="Nombre (ej: Peso)"
                              className="w-1/2 bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-orange"
                            />
                            <input
                              type="text"
                              value={field.value}
                              onChange={(e) => handleUpdateCustomField(idx, 'value', e.target.value)}
                              placeholder="Valor (ej: 340 gramos)"
                              className="w-1/2 bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-orange"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomField(idx)}
                              className="p-1.5 hover:bg-stone-200 text-stone-500 hover:text-brand-red rounded-lg transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Form Submission */}
                  <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row gap-2">
                    {editingProduct && (
                      <button
                        id="cancel-product-edit-btn"
                        type="button"
                        onClick={handleCancelEdit}
                        className="w-full sm:w-1/3 bg-stone-100 hover:bg-stone-200 text-stone-700 py-3 rounded-2xl text-xs font-bold font-display transition-all active:scale-98 flex items-center justify-center gap-1"
                      >
                        Cancelar Edición
                      </button>
                    )}
                    <button
                      id="submit-product-btn"
                      type="submit"
                      disabled={submittingProduct}
                      className={`py-3 rounded-2xl text-xs font-black font-display transition-all active:scale-98 flex items-center justify-center gap-2 ${
                        editingProduct 
                          ? 'w-full sm:w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white' 
                          : 'w-full bg-brand-orange hover:bg-brand-orange/95 text-white'
                      }`}
                    >
                      {submittingProduct ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          {editingProduct ? 'Guardando cambios...' : 'Procesando ingreso...'}
                        </>
                      ) : (
                        <>
                          {editingProduct ? (
                            <>
                              <Check size={14} className="stroke-[3px]" />
                              Guardar Cambios
                            </>
                          ) : (
                            <>
                              <Plus size={14} className="stroke-[3px]" />
                              Guardar e Insertar en el Menú
                            </>
                          )}
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* 2. CURRENT PRODUCTS OVERVIEW */}
                <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-stone-100 shadow-sm space-y-4 max-h-[750px] overflow-y-auto">
                  <div className="pb-3 border-b border-stone-100">
                    <h3 className="font-display font-bold text-stone-900">Carta Actual ({products.length} ítems)</h3>
                    <p className="text-[11px] text-stone-400">Elimine o supervise los productos publicados.</p>
                  </div>

                  <div className="space-y-3">
                    {products.filter(p => {
                      if (menuSubTab === 'promotions') return p.category === 'promos';
                      if (menuSubTab === 'offers') return p.isOffer && p.category !== 'promos';
                      return p.category !== 'promos';
                    }).length === 0 ? (
                      <div className="text-center py-12 text-stone-300 text-xs italic">
                        No hay ítems en esta sección del menú.
                      </div>
                    ) : (
                      products
                        .filter(p => {
                          if (menuSubTab === 'promotions') return p.category === 'promos';
                          if (menuSubTab === 'offers') return p.isOffer && p.category !== 'promos';
                          return p.category !== 'promos';
                        })
                        .map((p) => (
                          <div key={p.id} className="flex gap-3 items-center justify-between p-2.5 rounded-xl border border-stone-100 hover:bg-stone-50 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              <img 
                                src={p.image} 
                                alt={p.name} 
                                className="h-11 w-11 object-cover rounded-lg border border-stone-150 flex-shrink-0" 
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-stone-800 truncate" title={p.name}>{p.name}</p>
                                <p className="text-[10px] text-brand-orange font-black">${p.price.toLocaleString('es-AR')}</p>
                                {p.customFields && p.customFields.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {p.customFields.map((f, fi) => (
                                      <span key={fi} className="text-[9px] bg-stone-100 text-stone-500 px-1 py-0.5 rounded font-medium">
                                        {f.name}: {f.value}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                id={`edit-product-${p.id}`}
                                type="button"
                                onClick={() => handleStartEdit(p)}
                                className={`p-2 rounded-xl transition-all ${
                                  editingProduct?.id === p.id 
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                    : 'bg-stone-50 hover:bg-stone-100 text-stone-500 hover:text-stone-800'
                                }`}
                                title="Editar producto"
                              >
                                <Pencil size={14} />
                              </button>
                              {deletingProductId === p.id ? (
                                <div className="flex items-center gap-1.5 bg-brand-red/10 border border-brand-red/25 px-2 py-1 rounded-xl animate-pulse">
                                  <span className="text-[10px] font-bold text-brand-red font-display">¿Borrar?</span>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      await handleDeleteProduct(p.id);
                                      setDeletingProductId(null);
                                    }}
                                    className="bg-brand-red text-white text-[10px] font-bold px-2 py-0.5 rounded-lg hover:bg-brand-red/90 transition-all cursor-pointer"
                                  >
                                    Sí
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeletingProductId(null)}
                                    className="text-stone-500 hover:text-stone-800 text-[10px] font-bold px-2 py-0.5 rounded-lg hover:bg-stone-100 transition-all cursor-pointer"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button
                                  id={`delete-product-${p.id}`}
                                  type="button"
                                  onClick={() => setDeletingProductId(p.id)}
                                  className="p-2 bg-stone-50 hover:bg-brand-red/10 text-stone-400 hover:text-brand-red rounded-xl transition-all"
                                  title="Eliminar producto"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 5: Brand, Theme & Customizable Sections */}
          {activeTab === 'theme' && (
            <motion.div
              key="theme-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-6 max-w-5xl mx-auto text-left"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-stone-100 shadow-3xs">
                <div>
                  <h2 className="text-xl font-extrabold font-display text-stone-900">Personalización de Marca y Diseño</h2>
                  <p className="text-xs text-stone-500">Configure los textos públicos, tipos de letra, imágenes del banner, opiniones de clientes y categorías del menú en tiempo real.</p>
                </div>
                
                <button
                  id="save-theme-btn"
                  onClick={() => handleSaveThemeSettings()}
                  disabled={savingTheme}
                  className="px-5 py-2.5 bg-brand-orange hover:bg-brand-orange/95 disabled:bg-stone-400 text-white rounded-xl text-xs font-display font-black transition-all flex items-center gap-1.5 shadow-sm active:scale-95 flex-shrink-0"
                >
                  {savingTheme ? 'Guardando...' : '✓ Guardar Cambios'}
                </button>
              </div>

              {themeSuccessMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl p-3.5 text-center font-bold animate-pulse">
                  {themeSuccessMsg}
                </div>
              )}

              <div className="grid md:grid-cols-3 gap-6">
                
                {/* Column 1: Core Brand Identity & Typography */}
                <div className="md:col-span-2 space-y-6">
                  
                  {/* General Branding Card */}
                  <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold font-display text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-1.5">
                      <span>🏷️</span> Identidad de Marca
                    </h3>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Nombre del Local</label>
                        <input
                          type="text"
                          value={themeBrandName}
                          onChange={(e) => setThemeBrandName(e.target.value)}
                          placeholder="La Panchería del Jefe"
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-brand-orange focus:outline-none"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Eslogan / Subtítulo</label>
                        <input
                          type="text"
                          value={themeBrandSubtitle}
                          onChange={(e) => setThemeBrandSubtitle(e.target.value)}
                          placeholder="Panes súper tiernos, salchichas premium"
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-brand-orange focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Teléfono / WhatsApp Soporte</label>
                        <input
                          type="text"
                          value={themeSupportPhone}
                          onChange={(e) => setThemeSupportPhone(e.target.value)}
                          placeholder="11 5566-7788"
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-brand-orange focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Horario de Apertura</label>
                        <input
                          type="text"
                          value={themeOpeningHours}
                          onChange={(e) => setThemeOpeningHours(e.target.value)}
                          placeholder="Abierto: 11:30hs a 23:30hs"
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-brand-orange focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">📍 Dirección del Local</label>
                        <input
                          type="text"
                          value={themeAddress}
                          onChange={(e) => setThemeAddress(e.target.value)}
                          placeholder="Ej: Av. Rivadavia 2500, CABA"
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-brand-orange focus:outline-none"
                        />
                        <p className="text-[9px] text-stone-400">Se muestra en la carta y en el retiro en local.</p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">🗺️ Link de Google Maps (opcional)</label>
                        <input
                          type="text"
                          value={themeMapsUrl}
                          onChange={(e) => setThemeMapsUrl(e.target.value)}
                          placeholder="Pegá el link de Google Maps del local"
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-brand-orange focus:outline-none"
                        />
                        <p className="text-[9px] text-stone-400">Si lo dejás vacío, el botón "Cómo llegar" busca tu dirección en el mapa.</p>
                      </div>
                    </div>

                    {/* Logo del local (arriba a la izquierda) */}
                    <div className="pt-3 border-t border-stone-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">🖼️ Logo del Local (arriba a la izquierda)</label>
                        {themeLogoImage && (
                          <button
                            type="button"
                            onClick={() => setThemeLogoImage('')}
                            className="text-[10px] text-brand-red font-bold hover:underline"
                          >
                            Quitar (usar 🌭)
                          </button>
                        )}
                      </div>
                      <div className="flex gap-4 items-center">
                        <div className="w-16 h-16 rounded-xl border border-stone-200 bg-white flex-shrink-0 overflow-hidden flex items-center justify-center">
                          {themeLogoImage ? (
                            <img src={themeLogoImage} alt="Logo" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-3xl">🌭</span>
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                comprimirImagen(file, 800, 0.8).then((r) => { if (r) setThemeLogoImage(r); });
                              }
                            }}
                            className="block w-full text-xs text-stone-500 file:mr-4 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-[11px] file:font-semibold file:bg-stone-900 file:text-stone-100 hover:file:bg-stone-800 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={themeLogoImage}
                            onChange={(e) => setThemeLogoImage(e.target.value)}
                            placeholder="O pegá una URL de imagen del logo..."
                            className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-[10px] focus:ring-1 focus:ring-brand-orange focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Typography Selector */}
                  <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold font-display text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-1.5">
                      <span>🔤</span> Estilo de Tipografía (Fuente)
                    </h3>
                    
                    <div className="space-y-2">
                      <p className="text-xs text-stone-500">
                        Seleccioná la fuente de letra general para toda la página pública:
                      </p>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {[
                          { id: 'Inter', label: 'Inter (Moderna/Limpia)', preview: 'Abc' },
                          { id: 'Outfit', label: 'Outfit (Geométrica)', preview: 'Abc' },
                          { id: 'Playfair Display', label: 'Playfair (Elegante)', preview: 'Abc' },
                          { id: 'JetBrains Mono', label: 'Tech Mono (Brutalista)', preview: 'Abc' }
                        ].map(font => (
                          <button
                            key={font.id}
                            type="button"
                            onClick={() => setThemeFontFamily(font.id)}
                            className={`p-3 rounded-xl border text-center transition-all ${
                              themeFontFamily === font.id
                                ? 'bg-brand-orange/5 border-brand-orange text-brand-orange font-bold'
                                : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-300'
                            }`}
                          >
                            <span className="text-lg block font-semibold mb-0.5">{font.preview}</span>
                            <span className="text-[10px] block truncate">{font.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Admin Panel Theme Selector */}
                  <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold font-display text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-1.5">
                      <span>🎨</span> Color de Fondo del Panel (Tema Admin)
                    </h3>
                    
                    <div className="space-y-2">
                      <p className="text-xs text-stone-500">
                        Elegí un tono para el fondo y la interfaz del Panel de Control para evitar que se vea muy blanco:
                      </p>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                        {[
                          { id: 'classic', label: 'Clásico (Claro)', bg: 'bg-stone-50 border-stone-200 text-stone-900' },
                          { id: 'dark', label: 'Modo Oscuro', bg: 'bg-stone-950 border-stone-800 text-stone-100' },
                          { id: 'indigo', label: 'Índigo Real', bg: 'bg-indigo-50 border-indigo-200 text-indigo-900' },
                          { id: 'amber', label: 'Ámbar Cálido', bg: 'bg-orange-50 border-orange-200 text-orange-950' },
                          { id: 'emerald', label: 'Esmeralda', bg: 'bg-emerald-50 border-emerald-200 text-emerald-950' },
                        ].map(themeOpt => (
                          <button
                            key={themeOpt.id}
                            type="button"
                            onClick={() => {
                              setAdminTheme(themeOpt.id);
                              handleSaveThemeSettings({ adminTheme: themeOpt.id });
                            }}
                            className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${themeOpt.bg} ${
                              adminTheme === themeOpt.id
                                ? 'ring-2 ring-brand-orange ring-offset-2 scale-105 font-bold shadow-sm'
                                : 'opacity-80 hover:opacity-100'
                            }`}
                          >
                            <div className="w-4 h-4 rounded-full bg-brand-orange mb-1" />
                            <span className="text-[10px] block truncate">{themeOpt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Hero Banner Text Customizer */}
                  <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold font-display text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-1.5">
                      <span>📢</span> Seccional Banner / Portada Hero
                    </h3>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Etiqueta de Destacado</label>
                        <input
                          type="text"
                          value={themeHeroBadge}
                          onChange={(e) => setThemeHeroBadge(e.target.value)}
                          placeholder="SABOR ARGENTINO PREMIUM"
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-brand-orange focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Título del Banner (Soporta Saltos de Línea)</label>
                        <textarea
                          rows={2}
                          value={themeHeroTitle}
                          onChange={(e) => setThemeHeroTitle(e.target.value)}
                          placeholder="Panchos cargados de verdad,&#10;como a vos te gustan."
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-brand-orange focus:outline-none font-sans"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Descripción / Detalle del Banner</label>
                        <textarea
                          rows={3}
                          value={themeHeroDescription}
                          onChange={(e) => setThemeHeroDescription(e.target.value)}
                          placeholder="Disfrutá de panes brioche artesanales..."
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-brand-orange focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Hero Banner Images Customizer */}
                  <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm space-y-4 font-sans">
                    <h3 className="text-sm font-bold font-display text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-1.5">
                      <span>📸</span> Imágenes del Local (Banner Derecha)
                    </h3>
                    
                    <p className="text-xs text-stone-500">
                      Subí tus fotos directamente desde la PC/Móvil o ingresá una URL web:
                    </p>

                    <div className="space-y-5">
                      {/* Image 1 */}
                      <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/50 space-y-3">
                        <div className="flex items-center justify-between font-sans">
                          <span className="text-xs font-bold text-stone-800">Imagen Superior Izquierda (Chica)</span>
                          {themeHeroImage1 && (
                            <button 
                              type="button" 
                              onClick={() => setThemeHeroImage1('')}
                              className="text-[10px] text-brand-red font-bold hover:underline"
                            >
                              Restablecer Original
                            </button>
                          )}
                        </div>
                        <div className="flex gap-4 items-center">
                          <div className="w-16 h-16 rounded-xl border border-stone-200 bg-white flex-shrink-0 overflow-hidden flex items-center justify-center">
                            {themeHeroImage1 ? (
                              <img src={themeHeroImage1} alt="Preview 1" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl">🌭</span>
                            )}
                          </div>
                          <div className="flex-1 space-y-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  comprimirImagen(file, 1400, 0.72).then((r) => { if (r) setThemeHeroImage1(r); });
                                }
                              }}
                              className="block w-full text-xs text-stone-500 file:mr-4 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-[11px] file:font-semibold file:bg-stone-900 file:text-stone-100 hover:file:bg-stone-800 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={themeHeroImage1}
                              onChange={(e) => setThemeHeroImage1(e.target.value)}
                              placeholder="O pegue una dirección URL de imagen..."
                              className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-[10px] focus:ring-1 focus:ring-brand-orange focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Image 2 */}
                      <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-stone-800">Imagen Inferior Izquierda (Chica)</span>
                          {themeHeroImage2 && (
                            <button 
                              type="button" 
                              onClick={() => setThemeHeroImage2('')}
                              className="text-[10px] text-brand-red font-bold hover:underline"
                            >
                              Restablecer Original
                            </button>
                          )}
                        </div>
                        <div className="flex gap-4 items-center">
                          <div className="w-16 h-16 rounded-xl border border-stone-200 bg-white flex-shrink-0 overflow-hidden flex items-center justify-center">
                            {themeHeroImage2 ? (
                              <img src={themeHeroImage2} alt="Preview 2" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl">🍟</span>
                            )}
                          </div>
                          <div className="flex-1 space-y-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  comprimirImagen(file, 1400, 0.72).then((r) => { if (r) setThemeHeroImage2(r); });
                                }
                              }}
                              className="block w-full text-xs text-stone-500 file:mr-4 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-[11px] file:font-semibold file:bg-stone-900 file:text-stone-100 hover:file:bg-stone-800 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={themeHeroImage2}
                              onChange={(e) => setThemeHeroImage2(e.target.value)}
                              placeholder="O pegue una dirección URL de imagen..."
                              className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-[10px] focus:ring-1 focus:ring-brand-orange focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Image 3 */}
                      <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-stone-800">Imagen Derecha Principal (Alta)</span>
                          {themeHeroImage3 && (
                            <button 
                              type="button" 
                              onClick={() => setThemeHeroImage3('')}
                              className="text-[10px] text-brand-red font-bold hover:underline"
                            >
                              Restablecer Original
                            </button>
                          )}
                        </div>
                        <div className="flex gap-4 items-center">
                          <div className="w-16 h-16 rounded-xl border border-stone-200 bg-white flex-shrink-0 overflow-hidden flex items-center justify-center">
                            {themeHeroImage3 ? (
                              <img src={themeHeroImage3} alt="Preview 3" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl">🌭</span>
                            )}
                          </div>
                          <div className="flex-1 space-y-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => setThemeHeroImage3(reader.result as string);
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="block w-full text-xs text-stone-500 file:mr-4 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-[11px] file:font-semibold file:bg-stone-900 file:text-stone-100 hover:file:bg-stone-800 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={themeHeroImage3}
                              onChange={(e) => setThemeHeroImage3(e.target.value)}
                              placeholder="O pegue una dirección URL de imagen..."
                              className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-[10px] focus:ring-1 focus:ring-brand-orange focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>

                {/* Column 2: Side Utilities: Categories, Reviews, Sharing QR */}
                <div className="space-y-6">
                  
                  {/* Shared QR Code Card */}
                  <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold font-display text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-1.5">
                      <span>📢</span> Código QR de Compartir
                    </h3>
                    
                    <div className="flex flex-col items-center justify-center text-center space-y-3">
                      <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(publicCode ? window.location.origin + '/?codigo=' + publicCode : window.location.origin)}`}
                          alt="QR Code"
                          className="w-40 h-40 rounded-lg border-4 border-white bg-white shadow-xs"
                        />
                      </div>
                      <p className="text-[11px] text-stone-500 leading-normal">
                        Este código QR redirige directamente a la carta interactiva de clientes. Descargala o imprimila para pegarla en tus mesas.
                      </p>
                      
                      <a 
                        href={`https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(publicCode ? window.location.origin + '/?codigo=' + publicCode : window.location.origin)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full text-center py-2 bg-stone-900 text-stone-100 rounded-xl text-xs font-bold hover:bg-stone-800 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Download size={13} />
                        Descargar QR en Alta Calidad
                      </a>
                    </div>
                  </div>

                  {/* Categories Customizer */}
                  <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold font-display text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-1.5">
                      <span>📁</span> Categorías del Menú
                    </h3>
                    
                    {/* Add Category Section */}
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-150 space-y-2">
                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Agregar Nueva Categoría</span>
                      <div className="flex gap-1.5 items-center relative">
                        {/* Interactive Emoji Selector */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowIconPickerFor(showIconPickerFor === 'new' ? null : 'new')}
                            className="w-12 h-10 bg-white border border-stone-200 hover:border-brand-orange rounded-xl flex items-center justify-center text-xl transition-all shadow-2xs active:scale-95 cursor-pointer"
                            title="Seleccionar Icono"
                          >
                            <span>{newCatIcon || '🍔'}</span>
                          </button>
                          
                          {showIconPickerFor === 'new' && (
                            <div className="absolute z-50 top-12 left-0 w-64 bg-stone-900 border border-stone-700 rounded-2xl shadow-xl p-3.5 space-y-2">
                              <div className="flex justify-between items-center border-b border-stone-850 pb-1.5">
                                <span className="text-[10px] font-bold text-stone-300 uppercase tracking-wider">Elegir Icono</span>
                                <button 
                                  type="button"
                                  onClick={() => setShowIconPickerFor(null)} 
                                  className="text-[10px] text-stone-400 hover:text-white"
                                >
                                  Cerrar
                                </button>
                              </div>
                              <div className="grid grid-cols-6 gap-1.5 max-h-40 overflow-y-auto pr-1">
                                {AVAILABLE_ICONS.map((emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => {
                                      setNewCatIcon(emoji);
                                      setShowIconPickerFor(null);
                                    }}
                                    className="p-1 text-lg rounded-lg hover:bg-stone-800 transition-colors cursor-pointer active:scale-90 flex items-center justify-center"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <input
                          type="text"
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          placeholder="Ej: Helados, postres"
                          className="flex-1 bg-white border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-brand-orange focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!newCatName.trim()) return;
                            const id = newCatName.toLowerCase()
                              .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
                              .replace(/[^a-z0-9 ]/g, '')
                              .trim()
                              .replace(/\s+/g, '-');
                            
                            if (themeCategories.some(c => c.id === id)) {
                              alert('Ya existe una categoría con ese identificador.');
                              return;
                            }
                            
                            const updated = [...themeCategories, { id, name: newCatName.trim(), icon: newCatIcon.trim() || '🍔' }];
                            setThemeCategories(updated);
                            setNewCatName('');
                            setNewCatIcon('🌭');
                            handleSaveThemeSettings({ categories: updated });
                          }}
                          className="px-3 py-1.5 bg-brand-orange text-white rounded-xl text-xs font-bold font-display active:scale-95"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Categories List */}
                    <div className="space-y-1.5 max-h-56 overflow-y-auto">
                      {themeCategories.length === 0 ? (
                        <p className="text-[11px] text-stone-400 italic text-center py-2">No hay categorías configuradas.</p>
                      ) : (
                        themeCategories.map((cat, idx) => (
                          <div key={cat.id || idx} className="flex items-center gap-1.5 p-2 rounded-xl bg-white border border-stone-100 hover:bg-stone-50 transition-colors text-xs text-stone-800 relative">
                            {/* Icon Selector for existing category */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setShowIconPickerFor(showIconPickerFor === idx ? null : idx)}
                                className="w-9 h-9 bg-stone-50 border border-stone-150 rounded-lg flex items-center justify-center text-base hover:border-brand-orange transition-all active:scale-95 cursor-pointer"
                                title="Cambiar Icono"
                              >
                                <span>{cat.icon || '🍔'}</span>
                              </button>
                              
                              {showIconPickerFor === idx && (
                                <div className="absolute z-50 top-11 left-0 w-64 bg-stone-900 border border-stone-700 rounded-2xl shadow-xl p-3.5 space-y-2">
                                  <div className="flex justify-between items-center border-b border-stone-850 pb-1.5">
                                    <span className="text-[10px] font-bold text-stone-300 uppercase tracking-wider">Elegir Icono</span>
                                    <button 
                                      type="button"
                                      onClick={() => setShowIconPickerFor(null)} 
                                      className="text-[10px] text-stone-400 hover:text-white"
                                    >
                                      Cerrar
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-6 gap-1.5 max-h-40 overflow-y-auto pr-1">
                                    {AVAILABLE_ICONS.map((emoji) => (
                                      <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => {
                                          const updated = themeCategories.map((c, i) => i === idx ? { ...c, icon: emoji } : c);
                                          setThemeCategories(updated);
                                          setShowIconPickerFor(null);
                                          handleSaveThemeSettings({ categories: updated });
                                        }}
                                        className="p-1 text-lg rounded-lg hover:bg-stone-800 transition-colors cursor-pointer active:scale-90 flex items-center justify-center"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <input 
                              type="text"
                              value={cat.name}
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = themeCategories.map((c, i) => i === idx ? { ...c, name: val } : c);
                                setThemeCategories(updated);
                              }}
                              onBlur={() => handleSaveThemeSettings()}
                              className="bg-transparent border-0 p-1 focus:ring-1 focus:ring-brand-orange rounded-lg focus:outline-none font-bold text-stone-800 flex-1 min-w-0"
                              title="Editar Nombre de la categoría"
                            />
                            
                            {/* Reordering controls */}
                            <div className="flex flex-col -space-y-0.5 border-l border-stone-150 pl-1.5 mr-0.5">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => {
                                  if (idx === 0) return;
                                  const updated = [...themeCategories];
                                  const temp = updated[idx];
                                  updated[idx] = updated[idx - 1];
                                  updated[idx - 1] = temp;
                                  setThemeCategories(updated);
                                  handleSaveThemeSettings({ categories: updated });
                                }}
                                className={`p-0.5 rounded hover:bg-stone-100 transition-colors ${
                                  idx === 0 ? 'text-stone-300 opacity-40 cursor-not-allowed' : 'text-stone-500 hover:text-stone-800 cursor-pointer'
                                }`}
                                title="Mover Arriba"
                              >
                                <ChevronUp size={13} />
                              </button>
                              <button
                                type="button"
                                disabled={idx === themeCategories.length - 1}
                                onClick={() => {
                                  if (idx === themeCategories.length - 1) return;
                                  const updated = [...themeCategories];
                                  const temp = updated[idx];
                                  updated[idx] = updated[idx + 1];
                                  updated[idx + 1] = temp;
                                  setThemeCategories(updated);
                                  handleSaveThemeSettings({ categories: updated });
                                }}
                                className={`p-0.5 rounded hover:bg-stone-100 transition-colors ${
                                  idx === themeCategories.length - 1 ? 'text-stone-300 opacity-40 cursor-not-allowed' : 'text-stone-500 hover:text-stone-800 cursor-pointer'
                                }`}
                                title="Mover Abajo"
                              >
                                <ChevronDown size={13} />
                              </button>
                            </div>

                            {/* Safe Delete with inline confirmation */}
                            {deletingCatIdx === idx ? (
                              <div className="flex items-center gap-1 bg-brand-red/10 border border-brand-red/25 px-1.5 py-0.5 rounded-lg animate-pulse">
                                <span className="text-[9px] font-bold text-brand-red">¿Borrar?</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = themeCategories.filter((_, i) => i !== idx);
                                    setThemeCategories(updated);
                                    handleSaveThemeSettings({ categories: updated });
                                    setDeletingCatIdx(null);
                                  }}
                                  className="text-white bg-brand-red hover:bg-brand-red/90 px-1 rounded text-[9px] font-bold cursor-pointer transition-colors"
                                  title="Confirmar eliminación"
                                >
                                  Sí
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingCatIdx(null)}
                                  className="text-stone-500 hover:text-stone-800 hover:bg-stone-100 px-1 rounded text-[9px] font-bold cursor-pointer transition-colors"
                                  title="Cancelar"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  if (themeCategories.length <= 1) {
                                    alert('Debe conservar al menos una categoría en el menú.');
                                    return;
                                  }
                                  setDeletingCatIdx(idx);
                                }}
                                className="text-stone-400 hover:text-brand-red p-1 cursor-pointer transition-colors"
                                title="Eliminar Categoría"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Reviews Customizer */}
                  <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm space-y-4 font-sans">
                    <h3 className="text-sm font-bold font-display text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-1.5">
                      <span>★</span> Opiniones y Comentarios
                    </h3>

                    {/* Add Review section */}
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-150 space-y-2">
                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Agregar Comentario de Cliente</span>
                      
                      <div className="space-y-1.5 font-sans">
                        <input
                          type="text"
                          value={newRevAuthor}
                          onChange={(e) => setNewRevAuthor(e.target.value)}
                          placeholder="Nombre del Cliente"
                          className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-[11px] focus:ring-1 focus:ring-brand-orange focus:outline-none font-sans"
                        />
                        
                        <textarea
                          rows={2}
                          value={newRevText}
                          onChange={(e) => setNewRevText(e.target.value)}
                          placeholder="Escriba el comentario..."
                          className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-[11px] focus:ring-1 focus:ring-brand-orange focus:outline-none font-sans"
                        />

                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={newRevRating}
                            onChange={(e) => setNewRevRating(Number(e.target.value))}
                            className="bg-white border border-stone-200 rounded-lg px-2 py-1 text-[11px]"
                          >
                            <option value={5}>⭐⭐⭐⭐⭐ (5/5)</option>
                            <option value={4}>⭐⭐⭐⭐ (4/5)</option>
                            <option value={3}>⭐⭐⭐ (3/5)</option>
                          </select>
                          
                          <input
                            type="text"
                            value={newRevDate}
                            onChange={(e) => setNewRevDate(e.target.value)}
                            placeholder="Hace 2 días"
                            className="bg-white border border-stone-200 rounded-lg px-2 py-1 text-[11px]"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (!newRevAuthor.trim() || !newRevText.trim()) return;
                            const newReview = {
                              id: 'rev-' + Date.now(),
                              author: newRevAuthor.trim(),
                              text: newRevText.trim(),
                              rating: newRevRating,
                              date: newRevDate.trim() || 'Cliente Verificado'
                            };
                            const updated = [...themeReviews, newReview];
                            setThemeReviews(updated);
                            setNewRevAuthor('');
                            setNewRevText('');
                            setNewRevDate('');
                            setNewRevRating(5);
                            handleSaveThemeSettings({ reviews: updated });
                          }}
                          className="w-full bg-brand-orange hover:bg-brand-orange/95 text-white py-1.5 rounded-lg text-xs font-bold font-display transition-all active:scale-95"
                        >
                          + Agregar Comentario
                        </button>
                      </div>
                    </div>

                    {/* Reviews List */}
                    <div className="space-y-1.5 max-h-72 overflow-y-auto">
                      {themeReviews.length === 0 ? (
                        <p className="text-[11px] text-stone-400 italic text-center py-2 font-sans">No hay comentarios cargados.</p>
                      ) : (
                        themeReviews.map((rev, idx) => (
                          <div key={rev.id || idx} className="p-2.5 rounded-xl bg-stone-50 border border-stone-150 relative space-y-1 text-[11px]">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-bold text-stone-800">{rev.author}</span>
                                <span className="text-amber-500 ml-1.5">{'★'.repeat(rev.rating)}</span>
                              </div>
                              {deletingReviewIdx === idx ? (
                                <div className="flex items-center gap-1 bg-brand-red/10 border border-brand-red/25 px-1 rounded animate-pulse">
                                  <span className="text-[8px] font-bold text-brand-red">¿Borrar?</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = themeReviews.filter((_, i) => i !== idx);
                                      setThemeReviews(updated);
                                      handleSaveThemeSettings({ reviews: updated });
                                      setDeletingReviewIdx(null);
                                    }}
                                    className="bg-brand-red text-white text-[8px] font-bold px-1 rounded transition-colors"
                                  >
                                    Sí
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeletingReviewIdx(null)}
                                    className="text-stone-500 hover:text-stone-800 text-[8px] font-bold px-1 rounded transition-colors"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setDeletingReviewIdx(idx)}
                                  className="text-stone-400 hover:text-brand-red font-bold text-xs cursor-pointer"
                                  title="Eliminar Opinión"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                            <p className="text-stone-600 leading-normal italic text-[10px]">"{rev.text}"</p>
                            <span className="text-[9px] text-stone-400 block text-right">{rev.date || 'Cliente Verificado'}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
