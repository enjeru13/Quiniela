import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Eye, EyeOff, CheckCircle2, Lock } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

function PasswordField({ label, value, onChange, placeholder, disabled }) {
  const [show, setShow] = useState(false)
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#636366' }}>
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="new-password"
          className="w-full rounded-xl px-4 py-3.5 pr-11 text-white outline-none transition-all disabled:opacity-50"
          style={{ background: '#2c2c2e', border: '1px solid #3a3a3c', fontSize: 16 }}
          onFocus={(e) => (e.target.style.borderColor = '#0a84ff')}
          onBlur={(e) => (e.target.style.borderColor = '#3a3a3c')}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ios-label3"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  )
}

export default function ChangePasswordSheet({ open, onClose }) {
  const { user } = useAuth()
  const [newPass, setNewPass]       = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState(false)

  const reset = () => {
    setNewPass('')
    setConfirmPass('')
    setError('')
    setSuccess(false)
  }

  const handleClose = () => { reset(); onClose() }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (newPass.length < 6) {
      setError('Mínimo 6 caracteres')
      return
    }
    if (newPass !== confirmPass) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password: newPass })
    setLoading(false)

    if (err) {
      setError(err.message)
      return
    }

    setSuccess(true)
    setTimeout(() => { handleClose() }, 1800)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60]"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={handleClose}
          />
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            className="fixed bottom-0 left-0 right-0 z-[61] rounded-t-3xl"
            style={{ background: '#1c1c1e', paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: '#3a3a3c' }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: '#2c2c2e' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(10,132,255,0.12)' }}>
                  <Lock size={14} style={{ color: '#0a84ff' }} />
                </div>
                <div>
                  <p className="text-sm font-black text-white">Cambiar contraseña</p>
                  <p className="text-[11px]" style={{ color: '#636366' }}>{user?.email}</p>
                </div>
              </div>
              <button onClick={handleClose} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <X size={13} className="text-ios-label3" />
              </button>
            </div>

            <div className="px-5 pt-5 pb-6">
              <AnimatePresence mode="wait">
                {success ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-3 py-8"
                  >
                    <CheckCircle2 size={48} style={{ color: '#30d158' }} />
                    <p className="text-base font-black text-white">Contraseña actualizada</p>
                    <p className="text-sm" style={{ color: '#636366' }}>Ya puedes usar tu nueva contraseña</p>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-4"
                  >
                    <PasswordField
                      label="Nueva contraseña"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      placeholder="Mín. 6 caracteres"
                      disabled={loading}
                    />
                    <PasswordField
                      label="Confirmar contraseña"
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      placeholder="Repite la contraseña"
                      disabled={loading}
                    />

                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs font-semibold"
                        style={{ color: '#ff453a' }}
                      >
                        {error}
                      </motion.p>
                    )}

                    <button
                      type="submit"
                      disabled={loading || !newPass || !confirmPass}
                      className="w-full py-3.5 rounded-2xl text-white text-sm font-black transition-all active:scale-[0.98] disabled:opacity-40 mt-1"
                      style={{ background: 'linear-gradient(135deg, #0a84ff, #0066cc)' }}
                    >
                      {loading ? 'Guardando...' : 'Actualizar contraseña'}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
