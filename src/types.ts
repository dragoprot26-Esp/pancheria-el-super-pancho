export interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date?: string;
}

export interface CustomCategory {
  id: string;
  name: string;
  icon?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number; // For showing discounts/offers
  category: string;
  image: string;
  isOffer?: boolean;
  tag?: string; // e.g. "¡Más Vendido!", "2x1", "15% OFF"
  customFields?: { name: string; value: string }[];
  [key: string]: any;
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}

export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'completed' | 'cancelled';
export type DeliveryType = 'delivery' | 'pickup';

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface Order {
  id: string;
  code: string; // Pick-up or delivery code e.g., P-105
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  type: DeliveryType;
  address?: string; // optional, for delivery
  createdAt: string; // ISO string
}

export interface AdminSettings {
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  licenseValidated: boolean;
  brandName?: string;
  brandSubtitle?: string;
  supportPhone?: string;
  openingHours?: string;
  heroBadge?: string;
  heroTitle?: string;
  heroDescription?: string;
  heroImage1?: string;
  heroImage2?: string;
  heroImage3?: string;
  fontFamily?: string;
  reviews?: Review[];
  categories?: CustomCategory[];
  adminTheme?: string;
}

export interface SalesMetrics {
  totalSales: number;
  totalOrders: number;
  averageTicket: number;
  salesByCategory: {
    panchos: number;
    promos: number;
    sides: number;
    drinks: number;
  };
  ordersByType: {
    delivery: number;
    pickup: number;
  };
  dailySalesHistory: { date: string; sales: number; count: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
}
