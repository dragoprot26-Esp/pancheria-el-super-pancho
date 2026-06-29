import { Product, Order } from './types';

// Declare our beautifully generated image paths
const panchoClasicoImg = '/src/assets/images/pancho_clasico_1782340407911.jpg';
const panchoSuperImg = '/src/assets/images/pancho_super_1782340421315.jpg';
const papasCheddarImg = '/src/assets/images/papas_cheddar_1782340436280.jpg';

export const PRODUCTS: Product[] = [
  {
    id: 'pancho-1',
    name: 'Pancho Clásico',
    description: 'Nuestra salchicha seleccionada premium en pan super tierno, lluvia de papas pay crocantes y aderezos clásicos a elección.',
    price: 1800,
    category: 'panchos',
    image: panchoClasicoImg,
    tag: '¡El Más Mimado!'
  },
  {
    id: 'pancho-2',
    name: 'Súper Pancho Cheddar & Bacon',
    description: 'Salchicha gigante premium, generosa salsa de queso cheddar fundido, panceta crujiente picada y cebollita de verdeo fresca.',
    price: 2500,
    originalPrice: 2900,
    category: 'panchos',
    image: panchoSuperImg,
    isOffer: true,
    tag: '15% OFF'
  },
  {
    id: 'pancho-3',
    name: 'Pancho Criollo',
    description: 'Salchicha premium con fresca salsa criolla (tomate, cebolla, morrón), aderezos tradicionales y un toque de chimichurri suave.',
    price: 2100,
    category: 'panchos',
    image: panchoClasicoImg,
  },
  {
    id: 'pancho-4',
    name: 'Pancho Alemán',
    description: 'Salchicha premium envuelta en queso muzzarella derretido, chucrut clásico y mostaza dulce estilo bávaro.',
    price: 2300,
    category: 'panchos',
    image: panchoSuperImg,
  },
  {
    id: 'side-1',
    name: 'Papas con Cheddar & Bacon',
    description: 'Porción abundante de papas fritas rústicas, doble cheddar fundido caliente, panceta crujiente y cebollita de verdeo.',
    price: 2800,
    category: 'sides',
    image: papasCheddarImg,
    tag: 'Clásico Compartido'
  },
  {
    id: 'side-2',
    name: 'Papas Fritas Simples',
    description: 'Porción clásica de papas fritas bien crocantes por fuera y tiernas por dentro, con sal marina.',
    price: 1900,
    category: 'sides',
    image: papasCheddarImg
  },
  {
    id: 'promo-1',
    name: 'Promo Amigos (2x1 Clásicos)',
    description: 'Llevate 2 Panchos Clásicos con papas pay por el precio de uno. ¡Ideal para compartir!',
    price: 1800,
    originalPrice: 3600,
    category: 'promos',
    image: panchoClasicoImg,
    isOffer: true,
    tag: '¡2x1 IMPERDIBLE!'
  },
  {
    id: 'promo-2',
    name: 'Combo Súper Jefe',
    description: '1 Súper Pancho Cheddar & Bacon + 1 Porción de Papas Fritas Simples + 1 Gaseosa bien helada.',
    price: 4500,
    originalPrice: 6200,
    category: 'promos',
    image: panchoSuperImg,
    isOffer: true,
    tag: 'AHORRÁ $1700'
  },
  {
    id: 'drink-1',
    name: 'Coca-Cola 500ml',
    description: 'Gaseosa Coca-Cola original bien helada.',
    price: 1100,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'drink-2',
    name: 'Sprite 500ml',
    description: 'Gaseosa Sprite lima-limón helada.',
    price: 1100,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'drink-3',
    name: 'Cerveza Patagonia IPA (Lata)',
    description: 'Cerveza artesanal Patagonia IPA ideal para acompañar tus panchos.',
    price: 1800,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&q=80&w=600',
  }
];

// Helper to generate seed orders for analytics
export const getSeedOrders = (): Order[] => {
  const orders: Order[] = [];
  const baseTime = new Date();
  
  // Seed 40 orders over the past 30 days
  const customers = [
    { name: 'Lucas Gómez', phone: '1154321098' },
    { name: 'Martina Rojas', phone: '1123456789' },
    { name: 'Bautista Silva', phone: '1198765432' },
    { name: 'Camila Fernández', phone: '1167890123' },
    { name: 'Mateo Álvarez', phone: '1134567890' },
    { name: 'Sofía Díaz', phone: '1145678901' },
    { name: 'Nicolás Peralta', phone: '1178901234' },
    { name: 'Valentina Cabrera', phone: '1189012345' },
  ];

  const orderItemsPool = [
    [
      { productId: 'pancho-1', name: 'Pancho Clásico', quantity: 2, price: 1800 },
      { productId: 'drink-1', name: 'Coca-Cola 500ml', quantity: 2, price: 1100 }
    ],
    [
      { productId: 'pancho-2', name: 'Súper Pancho Cheddar & Bacon', quantity: 1, price: 2500 },
      { productId: 'side-1', name: 'Papas con Cheddar & Bacon', quantity: 1, price: 2800 },
      { productId: 'drink-3', name: 'Cerveza Patagonia IPA (Lata)', quantity: 1, price: 1800 }
    ],
    [
      { productId: 'promo-2', name: 'Combo Súper Jefe', quantity: 2, price: 4500 }
    ],
    [
      { productId: 'promo-1', name: 'Promo Amigos (2x1 Clásicos)', quantity: 1, price: 1800 },
      { productId: 'side-2', name: 'Papas Fritas Simples', quantity: 1, price: 1900 },
      { productId: 'drink-2', name: 'Sprite 500ml', quantity: 1, price: 1100 }
    ],
    [
      { productId: 'pancho-3', name: 'Pancho Criollo', quantity: 3, price: 2100 },
      { productId: 'drink-1', name: 'Coca-Cola 500ml', quantity: 3, price: 1100 }
    ]
  ];

  for (let i = 0; i < 40; i++) {
    const date = new Date();
    // Spread them over the last 30 days
    date.setDate(baseTime.getDate() - Math.floor(Math.random() * 30));
    // Set random hour
    date.setHours(12 + Math.floor(Math.random() * 11), Math.floor(Math.random() * 60));
    
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const items = orderItemsPool[Math.floor(Math.random() * orderItemsPool.length)];
    const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const type = Math.random() > 0.4 ? 'pickup' : 'delivery';
    const address = type === 'delivery' ? 'Av. Corrientes 1450, Piso 3' : undefined;
    
    // Status distribution
    let status: Order['status'] = 'completed';
    if (i === 0) status = 'pending';
    else if (i === 1) status = 'preparing';
    else if (i === 2) status = 'accepted';
    else if (i > 35) status = 'cancelled';

    orders.push({
      id: `seed-order-${i}`,
      code: `P-${100 + i}`,
      customerName: customer.name,
      customerPhone: customer.phone,
      items,
      total,
      status,
      type,
      address,
      createdAt: date.toISOString()
    });
  }

  // Sort by date descending
  return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};
