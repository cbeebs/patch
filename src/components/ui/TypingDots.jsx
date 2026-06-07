import { T } from '../../constants/theme.js'

export function TypingDots() {
  return (
    <div style={{display:"flex",gap:5,padding:"11px 14px",background:T.bubblePatch,borderRadius:"18px 18px 18px 4px",width:"fit-content",border:`1px solid ${T.border}`}}>
      {[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:T.muted,animation:`pdot 1.1s ${i*0.18}s ease-in-out infinite`}}/>)}
    </div>
  )
}
