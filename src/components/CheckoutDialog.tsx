import React, { useState, useEffect } from 'react';
import { CartItem, DeliveryType, Order } from '../types';
import { X, MapPin, Store, Trash2, ShoppingBag, CheckCircle, Smartphone, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { pancAgregarPedido } from '../cloud';

interface CheckoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onRemoveItem: (index: number) => void;
  onUpdateQuantity: (index: number, delta: number) => void;
  onClearCart: () => void;
  pickupEnabled: boolean; // Managed by admin settings
  deliveryEnabled: boolean; // Managed by admin settings
  publicCode: string; // código del local (tenant) para registrar el pedido
}

export default function CheckoutDialog({
  isOpen,
  onClose,
  cart,
  onRemoveItem,
  onUpdateQuantity,
  onClearCart,
  pickupEnabled,
  deliveryEnabled,
  publicCode
}: CheckoutDialogProps) {
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('delivery');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // If one of the modes is disabled, force selection of the other
  useEffect(() => {
    if (!pickupEnabled && deliveryEnabled) {
      setDeliveryType('delivery');
    } else if (pickupEnabled && !deliveryEnabled) {
      setDeliveryType('pickup');
    }
  }, [pickupEnabled, deliveryEnabled]);

  if (!isOpen) return null;

  const totalPrice = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) return setErrorMsg('Por favor ingrese su nombre.');
    if (!phone.trim() || phone.length < 8) return setErrorMsg('Por favor ingrese un teléfono válido para coordinar.');
    if (deliveryType === 'delivery' && !address.trim()) {
      return setErrorMsg('Por favor ingrese la dirección de entrega.');
    }

    if (!publicCode) {
      return setErrorMsg('No se pudo identificar el local. Abrí la carta desde el enlace del local (con su código).');
    }

    setSubmitting(true);

    try {
      const newOrder: Order = {
        id: (window.crypto && (window.crypto as any).randomUUID)
          ? (window.crypto as any).randomUUID()
          : `ord-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        code: 'P-' + Math.floor(100 + Math.random() * 900),
        customerName: name,
        customerPhone: phone,
        type: deliveryType,
        address: deliveryType === 'delivery' ? address : undefined,
        items: cart.map(item => ({
          productId: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          notes: item.notes,
        })),
        total: totalPrice,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      await pancAgregarPedido(publicCode, newOrder);

      setConfirmedOrder(newOrder);
      onClearCart(); // Empty the client cart
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de conexión. Intente nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseAfterConfirmation = () => {
    setConfirmedOrder(null);
    setName('');
    setPhone('');
    setAddress('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={confirmedOrder ? handleCloseAfterConfirmation : onClose}
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs"
      />

      <AnimatePresence mode="wait">
        {!confirmedOrder ? (
          /* Checkout Form Modal */
          <motion.div
            id="checkout-form-modal"
            key="checkout-form"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-stone-100 z-10"
          >
            {/* Header */}
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50">
              <div>
                <h3 className="text-xl font-bold font-display text-stone-900">Completa tu Pedido</h3>
                <p className="text-xs text-stone-500">Estas a un paso de probar la gloria panchera</p>
              </div>
              <button
                id="close-checkout-btn"
                onClick={onClose}
                className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Container */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Cart Summary */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">Resumen de canasta</h4>
                <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                  {cart.map((item, index) => (
                    <div key={`${item.product.id}-${index}`} className="flex items-start justify-between text-sm gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-brand-orange font-display">{item.quantity}x</span>
                          <span className="font-medium text-stone-800">{item.product.name}</span>
                        </div>
                        {item.notes && (
                          <span className="text-[11px] text-brand-orange bg-brand-orange/5 px-1.5 py-0.5 rounded-sm block w-fit mt-1">
                            Nota: "{item.notes}"
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-stone-900">
                          ${(item.product.price * item.quantity).toLocaleString('es-AR')}
                        </span>
                        
                        <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50 overflow-hidden">
                          <button
                            id={`qty-minus-${index}`}
                            type="button"
                            onClick={() => onUpdateQuantity(index, -1)}
                            className="px-2 py-0.5 text-xs font-bold hover:bg-stone-200 text-stone-600"
                          >
                            -
                          </button>
                          <button
                            id={`qty-plus-${index}`}
                            type="button"
                            onClick={() => onUpdateQuantity(index, 1)}
                            className="px-2 py-0.5 text-xs font-bold hover:bg-stone-200 text-stone-600"
                          >
                            +
                          </button>
                        </div>

                        <button
                          id={`remove-item-${index}`}
                          type="button"
                          onClick={() => onRemoveItem(index)}
                          className="text-stone-400 hover:text-brand-red transition-colors"
                          title="Remover"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center bg-stone-50 p-3.5 rounded-2xl border border-stone-100">
                  <span className="text-sm font-semibold text-stone-600">Total a Pagar</span>
                  <span className="text-2xl font-black text-stone-950 font-display">
                    ${totalPrice.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              {/* Order Form */}
              <form id="checkout-form-fields" onSubmit={handleSubmit} className="space-y-4">
                {/* Delivery Type Switch */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Modo de Entrega</label>
                  <div className="grid grid-cols-2 gap-2 bg-stone-100 p-1 rounded-xl">
                    <button
                      id="type-delivery-btn"
                      type="button"
                      disabled={!deliveryEnabled}
                      onClick={() => setDeliveryType('delivery')}
                      className={`py-2.5 rounded-lg text-xs font-bold font-display flex items-center justify-center gap-2 transition-all relative ${
                        !deliveryEnabled 
                          ? 'opacity-50 cursor-not-allowed text-stone-400' 
                          : deliveryType === 'delivery'
                            ? 'bg-white text-stone-950 shadow-xs'
                            : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      <MapPin size={15} />
                      Delivery a domicilio
                      {!deliveryEnabled && (
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-red opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-red"></span>
                        </span>
                      )}
                    </button>
                    <button
                      id="type-pickup-btn"
                      type="button"
                      disabled={!pickupEnabled}
                      onClick={() => setDeliveryType('pickup')}
                      className={`py-2.5 rounded-lg text-xs font-bold font-display flex items-center justify-center gap-2 transition-all relative ${
                        !pickupEnabled 
                          ? 'opacity-50 cursor-not-allowed text-stone-400' 
                          : deliveryType === 'pickup'
                            ? 'bg-white text-stone-950 shadow-xs'
                            : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      <Store size={15} />
                      Retiro en local
                      {!pickupEnabled && (
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-red opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-red"></span>
                        </span>
                      )}
                    </button>
                  </div>
                  {!deliveryEnabled && pickupEnabled && (
                    <p className="text-[10px] text-brand-red font-semibold text-center mt-1">
                      ⚠️ Envíos a domicilio inhabilitados temporalmente.
                    </p>
                  )}
                  {!pickupEnabled && deliveryEnabled && (
                    <p className="text-[10px] text-brand-red font-semibold text-center mt-1">
                      ⚠️ Retiro en tienda inhabilitado temporalmente por falta de inventario.
                    </p>
                  )}
                  {!pickupEnabled && !deliveryEnabled && (
                    <p className="text-[10px] text-brand-red font-semibold text-center mt-1">
                      ⚠️ Todos los métodos de entrega están inhabilitados temporalmente.
                    </p>
                  )}
                </div>

                {/* Personal Information */}
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Tus Datos</label>
                  
                  {/* Name Input */}
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-3.5 text-stone-400" />
                    <input
                      id="checkout-name-input"
                      type="text"
                      placeholder="Tu nombre completo"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange bg-stone-50 text-sm"
                    />
                  </div>

                  {/* Phone Input */}
                  <div className="relative">
                    <Smartphone size={16} className="absolute left-3 top-3.5 text-stone-400" />
                    <input
                      id="checkout-phone-input"
                      type="tel"
                      placeholder="Tu Whatsapp (Ej: 1155443322)"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange bg-stone-50 text-sm"
                    />
                  </div>

                  {/* Address Input for Delivery */}
                  {deliveryType === 'delivery' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="relative"
                    >
                      <MapPin size={16} className="absolute left-3 top-3.5 text-stone-400" />
                      <input
                        id="checkout-address-input"
                        type="text"
                        placeholder="Dirección de entrega (Ej: Av. Rivadavia 2500, Dto 4B)"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full pl-9 pr-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange bg-stone-50 text-sm"
                      />
                    </motion.div>
                  )}
                </div>

                {/* Error message */}
                {errorMsg && (
                  <p className="text-xs text-brand-red font-semibold bg-brand-red/5 p-3 rounded-xl border border-brand-red/20 text-center">
                    {errorMsg}
                  </p>
                )}

                {/* Submit button */}
                <button
                  id="submit-order-btn"
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-brand-orange hover:bg-brand-orange/90 disabled:bg-stone-300 text-white font-display font-bold py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-98 text-sm"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Enviando pedido al asador...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={16} />
                      <span>Confirmar mi Pedido - ${totalPrice.toLocaleString('es-AR')}</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        ) : (
          /* Success Receipt Card */
          <motion.div
            id="order-confirmation-modal"
            key="checkout-success"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl p-6 border border-stone-100 z-10 text-center space-y-6"
          >
            <div className="flex flex-col items-center">
              <div className="bg-emerald-50 text-emerald-500 p-3.5 rounded-full mb-3.5">
                <CheckCircle size={40} className="stroke-[2.5px]" />
              </div>
              <h3 className="text-xl font-bold font-display text-stone-900">¡Pedido Confirmado!</h3>
              <p className="text-xs text-stone-500 mt-1">Tu orden ya ingresó al panel de la panchería.</p>
            </div>

            {/* Retiro Code Box */}
            <div className="bg-stone-50 border border-dashed border-stone-200 p-5 rounded-2xl">
              <span className="text-[10px] text-stone-400 font-extrabold uppercase tracking-wider block">Código de Retiro</span>
              <span className="text-4xl font-black text-brand-orange font-mono block mt-1 tracking-wide">
                {confirmedOrder.code}
              </span>
              <p className="text-[11px] text-stone-500 mt-2">
                {confirmedOrder.type === 'pickup' 
                  ? 'Mostrá este código en caja al retirar en el local.' 
                  : 'Guardá este código para identificar tu pedido al recibir.'}
              </p>
            </div>

            {/* Tracking Details */}
            <div className="space-y-2 text-left text-xs bg-stone-50/50 p-4 rounded-xl border border-stone-100">
              <div className="flex justify-between border-b border-stone-100 pb-2">
                <span className="text-stone-400">Cliente:</span>
                <span className="font-semibold text-stone-800">{confirmedOrder.customerName}</span>
              </div>
              <div className="flex justify-between border-b border-stone-100 pb-2">
                <span className="text-stone-400">Teléfono:</span>
                <span className="font-semibold text-stone-800">{confirmedOrder.customerPhone}</span>
              </div>
              <div className="flex justify-between border-b border-stone-100 pb-2">
                <span className="text-stone-400">Entrega:</span>
                <span className="font-bold text-brand-orange font-display uppercase tracking-wider">
                  {confirmedOrder.type === 'pickup' ? 'Retiro en Local' : 'Envío a Domicilio'}
                </span>
              </div>
              {confirmedOrder.address && (
                <div className="flex justify-between border-b border-stone-100 pb-2">
                  <span className="text-stone-400">Dirección:</span>
                  <span className="font-semibold text-stone-800 truncate max-w-[180px]" title={confirmedOrder.address}>
                    {confirmedOrder.address}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-1">
                <span className="text-stone-500 font-bold">Total Abonado:</span>
                <span className="font-extrabold text-stone-900">${confirmedOrder.total.toLocaleString('es-AR')}</span>
              </div>
            </div>

            {/* Instructions list */}
            <div className="text-xs text-stone-400 text-center space-y-1">
              <p>⏱️ Tiempo estimado de preparación: <strong>10 a 15 min</strong>.</p>
              <p>Te avisaremos por WhatsApp si hay alguna novedad.</p>
            </div>

            {/* Back button */}
            <button
              id="close-confirmation-btn"
              onClick={handleCloseAfterConfirmation}
              className="w-full bg-stone-900 hover:bg-stone-800 text-white font-display font-bold py-3.5 rounded-xl transition-all active:scale-98 text-sm"
            >
              Cerrar y seguir comprando
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
