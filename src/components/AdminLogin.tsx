import React, { useState } from 'react';
import { KeyRound, ShieldAlert, User, Lock, Loader2, Store, Users } from 'lucide-react';
import { motion } from 'motion/react';
import {
  validarLicencia,
  asegurarCuentaSeguraDueno,
  asegurarCuentaSeguraColab,
} from '../cloud';

interface AdminLoginProps {
  onLoginSuccess: (adminName: string, codigo: string) => void;
  onClose: () => void;
}

export default function AdminLogin({ onLoginSuccess, onClose }: AdminLoginProps) {
  const [role, setRole] = useState<'admin' | 'collaborator'>('admin');
  const [licenseKey, setLicenseKey] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const codigo = licenseKey.trim().toUpperCase();
    const usuario = username.trim();
    if (!codigo) return setErrorMsg('Ingresá el código de licencia.');
    if (!usuario) return setErrorMsg('Ingresá tu usuario.');
    if (password.length < 6) return setErrorMsg('La contraseña debe tener 6 caracteres o más.');

    setLoading(true);
    try {
      const lic = await validarLicencia(codigo);
      if (!lic) {
        setErrorMsg('Código de licencia inválido o vencido.');
        setLoading(false);
        return;
      }
      const r = role === 'admin'
        ? await asegurarCuentaSeguraDueno(usuario, password, codigo)
        : await asegurarCuentaSeguraColab(usuario, password, codigo);
      if (!r.ok) {
        setErrorMsg(r.msg || 'No se pudo iniciar sesión.');
        setLoading(false);
        return;
      }
      onLoginSuccess(usuario, codigo);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error de conexión. Probá de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Container */}
      <motion.div
        id="admin-login-modal"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative bg-stone-900 border border-stone-800 text-white w-full max-w-md rounded-3xl p-6 shadow-2xl z-10"
      >
        <div className="text-center mb-6">
          <div className="inline-flex bg-brand-orange/10 border border-brand-orange/30 text-brand-orange p-3 rounded-full mb-3">
            <KeyRound size={26} />
          </div>
          <h3 className="text-xl font-bold font-display tracking-tight text-white">Consola de Control</h3>
          <p className="text-stone-400 text-xs mt-1">Acceso para Jefes y colaboradores del local</p>
        </div>

        {/* Role selector */}
        <div className="grid grid-cols-2 gap-2 bg-stone-950/60 p-1 rounded-2xl border border-stone-800 mb-5">
          <button
            type="button"
            onClick={() => setRole('admin')}
            className={`py-2.5 rounded-xl text-xs font-display font-bold flex items-center justify-center gap-2 transition-all ${
              role === 'admin' ? 'bg-brand-orange text-white shadow-md' : 'text-stone-400 hover:text-white'
            }`}
          >
            <Store size={15} /> Dueño
          </button>
          <button
            type="button"
            onClick={() => setRole('collaborator')}
            className={`py-2.5 rounded-xl text-xs font-display font-bold flex items-center justify-center gap-2 transition-all ${
              role === 'collaborator' ? 'bg-brand-orange text-white shadow-md' : 'text-stone-400 hover:text-white'
            }`}
          >
            <Users size={15} /> Colaborador
          </button>
        </div>

        <form id="login-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-stone-950/50 p-4 rounded-2xl border border-stone-800 flex items-start gap-3">
            <ShieldAlert size={18} className="text-brand-yellow flex-shrink-0 mt-0.5" />
            <div className="text-xs space-y-1 text-stone-300">
              <p className="font-bold text-white uppercase tracking-wider">Acceso seguro</p>
              <p>{role === 'admin'
                ? 'Ingresá el código de licencia de tu local y creá (o usá) tu usuario y contraseña de dueño.'
                : 'Pedile al dueño que te dé de alta como colaborador, después entrá con el código del local y tu usuario.'}</p>
            </div>
          </div>

          {/* License code */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1.5">Código de Licencia del Local</label>
            <input
              id="license-key-input"
              type="text"
              placeholder="Ej: PANC-XXXX-..."
              required
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-sm text-white placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-brand-orange font-mono uppercase"
            />
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Usuario</label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-3.5 text-stone-600" />
              <input
                id="username-input"
                type="text"
                placeholder="Tu nombre de usuario"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-brand-orange"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Contraseña</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3.5 text-stone-600" />
              <input
                id="password-input"
                type="password"
                placeholder="Mínimo 6 caracteres"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-brand-orange"
              />
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs text-brand-red bg-brand-red/10 border border-brand-red/20 p-3 rounded-xl font-semibold text-center">
              {errorMsg}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              id="cancel-login-btn"
              type="button"
              onClick={onClose}
              className="flex-1 bg-stone-800 hover:bg-stone-700 text-stone-300 font-display font-bold py-3.5 rounded-xl text-xs transition-colors"
            >
              Regresar
            </button>
            <button
              id="submit-login-btn"
              type="submit"
              disabled={loading}
              className="flex-1 bg-brand-orange hover:bg-brand-orange/90 disabled:bg-stone-800 text-white font-display font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Ingresando...</span>
                </>
              ) : (
                <span>Iniciar Sesión</span>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
