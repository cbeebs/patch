import { useState } from 'react'
import { AlgChip, Section } from './Chips.jsx'
import { ALLERGENS } from '../../constants/allergens.js'
import { T } from '../../constants/theme.js'

export function AllergenPicker({likely=[],possible=[],onDone}) {
  const [sel,setSel] = useState([])
  const toggle = a => setSel(s=>s.includes(a)?s.filter(x=>x!==a):[...s,a])
  const others = ALLERGENS.filter(a=>!likely.includes(a)&&!possible.includes(a))
  return (
    <div style={{background:T.card,borderRadius:16,padding:14,border:`1px solid ${T.border}`,maxWidth:290}}>
      {likely.length>0&&<Section label="LIKELY">{likely.map(a=><AlgChip key={a} label={a} prominent selected={sel.includes(a)} onClick={()=>toggle(a)}/>)}</Section>}
      {possible.length>0&&<Section label="POSSIBLY">{possible.map(a=><AlgChip key={a} label={a} selected={sel.includes(a)} onClick={()=>toggle(a)}/>)}</Section>}
      <Section label="ADD MORE">{others.map(a=><AlgChip key={a} label={a} small selected={sel.includes(a)} onClick={()=>toggle(a)}/>)}</Section>
      <button onClick={()=>onDone(sel)} style={{width:"100%",background:T.coral,color:"white",border:"none",borderRadius:11,padding:"11px 0",fontSize:14,fontWeight:"700",cursor:"pointer",touchAction:"manipulation"}}>
        Log it →
      </button>
    </div>
  )
}
