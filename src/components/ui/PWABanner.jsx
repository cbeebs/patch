import { useState } from 'react'
import { T } from '../../constants/theme.js'

const DISMISS_KEY = 'patch_v4_install_dismissed'

export function PWABanner() {
  const isInstalled =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true

  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === 'true'
  )

  if (isInstalled || dismissed) return null

  const dismiss = () => {
    setDismissed(true)
    localStorage.setItem(DISMISS_KEY, 'true')
  }

  return (
    <div style={{
      position:'fixed', bottom:0, left:0, right:0, zIndex:9999,
      background:T.coralLight,
      borderTop:`1px solid ${T.coralMid}`,
      padding:'10px 16px',
      paddingBottom:'max(10px,env(safe-area-inset-bottom))',
      display:'flex', alignItems:'center', gap:12,
    }}>
      <div style={{ flex:1 }}>
        <p style={{ margin:0, fontSize:13, fontWeight:600, color:T.coralDark, lineHeight:1.3 }}>
          Add to home screen for the best experience
        </p>
        <p style={{ margin:'2px 0 0', fontSize:11, color:T.sub }}>
          Safari → Share button → "Add to Home Screen"
        </p>
      </div>
      <button onClick={dismiss} style={{
        background:'none', border:'none', fontSize:22, color:T.coralDark,
        cursor:'pointer', padding:'2px 6px', touchAction:'manipulation',
        flexShrink:0, lineHeight:1,
      }}>×</button>
    </div>
  )
}
