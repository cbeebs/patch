import { T } from '../../constants/theme.js'

export function SeveritySlider({value,onChange,onConfirm,label}) {
  const labels = ["Clear","Very mild","Mild","Moderate","Significant","Severe"]
  const colors = ["#4CAF82","#8BC34A","#FFC107","#FF9800","#F44336","#B71C1C"]
  return (
    <div style={{background:T.card,borderTop:`1px solid ${T.border}`,padding:"14px 20px 22px"}}>
      <p style={{margin:"0 0 3px",fontSize:12,color:T.sub,textAlign:"center"}}>{label}</p>
      <p style={{margin:"0 0 14px",fontSize:23,fontWeight:"800",textAlign:"center",color:colors[value]}}>{labels[value]}</p>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:11,color:T.muted}}>0</span>
        <input type="range" min="0" max="5" step="1" value={value} onChange={e=>onChange(+e.target.value)} style={{flex:1,accentColor:colors[value]}}/>
        <span style={{fontSize:11,color:T.muted}}>5</span>
        <button onClick={onConfirm} style={{background:T.coral,color:"white",border:"none",borderRadius:20,padding:"9px 20px",fontSize:14,fontWeight:"700",cursor:"pointer",touchAction:"manipulation"}}>Done</button>
      </div>
    </div>
  )
}
