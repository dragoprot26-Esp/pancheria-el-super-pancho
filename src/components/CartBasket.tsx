import { CartItem } from '../types';
import { ShoppingBasket, ArrowRight, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CartBasketProps {
  cart: CartItem[];
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  onOpenCheckout: () => void;
}

export default function CartBasket({ cart, onRemoveItem, onClearCart, onOpenCheckout }: CartBasketProps) {
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-6 left-0 right-0 z-40 px-4 flex justify-center pointer-events-none">
      <motion.div
        id="cart-basket-floating"
        initial={{ y: 80, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 80, opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="pointer-events-auto bg-stone-900 text-white rounded-full shadow-2xl px-5 py-3.5 flex items-center gap-4 max-w-lg w-full border border-stone-800/80 pulsing-ring"
      >
        {/* Animated Basket Icon & Bubble */}
        <div className="relative flex items-center justify-center bg-brand-orange text-white p-3 rounded-full">
          <ShoppingBasket size={20} className="stroke-[2px]" />
          
          <AnimatePresence mode="popLayout">
            <motion.span
              key={totalItems}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              className="absolute -top-1.5 -right-1.5 bg-brand-yellow text-stone-950 font-black text-xs h-5 w-5 flex items-center justify-center rounded-full border border-stone-900 font-display"
            >
              {totalItems}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Sum & Quick Breakdown */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-stone-400 font-medium uppercase tracking-wider">Tu canasta está lista</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-black font-display text-white">
              ${totalPrice.toLocaleString('es-AR')}
            </span>
            <span className="text-xs text-stone-400">
              {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Clear button */}
          <button
            id="clear-basket-btn"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClearCart();
            }}
            className="p-2.5 rounded-full text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
            title="Vaciar canasta"
          >
            <Trash2 size={16} />
          </button>

          {/* Checkout button */}
          <button
            id="checkout-basket-btn"
            type="button"
            onClick={onOpenCheckout}
            className="bg-brand-orange hover:bg-brand-orange/90 text-white font-display font-bold text-xs px-4 py-2.5 rounded-full flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
          >
            <span>Pedir Ya</span>
            <ArrowRight size={14} className="stroke-[2.5px]" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
