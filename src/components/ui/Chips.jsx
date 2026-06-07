import { T } from '../../constants/theme.js'

export function AlgChip({label,selected,prominent,small,onClick}) {
  return (
    <button onClick={onClick} style={{
      padding:prominent?"6px 13px":small?"4px 9px":"5px 11px",
      borderRadius:20,cursor:"pointer",transition:"all 0.12s",
      border:selected?"none":prominent?`1.5px solid ${T.coral}`:`1.5px solid ${T.border}`,
      background:selected?T.coral:prominent?T.coralLight:T.bg,
      color:selected?"white":prominent?T.coralDark:T.sub,
      fontSize:prominent?13:small?11:12,
      fontWeight:selected||prominent?"600":"400",
      touchAction:"manipulation",
    }}>{label}</button>
  )
}

export function Section({label,children}) {
  return (
    <div style={{marginBottom:10}}>
      <p style={{margin:"0 0 7px",fontSize:10,fontWeight:"700",color:T.muted,letterSpacing:"0.9px",textTransform:"uppercase"}}>{label}</p>
      <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{children}</div>
    </div>
  )
}
