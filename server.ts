import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;
const DB_PATH = path.join(process.cwd(), 'db.json');

app.use(express.json());

// Type definitions for our simple server storage
interface ServerOrder {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  items: {
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  status: 'pending' | 'accepted' | 'preparing' | 'completed' | 'cancelled';
  type: 'delivery' | 'pickup';
  address?: string;
  createdAt: string;
}

interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date?: string;
}

interface CustomCategory {
  id: string;
  name: string;
  icon?: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  isOffer?: boolean;
  tag?: string;
  customFields?: { name: string; value: string }[];
}

interface ServerData {
  settings: {
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
  };
  orders: ServerOrder[];
  products: Product[];
}

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'pancho-1',
    name: 'Pancho Clásico',
    description: 'Nuestra salchicha seleccionada premium en pan super tierno, lluvia de papas pay crocantes y aderezos clásicos a elección.',
    price: 1800,
    category: 'panchos',
    image: '/src/assets/images/pancho_clasico_1782340407911.jpg',
    tag: '¡El Más Mimado!'
  },
  {
    id: 'pancho-2',
    name: 'Súper Pancho Cheddar & Bacon',
    description: 'Salchicha gigante premium, generosa salsa de queso cheddar fundido, panceta crujiente picada y cebollita de verdeo fresca.',
    price: 2500,
    originalPrice: 2900,
    category: 'panchos',
    image: '/src/assets/images/pancho_super_1782340421315.jpg',
    isOffer: true,
    tag: '15% OFF'
  },
  {
    id: 'pancho-3',
    name: 'Pancho Criollo',
    description: 'Salchicha premium con fresca salsa criolla (tomate, cebolla, morrón), aderezos tradicionales y un toque de chimichurri suave.',
    price: 2100,
    category: 'panchos',
    image: '/src/assets/images/pancho_clasico_1782340407911.jpg',
  },
  {
    id: 'pancho-4',
    name: 'Pancho Alemán',
    description: 'Salchicha premium envuelta en queso muzzarella derretido, chucrut clásico y mostaza dulce estilo bávaro.',
    price: 2300,
    category: 'panchos',
    image: '/src/assets/images/pancho_super_1782340421315.jpg',
  },
  {
    id: 'side-1',
    name: 'Papas con Cheddar & Bacon',
    description: 'Porción abundante de papas fritas rústicas, doble cheddar fundido caliente, panceta crujiente y cebollita de verdeo.',
    price: 2800,
    category: 'sides',
    image: '/src/assets/images/papas_cheddar_1782340436280.jpg',
    tag: 'Clásico Compartido'
  },
  {
    id: 'side-2',
    name: 'Papas Fritas Simples',
    description: 'Porción clásica de papas fritas bien crocantes por fuera y tiernas por dentro, con sal marina.',
    price: 1900,
    category: 'sides',
    image: '/src/assets/images/papas_cheddar_1782340436280.jpg'
  },
  {
    id: 'promo-1',
    name: 'Promo Amigos (2x1 Clásicos)',
    description: 'Llevate 2 Panchos Clásicos con papas pay por el precio de uno. ¡Ideal para compartir!',
    price: 1800,
    originalPrice: 3600,
    category: 'promos',
    image: '/src/assets/images/pancho_clasico_1782340407911.jpg',
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
    image: '/src/assets/images/pancho_super_1782340421315.jpg',
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

// Check and initialize the local JSON file database
const getInitialData = (): ServerData => {
  // Let's create some beautiful historical orders to populate the admin panel charts on first load!
  const orders: ServerOrder[] = [];
  const baseTime = new Date();
  
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

  const itemsPool = [
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
    ]
  ];

  // Seed 45 historical orders over the last 30 days
  for (let i = 0; i < 45; i++) {
    const date = new Date();
    date.setDate(baseTime.getDate() - Math.floor(Math.random() * 30));
    date.setHours(12 + Math.floor(Math.random() * 11), Math.floor(Math.random() * 60));
    
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const items = itemsPool[Math.floor(Math.random() * itemsPool.length)];
    const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const type = Math.random() > 0.4 ? 'pickup' : 'delivery' as 'pickup' | 'delivery';
    const address = type === 'delivery' ? 'Av. Corrientes 1450, Piso 3' : undefined;
    
    let status: ServerOrder['status'] = 'completed';
    if (i === 0) status = 'pending';
    else if (i === 1) status = 'preparing';
    else if (i === 2) status = 'accepted';
    else if (i > 40) status = 'cancelled';

    orders.push({
      id: `order-seed-${i}`,
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

  // Sort orders descending by date
  orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const initialReviews = [
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
  ];

  const initialCategories = [
    { id: 'panchos', name: '🌭 Súper Panchos' },
    { id: 'promos', name: '🎁 Combos / Promos' },
    { id: 'sides', name: '🍟 Acompañamientos' },
    { id: 'drinks', name: '🥤 Bebidas' }
  ];

  return {
    settings: {
      pickupEnabled: true,
      deliveryEnabled: true,
      licenseValidated: false,
      brandName: 'La Panchería del Jefe',
      brandSubtitle: 'Panes súper tiernos, salchichas premium',
      supportPhone: '11 5566-7788',
      openingHours: 'Abierto: 11:30hs a 23:30hs',
      heroBadge: 'SABOR ARGENTINO PREMIUM',
      heroTitle: 'Panchos cargados de verdad, como a vos te gustan.',
      heroDescription: 'Disfrutá de panes brioche artesanales, aderezos importados, lluvia interminable de papitas pay crujientes y combinaciones brutales de quesos fundidos. Pedí y retirá rápido en nuestro local o solicitalo directo a tu casa.',
      heroImage1: 'https://images.unsplash.com/photo-1627059318424-87d00f711f50?w=600&auto=format&fit=crop&q=60',
      heroImage2: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=60',
      heroImage3: 'https://images.unsplash.com/photo-1541232264-8066f8e4b2c6?w=600&auto=format&fit=crop&q=60',
      fontFamily: 'Inter',
      reviews: initialReviews,
      categories: initialCategories
    },
    orders,
    products: DEFAULT_PRODUCTS
  };
};

// Database helper functions
const readDb = (): ServerData => {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const data = getInitialData();
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
      return data;
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as ServerData;
    
    // Automatically migrate old databases that don't have the products field yet
    if (!parsed.products || !Array.isArray(parsed.products)) {
      parsed.products = DEFAULT_PRODUCTS;
      fs.writeFileSync(DB_PATH, JSON.stringify(parsed, null, 2), 'utf-8');
    }

    let migrated = false;

    // Automatically migrate old databases that don't have the deliveryEnabled setting yet
    if (parsed.settings.deliveryEnabled === undefined) {
      parsed.settings.deliveryEnabled = true;
      migrated = true;
    }

    if (parsed.settings.brandName === undefined) {
      parsed.settings.brandName = 'La Panchería del Jefe';
      migrated = true;
    }
    if (parsed.settings.brandSubtitle === undefined) {
      parsed.settings.brandSubtitle = 'Panes súper tiernos, salchichas premium';
      migrated = true;
    }
    if (parsed.settings.supportPhone === undefined) {
      parsed.settings.supportPhone = '11 5566-7788';
      migrated = true;
    }
    if (parsed.settings.openingHours === undefined) {
      parsed.settings.openingHours = 'Abierto: 11:30hs a 23:30hs';
      migrated = true;
    }
    if (parsed.settings.heroBadge === undefined) {
      parsed.settings.heroBadge = 'SABOR ARGENTINO PREMIUM';
      migrated = true;
    }
    if (parsed.settings.heroTitle === undefined) {
      parsed.settings.heroTitle = 'Panchos cargados de verdad, como a vos te gustan.';
      migrated = true;
    }
    if (parsed.settings.heroDescription === undefined) {
      parsed.settings.heroDescription = 'Disfrutá de panes brioche artesanales, aderezos importados, lluvia interminable de papitas pay crujientes y combinaciones brutales de quesos fundidos. Pedí y retirá rápido en nuestro local o solicitalo directo a tu casa.';
      migrated = true;
    }
    if (parsed.settings.heroImage1 === undefined) {
      parsed.settings.heroImage1 = 'https://images.unsplash.com/photo-1627059318424-87d00f711f50?w=600&auto=format&fit=crop&q=60';
      migrated = true;
    }
    if (parsed.settings.heroImage2 === undefined) {
      parsed.settings.heroImage2 = 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=60';
      migrated = true;
    }
    if (parsed.settings.heroImage3 === undefined) {
      parsed.settings.heroImage3 = 'https://images.unsplash.com/photo-1541232264-8066f8e4b2c6?w=600&auto=format&fit=crop&q=60';
      migrated = true;
    }
    if (parsed.settings.fontFamily === undefined) {
      parsed.settings.fontFamily = 'Inter';
      migrated = true;
    }
    if (parsed.settings.reviews === undefined) {
      parsed.settings.reviews = [
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
      ];
      migrated = true;
    }
    if (parsed.settings.categories === undefined) {
      parsed.settings.categories = [
        { id: 'panchos', name: '🌭 Súper Panchos' },
        { id: 'promos', name: '🎁 Combos / Promos' },
        { id: 'sides', name: '🍟 Acompañamientos' },
        { id: 'drinks', name: '🥤 Bebidas' }
      ];
      migrated = true;
    }

    if (migrated) {
      fs.writeFileSync(DB_PATH, JSON.stringify(parsed, null, 2), 'utf-8');
    }
    
    return parsed;
  } catch (error) {
    console.error('Error reading DB, resetting database', error);
    const data = getInitialData();
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return data;
  }
};

const writeDb = (data: ServerData) => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to database:', error);
  }
};

// SSE Client Connections for Real-Time Updates
let sseClients: any[] = [];

const broadcastToSse = (event: string, data: any) => {
  sseClients.forEach((client) => {
    client.res.write(`event: ${event}\n`);
    client.res.write(`data: ${JSON.stringify(data)}\n\n`);
  });
};

// ---------------------- API ENDPOINTS ----------------------

// 1. Get current settings and pickup state
app.get('/api/settings', (req, res) => {
  const db = readDb();
  res.json(db.settings);
});

// 2. Validate Central license code
app.post('/api/settings/validate-license', (req, res) => {
  const { licenseKey } = req.body;
  const centralLicense = 'PANCHERIA-MASTER-2026-JEFE';

  if (licenseKey === centralLicense) {
    const db = readDb();
    db.settings.licenseValidated = true;
    writeDb(db);
    
    // Broadcast setting change
    broadcastToSse('settings-updated', db.settings);
    res.json({ success: true, message: '¡Licencia validada con éxito!' });
  } else {
    res.status(400).json({ success: false, message: 'Licencia inválida. Verifique el código e intente nuevamente.' });
  }
});

// 3. Toggle store pickup option
app.post('/api/settings/toggle-pickup', (req, res) => {
  const { enabled } = req.body;
  const db = readDb();
  
  db.settings.pickupEnabled = !!enabled;
  writeDb(db);

  broadcastToSse('settings-updated', db.settings);
  res.json({ success: true, settings: db.settings });
});

// 3.5 Toggle store delivery option
app.post('/api/settings/toggle-delivery', (req, res) => {
  const { enabled } = req.body;
  const db = readDb();
  
  db.settings.deliveryEnabled = !!enabled;
  writeDb(db);

  broadcastToSse('settings-updated', db.settings);
  res.json({ success: true, settings: db.settings });
});

// 3.6 Update brand name, subtitle, support contacts, theme & reviews
app.post('/api/settings/update', (req, res) => {
  const {
    brandName,
    brandSubtitle,
    supportPhone,
    openingHours,
    heroBadge,
    heroTitle,
    heroDescription,
    heroImage1,
    heroImage2,
    heroImage3,
    fontFamily,
    reviews,
    categories,
    adminTheme
  } = req.body;

  const db = readDb();
  if (brandName !== undefined) db.settings.brandName = brandName;
  if (brandSubtitle !== undefined) db.settings.brandSubtitle = brandSubtitle;
  if (supportPhone !== undefined) db.settings.supportPhone = supportPhone;
  if (openingHours !== undefined) db.settings.openingHours = openingHours;
  if (heroBadge !== undefined) db.settings.heroBadge = heroBadge;
  if (heroTitle !== undefined) db.settings.heroTitle = heroTitle;
  if (heroDescription !== undefined) db.settings.heroDescription = heroDescription;
  if (heroImage1 !== undefined) db.settings.heroImage1 = heroImage1;
  if (heroImage2 !== undefined) db.settings.heroImage2 = heroImage2;
  if (heroImage3 !== undefined) db.settings.heroImage3 = heroImage3;
  if (fontFamily !== undefined) db.settings.fontFamily = fontFamily;
  if (reviews !== undefined) db.settings.reviews = reviews;
  if (categories !== undefined) db.settings.categories = categories;
  if (adminTheme !== undefined) db.settings.adminTheme = adminTheme;

  writeDb(db);
  broadcastToSse('settings-updated', db.settings);
  res.json({ success: true, settings: db.settings });
});

// 4. Get all orders
app.get('/api/orders', (req, res) => {
  const db = readDb();
  res.json(db.orders);
});

// 5. Create a new order (Place order)
app.post('/api/orders', (req, res) => {
  const { customerName, customerPhone, items, type, address } = req.body;

  if (!customerName || !customerPhone || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Nombre, teléfono y productos requeridos.' });
  }

  const db = readDb();

  // Validate pickup option isn't disabled by admin
  if (type === 'pickup' && !db.settings.pickupEnabled) {
    return res.status(400).json({ error: 'La opción de retiro en tienda no está disponible por el momento.' });
  }

  // Generate unique pickup/order code
  // Let's count current orders to generate a neat incremental ID (e.g. P-146)
  const codeNumber = 100 + db.orders.length + 1;
  const code = `P-${codeNumber}`;
  
  // Calculate total price to ensure server-side calculation and avoid manipulation
  const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const newOrder: ServerOrder = {
    id: `order-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    code,
    customerName,
    customerPhone,
    items,
    total,
    status: 'pending',
    type,
    address: type === 'delivery' ? address : undefined,
    createdAt: new Date().toISOString()
  };

  db.orders.unshift(newOrder); // Add to beginning
  writeDb(db);

  // Instantly notify admin panel client through SSE
  broadcastToSse('new-order', newOrder);

  res.status(201).json({ success: true, order: newOrder });
});

// 6. Update order status
app.patch('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const allowedStatuses = ['pending', 'accepted', 'preparing', 'completed', 'cancelled'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Estado de pedido inválido.' });
  }

  const db = readDb();
  const orderIndex = db.orders.findIndex((o) => o.id === id);

  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Pedido no encontrado.' });
  }

  db.orders[orderIndex].status = status as any;
  writeDb(db);

  // Broadcast the update
  broadcastToSse('order-status-updated', db.orders[orderIndex]);

  res.json({ success: true, order: db.orders[orderIndex] });
});

// 6.5 Get all products
app.get('/api/products', (req, res) => {
  const db = readDb();
  res.json(db.products);
});

// 6.6 Create a new product (or promotion/offer)
app.post('/api/products', (req, res) => {
  const { name, description, price, originalPrice, category, image, isOffer, tag, customFields } = req.body;

  if (!name || !description || price === undefined || !category || !image) {
    return res.status(400).json({ error: 'Nombre, descripción, precio, categoría e imagen requeridos.' });
  }

  const db = readDb();
  
  const newProduct: Product = {
    id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name,
    description,
    price: Number(price),
    originalPrice: originalPrice ? Number(originalPrice) : undefined,
    category,
    image,
    isOffer: !!isOffer,
    tag,
    customFields
  };

  db.products.push(newProduct);
  writeDb(db);

  // Notify all connected clients of menu update
  broadcastToSse('products-updated', db.products);

  res.status(201).json({ success: true, product: newProduct });
});

// 6.7 Delete a product
app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  
  const initialLength = db.products.length;
  db.products = db.products.filter(p => p.id !== id);
  
  if (db.products.length === initialLength) {
    return res.status(404).json({ error: 'Producto no encontrado.' });
  }
  
  writeDb(db);
  broadcastToSse('products-updated', db.products);
  
  res.json({ success: true, message: 'Producto eliminado correctamente.' });
});

// 6.8 Update/Edit an existing product
app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, price, originalPrice, category, image, isOffer, tag, customFields } = req.body;

  if (!name || !description || price === undefined || !category || !image) {
    return res.status(400).json({ error: 'Nombre, descripción, precio, categoría e imagen requeridos.' });
  }

  const db = readDb();
  const productIndex = db.products.findIndex(p => p.id === id);

  if (productIndex === -1) {
    return res.status(404).json({ error: 'Producto no encontrado.' });
  }

  db.products[productIndex] = {
    id,
    name,
    description,
    price: Number(price),
    originalPrice: originalPrice ? Number(originalPrice) : undefined,
    category,
    image,
    isOffer: !!isOffer,
    tag,
    customFields
  };

  writeDb(db);
  broadcastToSse('products-updated', db.products);

  res.json({ success: true, product: db.products[productIndex] });
});

// 7. Server-Sent Events (SSE) Stream Endpoint for Admins
app.get('/api/orders/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no' // Prevent proxy buffering
  });

  // Send initial ping to establish connection
  res.write('data: {"connected": true}\n\n');

  const clientId = Date.now();
  const newClient = { id: clientId, res };
  sseClients.push(newClient);

  req.on('close', () => {
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
});

// ---------------------- FRONTEND / VITE INTEGRATION ----------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
