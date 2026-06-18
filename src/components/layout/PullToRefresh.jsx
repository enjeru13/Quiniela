import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { useMatches } from '../../contexts/MatchesContext'

const THRESHOLD = 65

export default function PullToRefresh() {
  const { refetch } = useMatches()
  const [pullY, setPullY] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(null)
  const active = useRef(false)

  const onTouchStart = useCallback((e) => {
    if (window.scrollY > 2) return
    startY.current = e.touches[0].clientY
    active.current = true
  }, [])

  const onTouchMove = useCallback((e) => {
    if (!active.current || startY.current === null) return
    const dy = e.touches[0].clientY - startY.current
    if (dy <= 0) { active.current = false; return }
    setPullY(Math.min(dy * 0.42, THRESHOLD))
  }, [])

  const onTouchEnd = useCallback(async () => {
    if (!active.current) return
    active.current = false
    startY.current = null

    if (pullY >= THRESHOLD) {
      setRefreshing(true)
      setPullY(0)
      await refetch()
      setRefreshing(false)
    } else {
      setPullY(0)
    }
  }, [pullY, refetch])

  useEffect(() => {
    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: true })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [onTouchStart, onTouchMove, onTouchEnd])

  const progress = pullY / THRESHOLD
  const visible = pullY > 8 || refreshing

  return (
    <div className="lg:hidden overflow-hidden" style={{ height: refreshing ? 44 : pullY > 0 ? pullY * 0.65 : 0, transition: pullY === 0 ? 'height 0.25s ease' : 'none' }}>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center"
            style={{ height: refreshing ? 44 : pullY * 0.65 }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(10,132,255,0.12)', border: '1px solid rgba(10,132,255,0.2)' }}
            >
              <RefreshCw
                size={14}
                className="text-ios-blue"
                style={{
                  transform: refreshing ? undefined : `rotate(${progress * 300}deg)`,
                  animation: refreshing ? 'spin 0.7s linear infinite' : 'none',
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
