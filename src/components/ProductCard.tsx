import React, { useState } from 'react';
import { Product } from '../types';
import { Plus, Check, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProductCardProps {
  key?: string;
  product: Product;
  onAddToCart: (product: Product, quantity: number, notes: string) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAddToCart(product, 1, notes);
    setAdded(true);
    setNotes('');
    setShowNotes(false);
    setTimeout(() => setAdded(false), 1500);
  };

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div 
      id={`product-card-${product.id}`}
      className="bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col h-full group"
    >
      {/* Product Image and Badges */}
      <div className="relative aspect-video overflow-hidden bg-stone-100">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        
        {/* Floating Tag */}
        {product.tag && (
          <span className="absolute top-3 left-3 bg-brand-orange text-white text-xs font-bold tracking-wider uppercase px-2.5 py-1 rounded-full shadow-sm font-display">
            {product.tag}
          </span>
        )}

        {/* Offer Tag */}
        {product.isOffer && discountPercent > 0 && (
          <span className="absolute top-3 right-3 bg-brand-red text-white text-xs font-extrabold px-2.5 py-1 rounded-full shadow-sm font-display">
            {discountPercent}% OFF
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="mb-2">
          <span className="text-stone-400 text-xs font-semibold uppercase tracking-wider">
            {product.category === 'panchos' && '🌭 Panchos'}
            {product.category === 'promos' && '✨ Promociones'}
            {product.category === 'sides' && '🍟 Acompañamientos'}
            {product.category === 'drinks' && '🥤 Bebidas'}
          </span>
          <h3 className="text-lg font-bold font-display text-stone-900 group-hover:text-brand-orange transition-colors duration-200 mt-1">
            {product.name}
          </h3>
        </div>

        <p className="text-stone-500 text-xs leading-relaxed flex-1">
          {product.description}
        </p>

        {/* Notes input container if toggled */}
        <AnimatePresence>
          {showNotes && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3"
            >
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: sin aderezos, extra papas..."
                className="w-full text-xs p-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-orange bg-stone-50 resize-none h-12"
                maxLength={80}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pricing and Action Button */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-50">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-stone-950 font-display">
                ${product.price.toLocaleString('es-AR')}
              </span>
              {product.originalPrice && (
                <span className="text-xs text-stone-400 line-through">
                  ${product.originalPrice.toLocaleString('es-AR')}
                </span>
              )}
            </div>
            <p className="text-[10px] text-stone-400">Precio final en pesos</p>
          </div>

          <div className="flex items-center gap-1">
            {/* Custom Notes Toggle */}
            <button
              id={`notes-btn-${product.id}`}
              type="button"
              onClick={() => setShowNotes(!showNotes)}
              className={`p-2 rounded-xl border transition-colors ${
                showNotes || notes 
                  ? 'bg-brand-orange/10 border-brand-orange/30 text-brand-orange' 
                  : 'bg-stone-50 border-stone-200 text-stone-400 hover:text-stone-600 hover:bg-stone-100'
              }`}
              title="Agregar nota al pedido"
            >
              <MessageSquare size={16} />
            </button>

            {/* Main Add Button */}
            <button
              id={`add-btn-${product.id}`}
              type="button"
              onClick={handleAdd}
              disabled={added}
              className={`px-3 py-2 rounded-xl font-display font-bold text-xs flex items-center gap-1 transition-all duration-200 ${
                added
                  ? 'bg-emerald-500 text-white'
                  : 'bg-brand-orange hover:bg-brand-orange/90 text-white shadow-xs active:scale-95'
              }`}
            >
              {added ? (
                <>
                  <Check size={14} className="stroke-[3px]" />
                  <span>Agregado</span>
                </>
              ) : (
                <>
                  <Plus size={14} className="stroke-[3px]" />
                  <span>Pedir</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
