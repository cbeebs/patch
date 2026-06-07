import { AllergenPicker } from './AllergenPicker.jsx'
import { T } from '../../constants/theme.js'
import { fmtTime } from '../../lib/utils.js'

export function Bubble({msg,onAllergenDone}) {
  const isPatch = msg.role === "patch"
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:isPatch?"flex-start":"flex-end",padding:"2px 14px",gap:3}}>
      {msg.image&&<img src={msg.image} alt="" style={{maxWidth:"65%",borderRadius:14,border:`1px solid ${T.border}`,display:"block"}}/>}
      {msg.text&&(
        <div style={{
          maxWidth:"76%",
          background:isPatch?T.bubblePatch:T.bubbleUser,
          border:isPatch?`1px solid ${T.border}`:"none",
          borderRadius:isPatch?"18px 18px 18px 4px":"18px 18px 4px 18px",
          padding:"10px 14px",fontSize:14.5,lineHeight:1.5,
          color:T.text,whiteSpace:"pre-wrap",
        }}>{msg.text}</div>
      )}
      {msg.allergenPicker&&!msg.allergenDone&&(
        <div style={{maxWidth:"90%"}}>
          <AllergenPicker likely={msg.allergenPicker.likely} possible={msg.allergenPicker.possible} onDone={sel=>onAllergenDone(msg.id,sel)}/>
        </div>
      )}
      {msg.allergenDone&&(
        <div style={{fontSize:12,color:T.coral,fontWeight:"700",padding:"4px 12px",background:T.coralLight,borderRadius:20,border:`1px solid ${T.coralMid}`}}>✓ Logged</div>
      )}
      <span style={{fontSize:11,color:T.muted,padding:"0 3px"}}>{fmtTime(msg.ts)}</span>
    </div>
  )
}
