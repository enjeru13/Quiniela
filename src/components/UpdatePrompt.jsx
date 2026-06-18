import { useRegisterSW } from 'virtual:pwa-register/react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, X } from 'lucide-react'

export default function UpdatePrompt() {
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW()

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="fixed top-4 left-4 right-4 z-[100] max-w-sm mx-auto"
        >
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{
              background: 'rgba(28,28,30,0.97)',
              border: '1px solid #3a3a3c',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(10,132,255,0.15)' }}
            >
              <RefreshCw size={14} className="text-ios-blue" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-white leading-none">Nueva versión</p>
              <p className="text-[10px] text-ios-label3 mt-0.5">Actualiza para ver los cambios</p>
            </div>

            <button
              onClick={() => updateServiceWorker(true)}
              className="shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-black text-white"
              style={{ background: '#0a84ff' }}
            >
              Actualizar
            </button>

            <button
              onClick={() => setNeedRefresh(false)}
              className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-ios-label3"
              style={{ background: 'rgba(255,255,255,0.07)' }}
            >
              <X size={11} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
